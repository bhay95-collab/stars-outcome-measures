import followupsHandler from '../pages/api/followups'
import publicFollowupHandler from '../pages/api/followups/public/[token]'
import { getAdminClient, getUserFromRequest } from '../lib/supabase-admin'
import { createFollowUpToken, hashFollowUpToken } from '../lib/followupTokens'

jest.mock('../lib/supabase-admin', () => ({
  getAdminClient: jest.fn(),
  getUserFromRequest: jest.fn(),
}))

jest.mock('../lib/followupTokens', () => ({
  createFollowUpToken: jest.fn(),
  hashFollowUpToken: jest.fn(),
}))

const user = { id: 'user-1', email: 'clinician@example.com' }
const patientId = '11111111-1111-4111-8111-111111111111'
const requestId = '22222222-2222-4222-8222-222222222222'
const sourceAssessmentId = '33333333-3333-4333-8333-333333333333'
const completedAssessmentId = '44444444-4444-4444-8444-444444444444'

const sourceAssessment = {
  id: sourceAssessmentId,
  user_id: user.id,
  patient_id: patientId,
  measure: 'ABC',
  inputs: { items: Array(16).fill(70) },
  results: { primaryValue: 70, primaryUnit: '%', interpretation: 'Moderate functioning', meta: { classColor: 'amber' } },
  created_at: '2026-05-28T00:00:00.000Z',
}

function makeReq({ method = 'GET', query = {}, body = {}, headers = { host: 'localhost:3000' } } = {}) {
  return { method, query, body, headers, cookies: {}, socket: { remoteAddress: '127.0.0.1' } }
}

function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined,
    status: jest.fn(code => {
      res.statusCode = code
      return res
    }),
    json: jest.fn(payload => {
      res.body = payload
      return res
    }),
    end: jest.fn(() => res),
  }
  return res
}

function makeQuery(table, state) {
  const query = {
    payload: null,
    filters: {},
    select: jest.fn(() => query),
    eq: jest.fn((field, value) => {
      query.filters[field] = value
      return query
    }),
    insert: jest.fn(payload => {
      query.payload = payload
      state.inserts.push({ table, payload })
      return query
    }),
    update: jest.fn(payload => {
      query.payload = payload
      state.updates.push({ table, payload })
      return query
    }),
    delete: jest.fn(() => query),
    order: jest.fn(() => {
      if (table === 'followup_requests') return Promise.resolve({ data: state.requests ?? [], error: null })
      if (table === 'followup_responses') return Promise.resolve({ data: state.responses ?? [], error: null })
      if (table === 'assessments') {
        const rows = (state.assessments ?? []).filter(assessment => Object.entries(query.filters).every(([field, value]) => assessment[field] === value))
        return Promise.resolve({ data: rows, error: null })
      }
      return Promise.resolve({ data: [], error: null })
    }),
    maybeSingle: jest.fn(() => {
      if (table === 'profiles') return Promise.resolve({ data: state.profile, error: null })
      if (table === 'subscriptions') return Promise.resolve({ data: state.subscription, error: null })
      if (table === 'patients') return Promise.resolve({ data: state.patient, error: null })
      if (table === 'followup_requests') {
        if (query.payload) {
          return Promise.resolve({
            data: state.request ? { ...state.request, ...query.payload } : null,
            error: null,
          })
        }
        return Promise.resolve({ data: state.request, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    }),
    single: jest.fn(() => {
      if (table === 'followup_requests') {
        return Promise.resolve({
          data: {
            id: requestId,
            user_id: query.payload.user_id,
            patient_id: patientId,
            measure_id: query.payload.measure_id,
            source_assessment_id: query.payload.source_assessment_id,
            completed_assessment_id: null,
            status: 'pending',
            due_at: query.payload.due_at,
            expires_at: query.payload.expires_at,
            created_at: '2026-05-29T00:00:00.000Z',
            completed_at: null,
            cancelled_at: null,
          },
          error: null,
        })
      }
      if (table === 'assessments') {
        return Promise.resolve({
          data: {
            id: completedAssessmentId,
            user_id: query.payload.user_id,
            patient_id: query.payload.patient_id,
            measure: query.payload.measure,
            inputs: query.payload.inputs,
            results: query.payload.results,
            created_at: '2026-05-29T00:00:00.000Z',
          },
          error: null,
        })
      }
      return Promise.resolve({ data: null, error: null })
    }),
  }
  return query
}

function mockAdmin(state = {}) {
  const adminState = {
    profile: { trial_end_date: '2999-01-01T00:00:00.000Z' },
    subscription: null,
    patient: { id: patientId, user_id: user.id },
    requests: [],
    responses: [],
    assessments: [sourceAssessment],
    inserts: [],
    updates: [],
    ...state,
  }
  const admin = {
    from: jest.fn(table => makeQuery(table, adminState)),
  }
  getAdminClient.mockReturnValue(admin)
  return { admin, state: adminState }
}

describe('follow-up API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getUserFromRequest.mockResolvedValue(user)
    createFollowUpToken.mockReturnValue('raw-public-token-with-length')
    hashFollowUpToken.mockReturnValue('hashed-token')
  })

  it('creates an authenticated clinician follow-up without returning the token hash', async () => {
    const { state } = mockAdmin()
    const req = makeReq({
      method: 'POST',
      body: {
        patientId,
        measureId: 'ABC',
        sourceAssessmentId,
        dueAt: '2026-06-05T00:00:00.000Z',
        expiresAt: '2026-06-12T00:00:00.000Z',
      },
    })
    const res = makeRes()

    await followupsHandler(req, res)

    expect(res.statusCode).toBe(201)
    expect(res.body.publicUrl).toBe('http://localhost:3000/followup/raw-public-token-with-length')
    expect(res.body.followup.token_hash).toBeUndefined()
    expect(state.inserts[0]).toEqual(expect.objectContaining({
      table: 'followup_requests',
      payload: expect.objectContaining({
        user_id: user.id,
        patient_id: patientId,
        measure_id: 'ABC',
        source_assessment_id: sourceAssessmentId,
        token_hash: 'hashed-token',
      }),
    }))
  })

  it('requires the selected questionnaire to have been completed for the patient', async () => {
    mockAdmin({ assessments: [] })
    const req = makeReq({
      method: 'POST',
      body: {
        patientId,
        measureId: 'ABC',
        dueAt: '2026-06-05T00:00:00.000Z',
        expiresAt: '2026-06-12T00:00:00.000Z',
      },
    })
    const res = makeRes()

    await followupsHandler(req, res)

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/complete this questionnaire/i)
  })

  it('blocks creating a follow-up for a patient the clinician does not own', async () => {
    mockAdmin({ patient: null })
    const req = makeReq({
      method: 'POST',
      body: {
        patientId,
        measureId: 'ABC',
        dueAt: '2026-06-05T00:00:00.000Z',
        expiresAt: '2026-06-12T00:00:00.000Z',
      },
    })
    const res = makeRes()

    await followupsHandler(req, res)

    expect(res.statusCode).toBe(404)
    expect(res.body.error).toMatch(/patient/i)
  })

  it('returns public question config without patient identifiers', async () => {
    mockAdmin({
      request: {
        id: requestId,
        user_id: user.id,
        patient_id: patientId,
        measure_id: 'ABC',
        source_assessment_id: sourceAssessmentId,
        completed_assessment_id: null,
        status: 'pending',
        due_at: '2026-06-05T00:00:00.000Z',
        expires_at: '2999-06-12T00:00:00.000Z',
        created_at: '2026-05-29T00:00:00.000Z',
        completed_at: null,
        cancelled_at: null,
      },
    })
    const req = makeReq({ method: 'GET', query: { token: 'raw-public-token-with-length' } })
    const res = makeRes()

    await publicFollowupHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.state).toBe('ready')
    expect(res.body.questionnaire.id).toBe('ABC')
    expect(res.body.questions).toHaveLength(16)
    expect(JSON.stringify(res.body)).not.toContain(patientId)
  })

  it('rejects expired public submissions', async () => {
    mockAdmin({
      request: {
        id: requestId,
        user_id: user.id,
        patient_id: patientId,
        measure_id: 'ABC',
        source_assessment_id: sourceAssessmentId,
        completed_assessment_id: null,
        status: 'pending',
        due_at: '2000-01-01T00:00:00.000Z',
        expires_at: '2000-01-02T00:00:00.000Z',
        created_at: '1999-12-31T00:00:00.000Z',
        completed_at: null,
        cancelled_at: null,
      },
    })
    const req = makeReq({ method: 'POST', query: { token: 'raw-public-token-with-length' }, body: {} })
    const res = makeRes()

    await publicFollowupHandler(req, res)

    expect(res.statusCode).toBe(409)
    expect(res.body).toEqual({ state: 'unavailable', reason: 'expired' })
  })

  it('stores valid public submissions and marks the request completed', async () => {
    const { state } = mockAdmin({
      request: {
        id: requestId,
        user_id: user.id,
        patient_id: patientId,
        measure_id: 'ABC',
        source_assessment_id: sourceAssessmentId,
        completed_assessment_id: null,
        status: 'pending',
        due_at: '2026-06-05T00:00:00.000Z',
        expires_at: '2999-06-12T00:00:00.000Z',
        created_at: '2026-05-29T00:00:00.000Z',
        completed_at: null,
        cancelled_at: null,
      },
    })
    const req = makeReq({
      method: 'POST',
      query: { token: 'raw-public-token-with-length' },
      body: {
        answers: { items: Array(16).fill(40) },
      },
    })
    const res = makeRes()

    await publicFollowupHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.state).toBe('submitted')
    const assessmentInsert = state.inserts.find(item => item.table === 'assessments').payload
    expect(assessmentInsert).toEqual(expect.objectContaining({
      patient_id: patientId,
      measure: 'ABC',
      inputs: { items: Array(16).fill(40) },
    }))
    expect(assessmentInsert.results).toEqual(expect.objectContaining({
      primaryValue: 40,
      meta: expect.objectContaining({
        source: 'patient_reported_followup',
        followUpRequestId: requestId,
        followUpSourceAssessmentId: sourceAssessmentId,
      }),
    }))
    expect(state.updates.find(item => item.table === 'followup_requests').payload).toEqual(expect.objectContaining({
      status: 'completed',
      completed_assessment_id: completedAssessmentId,
    }))
  })
})

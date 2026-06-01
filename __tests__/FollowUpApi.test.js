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
    order: jest.fn(() => {
      if (table === 'followup_requests') return Promise.resolve({ data: state.requests ?? [], error: null })
      if (table === 'followup_responses') return Promise.resolve({ data: state.responses ?? [], error: null })
      return Promise.resolve({ data: [], error: null })
    }),
    maybeSingle: jest.fn(() => {
      if (table === 'profiles') return Promise.resolve({ data: state.profile, error: null })
      if (table === 'subscriptions') return Promise.resolve({ data: state.subscription, error: null })
      if (table === 'patients') return Promise.resolve({ data: state.patient, error: null })
      if (table === 'followup_requests') return Promise.resolve({ data: state.request, error: null })
      return Promise.resolve({ data: null, error: null })
    }),
    single: jest.fn(() => {
      if (table === 'followup_requests') {
        return Promise.resolve({
          data: {
            id: requestId,
            patient_id: patientId,
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
      if (table === 'followup_responses') {
        return Promise.resolve({
          data: {
            id: 'response-1',
            request_id: query.payload.request_id,
            patient_id: query.payload.patient_id,
            falls_count: query.payload.falls_count,
            confidence_score: query.payload.confidence_score,
            fatigue_score: query.payload.fatigue_score,
            symptoms_change: query.payload.symptoms_change,
            adherence_level: query.payload.adherence_level,
            global_status: query.payload.global_status,
            concern_text: query.payload.concern_text,
            attention_level: query.payload.attention_level,
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
        token_hash: 'hashed-token',
      }),
    }))
  })

  it('blocks creating a follow-up for a patient the clinician does not own', async () => {
    mockAdmin({ patient: null })
    const req = makeReq({
      method: 'POST',
      body: {
        patientId,
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
    expect(res.body.questions.length).toBeGreaterThan(0)
    expect(JSON.stringify(res.body)).not.toContain(patientId)
  })

  it('rejects expired public submissions', async () => {
    mockAdmin({
      request: {
        id: requestId,
        user_id: user.id,
        patient_id: patientId,
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
        falls_count: 1,
        confidence_score: 6,
        fatigue_score: 5,
        symptoms_change: 'same',
        adherence_level: 'most',
        global_status: 'same',
        concern_text: '',
      },
    })
    const res = makeRes()

    await publicFollowupHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.state).toBe('submitted')
    expect(state.inserts.find(item => item.table === 'followup_responses').payload).toEqual(expect.objectContaining({
      request_id: requestId,
      patient_id: patientId,
      attention_level: 'red',
    }))
    expect(state.updates.find(item => item.table === 'followup_requests').payload).toEqual(expect.objectContaining({
      status: 'completed',
    }))
  })
})

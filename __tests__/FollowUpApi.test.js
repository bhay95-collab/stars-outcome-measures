import followupsHandler from '../pages/api/followups'
import sendFollowupHandler from '../pages/api/followups/[id]/send'
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
const patientEmail = 'patient@example.com'

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

function baseFollowUpRequest(overrides = {}) {
  return {
    id: requestId,
    user_id: user.id,
    patient_id: patientId,
    measure_id: 'ABC',
    source_assessment_id: sourceAssessmentId,
    completed_assessment_id: null,
    recipient_email: null,
    sent_at: null,
    email_status: null,
    email_provider_message_id: null,
    email_error: null,
    last_email_attempt_at: null,
    status: 'pending',
    due_at: '2026-06-05T00:00:00.000Z',
    expires_at: '2999-06-12T00:00:00.000Z',
    created_at: '2026-05-29T00:00:00.000Z',
    completed_at: null,
    cancelled_at: null,
    ...overrides,
  }
}

function makeQuery(table, state) {
  function latestInsertedRequest() {
    return [...state.inserts].reverse().find(item => item.table === 'followup_requests')?.payload ?? null
  }

  function persistRequest(row) {
    if (!row) return row
    state.request = row
    const current = state.requests ?? []
    state.requests = [row, ...current.filter(item => item.id !== row.id)]
    return row
  }

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
      if (table === 'app_store_subscriptions') return Promise.resolve({ data: state.appStoreSubscription, error: null })
      if (table === 'patients') return Promise.resolve({ data: state.patient, error: null })
      if (table === 'followup_requests') {
        if (query.payload) {
          const base = state.request ?? (latestInsertedRequest() ? baseFollowUpRequest(latestInsertedRequest()) : null)
          const updated = base ? persistRequest({ ...base, ...query.payload }) : null
          return Promise.resolve({
            data: updated,
            error: null,
          })
        }
        return Promise.resolve({ data: state.request, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    }),
    single: jest.fn(() => {
      if (table === 'followup_requests') {
        return Promise.resolve({ data: persistRequest(baseFollowUpRequest(query.payload)), error: null })
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
    appStoreSubscription: null,
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
    delete process.env.RESEND_API_KEY
    delete process.env.FOLLOWUP_EMAIL_FROM
    global.fetch = jest.fn()
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
        recipient_email: null,
        email_status: 'manual',
        token_hash: 'hashed-token',
      }),
    }))
    expect(res.body.email).toBeNull()
  })

  it('creates and sends a follow-up email through Resend when a patient email is stored', async () => {
    process.env.RESEND_API_KEY = 'resend-test-key'
    process.env.FOLLOWUP_EMAIL_FROM = 'RehabMetrics IQ <followups@example.com>'
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'resend-message-1' }),
    })
    const { state } = mockAdmin({
      patient: { id: patientId, user_id: user.id, email: ' PATIENT@EXAMPLE.COM ' },
    })
    const req = makeReq({
      method: 'POST',
      body: {
        patientId,
        measureId: 'ABC',
        sourceAssessmentId,
        deliveryMode: 'email',
        dueAt: '2026-06-05T00:00:00.000Z',
        expiresAt: '2026-06-12T00:00:00.000Z',
      },
    })
    const res = makeRes()

    await followupsHandler(req, res)

    expect(res.statusCode).toBe(201)
    expect(res.body.publicUrl).toBe('http://localhost:3000/followup/raw-public-token-with-length')
    expect(res.body.email).toEqual({
      status: 'sent',
      error: null,
      providerMessageId: 'resend-message-1',
    })
    expect(res.body.followup).toEqual(expect.objectContaining({
      recipient_email: patientEmail,
      email_status: 'sent',
      email_provider_message_id: 'resend-message-1',
    }))
    expect(state.inserts[0].payload).toEqual(expect.objectContaining({
      recipient_email: patientEmail,
      email_status: null,
      token_hash: 'hashed-token',
    }))
    expect(state.updates.find(item => item.table === 'followup_requests').payload).toEqual(expect.objectContaining({
      email_status: 'sent',
      email_provider_message_id: 'resend-message-1',
      email_error: null,
    }))
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer resend-test-key',
          'Content-Type': 'application/json',
        }),
      }),
    )
    const resendBody = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(resendBody).toEqual(expect.objectContaining({
      from: 'RehabMetrics IQ <followups@example.com>',
      to: [patientEmail],
      subject: expect.stringMatching(/follow-up questionnaire/i),
    }))
    expect(resendBody.text).toContain('http://localhost:3000/followup/raw-public-token-with-length')
    expect(resendBody.text).toMatch(/Activities-specific Balance Confidence/i)
    expect(resendBody.text).not.toContain(patientId)
    expect(resendBody.html).not.toContain(sourceAssessmentId)
  })

  it('keeps a pending link available when Resend fails during creation', async () => {
    process.env.RESEND_API_KEY = 'resend-test-key'
    process.env.FOLLOWUP_EMAIL_FROM = 'RehabMetrics IQ <followups@example.com>'
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Invalid API key' }),
    })
    const { state } = mockAdmin({
      patient: { id: patientId, user_id: user.id, email: patientEmail },
    })
    const req = makeReq({
      method: 'POST',
      body: {
        patientId,
        measureId: 'ABC',
        deliveryMode: 'email',
        dueAt: '2026-06-05T00:00:00.000Z',
        expiresAt: '2026-06-12T00:00:00.000Z',
      },
    })
    const res = makeRes()

    await followupsHandler(req, res)

    expect(res.statusCode).toBe(201)
    expect(res.body.publicUrl).toBe('http://localhost:3000/followup/raw-public-token-with-length')
    expect(res.body.email).toEqual({
      status: 'failed',
      error: 'Invalid API key',
      providerMessageId: null,
    })
    expect(res.body.followup).toEqual(expect.objectContaining({
      status: 'pending',
      email_status: 'failed',
      email_error: 'Invalid API key',
    }))
  })

  it('requires a stored patient email for email delivery', async () => {
    const { state } = mockAdmin({ patient: { id: patientId, user_id: user.id, email: null } })
    const req = makeReq({
      method: 'POST',
      body: {
        patientId,
        measureId: 'ABC',
        deliveryMode: 'email',
        dueAt: '2026-06-05T00:00:00.000Z',
        expiresAt: '2026-06-12T00:00:00.000Z',
      },
    })
    const res = makeRes()

    await followupsHandler(req, res)

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/patient email/i)
    expect(state.inserts).toHaveLength(0)
    expect(global.fetch).not.toHaveBeenCalled()
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

  it('resends a pending follow-up email with a rotated public token', async () => {
    process.env.RESEND_API_KEY = 'resend-test-key'
    process.env.FOLLOWUP_EMAIL_FROM = 'RehabMetrics IQ <followups@example.com>'
    createFollowUpToken.mockReturnValue('rotated-public-token-with-length')
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'resend-message-2' }),
    })
    const { state } = mockAdmin({
      request: baseFollowUpRequest({
        recipient_email: 'Patient@Example.com',
        email_status: 'failed',
        email_error: 'Previous failure',
      }),
    })
    const req = makeReq({ method: 'POST', query: { id: requestId } })
    const res = makeRes()

    await sendFollowupHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.publicUrl).toBe('http://localhost:3000/followup/rotated-public-token-with-length')
    expect(res.body.email).toEqual({
      status: 'sent',
      error: null,
      providerMessageId: 'resend-message-2',
    })
    expect(state.updates.find(item => item.payload.token_hash).payload).toEqual(expect.objectContaining({
      token_hash: 'hashed-token',
      last_email_attempt_at: expect.any(String),
      email_error: null,
    }))
    expect(state.updates.find(item => item.payload.email_status === 'sent').payload).toEqual(expect.objectContaining({
      email_status: 'sent',
      email_provider_message_id: 'resend-message-2',
      email_error: null,
    }))
    expect(res.body.followup.token_hash).toBeUndefined()
  })

  it('returns a manual fallback link when resend fails', async () => {
    process.env.RESEND_API_KEY = 'resend-test-key'
    process.env.FOLLOWUP_EMAIL_FROM = 'RehabMetrics IQ <followups@example.com>'
    createFollowUpToken.mockReturnValue('rotated-public-token-with-length')
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Domain not verified' }),
    })
    const { state } = mockAdmin({
      request: baseFollowUpRequest({
        recipient_email: patientEmail,
        email_status: 'failed',
      }),
    })
    const req = makeReq({ method: 'POST', query: { id: requestId } })
    const res = makeRes()

    await sendFollowupHandler(req, res)

    expect(res.statusCode).toBe(502)
    expect(res.body.publicUrl).toBe('http://localhost:3000/followup/rotated-public-token-with-length')
    expect(res.body.email).toEqual({
      status: 'failed',
      error: 'Domain not verified',
      providerMessageId: null,
    })
    expect(state.updates.find(item => item.payload.token_hash).payload).toEqual(expect.objectContaining({
      token_hash: 'hashed-token',
      last_email_attempt_at: expect.any(String),
      email_error: null,
    }))
    expect(state.updates.find(item => item.payload.email_status === 'failed').payload).toEqual(expect.objectContaining({
      email_status: 'failed',
      email_error: 'Domain not verified',
    }))
  })

  it('does not resend completed follow-ups', async () => {
    mockAdmin({
      request: baseFollowUpRequest({
        status: 'completed',
        completed_at: '2026-06-01T00:00:00.000Z',
        recipient_email: patientEmail,
      }),
    })
    const req = makeReq({ method: 'POST', query: { id: requestId } })
    const res = makeRes()

    await sendFollowupHandler(req, res)

    expect(res.statusCode).toBe(409)
    expect(res.body.error).toMatch(/pending/i)
    expect(global.fetch).not.toHaveBeenCalled()
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

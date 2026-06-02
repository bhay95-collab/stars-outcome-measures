import handler from '../pages/api/pilot'

const insertMock = jest.fn().mockResolvedValue({ error: null })

jest.mock('../lib/supabase-admin', () => ({
  getAdminClient: () => ({
    from: () => ({ insert: insertMock }),
  }),
}))

function buildRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(code) { this.statusCode = code; return this },
    json(payload) { this.body = payload; return this },
    setHeader(k, v) { this.headers[k] = v; return this },
    end() { return this },
  }
}

function buildReq({ method = 'POST', body = {}, ip = '203.0.113.1' } = {}) {
  return {
    method,
    headers: { 'x-real-ip': ip, 'user-agent': 'jest-test' },
    socket: { remoteAddress: ip },
    body,
  }
}

const validBody = {
  name: 'Test Physio',
  email: 'test@example.com',
  clinic: 'Brisbane Neuro Physio',
  caseload: ['Neurological / stroke / TBI', 'NDIS-funded'],
  message: 'Want faster MCID interpretation for stroke reviews.',
}

describe('POST /api/pilot', () => {
  beforeEach(() => {
    insertMock.mockClear()
  })

  it('rejects non-POST methods with 405', async () => {
    const req = buildReq({ method: 'GET' })
    const res = buildRes()
    await handler(req, res)
    expect(res.statusCode).toBe(405)
    expect(res.headers['Allow']).toBe('POST')
  })

  it('accepts a valid application and records it in leads', async () => {
    const req = buildReq({ body: validBody, ip: '203.0.113.2' })
    const res = buildRes()
    await handler(req, res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(insertMock).toHaveBeenCalledTimes(1)
    const inserted = insertMock.mock.calls[0][0]
    expect(inserted.email).toBe('test@example.com')
    expect(inserted.name).toBe('Test Physio')
    expect(inserted.clinic).toBe('Brisbane Neuro Physio')
    expect(inserted.source).toBe('pilot')
    expect(inserted.caseload).toBe('Neurological / stroke / TBI, NDIS-funded')
    expect(inserted.message).toContain('MCID')
  })

  it('rejects an invalid email with 400', async () => {
    const req = buildReq({ body: { ...validBody, email: 'not-an-email' }, ip: '203.0.113.3' })
    const res = buildRes()
    await handler(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/valid email/i)
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('rejects a missing name with 400', async () => {
    const req = buildReq({ body: { ...validBody, name: '' }, ip: '203.0.113.4' })
    const res = buildRes()
    await handler(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/name/i)
  })

  it('rejects a missing clinic with 400', async () => {
    const req = buildReq({ body: { ...validBody, clinic: '' }, ip: '203.0.113.5' })
    const res = buildRes()
    await handler(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/clinic|workplace/i)
  })

  it('silently drops disallowed caseload values', async () => {
    const req = buildReq({
      body: { ...validBody, caseload: ['Neurological / stroke / TBI', 'not-a-real-caseload', '<script>'] },
      ip: '203.0.113.6',
    })
    const res = buildRes()
    await handler(req, res)
    expect(res.statusCode).toBe(200)
    expect(insertMock.mock.calls[0][0].caseload).toBe('Neurological / stroke / TBI')
  })

  it('rate-limits after 5 requests from the same IP within 60 seconds', async () => {
    const ip = '203.0.113.99'
    for (let i = 0; i < 5; i++) {
      const res = buildRes()
      await handler(buildReq({ body: validBody, ip }), res)
      expect(res.statusCode).toBe(200)
    }
    const limited = buildRes()
    await handler(buildReq({ body: validBody, ip }), limited)
    expect(limited.statusCode).toBe(429)
  })
})

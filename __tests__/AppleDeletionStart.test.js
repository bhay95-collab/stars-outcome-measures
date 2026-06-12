import startHandler from '../pages/api/apple/deletion-start'
import { getUserFromRequest } from '../lib/supabase-admin'

jest.mock('../lib/supabase-admin', () => ({
  getUserFromRequest: jest.fn(),
}))

function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined,
    status: jest.fn(code => {
      res.statusCode = code
      return res
    }),
    json: jest.fn(body => {
      res.body = body
      return res
    }),
    end: jest.fn(() => res),
  }
  return res
}

const appleUser = {
  id: 'user-1',
  email: 'clinician@example.com',
  app_metadata: { providers: ['apple'] },
}

describe('/api/apple/deletion-start', () => {
  beforeAll(() => {
    process.env.APPLE_WEB_CLIENT_ID = 'com.rehabmetricsiq.web'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-secret'
    delete process.env.NEXT_PUBLIC_SITE_URL
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects non-POST requests', async () => {
    const res = makeRes()
    await startHandler({ method: 'GET' }, res)
    expect(res.statusCode).toBe(405)
  })

  it('returns 401 when not authenticated', async () => {
    getUserFromRequest.mockResolvedValue(null)
    const res = makeRes()
    await startHandler({ method: 'POST', headers: {}, cookies: {} }, res)
    expect(res.statusCode).toBe(401)
  })

  it('returns 400 for an account that did not use Apple', async () => {
    getUserFromRequest.mockResolvedValue({
      id: 'user-2',
      email: 'google@example.com',
      app_metadata: { providers: ['google'] },
    })
    const res = makeRes()
    await startHandler({ method: 'POST', headers: {}, cookies: {} }, res)
    expect(res.statusCode).toBe(400)
  })

  it('returns an Apple authorize URL with the web client and form_post', async () => {
    getUserFromRequest.mockResolvedValue(appleUser)
    const res = makeRes()
    await startHandler({ method: 'POST', headers: {}, cookies: {} }, res)

    expect(res.statusCode).toBe(200)
    const url = new URL(res.body.url)
    expect(url.origin + url.pathname).toBe('https://appleid.apple.com/auth/authorize')
    expect(url.searchParams.get('client_id')).toBe('com.rehabmetricsiq.web')
    expect(url.searchParams.get('redirect_uri')).toBe('https://www.rehabmetricsiq.com/api/apple/deletion-callback')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('response_mode')).toBe('form_post')
    expect(url.searchParams.get('state')).toBeTruthy()
  })
})

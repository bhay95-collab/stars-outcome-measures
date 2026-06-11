import signupHandler from '../pages/api/signup'
import { getAdminClient } from '../lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

jest.mock('../lib/supabase-admin', () => ({
  getAdminClient: jest.fn(),
}))
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

function makeReq(body, ip = '127.0.0.1') {
  return {
    method: 'POST',
    body,
    headers: { 'x-real-ip': ip },
    socket: { remoteAddress: ip },
  }
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

function queryFor(table, state) {
  const deleteQuery = {
    eq: jest.fn(() => Promise.resolve({ error: state.profileDeleteError ?? null })),
  }
  const query = {
    payload: null,
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    maybeSingle: jest.fn(() => {
      if (table === 'deleted_accounts') return Promise.resolve({ data: state.deletedAccount, error: state.deletedError ?? null })
      return Promise.resolve({ data: null, error: null })
    }),
    upsert: jest.fn(payload => {
      query.payload = payload
      state.profilePayload = payload
      return Promise.resolve({ data: payload, error: state.profileError ?? null })
    }),
    delete: jest.fn(() => deleteQuery),
  }
  return query
}

function mockAdmin(state = {}) {
  const adminState = {
    deletedAccount: null,
    deletedError: null,
    profileError: null,
    profileDeleteError: null,
    deletedUsers: [],
    ...state,
  }
  const admin = {
    from: jest.fn(table => queryFor(table, adminState)),
    auth: {
      admin: {
        deleteUser: jest.fn(id => {
          adminState.deletedUsers.push(id)
          return Promise.resolve({ error: null })
        }),
      },
    },
  }
  getAdminClient.mockReturnValue(admin)
  return { admin, state: adminState }
}

function mockSignupClient(state = {}) {
  const signupState = {
    createdUser: { id: 'user-1', email: 'new.user@example.com' },
    signUpError: null,
    ...state,
  }
  const client = {
    auth: {
      signUp: jest.fn(() => Promise.resolve({
        data: { user: signupState.createdUser },
        error: signupState.signUpError,
      })),
    },
  }
  createClient.mockReturnValue(client)
  return { client, state: signupState }
}

describe('/api/signup', () => {
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    mockAdmin()
    mockSignupClient()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('creates an unconfirmed auth user, provisions a trial profile, and sends verification', async () => {
    const { admin, state } = mockAdmin()
    const req = makeReq({ email: 'New.User@Example.com', password: 'TestPassword123!' }, '1.1.1.1')
    req.headers.host = 'localhost:3000'
    req.headers['x-forwarded-proto'] = 'http'
    const res = makeRes()

    await signupHandler(req, res)

    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({ ok: true, needsEmailConfirmation: true })
    expect(createClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const signupClient = createClient.mock.results[0].value
    expect(signupClient.auth.signUp).toHaveBeenCalledWith({
      email: 'new.user@example.com',
      password: 'TestPassword123!',
      options: {
        emailRedirectTo: 'http://localhost:3000/app',
        data: { signup_source: 'web' },
      },
    })
    expect(state.profilePayload).toEqual(expect.objectContaining({
      id: 'user-1',
      email: 'new.user@example.com',
      trial_end_date: expect.any(String),
    }))
  })

  it('uses the mobile deep link for native account creation', async () => {
    mockAdmin()
    mockSignupClient()
    const req = makeReq({
      email: 'mobile@example.com',
      password: 'TestPassword123!',
      source: 'mobile',
    }, '1.1.1.2')
    const res = makeRes()

    await signupHandler(req, res)

    const signupClient = createClient.mock.results.at(-1).value
    expect(signupClient.auth.signUp).toHaveBeenCalledWith(expect.objectContaining({
      options: {
        emailRedirectTo: 'rehabmetricsiq://sign-in?verified=1',
        data: { signup_source: 'mobile' },
      },
    }))
  })

  it('blocks emails that are not eligible for a new trial', async () => {
    mockAdmin({ deletedAccount: { id: 'deleted-1' } })
    const req = makeReq({ email: 'deleted@example.com', password: 'TestPassword123!' }, '2.2.2.2')
    const res = makeRes()

    await signupHandler(req, res)

    expect(res.statusCode).toBe(403)
    expect(res.body.error).toMatch(/not eligible/i)
  })

  it('returns a friendly message for existing accounts', async () => {
    mockSignupClient({ signUpError: { message: 'User already registered' } })
    const req = makeReq({ email: 'existing@example.com', password: 'TestPassword123!' }, '3.3.3.3')
    const res = makeRes()

    await signupHandler(req, res)

    expect(res.statusCode).toBe(409)
    expect(res.body.error).toMatch(/already exists/i)
  })

  it('rolls back the auth user if profile setup fails', async () => {
    const { admin, state } = mockAdmin({ profileError: { message: 'profile insert failed' } })
    const req = makeReq({ email: 'rollback@example.com', password: 'TestPassword123!' }, '4.4.4.4')
    const res = makeRes()

    await signupHandler(req, res)

    expect(res.statusCode).toBe(500)
    expect(admin.auth.admin.deleteUser).toHaveBeenCalledWith('user-1')
    expect(state.deletedUsers).toEqual(['user-1'])
  })

  it('does not create a profile when verification email sending fails', async () => {
    const { admin } = mockAdmin()
    mockSignupClient({ signUpError: { message: '{}', status: 504 } })
    const req = makeReq({ email: 'mail-fail@example.com', password: 'TestPassword123!' }, '5.5.5.5')
    const res = makeRes()

    await signupHandler(req, res)

    expect(res.statusCode).toBe(502)
    expect(res.body.error).toMatch(/verification email/i)
    expect(admin.from).not.toHaveBeenCalledWith('profiles')
    expect(admin.auth.admin.deleteUser).not.toHaveBeenCalled()
  })
})

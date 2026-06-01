import signupHandler from '../pages/api/signup'
import { getAdminClient } from '../lib/supabase-admin'

jest.mock('../lib/supabase-admin', () => ({
  getAdminClient: jest.fn(),
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
  }
  return query
}

function mockAdmin(state = {}) {
  const adminState = {
    deletedAccount: null,
    deletedError: null,
    profileError: null,
    createdUser: { id: 'user-1' },
    createError: null,
    deletedUsers: [],
    ...state,
  }
  const admin = {
    from: jest.fn(table => queryFor(table, adminState)),
    auth: {
      admin: {
        createUser: jest.fn(() => Promise.resolve({
          data: { user: adminState.createdUser },
          error: adminState.createError,
        })),
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

describe('/api/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a confirmed auth user and provisions a trial profile', async () => {
    const { admin, state } = mockAdmin()
    const req = makeReq({ email: 'New.User@Example.com', password: 'TestPassword123!' }, '1.1.1.1')
    const res = makeRes()

    await signupHandler(req, res)

    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({ ok: true })
    expect(admin.auth.admin.createUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'new.user@example.com',
      password: 'TestPassword123!',
      email_confirm: true,
    }))
    expect(state.profilePayload).toEqual(expect.objectContaining({
      id: 'user-1',
      email: 'new.user@example.com',
      trial_end_date: expect.any(String),
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
    mockAdmin({ createError: { message: 'User already registered' } })
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
})

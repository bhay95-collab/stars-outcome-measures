import deleteAccountHandler from '../pages/api/delete-account'
import { getAdminClient, getUserFromRequest } from '../lib/supabase-admin'
import { getStripeServer } from '../lib/stripe-server'
import { revokeAppleAuthorizationCode } from '../lib/apple-server'

jest.mock('../lib/supabase-admin', () => ({
  getAdminClient: jest.fn(),
  getUserFromRequest: jest.fn(),
}))
jest.mock('../lib/stripe-server', () => ({
  getStripeServer: jest.fn(),
}))
jest.mock('../lib/apple-server', () => ({
  revokeAppleAuthorizationCode: jest.fn(),
  resolveAppleClient: jest.fn(() => 'com.rehabmetricsiq.app'),
  userUsesAppleLogin: jest.fn(user => user.app_metadata?.providers?.includes('apple')),
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

function makeAdmin() {
  const state = {
    deletedTables: [],
    deletedAccount: null,
  }

  function queryFor(table) {
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      maybeSingle: jest.fn(() => Promise.resolve({
        data: table === 'subscriptions'
          ? { stripe_subscription_id: 'sub_123', status: 'active' }
          : null,
        error: null,
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => {
          state.deletedTables.push(table)
          return Promise.resolve({ error: null })
        }),
      })),
      upsert: jest.fn(payload => {
        state.deletedAccount = payload
        return Promise.resolve({ error: null })
      }),
    }
    return query
  }

  const admin = {
    from: jest.fn(queryFor),
    storage: {
      from: jest.fn(() => ({
        list: jest.fn(() => Promise.resolve({ data: [{ name: 'avatar' }], error: null })),
        remove: jest.fn(() => Promise.resolve({ error: null })),
      })),
    },
    auth: {
      admin: {
        deleteUser: jest.fn(() => Promise.resolve({ error: null })),
      },
    },
  }
  return { admin, state }
}

describe('/api/delete-account', () => {
  const appleUser = {
    id: 'user-1',
    email: 'clinician@example.com',
    app_metadata: { providers: ['apple'] },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    getUserFromRequest.mockResolvedValue(appleUser)
    revokeAppleAuthorizationCode.mockResolvedValue(undefined)
  })

  it('cancels Stripe, revokes Apple, and deletes every owned data set', async () => {
    const { admin, state } = makeAdmin()
    const stripe = {
      subscriptions: {
        cancel: jest.fn(() => Promise.resolve()),
      },
    }
    getAdminClient.mockReturnValue(admin)
    getStripeServer.mockReturnValue(stripe)
    const req = {
      method: 'POST',
      body: { appleAuthorizationCode: 'apple-code' },
      headers: { authorization: 'Bearer mobile-token' },
      cookies: {},
    }
    const res = makeRes()

    await deleteAccountHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(stripe.subscriptions.cancel).toHaveBeenCalledWith('sub_123')
    expect(revokeAppleAuthorizationCode).toHaveBeenCalledWith('apple-code', { clientId: 'com.rehabmetricsiq.app' })
    expect(state.deletedTables).toEqual(expect.arrayContaining([
      'followup_responses',
      'followup_requests',
      'assessments',
      'patients',
      'subscriptions',
      'app_store_subscriptions',
      'profiles',
    ]))
    expect(state.deletedAccount.email_hash).toHaveLength(64)
    expect(admin.auth.admin.deleteUser).toHaveBeenCalledWith('user-1')
  })

  it('does not delete data if Stripe cancellation fails', async () => {
    const { admin, state } = makeAdmin()
    getAdminClient.mockReturnValue(admin)
    getStripeServer.mockReturnValue({
      subscriptions: {
        cancel: jest.fn(() => Promise.reject(new Error('Stripe unavailable'))),
      },
    })
    const res = makeRes()

    await deleteAccountHandler({
      method: 'POST',
      body: { appleAuthorizationCode: 'apple-code' },
      headers: {},
      cookies: {},
    }, res)

    expect(res.statusCode).toBe(502)
    expect(state.deletedTables).toEqual([])
    expect(revokeAppleAuthorizationCode).not.toHaveBeenCalled()
  })

  it('requires fresh Apple authorization before deletion', async () => {
    const { admin } = makeAdmin()
    getAdminClient.mockReturnValue(admin)
    const res = makeRes()

    await deleteAccountHandler({
      method: 'POST',
      body: {},
      headers: {},
      cookies: {},
    }, res)

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/sign in with apple again/i)
  })
})

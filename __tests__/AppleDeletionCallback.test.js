import callbackHandler from '../pages/api/apple/deletion-callback'
import { getAdminClient } from '../lib/supabase-admin'
import { verifyDeletionState } from '../lib/apple-deletion-state'
import { deleteUserAccount } from '../lib/account-deletion'

jest.mock('../lib/supabase-admin', () => ({
  getAdminClient: jest.fn(),
}))
jest.mock('../lib/apple-deletion-state', () => ({
  verifyDeletionState: jest.fn(),
}))
jest.mock('../lib/account-deletion', () => ({
  deleteUserAccount: jest.fn(),
}))

function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    setHeader: jest.fn((key, value) => {
      res.headers[key] = value
    }),
    status: jest.fn(code => {
      res.statusCode = code
      return res
    }),
    end: jest.fn(() => res),
    json: jest.fn(() => res),
  }
  return res
}

function makeAdmin(user) {
  return {
    auth: {
      admin: {
        getUserById: jest.fn(() => Promise.resolve({ data: { user }, error: null })),
      },
    },
  }
}

const deletedUser = { id: 'user-1', email: 'clinician@example.com' }

describe('/api/apple/deletion-callback', () => {
  beforeAll(() => {
    process.env.APPLE_WEB_CLIENT_ID = 'com.rehabmetricsiq.web'
    delete process.env.NEXT_PUBLIC_SITE_URL
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects non-POST requests', async () => {
    const res = makeRes()
    await callbackHandler({ method: 'GET' }, res)
    expect(res.statusCode).toBe(405)
  })

  it('redirects to an error without deleting when Apple returns an error', async () => {
    const res = makeRes()
    await callbackHandler({ method: 'POST', body: { error: 'user_cancelled_authorize' } }, res)

    expect(res.statusCode).toBe(303)
    expect(res.headers.Location).toBe('https://www.rehabmetricsiq.com/app?delete=error')
    expect(deleteUserAccount).not.toHaveBeenCalled()
  })

  it('redirects to an error without deleting when the code is missing', async () => {
    const res = makeRes()
    await callbackHandler({ method: 'POST', body: { state: 'whatever' } }, res)

    expect(res.statusCode).toBe(303)
    expect(deleteUserAccount).not.toHaveBeenCalled()
  })

  it('redirects to an error without deleting when state is invalid', async () => {
    verifyDeletionState.mockReturnValue(null)
    const res = makeRes()
    await callbackHandler({ method: 'POST', body: { code: 'apple-code', state: 'forged' } }, res)

    expect(res.statusCode).toBe(303)
    expect(res.headers.Location).toBe('https://www.rehabmetricsiq.com/app?delete=error')
    expect(deleteUserAccount).not.toHaveBeenCalled()
  })

  it('revokes with the web client and deletes on a valid callback', async () => {
    verifyDeletionState.mockReturnValue({ userId: 'user-1' })
    getAdminClient.mockReturnValue(makeAdmin(deletedUser))
    deleteUserAccount.mockResolvedValue(undefined)

    const res = makeRes()
    await callbackHandler({ method: 'POST', body: { code: 'apple-code', state: 'valid' } }, res)

    expect(deleteUserAccount).toHaveBeenCalledWith(expect.anything(), deletedUser, {
      appleAuthorizationCode: 'apple-code',
      appleClient: {
        clientId: 'com.rehabmetricsiq.web',
        redirectUri: 'https://www.rehabmetricsiq.com/api/apple/deletion-callback',
      },
    })
    expect(res.headers['Set-Cookie']).toMatch(/stars-auth=;/)
    expect(res.statusCode).toBe(303)
    expect(res.headers.Location).toBe('https://www.rehabmetricsiq.com/?account-deleted=1')
  })

  it('redirects to an error and keeps the session when deletion fails', async () => {
    verifyDeletionState.mockReturnValue({ userId: 'user-1' })
    getAdminClient.mockReturnValue(makeAdmin(deletedUser))
    deleteUserAccount.mockRejectedValue(new Error('Stripe down'))

    const res = makeRes()
    await callbackHandler({ method: 'POST', body: { code: 'apple-code', state: 'valid' } }, res)

    expect(res.statusCode).toBe(303)
    expect(res.headers.Location).toBe('https://www.rehabmetricsiq.com/app?delete=error')
    expect(res.headers['Set-Cookie']).toBeUndefined()
  })

  it('redirects to an error when the user cannot be found', async () => {
    verifyDeletionState.mockReturnValue({ userId: 'ghost' })
    getAdminClient.mockReturnValue({
      auth: { admin: { getUserById: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })) } },
    })

    const res = makeRes()
    await callbackHandler({ method: 'POST', body: { code: 'apple-code', state: 'valid' } }, res)

    expect(res.statusCode).toBe(303)
    expect(res.headers.Location).toBe('https://www.rehabmetricsiq.com/app?delete=error')
    expect(deleteUserAccount).not.toHaveBeenCalled()
  })
})

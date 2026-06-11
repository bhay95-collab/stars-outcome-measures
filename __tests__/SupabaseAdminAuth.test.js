import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '../lib/supabase-admin'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

describe('server request authentication', () => {
  const client = {
    auth: {
      getUser: jest.fn(token => Promise.resolve({
        data: { user: { id: 'user-1', token } },
        error: null,
      })),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    createClient.mockReturnValue(client)
  })

  it('accepts a mobile Bearer access token', async () => {
    const user = await getUserFromRequest({
      headers: { authorization: 'Bearer mobile-access-token' },
      cookies: {},
    })

    expect(user.id).toBe('user-1')
    expect(client.auth.getUser).toHaveBeenCalledWith('mobile-access-token')
  })

  it('retains web cookie authentication as a fallback', async () => {
    const cookie = encodeURIComponent(JSON.stringify({ access_token: 'web-access-token' }))

    await getUserFromRequest({
      headers: {},
      cookies: { 'stars-auth': cookie },
    })

    expect(client.auth.getUser).toHaveBeenCalledWith('web-access-token')
  })
})

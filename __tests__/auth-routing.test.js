import { hasSupabaseAuthErrorUrl, isSupabaseAuthCallbackUrl } from '../lib/auth-routing'

describe('auth routing helpers', () => {
  it('detects PKCE code callbacks on app routes', () => {
    expect(isSupabaseAuthCallbackUrl('/app?code=abc123')).toBe(true)
  })

  it('detects implicit token callbacks in the hash', () => {
    expect(isSupabaseAuthCallbackUrl('/#access_token=token&refresh_token=refresh')).toBe(true)
  })

  it('detects auth error callbacks from query or hash params', () => {
    expect(isSupabaseAuthCallbackUrl('/?error_description=Access%20denied')).toBe(true)
    expect(hasSupabaseAuthErrorUrl('/#error=access_denied')).toBe(true)
  })

  it('ignores normal landing and payment URLs', () => {
    expect(isSupabaseAuthCallbackUrl('/')).toBe(false)
    expect(isSupabaseAuthCallbackUrl('/app?payment=success')).toBe(false)
  })
})

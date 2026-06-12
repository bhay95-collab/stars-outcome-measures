import crypto from 'crypto'
import { resolveAppleClient, revokeAppleAuthorizationCode } from '../lib/apple-server'

function decodeJwtPayload(jwt) {
  const segment = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(Buffer.from(segment, 'base64').toString('utf8'))
}

function bodyOf(call) {
  return new URLSearchParams(call[1].body)
}

describe('apple-server', () => {
  beforeAll(() => {
    const { privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    })
    process.env.APPLE_TEAM_ID = 'TEAM12345'
    process.env.APPLE_KEY_ID = 'KEY12345'
    process.env.APPLE_PRIVATE_KEY = privateKey
    process.env.APPLE_CLIENT_ID = 'com.rehabmetricsiq.app'
    process.env.APPLE_WEB_CLIENT_ID = 'com.rehabmetricsiq.web'
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('resolveAppleClient', () => {
    it('returns the native bundle id for ios', () => {
      expect(resolveAppleClient('ios')).toBe('com.rehabmetricsiq.app')
    })

    it('returns the services id for web', () => {
      expect(resolveAppleClient('web')).toBe('com.rehabmetricsiq.web')
    })

    it('throws for an unsupported platform', () => {
      expect(() => resolveAppleClient('android')).toThrow(/unsupported apple platform/i)
    })
  })

  describe('revokeAppleAuthorizationCode', () => {
    function mockTokenThenRevoke(tokenBody) {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => JSON.stringify(tokenBody) })
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '' })
    }

    it('sends the web client id and redirect_uri when revoking a web code', async () => {
      mockTokenThenRevoke({ refresh_token: 'refresh-123' })

      await revokeAppleAuthorizationCode('web-code', {
        clientId: 'com.rehabmetricsiq.web',
        redirectUri: 'https://www.rehabmetricsiq.com/api/apple/deletion-callback',
      })

      const tokenForm = bodyOf(global.fetch.mock.calls[0])
      expect(tokenForm.get('client_id')).toBe('com.rehabmetricsiq.web')
      expect(tokenForm.get('redirect_uri')).toBe('https://www.rehabmetricsiq.com/api/apple/deletion-callback')
      expect(tokenForm.get('grant_type')).toBe('authorization_code')
      expect(decodeJwtPayload(tokenForm.get('client_secret')).sub).toBe('com.rehabmetricsiq.web')

      const revokeForm = bodyOf(global.fetch.mock.calls[1])
      expect(revokeForm.get('client_id')).toBe('com.rehabmetricsiq.web')
      expect(revokeForm.get('token')).toBe('refresh-123')
      expect(revokeForm.get('token_type_hint')).toBe('refresh_token')
    })

    it('defaults to the native client and omits redirect_uri', async () => {
      mockTokenThenRevoke({ access_token: 'access-123' })

      await revokeAppleAuthorizationCode('native-code')

      const tokenForm = bodyOf(global.fetch.mock.calls[0])
      expect(tokenForm.get('client_id')).toBe('com.rehabmetricsiq.app')
      expect(tokenForm.has('redirect_uri')).toBe(false)
      expect(decodeJwtPayload(tokenForm.get('client_secret')).sub).toBe('com.rehabmetricsiq.app')

      const revokeForm = bodyOf(global.fetch.mock.calls[1])
      expect(revokeForm.get('token')).toBe('access-123')
      expect(revokeForm.get('token_type_hint')).toBe('access_token')
    })

    it('throws when an authorization code is missing', async () => {
      await expect(revokeAppleAuthorizationCode('')).rejects.toThrow(/reauthentication is required/i)
    })

    it('throws when Apple returns no revocable token', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => JSON.stringify({}) })

      await expect(
        revokeAppleAuthorizationCode('web-code', { clientId: 'com.rehabmetricsiq.web' })
      ).rejects.toThrow(/did not return a revocable token/i)
    })
  })
})

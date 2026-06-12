import crypto from 'crypto'
import { userUsesAppleLogin } from './apple-identity'

// Re-exported for existing server callers that import it from this module.
export { userUsesAppleLogin }

const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token'
const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke'

function base64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function getAppleSigningConfig() {
  const teamId = process.env.APPLE_TEAM_ID
  const keyId = process.env.APPLE_KEY_ID
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!teamId || !keyId || !privateKey) {
    throw new Error('Apple token revocation is not configured')
  }

  return { teamId, keyId, privateKey }
}

// Apple requires client_id (and the client_secret `sub`) to match the client the
// authorization code was issued to: the Bundle ID for native iOS, the Services ID
// for the web sign-in flow.
export function resolveAppleClient(platform) {
  if (platform === 'web') {
    const clientId = process.env.APPLE_WEB_CLIENT_ID
    if (!clientId) throw new Error('Apple web client is not configured')
    return clientId
  }
  if (platform === 'ios') {
    const clientId = process.env.APPLE_CLIENT_ID
    if (!clientId) throw new Error('Apple native client is not configured')
    return clientId
  }
  throw new Error(`Unsupported Apple platform: ${platform}`)
}

function createAppleClientSecret(config, clientId) {
  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(JSON.stringify({
    alg: 'ES256',
    kid: config.keyId,
  }))
  const payload = base64Url(JSON.stringify({
    iss: config.teamId,
    iat: now,
    exp: now + 300,
    aud: 'https://appleid.apple.com',
    sub: clientId,
  }))
  const unsignedToken = `${header}.${payload}`
  const signature = crypto.sign('sha256', Buffer.from(unsignedToken), {
    key: config.privateKey,
    dsaEncoding: 'ieee-p1363',
  })
  return `${unsignedToken}.${base64Url(signature)}`
}

async function postAppleForm(url, values) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(values).toString(),
  })
  const body = await response.text()
  if (!response.ok) {
    throw new Error(`Apple request failed (${response.status})${body ? `: ${body}` : ''}`)
  }
  return body ? JSON.parse(body) : {}
}

// Exchanges a fresh Apple authorization code for a token, then revokes it.
// `clientId` defaults to the native Bundle ID so existing iOS callers are
// unaffected. `redirectUri` must be supplied for the web flow (it must match the
// redirect_uri used at authorize time) and omitted for native.
export async function revokeAppleAuthorizationCode(authorizationCode, options = {}) {
  if (!authorizationCode) throw new Error('Apple reauthentication is required')

  const { clientId = process.env.APPLE_CLIENT_ID, redirectUri } = options
  if (!clientId) throw new Error('Apple token revocation is not configured')

  const config = getAppleSigningConfig()
  const clientSecret = createAppleClientSecret(config, clientId)

  const tokenRequest = {
    client_id: clientId,
    client_secret: clientSecret,
    code: authorizationCode,
    grant_type: 'authorization_code',
  }
  if (redirectUri) tokenRequest.redirect_uri = redirectUri

  const tokens = await postAppleForm(APPLE_TOKEN_URL, tokenRequest)
  const token = tokens.refresh_token || tokens.access_token
  if (!token) throw new Error('Apple did not return a revocable token')

  await postAppleForm(APPLE_REVOKE_URL, {
    client_id: clientId,
    client_secret: clientSecret,
    token,
    token_type_hint: tokens.refresh_token ? 'refresh_token' : 'access_token',
  })
}

import crypto from 'crypto'

const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token'
const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke'

function base64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function getAppleConfig() {
  const teamId = process.env.APPLE_TEAM_ID
  const keyId = process.env.APPLE_KEY_ID
  const clientId = process.env.APPLE_CLIENT_ID
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!teamId || !keyId || !clientId || !privateKey) {
    throw new Error('Apple token revocation is not configured')
  }

  return { teamId, keyId, clientId, privateKey }
}

function createAppleClientSecret(config) {
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
    sub: config.clientId,
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

export async function revokeAppleAuthorizationCode(authorizationCode) {
  if (!authorizationCode) throw new Error('Apple reauthentication is required')

  const config = getAppleConfig()
  const clientSecret = createAppleClientSecret(config)
  const tokens = await postAppleForm(APPLE_TOKEN_URL, {
    client_id: config.clientId,
    client_secret: clientSecret,
    code: authorizationCode,
    grant_type: 'authorization_code',
  })
  const token = tokens.refresh_token || tokens.access_token
  if (!token) throw new Error('Apple did not return a revocable token')

  await postAppleForm(APPLE_REVOKE_URL, {
    client_id: config.clientId,
    client_secret: clientSecret,
    token,
    token_type_hint: tokens.refresh_token ? 'refresh_token' : 'access_token',
  })
}

export function userUsesAppleLogin(user) {
  const providers = Array.isArray(user?.app_metadata?.providers)
    ? user.app_metadata.providers
    : []
  return providers.includes('apple')
    || user?.identities?.some(identity => identity.provider === 'apple')
}

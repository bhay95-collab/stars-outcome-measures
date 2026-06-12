import crypto from 'crypto'

// Apple returns the deletion authorization code via a cross-site form_post, where
// the SameSite=Lax `stars-auth` cookie is NOT sent. To know which account to
// delete, we authenticate the user up front (a same-site request) and carry their
// id through Apple inside a short-lived, HMAC-signed `state` parameter that the
// callback validates without relying on cookies.

const STATE_TTL_SECONDS = 300

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(value) {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

function getStateSecret() {
  // Prefer a dedicated signing secret so it can be rotated independently of the
  // service-role key. Falls back to the service-role key for backward
  // compatibility when DELETION_STATE_SECRET is not configured.
  const secret = process.env.DELETION_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('Account deletion state secret is not configured')
  return secret
}

function signSegment(payloadSegment) {
  return base64UrlEncode(
    crypto.createHmac('sha256', getStateSecret()).update(payloadSegment).digest()
  )
}

export function createDeletionState(userId, now = Date.now()) {
  if (!userId) throw new Error('A user id is required to create deletion state')

  const payload = { userId, exp: Math.floor(now / 1000) + STATE_TTL_SECONDS }
  const payloadSegment = base64UrlEncode(JSON.stringify(payload))
  return `${payloadSegment}.${signSegment(payloadSegment)}`
}

// Returns { userId } when the state is authentic and unexpired, otherwise null.
export function verifyDeletionState(state, now = Date.now()) {
  if (typeof state !== 'string' || !state.includes('.')) return null

  const [payloadSegment, signature] = state.split('.')
  if (!payloadSegment || !signature) return null

  const expected = Buffer.from(signSegment(payloadSegment))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length) return null
  if (!crypto.timingSafeEqual(expected, actual)) return null

  let payload
  try {
    payload = JSON.parse(base64UrlDecode(payloadSegment).toString('utf8'))
  } catch {
    return null
  }

  if (!payload?.userId || typeof payload.exp !== 'number') return null
  if (Math.floor(now / 1000) > payload.exp) return null

  return { userId: payload.userId }
}

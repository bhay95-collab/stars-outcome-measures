import crypto from 'crypto'

export function createFollowUpToken() {
  return crypto.randomBytes(32).toString('base64url')
}

export function hashFollowUpToken(token) {
  return crypto
    .createHash('sha256')
    .update(String(token ?? '').trim())
    .digest('hex')
}

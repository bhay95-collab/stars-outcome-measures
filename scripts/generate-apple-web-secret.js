#!/usr/bin/env node
/*
 * Generates the Apple "Secret Key (for OAuth)" JWT that Supabase needs for
 * "Sign in with Apple" on the web.
 *
 * Supabase does NOT generate this for you — you paste the output of this
 * script into:
 *   Supabase dashboard -> Authentication -> Providers -> Apple
 *   -> "Secret Key (for OAuth)"
 *
 * The token is an ES256-signed JWT, signed with your Apple "Sign in with
 * Apple" private key (.p8). It mirrors the signing logic already used in
 * lib/apple-server.js. Apple caps its lifetime at 6 months, so this must be
 * re-run and the value re-pasted into Supabase roughly every 6 months.
 *
 * Usage (run locally, never commit the output or the private key):
 *
 *   APPLE_TEAM_ID=U3KB3BY59J \
 *   APPLE_KEY_ID=YOUR_KEY_ID \
 *   APPLE_SERVICE_ID=com.rehabmetricsiq.web \
 *   APPLE_PRIVATE_KEY="$(cat AuthKey_YOURKEYID.p8)" \
 *   node scripts/generate-apple-web-secret.js
 *
 * APPLE_PRIVATE_KEY may contain real newlines (as above) or escaped "\n".
 */

const crypto = require('crypto')

// Apple's maximum allowed client-secret lifetime is 6 months (in seconds).
const SIX_MONTHS_SECONDS = 15777000
const APPLE_AUDIENCE = 'https://appleid.apple.com'

function base64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value
}

function main() {
  const teamId = requireEnv('APPLE_TEAM_ID')
  const keyId = requireEnv('APPLE_KEY_ID')
  // The web Services ID (e.g. com.rehabmetricsiq.web), NOT the iOS bundle ID.
  const serviceId = requireEnv('APPLE_SERVICE_ID')
  const privateKey = requireEnv('APPLE_PRIVATE_KEY').replace(/\\n/g, '\n')

  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(JSON.stringify({ alg: 'ES256', kid: keyId }))
  const payload = base64Url(JSON.stringify({
    iss: teamId,
    iat: now,
    exp: now + SIX_MONTHS_SECONDS,
    aud: APPLE_AUDIENCE,
    sub: serviceId,
  }))

  const unsignedToken = `${header}.${payload}`
  const signature = crypto.sign('sha256', Buffer.from(unsignedToken), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363',
  })

  const clientSecret = `${unsignedToken}.${base64Url(signature)}`
  const expiresOn = new Date((now + SIX_MONTHS_SECONDS) * 1000).toISOString()

  console.log(clientSecret)
  console.error(`\nPaste the line above into Supabase -> Apple -> "Secret Key (for OAuth)".`)
  console.error(`This secret expires on ${expiresOn}. Re-run this script before then.`)
}

main()

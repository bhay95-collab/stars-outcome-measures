import { getUserFromRequest } from '../../../lib/supabase-admin'
import { userUsesAppleLogin, resolveAppleClient } from '../../../lib/apple-server'
import { createDeletionState } from '../../../lib/apple-deletion-state'
import { getDeletionCallbackUrl } from '../../../lib/apple-deletion-urls'

const APPLE_AUTHORIZE_URL = 'https://appleid.apple.com/auth/authorize'

// Starts the web Sign-in-with-Apple re-authentication needed to obtain a fresh
// authorization code for token revocation. The user is authenticated here (a
// same-site request, so the stars-auth cookie/Bearer token is present) and their
// id is sealed into a signed `state` that survives Apple's cross-site form_post.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  if (!userUsesAppleLogin(user)) {
    return res.status(400).json({ error: 'This account did not sign in with Apple.' })
  }

  let url
  try {
    const params = new URLSearchParams({
      client_id: resolveAppleClient('web'),
      redirect_uri: getDeletionCallbackUrl(),
      response_type: 'code',
      // No scopes are requested — we only need a re-auth code to revoke. form_post
      // is required for the web flow; the signed `state` carries the user id.
      response_mode: 'form_post',
      state: createDeletionState(user.id),
    })
    url = `${APPLE_AUTHORIZE_URL}?${params.toString()}`
  } catch (error) {
    console.error('Apple deletion start failed', { userId: user.id, message: error.message })
    return res.status(500).json({
      error: 'Apple account deletion is not available right now. Please try again or contact support.',
    })
  }

  return res.status(200).json({ url })
}

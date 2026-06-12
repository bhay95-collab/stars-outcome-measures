import { getAdminClient, getUserFromRequest } from '../../lib/supabase-admin'
import { userUsesAppleLogin, resolveAppleClient } from '../../lib/apple-server'
import { deleteUserAccount, AccountDeletionError } from '../../lib/account-deletion'

const VALID_PLATFORMS = new Set(['ios', 'web'])

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const usesAppleLogin = userUsesAppleLogin(user)
  const appleAuthorizationCode = req.body?.appleAuthorizationCode
  // Missing/invalid platform defaults to native so the shipped iOS app, which
  // sends no platform field, is unaffected.
  const platform = VALID_PLATFORMS.has(req.body?.platform) ? req.body.platform : 'ios'

  if (!user.email) return res.status(400).json({ error: 'This account does not include an email address.' })
  if (usesAppleLogin && !appleAuthorizationCode) {
    return res.status(400).json({ error: 'Sign in with Apple again to confirm account deletion.' })
  }

  try {
    await deleteUserAccount(getAdminClient(), user, {
      appleAuthorizationCode: usesAppleLogin ? appleAuthorizationCode : undefined,
      appleClient: usesAppleLogin ? { clientId: resolveAppleClient(platform) } : undefined,
    })
    return res.status(200).json({ success: true })
  } catch (error) {
    if (error instanceof AccountDeletionError) {
      return res.status(error.statusCode).json({ error: error.message })
    }
    console.error('Account deletion failed', {
      userId: user.id,
      message: error.message,
    })
    return res.status(500).json({
      error: 'The account could not be completely deleted. Please try again or contact support.',
    })
  }
}

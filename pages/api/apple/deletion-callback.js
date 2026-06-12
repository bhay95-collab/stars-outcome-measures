import { getAdminClient } from '../../../lib/supabase-admin'
import { resolveAppleClient } from '../../../lib/apple-server'
import { verifyDeletionState } from '../../../lib/apple-deletion-state'
import { deleteUserAccount } from '../../../lib/account-deletion'
import { getSiteOrigin, getDeletionCallbackUrl } from '../../../lib/apple-deletion-urls'

function redirect(res, path) {
  res.setHeader('Location', `${getSiteOrigin()}${path}`)
  return res.status(303).end()
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', 'stars-auth=; Path=/; Max-Age=0; SameSite=Lax; Secure')
}

// Apple form_posts the re-auth result here (registered Return URL on the web
// Services ID). The SameSite=Lax cookie is NOT sent on this cross-site POST, so
// the user is identified solely from the signed `state`. Any failure redirects
// back to the app WITHOUT deleting data.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { code, state, error: appleError } = req.body || {}

  if (appleError || !code) {
    return redirect(res, '/app?delete=error')
  }

  const verified = verifyDeletionState(state)
  if (!verified) {
    return redirect(res, '/app?delete=error')
  }

  const admin = getAdminClient()

  let user
  try {
    const { data, error } = await admin.auth.admin.getUserById(verified.userId)
    if (error || !data?.user) throw new Error('User not found')
    user = data.user
  } catch (error) {
    console.error('Apple deletion callback: user lookup failed', {
      userId: verified.userId,
      message: error.message,
    })
    return redirect(res, '/app?delete=error')
  }

  try {
    await deleteUserAccount(admin, user, {
      appleAuthorizationCode: code,
      appleClient: {
        clientId: resolveAppleClient('web'),
        redirectUri: getDeletionCallbackUrl(),
      },
    })
  } catch (error) {
    console.error('Apple deletion callback: deletion failed', {
      userId: user.id,
      message: error.message,
    })
    return redirect(res, '/app?delete=error')
  }

  clearAuthCookie(res)
  return redirect(res, '/?account-deleted=1')
}

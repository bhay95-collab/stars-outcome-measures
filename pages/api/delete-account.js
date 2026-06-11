import { getAdminClient, getUserFromRequest } from '../../lib/supabase-admin'
import { getStripeServer } from '../../lib/stripe-server'
import { hashEmail } from '../../lib/account-provisioning'
import { revokeAppleAuthorizationCode, userUsesAppleLogin } from '../../lib/apple-server'

async function deleteRows(admin, table, column, value) {
  const { error } = await admin.from(table).delete().eq(column, value)
  if (error) throw new Error(`Could not delete ${table}: ${error.message}`)
}

async function deleteAvatarFiles(admin, userId) {
  const bucket = admin.storage.from('avatars')
  const { data: files, error: listError } = await bucket.list(userId)
  if (listError) throw new Error(`Could not inspect avatar files: ${listError.message}`)
  if (!files?.length) return

  const paths = files.map(file => `${userId}/${file.name}`)
  const { error: removeError } = await bucket.remove(paths)
  if (removeError) throw new Error(`Could not delete avatar files: ${removeError.message}`)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const admin = getAdminClient()
  const userId = user.id
  const userEmail = user.email
  const usesAppleLogin = userUsesAppleLogin(user)
  const appleAuthorizationCode = req.body?.appleAuthorizationCode

  if (!userEmail) return res.status(400).json({ error: 'This account does not include an email address.' })
  if (usesAppleLogin && !appleAuthorizationCode) {
    return res.status(400).json({ error: 'Sign in with Apple again to confirm account deletion.' })
  }

  const { data: sub, error: subscriptionLookupError } = await admin
    .from('subscriptions')
    .select('stripe_subscription_id, status')
    .eq('user_id', userId)
    .maybeSingle()

  if (subscriptionLookupError) {
    return res.status(500).json({ error: 'Your billing status could not be checked. Please try again.' })
  }

  if (sub?.stripe_subscription_id && sub.status !== 'cancelled') {
    try {
      const stripe = getStripeServer()
      await stripe.subscriptions.cancel(sub.stripe_subscription_id)
    } catch (error) {
      console.error('Stripe cancellation before account deletion failed', {
        userId,
        message: error.message,
      })
      return res.status(502).json({
        error: 'Your Stripe subscription could not be cancelled, so the account was not deleted. Please try again.',
      })
    }
  }

  try {
    if (usesAppleLogin) {
      await revokeAppleAuthorizationCode(appleAuthorizationCode)
    }

    await deleteAvatarFiles(admin, userId)
    await deleteRows(admin, 'followup_responses', 'user_id', userId)
    await deleteRows(admin, 'followup_requests', 'user_id', userId)
    await deleteRows(admin, 'assessments', 'user_id', userId)
    await deleteRows(admin, 'patients', 'user_id', userId)
    await deleteRows(admin, 'subscriptions', 'user_id', userId)
    await deleteRows(admin, 'app_store_subscriptions', 'user_id', userId)
    await deleteRows(admin, 'profiles', 'id', userId)

    const { error: deletedAccountError } = await admin
      .from('deleted_accounts')
      .upsert({ email_hash: hashEmail(userEmail) })
    if (deletedAccountError) throw new Error(`Could not record account deletion: ${deletedAccountError.message}`)

    const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId)
    if (authDeleteError) throw new Error(`Could not delete authentication account: ${authDeleteError.message}`)

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Account deletion failed', {
      userId,
      message: error.message,
    })
    return res.status(500).json({
      error: 'The account could not be completely deleted. Please try again or contact support.',
    })
  }
}

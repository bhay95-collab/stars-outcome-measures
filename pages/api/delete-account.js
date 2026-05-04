import crypto from 'crypto'
import { getAdminClient, getUserFromRequest } from '../../lib/supabase-admin'
import { getStripeServer } from '../../lib/stripe-server'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const admin = getAdminClient()
  const userId = user.id
  const userEmail = user.email

  // Cancel active Stripe subscription if one exists
  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_subscription_id, status')
    .eq('user_id', userId)
    .maybeSingle()

  if (sub?.stripe_subscription_id && sub.status === 'active') {
    try {
      const stripe = getStripeServer()
      await stripe.subscriptions.cancel(sub.stripe_subscription_id)
    } catch {
      // Continue with deletion even if Stripe cancel fails
    }
  }

  // Delete all app data for this user
  await admin.from('assessments').delete().eq('user_id', userId)
  await admin.from('patients').delete().eq('user_id', userId)
  await admin.from('subscriptions').delete().eq('user_id', userId)
  await admin.from('profiles').delete().eq('id', userId)

  // Record email hash to block this email from claiming a new trial
  const emailHash = crypto
    .createHash('sha256')
    .update(userEmail.toLowerCase().trim())
    .digest('hex')
  await admin.from('deleted_accounts').upsert({ email_hash: emailHash })

  // Delete the Supabase auth user
  await admin.auth.admin.deleteUser(userId)

  return res.status(200).json({ success: true })
}

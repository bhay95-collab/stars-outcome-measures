import { getAdminClient, getUserFromRequest } from '../../lib/supabase-admin'
import { getStripeServer } from '../../lib/stripe-server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const admin = getAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sub?.stripe_customer_id) {
    return res.status(404).json({ error: 'No billing account found' })
  }

  const stripe = getStripeServer()
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${APP_URL}/app`,
  })

  return res.status(200).json({ url: portalSession.url })
}

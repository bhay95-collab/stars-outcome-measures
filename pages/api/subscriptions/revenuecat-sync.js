import { getAdminClient, getUserFromRequest } from '../../../lib/supabase-admin'
import { syncRevenueCatSubscription } from '../../../lib/revenuecat-server'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  try {
    const subscription = await syncRevenueCatSubscription(getAdminClient(), user.id)
    return res.status(200).json({ ok: true, subscription })
  } catch (error) {
    console.error('RevenueCat subscription sync failed', {
      userId: user.id,
      message: error.message,
    })
    return res.status(502).json({ error: 'Your App Store purchase could not be verified. Please try again.' })
  }
}

import { getAdminClient, getUserFromRequest } from '../../../lib/supabase-admin'
import { provisionOAuthProfile } from '../../../lib/account-provisioning'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const admin = getAdminClient()
  const result = await provisionOAuthProfile(admin, user, {
    firstName: req.body?.firstName,
    lastName: req.body?.lastName,
  })

  if (result.error) return res.status(result.status).json({ error: result.error })
  return res.status(result.created ? 201 : 200).json({
    ok: true,
    created: result.created,
    trialEndDate: result.trialEndDate,
  })
}

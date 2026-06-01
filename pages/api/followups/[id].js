import { getAdminClient, getUserFromRequest } from '../../../lib/supabase-admin'
import { FOLLOWUP_STATUS, isValidUuid, shapeFollowUpRecord } from '../../../lib/followups'
import { userHasActiveAccess } from '../../../lib/followupServer'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  if (!isValidUuid(id)) return res.status(400).json({ error: 'Valid follow-up id required' })

  const admin = getAdminClient()
  const hasAccess = await userHasActiveAccess(admin, user.id)
  if (!hasAccess) return res.status(403).json({ error: 'Subscription or trial access required' })

  const { data, error } = await admin
    .from('followup_requests')
    .update({
      status: FOLLOWUP_STATUS.CANCELLED,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', FOLLOWUP_STATUS.PENDING)
    .select('id, patient_id, status, due_at, expires_at, created_at, completed_at, cancelled_at')
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Pending follow-up not found' })

  return res.status(200).json({ followup: shapeFollowUpRecord(data, null) })
}

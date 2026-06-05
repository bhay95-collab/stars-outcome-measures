import { getAdminClient, getUserFromRequest } from '../../../lib/supabase-admin'
import {
  buildPublicFollowUpUrl,
  FOLLOWUP_REQUEST_SELECT,
  listFollowUpsForPatient,
  normalizeFollowUpDates,
  requireOwnedPatient,
  resolveFollowUpSourceAssessment,
  userHasActiveAccess,
} from '../../../lib/followupServer'
import { createFollowUpToken, hashFollowUpToken } from '../../../lib/followupTokens'
import { FOLLOWUP_STATUS, shapeFollowUpRecord } from '../../../lib/followups'

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).end()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const admin = getAdminClient()
  const hasAccess = await userHasActiveAccess(admin, user.id)
  if (!hasAccess) return res.status(403).json({ error: 'Subscription or trial access required' })

  if (req.method === 'GET') {
    const patientId = Array.isArray(req.query.patientId) ? req.query.patientId[0] : req.query.patientId
    const patient = await requireOwnedPatient(admin, user.id, patientId)
    if (!patient) return res.status(404).json({ error: 'Patient not found' })

    try {
      const followups = await listFollowUpsForPatient(admin, user.id, patient.id)
      return res.status(200).json({ followups })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  const { patientId, dueAt, expiresAt, measureId, sourceAssessmentId } = req.body ?? {}
  const patient = await requireOwnedPatient(admin, user.id, patientId)
  if (!patient) return res.status(404).json({ error: 'Patient not found' })

  const source = await resolveFollowUpSourceAssessment(admin, user.id, patient.id, measureId, sourceAssessmentId)
  if (source.error) return res.status(400).json({ error: source.error })

  const dates = normalizeFollowUpDates({ dueAt, expiresAt })
  if (dates.error) return res.status(400).json({ error: dates.error })

  const token = createFollowUpToken()
  const tokenHash = hashFollowUpToken(token)

  const { data, error } = await admin
    .from('followup_requests')
    .insert({
      user_id: user.id,
      patient_id: patient.id,
      measure_id: source.assessment.measure,
      source_assessment_id: source.assessment.id,
      token_hash: tokenHash,
      status: FOLLOWUP_STATUS.PENDING,
      due_at: dates.due_at,
      expires_at: dates.expires_at,
    })
    .select(FOLLOWUP_REQUEST_SELECT)
    .single()

  if (error) return res.status(500).json({ error: error.message })

  return res.status(201).json({
    followup: shapeFollowUpRecord(data, null),
    publicUrl: buildPublicFollowUpUrl(token, req),
  })
}

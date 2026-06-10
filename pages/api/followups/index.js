import { getAdminClient, getUserFromRequest } from '../../../lib/supabase-admin'
import {
  buildPublicFollowUpUrl,
  FOLLOWUP_REQUEST_SELECT,
  listFollowUpAttentionBoard,
  listFollowUpsForPatient,
  normalizeFollowUpDates,
  requireOwnedPatient,
  resolveFollowUpSourceAssessment,
  userHasActiveAccess,
} from '../../../lib/followupServer'
import { createFollowUpToken, hashFollowUpToken } from '../../../lib/followupTokens'
import { FOLLOWUP_STATUS, shapeFollowUpRecord } from '../../../lib/followups'
import { sendFollowUpEmail, validateFollowUpRecipientEmail } from '../../../lib/followupEmail'

const DELIVERY_MODES = new Set(['manual', 'email'])

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).end()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const admin = getAdminClient()
  const hasAccess = await userHasActiveAccess(admin, user.id)
  if (!hasAccess) return res.status(403).json({ error: 'Subscription or trial access required' })

  if (req.method === 'GET') {
    const patientId = Array.isArray(req.query.patientId) ? req.query.patientId[0] : req.query.patientId

    if (!patientId) {
      try {
        const attention = await listFollowUpAttentionBoard(admin, user.id)
        return res.status(200).json({ attention })
      } catch (error) {
        return res.status(500).json({ error: error.message })
      }
    }

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
  const deliveryMode = DELIVERY_MODES.has(req.body?.deliveryMode) ? req.body.deliveryMode : 'manual'
  const patient = await requireOwnedPatient(admin, user.id, patientId)
  if (!patient) return res.status(404).json({ error: 'Patient not found' })

  const recipient = validateFollowUpRecipientEmail(patient.email)
  if (deliveryMode === 'email' && (recipient.error || !recipient.email)) {
    return res.status(400).json({ error: recipient.error || 'Add a patient email before sending a follow-up.' })
  }

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
      recipient_email: deliveryMode === 'email' ? recipient.email : null,
      email_status: deliveryMode === 'email' ? null : 'manual',
      token_hash: tokenHash,
      status: FOLLOWUP_STATUS.PENDING,
      due_at: dates.due_at,
      expires_at: dates.expires_at,
    })
    .select(FOLLOWUP_REQUEST_SELECT)
    .single()

  if (error) return res.status(500).json({ error: error.message })

  let followupData = data
  let emailDelivery = null
  if (deliveryMode === 'email') {
    const attemptedAt = new Date().toISOString()
    emailDelivery = await sendFollowUpEmail({
      to: recipient.email,
      publicUrl: buildPublicFollowUpUrl(token, req),
      expiresAt: dates.expires_at,
      measureId: source.assessment.measure,
    })

    const deliveryPatch = emailDelivery.ok
      ? {
          email_status: 'sent',
          sent_at: attemptedAt,
          last_email_attempt_at: attemptedAt,
          email_provider_message_id: emailDelivery.providerMessageId,
          email_error: null,
        }
      : {
          email_status: 'failed',
          sent_at: null,
          last_email_attempt_at: attemptedAt,
          email_provider_message_id: null,
          email_error: emailDelivery.error,
        }

    const { data: updated, error: deliveryUpdateError } = await admin
      .from('followup_requests')
      .update(deliveryPatch)
      .eq('id', data.id)
      .eq('user_id', user.id)
      .select(FOLLOWUP_REQUEST_SELECT)
      .maybeSingle()

    if (!deliveryUpdateError && updated) followupData = updated
  }

  return res.status(201).json({
    followup: shapeFollowUpRecord(followupData, null),
    publicUrl: buildPublicFollowUpUrl(token, req),
    email: emailDelivery
      ? {
          status: emailDelivery.status,
          error: emailDelivery.error ?? null,
          providerMessageId: emailDelivery.providerMessageId ?? null,
        }
      : null,
  })
}

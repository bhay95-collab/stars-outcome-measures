import { getAdminClient } from '../../../../lib/supabase-admin'
import { expirePendingRequest } from '../../../../lib/followupServer'
import { hashFollowUpToken } from '../../../../lib/followupTokens'
import {
  FOLLOWUP_QUESTION_CONFIG,
  FOLLOWUP_STATUS,
  getFollowUpRequestStatus,
  shapeFollowUpRecord,
  validateFollowUpAnswers,
} from '../../../../lib/followups'

function unavailable(res, reason, status = 200) {
  return res.status(status).json({ state: 'unavailable', reason })
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).end()

  const token = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token
  if (!token || typeof token !== 'string' || token.length < 20 || token.length > 256) {
    return unavailable(res, 'invalid', 404)
  }

  const admin = getAdminClient()
  const tokenHash = hashFollowUpToken(token)
  const { data: rawRequest, error } = await admin
    .from('followup_requests')
    .select('id, user_id, patient_id, status, due_at, expires_at, created_at, completed_at, cancelled_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (error) return res.status(500).json({ error: 'Service unavailable' })
  if (!rawRequest) return unavailable(res, 'invalid', 404)

  const request = await expirePendingRequest(admin, rawRequest)
  const status = getFollowUpRequestStatus(request)

  if (req.method === 'GET') {
    if (status !== FOLLOWUP_STATUS.PENDING) {
      return unavailable(res, status)
    }
    return res.status(200).json({
      state: 'ready',
      dueAt: request.due_at,
      expiresAt: request.expires_at,
      questions: FOLLOWUP_QUESTION_CONFIG,
    })
  }

  if (status !== FOLLOWUP_STATUS.PENDING) {
    return unavailable(res, status, 409)
  }

  const validation = validateFollowUpAnswers(req.body ?? {})
  if (validation.error) return res.status(400).json({ error: validation.error })

  const { data: responseData, error: insertError } = await admin
    .from('followup_responses')
    .insert({
      request_id: request.id,
      user_id: request.user_id,
      patient_id: request.patient_id,
      ...validation.data,
    })
    .select('id, request_id, patient_id, falls_count, confidence_score, fatigue_score, symptoms_change, adherence_level, global_status, concern_text, attention_level, created_at')
    .single()

  if (insertError) {
    return unavailable(res, 'completed', 409)
  }

  const completedAt = new Date().toISOString()
  const { data: completedRequest } = await admin
    .from('followup_requests')
    .update({
      status: FOLLOWUP_STATUS.COMPLETED,
      completed_at: completedAt,
    })
    .eq('id', request.id)
    .eq('status', FOLLOWUP_STATUS.PENDING)
    .select('id, patient_id, status, due_at, expires_at, created_at, completed_at, cancelled_at')
    .maybeSingle()

  return res.status(200).json({
    state: 'submitted',
    followup: shapeFollowUpRecord(completedRequest ?? { ...request, status: FOLLOWUP_STATUS.COMPLETED, completed_at: completedAt }, responseData),
  })
}

import { getAdminClient } from '../../../../lib/supabase-admin'
import {
  expirePendingRequest,
  FOLLOWUP_ASSESSMENT_SELECT,
  FOLLOWUP_REQUEST_SELECT,
} from '../../../../lib/followupServer'
import { hashFollowUpToken } from '../../../../lib/followupTokens'
import {
  FOLLOWUP_STATUS,
  getFollowUpRequestStatus,
  shapeFollowUpRecord,
} from '../../../../lib/followups'
import {
  getFollowUpQuestionnaire,
  questionnaireAttentionLevel,
  validateFollowUpQuestionnaireAnswers,
} from '../../../../lib/followupQuestionnaires'
import { createRateLimiter, getClientIp } from '../../../../lib/rateLimit'

function unavailable(res, reason, status = 200) {
  return res.status(status).json({ state: 'unavailable', reason })
}

// Unauthenticated, token-gated endpoint. Tokens are 256-bit and stored hashed so
// brute force is infeasible, but an IP cap hardens against probing/abuse bursts.
const isRateLimited = createRateLimiter({ windowMs: 60_000, max: 30 })

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).end()

  if (isRateLimited(getClientIp(req))) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' })
  }

  const token = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token
  if (!token || typeof token !== 'string' || token.length < 20 || token.length > 256) {
    return unavailable(res, 'invalid', 404)
  }

  const admin = getAdminClient()
  const tokenHash = hashFollowUpToken(token)
  const { data: rawRequest, error } = await admin
    .from('followup_requests')
    .select(FOLLOWUP_REQUEST_SELECT)
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
    const questionnaire = getFollowUpQuestionnaire(request.measure_id)
    if (!questionnaire) return unavailable(res, 'unsupported', 404)

    return res.status(200).json({
      state: 'ready',
      dueAt: request.due_at,
      expiresAt: request.expires_at,
      questionnaire,
      questions: questionnaire.questions,
    })
  }

  if (status !== FOLLOWUP_STATUS.PENDING) {
    return unavailable(res, status, 409)
  }

  const questionnaire = getFollowUpQuestionnaire(request.measure_id)
  if (!questionnaire) return unavailable(res, 'unsupported', 404)

  const validation = validateFollowUpQuestionnaireAnswers(request.measure_id, req.body?.answers ?? req.body ?? {})
  if (validation.error) return res.status(400).json({ error: validation.error })

  const completedAt = new Date().toISOString()
  const { data: assessmentData, error: insertError } = await admin
    .from('assessments')
    .insert({
      user_id: request.user_id,
      patient_id: request.patient_id,
      measure: request.measure_id,
      inputs: validation.inputs,
      results: {
        ...validation.results,
        meta: {
          ...(validation.results?.meta ?? {}),
          patientReported: true,
          source: 'patient_reported_followup',
          followUpRequestId: request.id,
          followUpSourceAssessmentId: request.source_assessment_id ?? null,
          encounterId: `followup-${request.id}`,
          encounterDate: completedAt,
        },
      },
    })
    .select(FOLLOWUP_ASSESSMENT_SELECT)
    .single()

  if (insertError) {
    return res.status(500).json({ error: 'Your responses could not be saved. Please try again.' })
  }

  const { data: completedRequest } = await admin
    .from('followup_requests')
    .update({
      status: FOLLOWUP_STATUS.COMPLETED,
      completed_at: completedAt,
      completed_assessment_id: assessmentData.id,
    })
    .eq('id', request.id)
    .eq('status', FOLLOWUP_STATUS.PENDING)
    .select(FOLLOWUP_REQUEST_SELECT)
    .maybeSingle()

  if (!completedRequest) {
    await admin
      .from('assessments')
      .delete()
      .eq('id', assessmentData.id)
      .eq('user_id', request.user_id)
    return unavailable(res, 'completed', 409)
  }

  return res.status(200).json({
    state: 'submitted',
    attentionLevel: questionnaireAttentionLevel(request.measure_id, assessmentData.results),
    followup: shapeFollowUpRecord(completedRequest, null, assessmentData),
  })
}

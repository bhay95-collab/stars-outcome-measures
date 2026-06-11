import {
  addDaysIso,
  buildFollowUpAttentionBoard,
  FOLLOWUP_STATUS,
  isValidUuid,
  shapeFollowUpRecord,
} from './followups'
import { isEligibleFollowUpMeasureId } from './followupQuestionnaires'

export const FOLLOWUP_REQUEST_SELECT = 'id, user_id, patient_id, measure_id, source_assessment_id, completed_assessment_id, recipient_email, sent_at, email_status, email_provider_message_id, email_error, last_email_attempt_at, status, due_at, expires_at, created_at, completed_at, cancelled_at'
export const FOLLOWUP_RESPONSE_SELECT = 'id, request_id, patient_id, falls_count, confidence_score, fatigue_score, symptoms_change, adherence_level, global_status, concern_text, attention_level, created_at'
export const FOLLOWUP_ASSESSMENT_SELECT = 'id, patient_id, measure, inputs, results, created_at'

export function getRequestOrigin(req) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/$/, '')
  const host = req?.headers?.host
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  return host ? `${protocol}://${host}` : 'http://localhost:3000'
}

export function buildPublicFollowUpUrl(token, req) {
  return `${getRequestOrigin(req)}/followup/${encodeURIComponent(token)}`
}

export async function userHasActiveAccess(admin, userId) {
  const [
    { data: profile },
    { data: stripeSubscription },
    { data: appStoreSubscription },
  ] = await Promise.all([
    admin
      .from('profiles')
      .select('trial_end_date')
      .eq('id', userId)
      .maybeSingle(),
    admin
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', userId)
      .maybeSingle(),
    admin
      .from('app_store_subscriptions')
      .select('is_active, expiration_at')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const now = new Date()
  const trialActive = profile?.trial_end_date && new Date(profile.trial_end_date) > now
  const subscriptionActive =
    stripeSubscription?.status === 'active' &&
    stripeSubscription?.current_period_end &&
    new Date(stripeSubscription.current_period_end) > now
  const appStoreActive =
    appStoreSubscription?.is_active === true &&
    appStoreSubscription?.expiration_at &&
    new Date(appStoreSubscription.expiration_at) > now

  return Boolean(trialActive || subscriptionActive || appStoreActive)
}

export async function requireOwnedPatient(admin, userId, patientId) {
  if (!isValidUuid(patientId)) return null
  const { data } = await admin
    .from('patients')
    .select('id, user_id, email')
    .eq('id', patientId)
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

export async function listFollowUpsForPatient(admin, userId, patientId) {
  const [
    { data: requests, error: requestsError },
    { data: responses, error: responsesError },
    { data: assessments, error: assessmentsError },
    { data: patient },
  ] = await Promise.all([
    admin
      .from('followup_requests')
      .select(FOLLOWUP_REQUEST_SELECT)
      .eq('user_id', userId)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),
    admin
      .from('followup_responses')
      .select(FOLLOWUP_RESPONSE_SELECT)
      .eq('user_id', userId)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),
    admin
      .from('assessments')
      .select(FOLLOWUP_ASSESSMENT_SELECT)
      .eq('user_id', userId)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),
    admin
      .from('patients')
      .select('diagnosis')
      .eq('user_id', userId)
      .eq('id', patientId)
      .maybeSingle(),
  ])

  if (requestsError || responsesError || assessmentsError) {
    throw new Error(requestsError?.message || responsesError?.message || assessmentsError?.message || 'Could not load follow-ups')
  }

  const condition = patient?.diagnosis ?? null
  const responseMap = new Map((responses ?? []).map(response => [response.request_id, response]))
  const assessmentMap = new Map((assessments ?? []).map(assessment => [assessment.id, assessment]))
  return (requests ?? []).map(request => shapeFollowUpRecord(
    request,
    responseMap.get(request.id),
    assessmentMap.get(request.completed_assessment_id),
    new Date(),
    assessmentMap.get(request.source_assessment_id),
    condition,
  ))
}

export async function listFollowUpAttentionBoard(admin, userId) {
  const { data: requests, error: requestsError } = await admin
    .from('followup_requests')
    .select(FOLLOWUP_REQUEST_SELECT)
    .eq('user_id', userId)
    .neq('status', FOLLOWUP_STATUS.CANCELLED)
    .order('created_at', { ascending: false })

  if (requestsError) throw new Error(requestsError.message)
  if (!requests?.length) return []

  const patientIds = [...new Set(requests.map(request => request.patient_id))]
  const requestIds = requests.map(request => request.id)
  const assessmentIds = [...new Set(
    requests.flatMap(request => [request.completed_assessment_id, request.source_assessment_id]).filter(Boolean),
  )]

  const [
    { data: patients, error: patientsError },
    { data: responses, error: responsesError },
    { data: assessments, error: assessmentsError },
  ] = await Promise.all([
    admin
      .from('patients')
      .select('id, initials, diagnosis')
      .eq('user_id', userId)
      .in('id', patientIds),
    admin
      .from('followup_responses')
      .select(FOLLOWUP_RESPONSE_SELECT)
      .eq('user_id', userId)
      .in('request_id', requestIds),
    assessmentIds.length
      ? admin
          .from('assessments')
          .select(FOLLOWUP_ASSESSMENT_SELECT)
          .eq('user_id', userId)
          .in('id', assessmentIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (patientsError || responsesError || assessmentsError) {
    throw new Error(patientsError?.message || responsesError?.message || assessmentsError?.message || 'Could not load follow-up attention')
  }

  const patientMap = new Map((patients ?? []).map(patient => [patient.id, patient]))
  const responseMap = new Map((responses ?? []).map(response => [response.request_id, response]))
  const assessmentMap = new Map((assessments ?? []).map(assessment => [assessment.id, assessment]))

  const recordsByPatient = new Map()
  for (const request of requests) {
    if (!patientMap.has(request.patient_id)) continue
    const record = shapeFollowUpRecord(
      request,
      responseMap.get(request.id),
      assessmentMap.get(request.completed_assessment_id),
      new Date(),
      assessmentMap.get(request.source_assessment_id),
      patientMap.get(request.patient_id)?.diagnosis ?? null,
    )
    const list = recordsByPatient.get(request.patient_id) ?? []
    list.push(record)
    recordsByPatient.set(request.patient_id, list)
  }

  const entries = [...recordsByPatient.entries()].map(([patientId, records]) => ({
    patientId,
    patientLabel: patientMap.get(patientId)?.initials ?? 'Patient',
    records,
  }))

  return buildFollowUpAttentionBoard(entries)
}

export function normalizeFollowUpDates({ dueAt, expiresAt } = {}) {
  const due = dueAt ? new Date(dueAt) : new Date(addDaysIso(7))
  const expires = expiresAt ? new Date(expiresAt) : new Date(addDaysIso(14))
  const now = new Date()

  if (Number.isNaN(due.getTime()) || Number.isNaN(expires.getTime())) {
    return { error: 'Valid due and expiry dates are required.' }
  }
  if (expires <= now) return { error: 'Expiry date must be in the future.' }
  if (expires <= due) return { error: 'Expiry date must be after the due date.' }

  return {
    due_at: due.toISOString(),
    expires_at: expires.toISOString(),
  }
}

export async function expirePendingRequest(admin, request) {
  if (!request || request.status !== FOLLOWUP_STATUS.PENDING) return request
  const expiresAt = request.expires_at ? new Date(request.expires_at) : null
  if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt >= new Date()) return request

  await admin
    .from('followup_requests')
    .update({ status: FOLLOWUP_STATUS.EXPIRED })
    .eq('id', request.id)
    .eq('status', FOLLOWUP_STATUS.PENDING)

  return { ...request, status: FOLLOWUP_STATUS.EXPIRED }
}

export async function resolveFollowUpSourceAssessment(admin, userId, patientId, measureId, sourceAssessmentId = null) {
  if (!isEligibleFollowUpMeasureId(measureId)) return { error: 'Select a supported patient questionnaire.' }
  if (sourceAssessmentId && !isValidUuid(sourceAssessmentId)) return { error: 'Selected source assessment is not valid.' }

  const query = admin
    .from('assessments')
    .select(FOLLOWUP_ASSESSMENT_SELECT)
    .eq('user_id', userId)
    .eq('patient_id', patientId)
    .eq('measure', measureId)

  if (sourceAssessmentId) query.eq('id', sourceAssessmentId)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return { error: error.message }

  const assessment = (data ?? [])[0] ?? null
  if (!assessment) {
    return { error: 'Complete this questionnaire with the patient before sending it as a follow-up.' }
  }

  return { assessment }
}

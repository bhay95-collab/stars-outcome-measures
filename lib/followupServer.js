import {
  addDaysIso,
  FOLLOWUP_STATUS,
  isValidUuid,
  shapeFollowUpRecord,
} from './followups'

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
    { data: subscription },
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
  ])

  const now = new Date()
  const trialActive = profile?.trial_end_date && new Date(profile.trial_end_date) > now
  const subscriptionActive =
    subscription?.status === 'active' &&
    subscription?.current_period_end &&
    new Date(subscription.current_period_end) > now

  return Boolean(trialActive || subscriptionActive)
}

export async function requireOwnedPatient(admin, userId, patientId) {
  if (!isValidUuid(patientId)) return null
  const { data } = await admin
    .from('patients')
    .select('id, user_id')
    .eq('id', patientId)
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

export async function listFollowUpsForPatient(admin, userId, patientId) {
  const [
    { data: requests, error: requestsError },
    { data: responses, error: responsesError },
  ] = await Promise.all([
    admin
      .from('followup_requests')
      .select('id, patient_id, status, due_at, expires_at, created_at, completed_at, cancelled_at')
      .eq('user_id', userId)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),
    admin
      .from('followup_responses')
      .select('id, request_id, patient_id, falls_count, confidence_score, fatigue_score, symptoms_change, adherence_level, global_status, concern_text, attention_level, created_at')
      .eq('user_id', userId)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),
  ])

  if (requestsError || responsesError) {
    throw new Error(requestsError?.message || responsesError?.message || 'Could not load follow-ups')
  }

  const responseMap = new Map((responses ?? []).map(response => [response.request_id, response]))
  return (requests ?? []).map(request => shapeFollowUpRecord(request, responseMap.get(request.id)))
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

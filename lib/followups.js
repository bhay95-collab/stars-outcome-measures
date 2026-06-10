import {
  formatQuestionnaireResult,
  getFollowUpQuestionnaire,
  questionnaireAttentionLevel,
} from './followupQuestionnaires'
import { calcChange, getMCIDStatus, MCID_VALS, MEASURES } from './clinical'

export const FOLLOWUP_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
}

export const FOLLOWUP_ATTENTION = {
  GREEN: 'green',
  AMBER: 'amber',
  RED: 'red',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidUuid(value) {
  return UUID_RE.test(String(value ?? ''))
}

export function addDaysIso(days, baseDate = new Date()) {
  const date = new Date(baseDate)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export function dateInputValueFromIso(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function dateInputValueInDays(days, baseDate = new Date()) {
  return dateInputValueFromIso(addDaysIso(days, baseDate))
}

export function isoFromDateInput(value) {
  if (!value) return null
  const date = new Date(`${value}T12:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function formatFollowUpDate(iso) {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function getFollowUpRequestStatus(request, now = new Date()) {
  if (!request) return FOLLOWUP_STATUS.EXPIRED
  if (request.status === FOLLOWUP_STATUS.COMPLETED || request.completed_at) return FOLLOWUP_STATUS.COMPLETED
  if (request.status === FOLLOWUP_STATUS.CANCELLED || request.cancelled_at) return FOLLOWUP_STATUS.CANCELLED
  const expiresAt = request.expires_at ? new Date(request.expires_at) : null
  if (expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt < now) return FOLLOWUP_STATUS.EXPIRED
  return FOLLOWUP_STATUS.PENDING
}

export function isFollowUpOverdue(request, now = new Date()) {
  if (getFollowUpRequestStatus(request, now) !== FOLLOWUP_STATUS.PENDING) return false
  const dueAt = request?.due_at ? new Date(request.due_at) : null
  return Boolean(dueAt && !Number.isNaN(dueAt.getTime()) && dueAt < now)
}

export function isPatientReportedAssessment(assessment) {
  const meta = assessment?.results?.meta
  return Boolean(meta?.patientReported || meta?.source === 'patient_reported_followup')
}

function toFiniteNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

/**
 * Compare a patient-reported questionnaire result against the clinic-recorded
 * source assessment the follow-up link was created from. MCID thresholds and
 * directionality come from the clinical registry — nothing is invented here.
 */
export function buildFollowUpComparison(sourceAssessment, completedAssessment) {
  if (!sourceAssessment || !completedAssessment) return null
  if (sourceAssessment.measure !== completedAssessment.measure) return null

  const measure = MEASURES[completedAssessment.measure]
  const current = toFiniteNumber(completedAssessment.results?.primaryValue)
  const previous = toFiniteNumber(sourceAssessment.results?.primaryValue)
  if (!measure || current == null || previous == null) return null

  const change = calcChange(current, previous, Boolean(measure.higherIsBetter))
  if (!change) return null

  const mcid = measure.mcidKey ? getMCIDStatus(measure.mcidKey, current, previous) : null
  const threshold = measure.mcidKey ? MCID_VALS[measure.mcidKey]?.thresh ?? null : null
  const unit = measure.primaryUnit ?? ''
  const direction = change.delta === 0 ? 'stable' : change.improved ? 'improved' : 'declined'
  const meaningfulDecline = direction === 'declined' && threshold != null && Math.abs(change.delta) >= threshold

  const baselineLabel = `${previous}${unit} on ${formatFollowUpDate(sourceAssessment.created_at)}`
  let changeLabel
  if (direction === 'stable') {
    changeLabel = 'No change'
  } else if (mcid) {
    changeLabel = meaningfulDecline ? `${mcid.label} (exceeds MCID ${threshold}${unit})` : mcid.label
  } else {
    changeLabel = `${direction === 'improved' ? 'Improved' : 'Declined'} ${change.rawStr}${unit ? ` ${unit}` : ''}`
  }

  return {
    baselineValue: previous,
    baselineDate: sourceAssessment.created_at,
    currentValue: current,
    delta: change.delta,
    deltaLabel: `${change.rawStr}${unit ? ` ${unit}` : ''}`,
    direction,
    meaningfulDecline,
    mcidLabel: mcid?.label ?? null,
    summaryLine: `Vs clinic baseline ${baselineLabel}: ${changeLabel}`,
  }
}

/**
 * A confirmed decline beyond the MCID threshold always warrants clinician
 * review, even when the absolute score still classifies as green.
 */
export function escalateAttentionForDecline(attentionLevel, comparison) {
  if (!comparison?.meaningfulDecline) return attentionLevel
  if (attentionLevel === FOLLOWUP_ATTENTION.RED) return FOLLOWUP_ATTENTION.RED
  return FOLLOWUP_ATTENTION.AMBER
}

export function sanitizeFollowUpResponse(response) {
  if (!response) return null
  return {
    id: response.id,
    request_id: response.request_id,
    patient_id: response.patient_id,
    falls_count: response.falls_count,
    confidence_score: response.confidence_score,
    fatigue_score: response.fatigue_score,
    symptoms_change: response.symptoms_change,
    adherence_level: response.adherence_level,
    global_status: response.global_status,
    concern_text: response.concern_text ?? '',
    attention_level: response.attention_level ?? FOLLOWUP_ATTENTION.GREEN,
    created_at: response.created_at,
  }
}

export function sanitizeFollowUpAssessment(assessment, sourceAssessment = null) {
  if (!assessment) return null
  const measureId = assessment.measure
  const comparison = buildFollowUpComparison(sourceAssessment, assessment)
  return {
    id: assessment.id,
    patient_id: assessment.patient_id,
    measure: measureId,
    measureName: getFollowUpQuestionnaire(measureId)?.name ?? measureId,
    resultLabel: formatQuestionnaireResult(measureId, assessment.results),
    interpretation: assessment.results?.interpretation ?? '',
    attention_level: escalateAttentionForDecline(
      questionnaireAttentionLevel(measureId, assessment.results),
      comparison,
    ),
    comparison,
    created_at: assessment.created_at,
    results: assessment.results,
  }
}

export function shapeFollowUpRecord(request, response = null, assessment = null, now = new Date(), sourceAssessment = null) {
  const displayStatus = getFollowUpRequestStatus(request, now)
  return {
    id: request.id,
    patient_id: request.patient_id,
    measure_id: request.measure_id ?? null,
    source_assessment_id: request.source_assessment_id ?? null,
    completed_assessment_id: request.completed_assessment_id ?? null,
    recipient_email: request.recipient_email ?? null,
    sent_at: request.sent_at ?? null,
    email_status: request.email_status ?? null,
    email_provider_message_id: request.email_provider_message_id ?? null,
    email_error: request.email_error ?? null,
    last_email_attempt_at: request.last_email_attempt_at ?? null,
    status: request.status,
    displayStatus,
    overdue: isFollowUpOverdue(request, now),
    due_at: request.due_at,
    expires_at: request.expires_at,
    created_at: request.created_at,
    completed_at: request.completed_at,
    cancelled_at: request.cancelled_at,
    response: sanitizeFollowUpResponse(response),
    assessment: sanitizeFollowUpAssessment(assessment, sourceAssessment),
  }
}

export function getFollowUpRecordAttention(record) {
  return record?.assessment?.attention_level
    ?? record?.response?.attention_level
    ?? FOLLOWUP_ATTENTION.GREEN
}

export function getFollowUpRecordCompletedAt(record) {
  return record?.assessment?.created_at
    ?? record?.response?.created_at
    ?? record?.completed_at
    ?? null
}

export function followUpRecordOneLine(record) {
  if (!record) return 'No response recorded'
  if (record.assessment) {
    const name = record.assessment.measureName ?? record.measure_id ?? 'Questionnaire'
    const score = record.assessment.resultLabel ?? 'score recorded'
    return `${name}: ${score}`
  }
  if (record.response) return responseOneLine(record.response)
  return 'No response recorded'
}

export function summarizeFollowUpRecords(records = [], now = new Date()) {
  const list = records.map(record => ({
    ...record,
    displayStatus: record.displayStatus ?? getFollowUpRequestStatus(record, now),
    overdue: record.overdue ?? isFollowUpOverdue(record, now),
  }))
  const completed = list
    .filter(record => record.response || record.assessment)
    .sort((a, b) => new Date(getFollowUpRecordCompletedAt(b) ?? 0) - new Date(getFollowUpRecordCompletedAt(a) ?? 0))
  const pending = list.filter(record => record.displayStatus === FOLLOWUP_STATUS.PENDING)
  const overdue = pending.filter(record => record.overdue)
  const latestResponse = completed[0] ?? null
  const redCount = completed.filter(record => getFollowUpRecordAttention(record) === FOLLOWUP_ATTENTION.RED).length
  const amberCount = completed.filter(record => getFollowUpRecordAttention(record) === FOLLOWUP_ATTENTION.AMBER).length

  return {
    records: list,
    latestResponse,
    pendingCount: pending.length,
    overdueCount: overdue.length,
    completedCount: completed.length,
    attentionLevel: redCount ? FOLLOWUP_ATTENTION.RED : amberCount ? FOLLOWUP_ATTENTION.AMBER : FOLLOWUP_ATTENTION.GREEN,
  }
}

export function followUpStatusLabel(status, overdue = false) {
  if (overdue && status === FOLLOWUP_STATUS.PENDING) return 'Overdue'
  if (status === FOLLOWUP_STATUS.COMPLETED) return 'Completed'
  if (status === FOLLOWUP_STATUS.CANCELLED) return 'Cancelled'
  if (status === FOLLOWUP_STATUS.EXPIRED) return 'Expired'
  return 'Pending'
}

export function followUpAttentionLabel(level) {
  if (level === FOLLOWUP_ATTENTION.RED) return 'Needs review'
  if (level === FOLLOWUP_ATTENTION.AMBER) return 'Watch'
  return 'Settled'
}

const ATTENTION_RANK = {
  [FOLLOWUP_ATTENTION.RED]: 0,
  [FOLLOWUP_ATTENTION.AMBER]: 1,
  [FOLLOWUP_ATTENTION.GREEN]: 2,
}

/**
 * Build the caseload-wide attention board: one row per patient whose latest
 * patient-reported result needs review (red/amber) or who has overdue links.
 *
 * @param {Array<{ patientId: string, patientLabel: string, records: Array }>} entries
 *   Shaped follow-up records grouped per patient.
 */
export function buildFollowUpAttentionBoard(entries = [], now = new Date()) {
  return entries
    .map(entry => {
      const summary = summarizeFollowUpRecords(entry.records ?? [], now)
      const latest = summary.latestResponse
      const attentionLevel = latest ? getFollowUpRecordAttention(latest) : FOLLOWUP_ATTENTION.GREEN
      return {
        patientId: entry.patientId,
        patientLabel: entry.patientLabel,
        attentionLevel,
        attentionLabel: followUpAttentionLabel(attentionLevel),
        overdueCount: summary.overdueCount,
        pendingCount: summary.pendingCount,
        latestLine: latest ? followUpRecordOneLine(latest) : null,
        latestComparisonLine: latest?.assessment?.comparison?.summaryLine ?? null,
        latestCompletedAt: getFollowUpRecordCompletedAt(latest),
      }
    })
    .filter(item => item.attentionLevel !== FOLLOWUP_ATTENTION.GREEN || item.overdueCount > 0)
    .sort((a, b) => {
      const rank = ATTENTION_RANK[a.attentionLevel] - ATTENTION_RANK[b.attentionLevel]
      if (rank !== 0) return rank
      if (b.overdueCount !== a.overdueCount) return b.overdueCount - a.overdueCount
      return new Date(b.latestCompletedAt ?? 0) - new Date(a.latestCompletedAt ?? 0)
    })
}

export function responseOneLine(response) {
  if (!response) return 'No response recorded'
  const falls = Number(response.falls_count) === 1 ? '1 fall' : `${response.falls_count} falls`
  return `${falls}, confidence ${response.confidence_score}/10, fatigue ${response.fatigue_score}/10, overall ${response.global_status}`
}

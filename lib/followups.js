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

export const SYMPTOMS_CHANGE_OPTIONS = [
  { value: 'better', label: 'Better' },
  { value: 'same', label: 'About the same' },
  { value: 'worse', label: 'Worse' },
]

export const GLOBAL_STATUS_OPTIONS = [
  { value: 'better', label: 'Better' },
  { value: 'same', label: 'About the same' },
  { value: 'worse', label: 'Worse' },
]

export const ADHERENCE_OPTIONS = [
  { value: 'all', label: 'All sessions' },
  { value: 'most', label: 'Most sessions' },
  { value: 'some', label: 'Some sessions' },
  { value: 'none', label: 'None' },
  { value: 'not_applicable', label: 'Not applicable' },
]

export const FOLLOWUP_QUESTION_CONFIG = [
  {
    id: 'falls_count',
    label: 'Falls since your last check-in',
    help: 'Count any fall to the floor, ground, or lower surface.',
    type: 'number',
    min: 0,
    max: 99,
  },
  {
    id: 'confidence_score',
    label: 'Movement confidence',
    help: '0 means not confident at all. 10 means fully confident.',
    type: 'scale',
    min: 0,
    max: 10,
  },
  {
    id: 'fatigue_score',
    label: 'Fatigue impact',
    help: '0 means no fatigue impact. 10 means severe impact.',
    type: 'scale',
    min: 0,
    max: 10,
  },
  {
    id: 'symptoms_change',
    label: 'Symptoms',
    type: 'segmented',
    options: SYMPTOMS_CHANGE_OPTIONS,
  },
  {
    id: 'adherence_level',
    label: 'Home program',
    type: 'radio',
    options: ADHERENCE_OPTIONS,
  },
  {
    id: 'global_status',
    label: 'Overall status',
    type: 'segmented',
    options: GLOBAL_STATUS_OPTIONS,
  },
  {
    id: 'concern_text',
    label: 'Anything you want your clinician to know?',
    type: 'textarea',
    maxLength: 1000,
  },
]

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function intInRange(value, min, max) {
  if (value === '' || value == null) return null
  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max) return null
  return number
}

function optionValue(value, options) {
  const stringValue = String(value ?? '')
  return options.some(option => option.value === stringValue) ? stringValue : null
}

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

export function scoreFollowUpAttention(input) {
  const falls = intInRange(input?.falls_count, 0, 99) ?? 0
  const confidence = intInRange(input?.confidence_score, 0, 10)
  const fatigue = intInRange(input?.fatigue_score, 0, 10)
  const symptoms = optionValue(input?.symptoms_change, SYMPTOMS_CHANGE_OPTIONS)
  const adherence = optionValue(input?.adherence_level, ADHERENCE_OPTIONS)
  const global = optionValue(input?.global_status, GLOBAL_STATUS_OPTIONS)

  if (falls > 0 || (global === 'worse' && symptoms === 'worse')) return FOLLOWUP_ATTENTION.RED
  if (confidence != null && confidence <= 4) return FOLLOWUP_ATTENTION.AMBER
  if (fatigue != null && fatigue >= 7) return FOLLOWUP_ATTENTION.AMBER
  if (adherence === 'none' || global === 'worse') return FOLLOWUP_ATTENTION.AMBER
  return FOLLOWUP_ATTENTION.GREEN
}

export function validateFollowUpAnswers(input = {}) {
  const falls_count = intInRange(input.falls_count, 0, 99)
  const confidence_score = intInRange(input.confidence_score, 0, 10)
  const fatigue_score = intInRange(input.fatigue_score, 0, 10)
  const symptoms_change = optionValue(input.symptoms_change, SYMPTOMS_CHANGE_OPTIONS)
  const adherence_level = optionValue(input.adherence_level, ADHERENCE_OPTIONS)
  const global_status = optionValue(input.global_status, GLOBAL_STATUS_OPTIONS)
  const concern_text = String(input.concern_text ?? '').trim().slice(0, 1000)

  if (falls_count == null) return { error: 'Falls count must be between 0 and 99.' }
  if (confidence_score == null) return { error: 'Confidence must be between 0 and 10.' }
  if (fatigue_score == null) return { error: 'Fatigue must be between 0 and 10.' }
  if (!symptoms_change) return { error: 'Symptoms change is required.' }
  if (!adherence_level) return { error: 'Home program response is required.' }
  if (!global_status) return { error: 'Overall status is required.' }

  const data = {
    falls_count,
    confidence_score,
    fatigue_score,
    symptoms_change,
    adherence_level,
    global_status,
    concern_text,
  }

  return {
    data: {
      ...data,
      attention_level: scoreFollowUpAttention(data),
    },
  }
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

export function shapeFollowUpRecord(request, response, now = new Date()) {
  const displayStatus = getFollowUpRequestStatus(request, now)
  return {
    id: request.id,
    patient_id: request.patient_id,
    status: request.status,
    displayStatus,
    overdue: isFollowUpOverdue(request, now),
    due_at: request.due_at,
    expires_at: request.expires_at,
    created_at: request.created_at,
    completed_at: request.completed_at,
    cancelled_at: request.cancelled_at,
    response: sanitizeFollowUpResponse(response),
  }
}

export function summarizeFollowUpRecords(records = [], now = new Date()) {
  const list = records.map(record => ({
    ...record,
    displayStatus: record.displayStatus ?? getFollowUpRequestStatus(record, now),
    overdue: record.overdue ?? isFollowUpOverdue(record, now),
  }))
  const responses = list
    .filter(record => record.response)
    .sort((a, b) => new Date(b.response.created_at) - new Date(a.response.created_at))
  const pending = list.filter(record => record.displayStatus === FOLLOWUP_STATUS.PENDING)
  const overdue = pending.filter(record => record.overdue)
  const latestResponse = responses[0] ?? null
  const redCount = responses.filter(record => record.response.attention_level === FOLLOWUP_ATTENTION.RED).length
  const amberCount = responses.filter(record => record.response.attention_level === FOLLOWUP_ATTENTION.AMBER).length

  return {
    records: list,
    latestResponse,
    pendingCount: pending.length,
    overdueCount: overdue.length,
    completedCount: responses.length,
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

export function responseOneLine(response) {
  if (!response) return 'No response recorded'
  const falls = Number(response.falls_count) === 1 ? '1 fall' : `${response.falls_count} falls`
  return `${falls}, confidence ${response.confidence_score}/10, fatigue ${response.fatigue_score}/10, overall ${response.global_status}`
}

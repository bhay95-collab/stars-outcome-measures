import { DIAG_RECS } from './constants.js'
import { MEASURES } from './measures.js'

export const DEFAULT_REASSESSMENT_DAYS = 28

export const SMART_REHAB_PATHWAY_COPY = {
  short: 'A diagnosis-based guide that checks recommended outcome measures against what has already been recorded.',
  detail: 'Smart Rehab Pathway uses the patient diagnosis and saved assessments to suggest the core outcome measures for this condition, show missing baseline measures, and flag reassessments that are due.',
  badgeHelp: 'Baseline badges mean a recommended first measure is missing. Due badges mean a previously recorded pathway measure is ready to repeat.',
  caution: 'It supports consistent measurement and planning, but should be interpreted alongside clinical judgement.',
}

const DAY_MS = 24 * 60 * 60 * 1000

function formatDate(iso) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function normalizeDiagnosis(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return { raw: '', key: '' }
  const direct = DIAG_RECS[raw] ? raw : ''
  if (direct) return { raw, key: direct }
  const lower = raw.toLowerCase()
  const fuzzy = Object.keys(DIAG_RECS).find(key => key.toLowerCase() === lower)
  return { raw, key: fuzzy ?? '' }
}

function latestAssessmentByMeasure(assessments = []) {
  const map = new Map()
  for (const assessment of assessments) {
    if (!assessment?.measure || !MEASURES[assessment.measure]) continue
    const current = map.get(assessment.measure)
    if (!current || new Date(assessment.created_at) > new Date(current.created_at)) {
      map.set(assessment.measure, assessment)
    }
  }
  return map
}

function measureMeta(measureId, latest, now, reassessmentDays) {
  const measure = MEASURES[measureId]
  const lastRecordedAt = latest?.created_at ?? null
  const ageDays = lastRecordedAt
    ? Math.floor((now.getTime() - new Date(lastRecordedAt).getTime()) / DAY_MS)
    : null
  const hasBaseline = Boolean(latest)
  const isDue = hasBaseline && ageDays != null && ageDays >= reassessmentDays
  return {
    id: measureId,
    name: measure?.name ?? measureId,
    category: measure?.category ?? 'performance',
    hasBaseline,
    isDue,
    lastRecordedAt,
    lastRecordedLabel: formatDate(lastRecordedAt),
    daysSinceLast: ageDays,
  }
}

function actionForMeasure(type, item, reassessmentDays) {
  if (type === 'due') {
    return {
      type: 'reassess',
      tone: 'due',
      measureId: item.id,
      label: `Repeat ${item.id}`,
      detail: `${item.name} was last recorded ${item.daysSinceLast} days ago. Reassessment is due every ${reassessmentDays} days.`,
    }
  }

  return {
    type: 'baseline',
    tone: 'attention',
    measureId: item.id,
    label: `Record ${item.id}`,
    detail: `${item.name} is recommended for this pathway and has not been recorded yet.`,
  }
}

export function buildPatientPathway(patient, assessments = [], options = {}) {
  const reassessmentDays = options.reassessmentDays ?? DEFAULT_REASSESSMENT_DAYS
  const now = options.now ? new Date(options.now) : new Date()
  const sourceDiagnosis = patient?.diagnosis ?? patient?.condition ?? ''
  const diagnosis = normalizeDiagnosis(sourceDiagnosis)
  const allRecommendedIds = diagnosis.key
    ? (DIAG_RECS[diagnosis.key] ?? []).filter(id => MEASURES[id])
    : []
  const excludedIdSet = new Set(Array.isArray(patient?.pathway_excluded_measures) ? patient.pathway_excluded_measures : [])
  const activeIds = allRecommendedIds.filter(id => !excludedIdSet.has(id))
  const allExcluded = allRecommendedIds.length > 0 && activeIds.length === 0
  const latestByMeasure = latestAssessmentByMeasure(assessments)

  const recommendedMeasures = activeIds.map(id =>
    measureMeta(id, latestByMeasure.get(id), now, reassessmentDays)
  )
  const excludedMeasures = allRecommendedIds
    .filter(id => excludedIdSet.has(id))
    .map(id => measureMeta(id, latestByMeasure.get(id), now, reassessmentDays))
  const missingMeasures = recommendedMeasures.filter(item => !item.hasBaseline)
  const dueMeasures = recommendedMeasures.filter(item => item.isDue)
  const recordedMeasures = recommendedMeasures.filter(item => item.hasBaseline)
  const coveragePercent = recommendedMeasures.length
    ? Math.round((recordedMeasures.length / recommendedMeasures.length) * 100)
    : 0

  let nextActions = []
  if (!diagnosis.raw) {
    nextActions = [{
      type: 'diagnosis',
      tone: 'neutral',
      measureId: null,
      label: 'Record diagnosis',
      detail: 'Add a diagnosis to generate condition-specific pathway recommendations.',
    }]
  } else if (!allRecommendedIds.length) {
    nextActions = [{
      type: 'pathway',
      tone: 'neutral',
      measureId: null,
      label: 'No pathway template',
      detail: `${diagnosis.raw} does not yet have a mapped pathway. Use clinical judgement to select measures.`,
    }]
  } else if (allExcluded) {
    nextActions = [{
      type: 'all-excluded',
      tone: 'neutral',
      measureId: null,
      label: 'All measures excluded',
      detail: 'All recommended measures for this pathway have been marked as not indicated. Restore measures below to resume pathway tracking.',
    }]
  } else if (missingMeasures.length || dueMeasures.length) {
    nextActions = [
      ...missingMeasures.slice(0, 3).map(item => actionForMeasure('baseline', item, reassessmentDays)),
      ...dueMeasures.slice(0, 3).map(item => actionForMeasure('due', item, reassessmentDays)),
    ].slice(0, 4)
  } else {
    nextActions = [{
      type: 'current',
      tone: 'good',
      measureId: null,
      label: 'Pathway current',
      detail: 'Recommended baseline measures are recorded and no reassessments are currently due.',
    }]
  }

  const preferredMeasureId =
    missingMeasures[0]?.id ??
    dueMeasures[0]?.id ??
    recommendedMeasures[0]?.id ??
    null

  const statusTone = !diagnosis.raw || !allRecommendedIds.length || allExcluded
    ? 'neutral'
    : dueMeasures.length
      ? 'due'
      : missingMeasures.length
        ? 'attention'
        : 'good'
  const statusLabel = !diagnosis.raw
    ? 'Diagnosis needed'
    : !allRecommendedIds.length
      ? 'No pathway template'
      : allExcluded
        ? 'All measures excluded'
        : dueMeasures.length
          ? `${dueMeasures.length} reassessment${dueMeasures.length === 1 ? '' : 's'} due`
          : missingMeasures.length
            ? `${missingMeasures.length} baseline measure${missingMeasures.length === 1 ? '' : 's'} remaining`
            : 'Pathway current'

  return {
    diagnosis: diagnosis.key || diagnosis.raw || '',
    diagnosisLabel: diagnosis.raw || 'Not recorded',
    recommendedMeasures,
    excludedMeasures,
    missingMeasures,
    dueMeasures,
    recordedMeasures,
    coveragePercent,
    nextActions,
    statusLabel,
    statusTone,
    preferredMeasureId,
    reassessmentDays,
    explanation: SMART_REHAB_PATHWAY_COPY,
  }
}

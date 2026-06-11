// Outcomes Intelligence — derived service-level reporting across the caseload.
// Pure aggregation only: improvement is baseline (earliest) vs latest per
// patient-measure pair, MCID achievement uses published MCID_VALS thresholds,
// and rates are only reported over pairs with genuine repeat data.

import { DIAG_RECS } from './constants.js'
import { MEASURES } from './measures.js'
import { getMCIDStatus } from './mcid.js'
import { toFiniteNumber } from './patientSummary.js'

export const OUTCOMES_INTELLIGENCE_COPY = {
  short: 'Service-level outcomes across your caseload: improvement rates, MCID achievement, and diagnosis cohorts.',
  method: 'Change is measured from each patient’s earliest recorded result to their latest result for the same measure. Improvement direction follows each measure’s published directionality. MCID achievement is only calculated for measures with a published MCID threshold.',
  caution: 'These figures summarise recorded outcome measures. They support service review and reporting, but do not replace clinical judgement about individual patients.',
}

export const UNMAPPED_COHORT_LABEL = 'Other / unmapped'
export const NO_DIAGNOSIS_COHORT_LABEL = 'No diagnosis recorded'

function normalizeDiagnosisLabel(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return NO_DIAGNOSIS_COHORT_LABEL
  if (DIAG_RECS[raw]) return raw
  const lower = raw.toLowerCase()
  const fuzzy = Object.keys(DIAG_RECS).find(key => key.toLowerCase() === lower)
  return fuzzy ?? UNMAPPED_COHORT_LABEL
}

function isPatientReported(assessment) {
  return Boolean(assessment?.results?.meta?.patientReported)
}

function sortByDateAsc(a, b) {
  return new Date(a.created_at) - new Date(b.created_at)
}

function ratePercent(numerator, denominator) {
  if (!denominator) return null
  return Math.round((numerator / denominator) * 100)
}

// One pair per (patient, measure) with at least two numeric results:
// earliest result = baseline, latest result = current.
// diagnosisByPatientId supplies each patient's condition so MCID achievement
// uses the condition-specific threshold (e.g. TUG 2.9 s in stroke, not 2.0 s).
function buildChangePairs(assessmentsByPatient, diagnosisByPatientId = new Map()) {
  const pairs = []
  for (const [patientId, patientAssessments] of assessmentsByPatient) {
    const condition = diagnosisByPatientId.get(patientId) ?? null
    const byMeasure = new Map()
    for (const assessment of patientAssessments) {
      if (toFiniteNumber(assessment.results?.primaryValue) == null) continue
      if (!byMeasure.has(assessment.measure)) byMeasure.set(assessment.measure, [])
      byMeasure.get(assessment.measure).push(assessment)
    }

    for (const [measureId, records] of byMeasure) {
      if (records.length < 2) continue
      const ordered = [...records].sort(sortByDateAsc)
      const baseline = ordered[0]
      const latest = ordered[ordered.length - 1]
      const measure = MEASURES[measureId]
      const baselineValue = toFiniteNumber(baseline.results?.primaryValue)
      const latestValue = toFiniteNumber(latest.results?.primaryValue)
      const delta = latestValue - baselineValue
      const direction = delta === 0
        ? 'stable'
        : (measure.higherIsBetter === false ? delta < 0 : delta > 0)
          ? 'improved'
          : 'declined'
      const mcid = measure.mcidKey
        ? getMCIDStatus(measure.mcidKey, latestValue, baselineValue, condition)
        : null

      pairs.push({
        patientId,
        measureId,
        baselineValue,
        latestValue,
        baselineAt: baseline.created_at,
        latestAt: latest.created_at,
        recordCount: ordered.length,
        direction,
        mcidEligible: Boolean(mcid),
        mcidMet: Boolean(mcid?.meetsThreshold),
      })
    }
  }
  return pairs
}

function summarizePairs(pairs) {
  const improved = pairs.filter(pair => pair.direction === 'improved').length
  const declined = pairs.filter(pair => pair.direction === 'declined').length
  const stable = pairs.filter(pair => pair.direction === 'stable').length
  const mcidEligible = pairs.filter(pair => pair.mcidEligible).length
  const mcidMet = pairs.filter(pair => pair.mcidMet).length
  return {
    pairCount: pairs.length,
    improvedCount: improved,
    declinedCount: declined,
    stableCount: stable,
    improvementRate: ratePercent(improved, pairs.length),
    mcidEligibleCount: mcidEligible,
    mcidMetCount: mcidMet,
    mcidRate: ratePercent(mcidMet, mcidEligible),
  }
}

function buildMeasureRows(outcomeAssessments, pairs) {
  const usage = new Map()
  for (const assessment of outcomeAssessments) {
    if (!usage.has(assessment.measure)) usage.set(assessment.measure, { patientIds: new Set(), assessmentCount: 0 })
    const entry = usage.get(assessment.measure)
    entry.patientIds.add(assessment.patient_id)
    entry.assessmentCount += 1
  }

  return [...usage.entries()]
    .map(([measureId, entry]) => {
      const measure = MEASURES[measureId]
      const measurePairs = pairs.filter(pair => pair.measureId === measureId)
      return {
        measureId,
        name: measure?.name ?? measureId,
        hasMcid: Boolean(measure?.mcidKey),
        patientCount: entry.patientIds.size,
        assessmentCount: entry.assessmentCount,
        ...summarizePairs(measurePairs),
      }
    })
    .sort((a, b) => b.assessmentCount - a.assessmentCount || a.measureId.localeCompare(b.measureId))
}

function buildCohorts(patients, assessmentsByPatient, pairs) {
  const cohortMap = new Map()
  for (const patient of patients) {
    const label = normalizeDiagnosisLabel(patient?.diagnosis ?? patient?.condition)
    if (!cohortMap.has(label)) cohortMap.set(label, { patients: [], patientIds: new Set() })
    cohortMap.get(label).patients.push(patient)
    cohortMap.get(label).patientIds.add(patient.id)
  }

  return [...cohortMap.entries()]
    .map(([label, cohort]) => {
      const cohortAssessments = []
      const measureCounts = new Map()
      let patientsWithAssessments = 0
      for (const patientId of cohort.patientIds) {
        const records = assessmentsByPatient.get(patientId) ?? []
        if (records.length) patientsWithAssessments += 1
        for (const record of records) {
          cohortAssessments.push(record)
          measureCounts.set(record.measure, (measureCounts.get(record.measure) ?? 0) + 1)
        }
      }
      const cohortPairs = pairs.filter(pair => cohort.patientIds.has(pair.patientId))
      const repeatPatientIds = new Set(cohortPairs.map(pair => pair.patientId))
      const topMeasures = [...measureCounts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 4)
        .map(([measureId]) => measureId)

      return {
        label,
        patientCount: cohort.patients.length,
        patientsWithAssessments,
        assessmentCount: cohortAssessments.length,
        repeatPatientCount: repeatPatientIds.size,
        topMeasures,
        ...summarizePairs(cohortPairs),
      }
    })
    .sort((a, b) => b.patientCount - a.patientCount || a.label.localeCompare(b.label))
}

function buildHighlights(totals, overall) {
  const highlights = []
  if (!totals.assessmentCount) {
    highlights.push('No outcome measures have been recorded yet. Service-level reporting will populate as assessments are saved.')
    return highlights
  }

  highlights.push(`${totals.assessmentCount} outcome measure result${totals.assessmentCount === 1 ? '' : 's'} recorded across ${totals.patientsWithAssessments} of ${totals.patientCount} patient${totals.patientCount === 1 ? '' : 's'}.`)

  if (!overall.pairCount) {
    highlights.push('No patients have repeat results for the same measure yet, so improvement and MCID rates cannot be reported. Repeat assessments to unlock change reporting.')
    return highlights
  }

  highlights.push(`${overall.improvementRate}% of repeated measures improved between baseline and latest result (${overall.improvedCount} of ${overall.pairCount} patient-measure pairs).`)
  if (overall.mcidEligibleCount) {
    highlights.push(`${overall.mcidRate}% of repeated measures with a published MCID achieved clinically meaningful improvement (${overall.mcidMetCount} of ${overall.mcidEligibleCount}).`)
  } else {
    highlights.push('None of the repeated measures have a published MCID threshold, so MCID achievement is not reported.')
  }
  if (overall.declinedCount) {
    highlights.push(`${overall.declinedCount} repeated measure${overall.declinedCount === 1 ? '' : 's'} declined and may warrant clinical review.`)
  }
  return highlights
}

/**
 * Build the derived service-level outcomes model for the caseload.
 *
 * @param {Array} patients - rows from the patients table
 * @param {Array} assessments - rows from the assessments table (any patient)
 * @param {{ now?: string | Date }} options
 */
export function buildOutcomesIntelligence(patients = [], assessments = [], options = {}) {
  const now = options.now ? new Date(options.now) : new Date()
  const outcomeAssessments = assessments.filter(assessment => MEASURES[assessment?.measure])

  const assessmentsByPatient = new Map()
  for (const assessment of outcomeAssessments) {
    if (!assessmentsByPatient.has(assessment.patient_id)) assessmentsByPatient.set(assessment.patient_id, [])
    assessmentsByPatient.get(assessment.patient_id).push(assessment)
  }

  const diagnosisByPatientId = new Map(
    patients.map(patient => [patient.id, patient?.diagnosis ?? patient?.condition ?? null])
  )

  const pairs = buildChangePairs(assessmentsByPatient, diagnosisByPatientId)
  const overall = summarizePairs(pairs)
  const measureRows = buildMeasureRows(outcomeAssessments, pairs)
  const cohorts = buildCohorts(patients, assessmentsByPatient, pairs)

  const orderedDates = outcomeAssessments
    .map(assessment => assessment.created_at)
    .filter(Boolean)
    .sort((a, b) => new Date(a) - new Date(b))

  const totals = {
    patientCount: patients.length,
    patientsWithAssessments: assessmentsByPatient.size,
    assessmentCount: outcomeAssessments.length,
    measureCount: measureRows.length,
    patientsWithRepeat: new Set(pairs.map(pair => pair.patientId)).size,
    patientReportedCount: outcomeAssessments.filter(isPatientReported).length,
    firstAssessmentAt: orderedDates[0] ?? null,
    latestAssessmentAt: orderedDates[orderedDates.length - 1] ?? null,
  }

  return {
    totals,
    overall,
    measureRows,
    cohorts,
    highlights: buildHighlights(totals, overall),
    explanation: OUTCOMES_INTELLIGENCE_COPY,
    generatedAt: now.toISOString(),
  }
}

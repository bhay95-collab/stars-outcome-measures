import {
  ABC_ITEMS,
  ATRS_ITEMS,
  ATRS_OPTIONS,
  BIVI_ITEMS,
  BPFS_ITEMS,
  BPFS_OPTIONS,
  CAIT_ITEMS,
  FABQ_ITEMS,
  FABQ_RESPONSE_OPTIONS,
  FSS_ITEMS,
  HADS_ITEMS,
  HOOS_SECTIONS,
  KOOS_SECTIONS,
  LEFS_ITEMS,
  LEFS_OPTIONS,
  MEASURES,
  PDQ8_ITEMS,
  PDQ8_OPTIONS,
  RPQ_ITEMS,
  calcABC,
  calcATRS,
  calcBIVI,
  calcBPFS,
  calcCAIT,
  calcFABQ,
  calcFSS,
  calcHADS,
  calcHOOS,
  calcKOOS,
  calcLEFS,
  calcNPRS,
  calcPDQ8,
  calcRPQ,
} from './clinical'

// FAAM (N/A responses) and PSFS (patient-specific activities) need engine
// support before they can be sent as patient links — tracked in the
// outcome-measures handoff.
export const FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS = ['ABC', 'FSS', 'HADS', 'PDQ8', 'RPQ', 'BIVI', 'NPRS', 'LEFS', 'BPFS', 'KOOS', 'HOOS', 'CAIT', 'ATRS', 'FABQ']

const SCORE_OPTIONS_0_TO_3 = [0, 1, 2, 3].map(value => ({ value, label: String(value) }))
const SCORE_OPTIONS_1_TO_7 = [1, 2, 3, 4, 5, 6, 7].map(value => ({ value, label: String(value) }))
const RPQ_OPTIONS = [
  { value: 0, label: '0 - Not experienced at all' },
  { value: 1, label: '1 - No more of a problem' },
  { value: 2, label: '2 - Mild problem' },
  { value: 3, label: '3 - Moderate problem' },
  { value: 4, label: '4 - Severe problem' },
]
const BIVI_OPTIONS = [
  { value: 0, label: '0 - Not at all' },
  { value: 1, label: '1 - A little' },
  { value: 2, label: '2 - Quite a lot' },
  { value: 3, label: '3 - A great deal' },
]

function numberedQuestions(items, mapItem) {
  return items.map((item, index) => ({
    id: `item_${index + 1}`,
    index,
    ...mapItem(item, index),
  }))
}

// KOOS/HOOS are answered subscale-by-subscale in the clinic form, but the
// public follow-up page renders a flat question list — these helpers flatten
// the sections and rebuild the subscale arrays for scoring.
function koosFamilyQuestions(sections) {
  const flat = []
  for (const section of sections) {
    for (const item of section.items) {
      flat.push({
        label: item.label,
        section: section.label,
        type: 'select',
        options: item.options.map((label, value) => ({ value, label })),
      })
    }
  }
  return numberedQuestions(flat, item => item)
}

function koosFamilyCalc(sections, calc) {
  return ({ items }) => {
    const bySubscale = {}
    let cursor = 0
    for (const section of sections) {
      bySubscale[section.key] = items.slice(cursor, cursor + section.items.length)
      cursor += section.items.length
    }
    return calc({ items: bySubscale })
  }
}

const QUESTIONNAIRES = {
  ABC: {
    id: 'ABC',
    instructions: 'Rate your confidence from 0% to 100% for each activity.',
    questions: numberedQuestions(ABC_ITEMS, item => ({
      label: item.label,
      type: 'number',
      min: 0,
      max: 100,
      step: 1,
      suffix: '%',
    })),
    calc: calcABC,
  },
  FSS: {
    id: 'FSS',
    instructions: 'Choose the score that best describes how much you agree with each statement.',
    questions: numberedQuestions(FSS_ITEMS, item => ({
      label: item,
      type: 'select',
      options: SCORE_OPTIONS_1_TO_7,
    })),
    calc: calcFSS,
  },
  HADS: {
    id: 'HADS',
    instructions: 'Choose a score from 0 to 3 for each item.',
    questions: numberedQuestions(HADS_ITEMS, item => ({
      label: item.text,
      subscale: item.subscale,
      type: 'select',
      options: SCORE_OPTIONS_0_TO_3,
    })),
    calc: calcHADS,
  },
  PDQ8: {
    id: 'PDQ8',
    instructions: 'In the past month, choose how often each issue has affected you.',
    questions: numberedQuestions(PDQ8_ITEMS, item => ({
      label: item.label,
      type: 'select',
      options: PDQ8_OPTIONS,
    })),
    calc: calcPDQ8,
  },
  RPQ: {
    id: 'RPQ',
    instructions: 'Rate each symptom compared with before the injury.',
    questions: numberedQuestions([...RPQ_ITEMS.rpq3, ...RPQ_ITEMS.rpq13], (item, index) => ({
      label: item,
      section: index < 3 ? 'RPQ-3 - Early symptoms' : 'RPQ-13 - Later symptoms',
      type: 'select',
      options: RPQ_OPTIONS,
    })),
    calc: calcRPQ,
  },
  BIVI: {
    id: 'BIVI',
    instructions: 'Choose how much each vision difficulty affects daily life.',
    questions: numberedQuestions(BIVI_ITEMS, item => ({
      label: item,
      type: 'select',
      options: BIVI_OPTIONS,
    })),
    calc: calcBIVI,
  },
  NPRS: {
    id: 'NPRS',
    instructions: 'Rate your current pain from 0 (no pain) to 10 (worst pain imaginable).',
    questions: numberedQuestions([{ label: 'How would you rate your pain right now?' }], item => ({
      label: item.label,
      type: 'select',
      options: Array.from({ length: 11 }, (_, value) => ({ value, label: String(value) })),
    })),
    calc: ({ items }) => calcNPRS({ score: items[0], context: 'current' }),
  },
  LEFS: {
    id: 'LEFS',
    instructions: 'For each activity, choose how much difficulty you have today because of your lower limb.',
    questions: numberedQuestions(LEFS_ITEMS, item => ({
      label: item.label,
      type: 'select',
      options: LEFS_OPTIONS,
    })),
    calc: calcLEFS,
  },
  BPFS: {
    id: 'BPFS',
    instructions: 'For each activity, choose how much difficulty you have because of your back.',
    questions: numberedQuestions(BPFS_ITEMS, item => ({
      label: item.label,
      type: 'select',
      options: BPFS_OPTIONS,
    })),
    calc: calcBPFS,
  },
  CAIT: {
    id: 'CAIT',
    instructions: 'Answer each statement for your affected ankle.',
    questions: numberedQuestions(CAIT_ITEMS, item => ({
      label: item.label,
      type: 'select',
      options: item.options.map(opt => ({ value: opt.value, label: `${opt.label} (${opt.value})` })),
    })),
    calc: calcCAIT,
  },
  ATRS: {
    id: 'ATRS',
    instructions: 'For each item, choose 0 (very limited) to 10 (no limitation) for your injured Achilles tendon.',
    questions: numberedQuestions(ATRS_ITEMS, item => ({
      label: item,
      type: 'select',
      options: ATRS_OPTIONS,
    })),
    calc: calcATRS,
  },
  FABQ: {
    id: 'FABQ',
    instructions: 'For each statement, choose 0 (completely disagree) to 6 (completely agree) about your back pain.',
    questions: numberedQuestions(FABQ_ITEMS, item => ({
      label: item.label,
      section: item.section,
      type: 'select',
      options: FABQ_RESPONSE_OPTIONS,
    })),
    calc: calcFABQ,
  },
  KOOS: {
    id: 'KOOS',
    instructions: 'Answer every question thinking of your knee during the last week.',
    questions: koosFamilyQuestions(KOOS_SECTIONS),
    calc: koosFamilyCalc(KOOS_SECTIONS, calcKOOS),
  },
  HOOS: {
    id: 'HOOS',
    instructions: 'Answer every question thinking of your hip during the last week.',
    questions: koosFamilyQuestions(HOOS_SECTIONS),
    calc: koosFamilyCalc(HOOS_SECTIONS, calcHOOS),
  },
}

export function normalizeMeasureId(measureId) {
  const value = String(measureId ?? '').trim()
  return FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS.find(id => id.toLowerCase() === value.toLowerCase()) ?? null
}

function parseItemScore(value, question) {
  if (value === '' || value == null) return null
  const score = Number(value)
  if (!Number.isFinite(score)) return null
  if (question.type === 'number') {
    if (!Number.isInteger(score) || score < question.min || score > question.max) return null
    return score
  }
  if (!question.options?.some(option => Number(option.value) === score)) return null
  return score
}

export function isEligibleFollowUpMeasureId(measureId) {
  return Boolean(normalizeMeasureId(measureId))
}

export function getFollowUpQuestionnaire(measureId) {
  const id = normalizeMeasureId(measureId)
  if (!id) return null
  const measure = MEASURES[id]
  const questionnaire = QUESTIONNAIRES[id]
  return {
    id,
    name: measure?.name ?? id,
    primaryUnit: measure?.primaryUnit ?? '',
    instructions: questionnaire.instructions,
    questions: questionnaire.questions,
  }
}

export function validateFollowUpQuestionnaireAnswers(measureId, input = {}) {
  const id = normalizeMeasureId(measureId)
  const questionnaire = id ? QUESTIONNAIRES[id] : null
  if (!questionnaire) return { error: 'Select a supported patient questionnaire.' }

  const rawItems = Array.isArray(input.items) ? input.items : Array.isArray(input.answers?.items) ? input.answers.items : []
  if (rawItems.length !== questionnaire.questions.length) {
    return { error: `Please answer all ${questionnaire.questions.length} items.` }
  }

  const items = questionnaire.questions.map((question, index) => parseItemScore(rawItems[index], question))
  const invalidIndex = items.findIndex(value => value == null)
  if (invalidIndex >= 0) {
    return { error: `Item ${invalidIndex + 1} has an invalid response.` }
  }

  const results = questionnaire.calc({ items })
  if (!results) return { error: 'Responses could not be scored.' }

  return {
    inputs: { items },
    results,
  }
}

export function questionnaireAttentionLevel(measureId, results) {
  const meta = results?.meta ?? {}
  const colors = [meta.classColor, meta.depressionColor].filter(Boolean)
  if (colors.includes('red')) return 'red'
  if (colors.includes('amber')) return 'amber'
  return 'green'
}

export function formatQuestionnaireResult(measureId, results) {
  if (!results) return 'No score recorded'
  if (measureId === 'HADS') {
    const anxiety = `${results.primaryValue}${results.primaryUnit ?? ''}`
    const depression = `${results.meta?.depressionScore ?? '-'}${results.primaryUnit ?? ''}`
    return `Anxiety ${anxiety}, depression ${depression}`
  }
  const value = results.primaryValue == null ? '-' : results.primaryValue
  return `${value}${results.primaryUnit ?? ''}`
}

function buildPriorAssessmentMap(assessments = []) {
  const map = new Map()
  for (const assessment of assessments) {
    const measureId = normalizeMeasureId(assessment?.measure)
    if (!measureId) continue
    const current = map.get(measureId)
    const currentDate = current?.latestAssessment?.created_at ? new Date(current.latestAssessment.created_at) : null
    const nextDate = assessment.created_at ? new Date(assessment.created_at) : null
    const isNewer = !current || (nextDate && (!currentDate || nextDate > currentDate))
    map.set(measureId, {
      count: (current?.count ?? 0) + 1,
      latestAssessment: isNewer ? assessment : current.latestAssessment,
    })
  }
  return map
}

export function getAllEligibleFollowUpQuestionnaireOptions(assessments = []) {
  const priorByMeasure = buildPriorAssessmentMap(assessments)
  return FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS.map(id => {
    const prior = priorByMeasure.get(id) ?? null
    return {
      measureId: id,
      name: MEASURES[id]?.name ?? id,
      hasPriorAssessment: Boolean(prior),
      count: prior?.count ?? 0,
      sourceAssessmentId: prior?.latestAssessment?.id ?? null,
      latestCreatedAt: prior?.latestAssessment?.created_at ?? null,
      resultLabel: prior ? formatQuestionnaireResult(id, prior.latestAssessment?.results) : null,
    }
  })
}

export function getEligibleFollowUpQuestionnaireOptions(assessments = []) {
  const priorByMeasure = buildPriorAssessmentMap(assessments)
  return [...priorByMeasure.entries()]
    .map(([measureId, prior]) => ({
      measureId,
      name: MEASURES[measureId]?.name ?? measureId,
      count: prior.count,
      sourceAssessmentId: prior.latestAssessment?.id ?? null,
      latestCreatedAt: prior.latestAssessment?.created_at ?? null,
      resultLabel: formatQuestionnaireResult(measureId, prior.latestAssessment?.results),
    }))
    .sort((a, b) => new Date(b.latestCreatedAt ?? 0) - new Date(a.latestCreatedAt ?? 0))
}

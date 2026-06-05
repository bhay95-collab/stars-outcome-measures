import {
  ABC_ITEMS,
  BIVI_ITEMS,
  FSS_ITEMS,
  HADS_ITEMS,
  MEASURES,
  PDQ8_ITEMS,
  PDQ8_OPTIONS,
  RPQ_ITEMS,
  calcABC,
  calcBIVI,
  calcFSS,
  calcHADS,
  calcPDQ8,
  calcRPQ,
} from './clinical'

export const FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS = ['ABC', 'FSS', 'HADS', 'PDQ8', 'RPQ', 'BIVI']

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
}

function normalizeMeasureId(measureId) {
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

export function getEligibleFollowUpQuestionnaireOptions(assessments = []) {
  const latestByMeasure = new Map()

  for (const assessment of assessments) {
    const measureId = normalizeMeasureId(assessment?.measure)
    if (!measureId) continue
    const current = latestByMeasure.get(measureId)
    const currentDate = current?.latestAssessment?.created_at ? new Date(current.latestAssessment.created_at) : null
    const nextDate = assessment.created_at ? new Date(assessment.created_at) : null
    const isNewer = !current || (nextDate && (!currentDate || nextDate > currentDate))

    latestByMeasure.set(measureId, {
      measureId,
      name: MEASURES[measureId]?.name ?? measureId,
      count: (current?.count ?? 0) + 1,
      latestAssessment: isNewer ? assessment : current.latestAssessment,
    })
  }

  return [...latestByMeasure.values()]
    .map(option => ({
      measureId: option.measureId,
      name: option.name,
      count: option.count,
      sourceAssessmentId: option.latestAssessment?.id ?? null,
      latestCreatedAt: option.latestAssessment?.created_at ?? null,
      resultLabel: formatQuestionnaireResult(option.measureId, option.latestAssessment?.results),
    }))
    .sort((a, b) => new Date(b.latestCreatedAt ?? 0) - new Date(a.latestCreatedAt ?? 0))
}

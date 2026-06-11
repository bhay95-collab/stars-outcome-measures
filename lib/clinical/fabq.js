// Fear-Avoidance Beliefs Questionnaire (FABQ) — clinical engine (Waddell 1993)
// 16 items, each 0 (completely disagree) – 6 (completely agree). Two scored
// subscales; 5 items are distractors (1, 8, 13, 14, 16) and are NOT scored:
//   FABQ-PA (Physical Activity): items 2–5      → 0–24, >15 = high fear
//   FABQ-W  (Work):              items 6,7,9,10,11,12,15 → 0–42, >34 = high
// Higher = MORE fear-avoidance (worse). Change thresholds use published MDC
// (PA ≈6.1 Grotle 2012; W ≈13 Inrig 2012 / George 2006) — see mcid.js.
// Item wording follows Waddell 1993 (widely reproduced, free); proof-read
// against the original before public release.
// Input: { items: number[16] } — each 0–6 integer (distractors included).
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

// 0-based indices of the scored items within the 16-item array.
const PA_INDICES = [1, 2, 3, 4]                 // items 2–5
const W_INDICES = [5, 6, 8, 9, 10, 11, 14]      // items 6, 7, 9, 10, 11, 12, 15

const PA_HIGH = 15  // FABQ-PA > 15 = significant fear of physical activity
const W_HIGH = 34   // FABQ-W  > 34 = high work-related fear-avoidance

export const FABQ_RESPONSE_OPTIONS = [
  { value: 0, label: '0 — Completely disagree' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3 — Unsure' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6 — Completely agree' },
]

// section: which part of the form; scored: counts toward a subscale.
export const FABQ_ITEMS = [
  { label: 'My pain was caused by physical activity', section: 'Physical activity', scored: false },
  { label: 'Physical activity makes my pain worse', section: 'Physical activity', scored: true },
  { label: 'Physical activity might harm my back', section: 'Physical activity', scored: true },
  { label: 'I should not do physical activities which (might) make my pain worse', section: 'Physical activity', scored: true },
  { label: 'I cannot do physical activities which (might) make my pain worse', section: 'Physical activity', scored: true },
  { label: 'My pain was caused by my work or by an accident at work', section: 'Work', scored: true },
  { label: 'My work aggravated my pain', section: 'Work', scored: true },
  { label: 'I have a claim for compensation for my pain', section: 'Work', scored: false },
  { label: 'My work is too heavy for me', section: 'Work', scored: true },
  { label: 'My work makes or would make my pain worse', section: 'Work', scored: true },
  { label: 'My work might harm my back', section: 'Work', scored: true },
  { label: 'I should not do my normal work with my present pain', section: 'Work', scored: true },
  { label: 'I cannot do my normal work with my present pain', section: 'Work', scored: false },
  { label: 'I cannot do my normal work until my pain is treated', section: 'Work', scored: false },
  { label: 'I do not think that I will be back to my normal work within 3 months', section: 'Work', scored: true },
  { label: 'I do not think that I will ever be able to go back to that work', section: 'Work', scored: false },
]

function sumIndices(scores, indices) {
  return indices.reduce((sum, index) => sum + scores[index], 0)
}

function classify(pa, work) {
  if (pa > PA_HIGH || work > W_HIGH) return 'red'
  if (pa >= 9 || work >= 20) return 'amber'
  return 'green'
}

export function calcFABQ({ items }) {
  if (!Array.isArray(items) || items.length !== 16) return null

  const scores = items.map(Number)
  if (scores.some(value => !Number.isInteger(value) || value < 0 || value > 6)) return null

  const pa = sumIndices(scores, PA_INDICES)
  const work = sumIndices(scores, W_INDICES)
  const classColor = classify(pa, work)

  const paNote = pa > PA_HIGH ? ' (high)' : ''
  const workNote = work > W_HIGH ? ' (high)' : ''

  return {
    primaryValue: pa,
    primaryUnit: '/24',
    interpretation: `Physical activity ${pa}/24${paNote} · Work ${work}/42${workNote} (higher = more fear-avoidance)`,
    meta: { classColor, work, physicalActivity: pa, items: scores },
  }
}

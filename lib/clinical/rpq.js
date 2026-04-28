// Rivermead Post-Concussion Questionnaire — clinical engine
// 16 items rated 0–4 (0=Not experienced, 1=No more a problem, 2=Mild, 3=Moderate, 4=Severe)
// RPQ-3 = items 0–2 (max 12), RPQ-13 = items 3–15 (max 52), Total max 64
// Input: { items: number[] } — array of 16 scores

export const RPQ_ITEMS = {
  rpq3: [
    'Headaches',
    'Feelings of dizziness',
    'Nausea and/or vomiting',
  ],
  rpq13: [
    'Noise sensitivity, easily upset by loud noise',
    'Sleep disturbance',
    'Fatigue, tiring more easily',
    'Being irritable, easily angered',
    'Feeling depressed or tearful',
    'Feeling frustrated or impatient',
    'Forgetfulness, poor memory',
    'Poor concentration',
    'Taking longer to think',
    'Blurred vision',
    'Light sensitivity, easily upset by bright light',
    'Double vision',
    'Restlessness',
  ],
}

export function calcRPQ({ items }) {
  if (!items || items.length !== 16) return null

  const scores = items.map(Number)
  if (scores.some(s => isNaN(s) || s < 0 || s > 4)) return null

  const rpq3  = scores.slice(0, 3).reduce((sum, s) => sum + s, 0)
  const rpq13 = scores.slice(3).reduce((sum, s) => sum + s, 0)
  const total = rpq3 + rpq13

  const symptomCount = scores.filter(s => s >= 2).length

  let interpretation, classColor
  if (total === 0) {
    interpretation = 'No post-concussion symptoms reported'
    classColor = 'green'
  } else if (symptomCount >= 4 && total > 10) {
    interpretation = `Post-Concussion Syndrome indicator (${symptomCount} symptoms rated ≥ moderate)`
    classColor = 'red'
  } else {
    interpretation = `Symptoms present — ${symptomCount} item${symptomCount === 1 ? '' : 's'} rated ≥ moderate`
    classColor = 'amber'
  }

  return {
    primaryValue: total,
    primaryUnit: '/64',
    interpretation,
    meta: { rpq3, rpq13, symptomCount, classColor },
  }
}

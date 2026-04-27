export const BOOMER_ITEMS = [
  {
    label: '1. Timed Up and Go (TUG)',
    criteria: ['>30 sec or cannot', '21–30 sec', '11–20 sec', '≤10 sec'],
    note: 'Enter TUG comfortable time and score consistently with TUG assessment above.',
  },
  {
    label: '2. Functional Reach Test (FRT)',
    criteria: ['0–6 cm or cannot reach', '7–14 cm', '15–24 cm', '≥25 cm'],
    note: 'Maximum forward reach from standing. Standard arm length.',
  },
  {
    label: '3. Step Test (affected limb)',
    criteria: ['0 steps (cannot stand)', '1–4 steps', '5–9 steps', '≥10 steps'],
    note: '7.5 cm step, 15 seconds. Score consistently with Step Test assessment above.',
  },
  {
    label: '4. Static standing — feet together, eyes closed',
    criteria: ['Cannot stand', '<5 sec', '5–29 sec', '≥30 sec'],
    note: 'Time standing feet together, eyes closed. No support.',
  },
]

function classify(total) {
  if (total >= 12) return { label: 'Good balance (≥12/16)',                     color: 'green' }
  if (total >= 6)  return { label: 'Moderate balance deficit (6–11)',           color: 'amber' }
  if (total >= 4)  return { label: 'Caution: score <4 predicts RACF discharge', color: 'amber' }
  return                  { label: 'Significant balance impairment (<6)',        color: 'red'   }
}

export function calcBOOMER({ items }) {
  if (!Array.isArray(items) || items.length !== 4) return null
  const scores = items.map(Number)
  if (scores.some(s => !isFinite(s) || s < 0 || s > 4)) return null
  const total = scores.reduce((sum, s) => sum + s, 0)
  const { label, color } = classify(total)
  return {
    primaryValue: total,
    primaryUnit: '/16',
    interpretation: label,
    meta: { classColor: color },
  }
}

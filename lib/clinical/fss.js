// Fatigue Severity Scale — clinical engine
// 9 items, each scored 1–7 → total 9–63
// Fatigue threshold: total ≥ 36 (mean ≥ 4)
// Input: { items: number[] } — array of 9 scores (1–7 each)
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

export const FSS_ITEMS = [
  'My motivation is lower when I am fatigued.',
  'Exercise brings on my fatigue.',
  'I am easily fatigued.',
  'Fatigue interferes with my physical functioning.',
  'Fatigue causes frequent problems for me.',
  'My fatigue prevents sustained physical functioning.',
  'Fatigue interferes with carrying out certain duties and responsibilities.',
  'Fatigue is among my three most disabling symptoms.',
  'Fatigue interferes with my work, family, or social life.',
]

function classify(total) {
  if (total < 36) return { label: 'No significant fatigue', color: 'green' }
  if (total < 45) return { label: 'Moderate fatigue',       color: 'amber' }
  return           { label: 'Severe fatigue',                color: 'red'   }
}

export function calcFSS({ items }) {
  if (!items || items.length !== 9) return null

  const scores = items.map(Number)
  if (scores.some(s => isNaN(s) || s < 1 || s > 7)) return null

  const total = scores.reduce((sum, s) => sum + s, 0)
  const mean = parseFloat((total / 9).toFixed(1))
  const { label, color } = classify(total)

  return {
    primaryValue: total,
    primaryUnit: '/63',
    interpretation: label,
    meta: {
      classColor: color,
      mean,
      items: scores,
    },
  }
}

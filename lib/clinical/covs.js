export const COVS_ITEMS = [
  'Roll in bed — supine to lying (affected side)',
  'Roll in bed — supine to lying (unaffected side)',
  'Gets to sitting from supine in bed',
  'Sitting balance: edge of bed, thighs supported, hands on lap, feet flat',
  'Horizontal transfer: chair/wheelchair to bed/plinth',
  'Vertical transfer: supine on floor to chair or standing',
  'Ambulation',
  'Ambulation (aids)',
  'Ambulation (endurance)',
  'Ambulation (velocity)',
  'Wheelchair mobility',
  'Arm function (affected)',
  'Arm function (unaffected)',
]

function classify(total) {
  if (total >= 68) return {
    label: 'Score ≥68 — associated with discharge home (shorter LOS)',
    color: 'green',
  }
  if (total >= 50) return {
    label: `Score ${total}/91 — Functional mobility developing. Mean admission stroke ≈50.`,
    color: 'amber',
  }
  return {
    label: `Score ${total}/91 — Significant mobility limitation. Mean discharge stroke ≈67.`,
    color: 'red',
  }
}

export function calcCOVS({ items }) {
  if (!Array.isArray(items) || items.length !== 13) return null
  const scores = items.map(Number)
  if (scores.some(s => !isFinite(s) || s < 1 || s > 7)) return null
  const total = scores.reduce((sum, s) => sum + s, 0)
  const { label, color } = classify(total)
  return {
    primaryValue: total,
    primaryUnit: '/91',
    interpretation: label,
    meta: { classColor: color },
  }
}

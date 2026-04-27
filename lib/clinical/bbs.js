// Berg Balance Scale — clinical engine
// 14 items, each scored 0–4 → total 0–56
// Input: { items: number[] } — array of 14 scores
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

export const BBS_ITEMS = [
  'Sitting to standing',
  'Standing unsupported',
  'Sitting unsupported',
  'Standing to sitting',
  'Transfers',
  'Standing with eyes closed',
  'Standing with feet together',
  'Reaching forward while standing',
  'Retrieving object from floor',
  'Turning to look behind',
  'Turning 360 degrees',
  'Placing alternate foot on stool',
  'Standing with one foot in front (tandem)',
  'Standing on one foot',
]

function classify(total) {
  if (total >= 45) return { label: 'Low fall risk',      color: 'green' }
  if (total >= 36) return { label: 'Moderate fall risk', color: 'amber' }
  return             { label: 'High fall risk',           color: 'red'   }
}

export function calcBBS({ items }) {
  if (!items || items.length !== 14) return null

  const scores = items.map(Number)
  if (scores.some(s => isNaN(s) || s < 0 || s > 4)) return null

  const total = scores.reduce((sum, s) => sum + s, 0)
  const { label, color } = classify(total)

  return {
    primaryValue: total,
    primaryUnit: '/56',
    interpretation: label,
    meta: {
      classColor: color,
      items: scores,
    },
  }
}

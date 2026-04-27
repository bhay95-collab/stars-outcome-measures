// Functional Gait Assessment (FGA) — clinical engine
// 10 items, each scored 0–3 → total 0–30
// Input: { items: [10 numbers] }
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

export const FGA_ITEMS = [
  { label: 'Gait level surface',               options: [0, 1, 2, 3] },
  { label: 'Change in gait speed',             options: [0, 1, 2, 3] },
  { label: 'Gait with horizontal head turns',  options: [0, 1, 2, 3] },
  { label: 'Gait with vertical head turns',    options: [0, 1, 2, 3] },
  { label: 'Gait and pivot turn',              options: [0, 1, 2, 3] },
  { label: 'Step over obstacle',               options: [0, 1, 2, 3] },
  { label: 'Gait with narrow base of support', options: [0, 1, 2, 3] },
  { label: 'Ambulating backwards',             options: [0, 1, 2, 3] },
  { label: 'Gait with eyes closed',            options: [0, 1, 2, 3] },
  { label: 'Inclined surfaces',                options: [0, 1, 2, 3] },
]

function classify(total) {
  if (total >= 22) return { label: 'Low fall risk',      color: 'green' }
  if (total >= 17) return { label: 'Moderate fall risk', color: 'amber' }
  return                  { label: 'High fall risk',     color: 'red'   }
}

export function calcFGA({ items }) {
  if (!Array.isArray(items) || items.length !== 10) return null
  if (items.some(v => !isFinite(v))) return null

  const total = items.reduce((sum, v) => sum + v, 0)
  const { label, color } = classify(total)

  return {
    primaryValue: total,
    primaryUnit: '/30',
    interpretation: label,
    meta: { classColor: color },
  }
}

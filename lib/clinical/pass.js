// Postural Assessment Scale for Stroke (PASS) — clinical engine
// 12 items, each scored 0–3 → total 0–36
// Input: { items: [12 numbers] }
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

export const PASS_ITEMS = [
  { label: 'Sitting without support',                      options: [0, 1, 2, 3] },
  { label: 'Supine to affected side lateral position',     options: [0, 1, 2, 3] },
  { label: 'Supine to non-affected side lateral position', options: [0, 1, 2, 3] },
  { label: 'Supine to sitting up on side of bed',          options: [0, 1, 2, 3] },
  { label: 'Sitting to standing',                          options: [0, 1, 2, 3] },
  { label: 'Standing',                                     options: [0, 1, 2, 3] },
  { label: 'Transfer',                                     options: [0, 1, 2, 3] },
  { label: 'Walking',                                      options: [0, 1, 2, 3] },
  { label: 'Going up and down stairs',                     options: [0, 1, 2, 3] },
  { label: 'Picking up a pencil from the floor',           options: [0, 1, 2, 3] },
  { label: 'Turning around 360°',                          options: [0, 1, 2, 3] },
  { label: 'Reaching forward with outstretched arm',       options: [0, 1, 2, 3] },
]

function classify(total) {
  if (total >= 30) return { label: 'Good postural control',                                 color: 'green' }
  if (total >= 18) return { label: 'Moderate postural impairment',                          color: 'amber' }
  if (total >= 9)  return { label: 'ADL independence likely at 6 months if ≥9 at 2 weeks', color: 'amber' }
  return                  { label: 'Significant postural impairment',                       color: 'red'   }
}

export function calcPASS({ items }) {
  if (!Array.isArray(items) || items.length !== 12) return null
  if (items.some(v => !isFinite(v))) return null

  const total = items.reduce((sum, v) => sum + v, 0)
  const { label, color } = classify(total)

  return {
    primaryValue: total,
    primaryUnit: '/36',
    interpretation: label,
    meta: { classColor: color },
  }
}

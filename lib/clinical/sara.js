// Scale for Assessment and Rating of Ataxia (SARA) — clinical engine
// 8 items with varied score ranges → total 0–40
// Input: { items: [8 numbers] }
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

export const SARA_ITEMS = [
  { label: 'Gait',                            options: [0, 1, 2, 3, 4, 6, 8] },
  { label: 'Stance',                          options: [0, 1, 2, 3, 4, 6]    },
  { label: 'Sitting',                         options: [0, 1, 2, 3, 4]       },
  { label: 'Speech disturbance',              options: [0, 1, 2, 3, 4, 6]    },
  { label: 'Finger chase',                    options: [0, 1, 2, 4]           },
  { label: 'Nose-finger test',                options: [0, 1, 2, 4]           },
  { label: 'Fast alternating hand movements', options: [0, 1, 2, 4]           },
  { label: 'Heel-shin slide',                 options: [0, 1, 2, 4]           },
]

function classify(total) {
  if (total === 0) return { label: 'No ataxia',              color: 'green' }
  if (total <= 10) return { label: 'Mild ataxia (1–10)',     color: 'amber' }
  if (total <= 20) return { label: 'Moderate ataxia (11–20)', color: 'red' }
  return                  { label: 'Severe ataxia (>20)',    color: 'red'   }
}

export function calcSARA({ items }) {
  if (!Array.isArray(items) || items.length !== 8) return null
  if (items.some(v => !isFinite(v))) return null

  const total = items.reduce((sum, v) => sum + v, 0)
  const { label, color } = classify(total)

  return {
    primaryValue: total,
    primaryUnit: '/40',
    interpretation: label,
    meta: { classColor: color },
  }
}

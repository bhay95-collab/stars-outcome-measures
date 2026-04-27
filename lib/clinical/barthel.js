// Barthel Index — clinical engine
// 10 items with specific point values → total 0–100
// Input: { items: number[] } — array of 10 scores per BARTHEL_ITEMS options
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

export const BARTHEL_ITEMS = [
  { label: 'Feeding',              options: [0, 5, 10]     },
  { label: 'Bathing',              options: [0, 5]         },
  { label: 'Grooming',             options: [0, 5]         },
  { label: 'Dressing',             options: [0, 5, 10]     },
  { label: 'Bowels',               options: [0, 5, 10]     },
  { label: 'Bladder',              options: [0, 5, 10]     },
  { label: 'Toilet use',           options: [0, 5, 10]     },
  { label: 'Transfers (bed/chair)',options: [0, 5, 10, 15] },
  { label: 'Mobility on level',    options: [0, 5, 10, 15] },
  { label: 'Stairs',               options: [0, 5, 10]     },
]

function classify(total) {
  if (total >= 85) return { label: 'Independent',        color: 'green' }
  if (total >= 60) return { label: 'Minimal dependence', color: 'green' }
  if (total >= 40) return { label: 'Partial dependence', color: 'amber' }
  if (total >= 20) return { label: 'High dependence',    color: 'red'   }
  return           { label: 'Total dependence',           color: 'red'   }
}

export function calcBarthel({ items }) {
  if (!items || items.length !== 10) return null

  const scores = items.map(Number)
  const validOptions = BARTHEL_ITEMS.map(item => item.options)
  if (scores.some((s, i) => isNaN(s) || !validOptions[i].includes(s))) return null

  const total = scores.reduce((sum, s) => sum + s, 0)
  const { label, color } = classify(total)

  return {
    primaryValue: total,
    primaryUnit: '/100',
    interpretation: label,
    meta: {
      classColor: color,
      items: scores,
    },
  }
}

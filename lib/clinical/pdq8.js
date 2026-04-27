// Parkinson's Disease Questionnaire 8 (PDQ-8) — clinical engine
// 8 items, each scored 0–4 → Summary Index (SI) = (sum / 32) × 100
// Input: { items: [8 numbers] }
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

export const PDQ8_ITEMS = [
  { label: 'Had difficulty getting around in public'        },
  { label: 'Had difficulty dressing yourself'               },
  { label: 'Felt depressed'                                 },
  { label: 'Had problems with close personal relationships' },
  { label: 'Had concentration problems'                     },
  { label: 'Felt unable to communicate properly'            },
  { label: 'Had painful muscle cramps or spasms'            },
  { label: 'Felt embarrassed in public'                     },
]

export const PDQ8_OPTIONS = [
  { value: 0, label: 'Never'        },
  { value: 1, label: 'Occasionally' },
  { value: 2, label: 'Sometimes'    },
  { value: 3, label: 'Often'        },
  { value: 4, label: 'Always'       },
]

function classify(si) {
  if (si <= 20) return { label: 'Mild impact on quality of life',        color: 'green' }
  if (si <= 40) return { label: 'Moderate impact on quality of life',    color: 'amber' }
  if (si <= 60) return { label: 'Significant impact on quality of life', color: 'red'   }
  return               { label: 'Severe impact on quality of life',      color: 'red'   }
}

export function calcPDQ8({ items }) {
  if (!Array.isArray(items) || items.length !== 8) return null
  if (items.some(v => !isFinite(v))) return null

  const sum = items.reduce((acc, v) => acc + v, 0)
  const si  = parseFloat(((sum / 32) * 100).toFixed(1))
  const { label, color } = classify(si)

  return {
    primaryValue: si,
    primaryUnit: 'SI',
    interpretation: label,
    meta: { classColor: color, rawSum: sum },
  }
}

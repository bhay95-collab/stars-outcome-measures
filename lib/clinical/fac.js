// Functional Ambulation Classification — clinical engine
// Input: { level } — integer 0–5
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

const FAC_LEVELS = [
  { label: 'Non-functional ambulator',      color: 'red'   },
  { label: 'Dependent — level 2 assist',    color: 'red'   },
  { label: 'Dependent — level 1 assist',    color: 'amber' },
  { label: 'Dependent — supervision',       color: 'amber' },
  { label: 'Independent on level surfaces', color: 'green' },
  { label: 'Fully independent ambulator',   color: 'green' },
]

export function calcFAC({ level }) {
  const l = Number(level)
  if (isNaN(l) || l < 0 || l > 5) return null

  const { label, color } = FAC_LEVELS[l]

  return {
    primaryValue: l,
    primaryUnit: '/5',
    interpretation: label,
    meta: { classColor: color },
  }
}

// Timed Up and Go — clinical engine
// Input: { time } — seconds (required)
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

const CLASSIFICATIONS = [
  { max: 10,       label: 'Normal',             color: 'green' },
  { max: 20,       label: 'Mild impairment',    color: 'amber' },
  { max: 30,       label: 'Moderate impairment',color: 'amber' },
  { max: Infinity, label: 'Severe impairment',  color: 'red'   },
]

function classify(time) {
  return CLASSIFICATIONS.find(c => time < c.max) ?? CLASSIFICATIONS[CLASSIFICATIONS.length - 1]
}

export function calcTUG({ time }) {
  const t = Number(time)
  if (!t || t <= 0) return null

  const { label, color } = classify(t)

  return {
    primaryValue: t,
    primaryUnit: 'sec',
    interpretation: label,
    meta: {
      classColor: color,
      fallRisk: t >= 13.5,
    },
  }
}

// Timed Up and Go — clinical engine
// Input: { time, fastTime?, dualTime? } — all in seconds
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

function classifyComfortable(t) {
  if (t < 10)   return { label: 'Normal (<10 sec)',       color: 'green' }
  if (t < 13.5) return { label: 'Mildly impaired',       color: 'amber' }
  return               { label: 'Fall risk (>13.5 sec)',  color: 'red'   }
}

function classifyFast(t) {
  if (t < 8) return { label: 'Normal (<8 sec)',  color: 'green' }
  return            { label: 'Reduced (>8 sec)', color: 'amber' }
}

function calcDTC(comf, dual) {
  if (!comf || !dual || comf <= 0) return null
  const pct = ((dual - comf) / comf) * 100
  const label = pct > 20
    ? 'Significant cognitive-motor interference (>20%)'
    : 'Within normal limits (≤20%)'
  const color = pct > 20 ? 'red' : 'green'
  return { pct: parseFloat(pct.toFixed(1)), label, color }
}

export function calcTUG({ time, fastTime, dualTime }) {
  const t = Number(time)
  if (!t || t <= 0) return null

  const { label, color } = classifyComfortable(t)

  const fast = fastTime != null && Number(fastTime) > 0
    ? classifyFast(Number(fastTime))
    : null

  const dtc = dualTime != null && Number(dualTime) > 0
    ? calcDTC(t, Number(dualTime))
    : null

  return {
    primaryValue: t,
    primaryUnit: 'sec',
    interpretation: label,
    meta: {
      classColor: color,
      fallRisk: t >= 13.5,
      fastTime: fastTime != null ? Number(fastTime) : null,
      fastInterp: fast?.label ?? null,
      fastColor: fast?.color ?? null,
      dualTime: dualTime != null ? Number(dualTime) : null,
      dtc: dtc?.pct ?? null,
      dtcInterp: dtc?.label ?? null,
      dtcColor: dtc?.color ?? null,
    },
  }
}

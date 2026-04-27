function classify(total) {
  if (total >= 18) return { label: 'Good trunk control (≥18)',          color: 'green' }
  if (total >= 12) return { label: 'Moderate trunk impairment (12–17)', color: 'amber' }
  return                  { label: 'Severe trunk impairment (<12)',      color: 'red'   }
}

export function calcTIS({ staticScore, dynamicScore, coordinationScore }) {
  const s = Number(staticScore), d = Number(dynamicScore), c = Number(coordinationScore)
  if (!isFinite(s) || !isFinite(d) || !isFinite(c)) return null
  if (s < 0 || s > 7 || d < 0 || d > 10 || c < 0 || c > 6) return null
  const total = s + d + c
  const { label, color } = classify(total)
  return {
    primaryValue: total,
    primaryUnit: '/23',
    interpretation: label,
    meta: { classColor: color, staticScore: s, dynamicScore: d, coordinationScore: c },
  }
}

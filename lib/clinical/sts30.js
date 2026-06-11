// 30-Second Sit to Stand Test (30s-STS / CST) — clinical engine
// Count of full stands in 30 seconds, arms crossed over chest (Rikli & Jones 1999).
// Higher = better. Age/sex normal ranges 60–94 yr (Rikli & Jones 1999).
// <12 stands = reduced physical function in knee OA regardless of age/sex
// (early-stage knee OA reliability study, 2022). MDC individual ≈ 2.5 stands —
// used as the change threshold (MCID estimates vary, ~2–3 stands in knee OA/TKA).
// Input: { stands: number, age?: number, gender?: 'M'|'F' }
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

// [ageLo, ageHi, normLo, normHi] — Rikli & Jones 1999 normal range (stands)
export const STS30_NORMS = {
  M: [
    [60, 64, 14, 19], [65, 69, 12, 18], [70, 74, 12, 17],
    [75, 79, 11, 17], [80, 84, 10, 15], [85, 89, 8, 14], [90, 94, 7, 12],
  ],
  F: [
    [60, 64, 12, 17], [65, 69, 11, 16], [70, 74, 10, 15],
    [75, 79, 10, 15], [80, 84, 9, 14], [85, 89, 8, 13], [90, 94, 4, 11],
  ],
}

function getNormRange(age, gender) {
  const table = STS30_NORMS[gender]
  if (!table) return null
  for (const [lo, hi, normLo, normHi] of table) {
    if (age >= lo && age <= hi) return { lo: normLo, hi: normHi }
  }
  return null
}

export function calc30STS({ stands, age, gender }) {
  const count = Number(stands)
  if (!Number.isInteger(count) || count < 0 || count > 60) return null

  const hasAge = age != null && isFinite(age) && age > 0
  const norm = hasAge && (gender === 'M' || gender === 'F') ? getNormRange(age, gender) : null

  let label
  let color
  if (norm) {
    if (count < norm.lo) {
      label = `Below age norm (${norm.lo}–${norm.hi}) — falls/deconditioning risk`
      color = 'amber'
    } else if (count > norm.hi) {
      label = `Above age norm (${norm.lo}–${norm.hi})`
      color = 'green'
    } else {
      label = `Within age norm (${norm.lo}–${norm.hi})`
      color = 'green'
    }
  } else if (count < 12) {
    label = 'Reduced functional strength (<12 stands — knee OA cutoff)'
    color = 'amber'
  } else {
    label = 'Functional lower-limb strength (≥12 stands)'
    color = 'green'
  }

  return {
    primaryValue: count,
    primaryUnit: 'stands',
    interpretation: label,
    meta: {
      classColor: color,
      normRange: norm,
    },
  }
}

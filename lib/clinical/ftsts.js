// Five Times Sit to Stand Test (FTSTS / 5TSTS) — clinical engine
// Time (seconds) to complete 5 full stands as fast as possible, arms crossed.
// Lower = better. Cutoffs: ≥12 s — assess falls risk further; >15 s —
// associated with recurrent falls in community-dwelling adults ≥65
// (Buatois 2008; ANPT core measures guidance).
// Age norms (Bohannon 2006 meta-analysis): 60–69 yr 11.4 s · 70–79 yr 12.6 s · 80–89 yr 14.8 s.
// MCID 2.3 s; MDC estimates range 1.5–4.2 s across populations.
// Input: { time: number }
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

function classify(time) {
  if (time <= 12) return { label: 'Within typical range (≤12 s)',                 color: 'green' }
  if (time <= 15) return { label: 'Further falls assessment indicated (>12 s)',   color: 'amber' }
  return               { label: 'Elevated fall risk (>15 s)',                     color: 'red'   }
}

export function calcFTSTS({ time }) {
  const seconds = Number(time)
  if (!isFinite(seconds) || seconds <= 0 || seconds > 300) return null

  const value = parseFloat(seconds.toFixed(1))
  const { label, color } = classify(value)

  return {
    primaryValue: value,
    primaryUnit: 'sec',
    interpretation: label,
    meta: { classColor: color },
  }
}

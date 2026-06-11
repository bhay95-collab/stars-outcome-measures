// Numeric Pain Rating Scale (NPRS) — clinical engine
// Single item: pain intensity on an 11-point scale, 0 (no pain) to 10 (worst pain imaginable)
// Severity bands (conventional): 0 none · 1–3 mild · 4–6 moderate · 7–10 severe
// MCID ≈ 2 points or ~30% reduction (Farrar 2001 chronic pain; Childs 2005 subacute LBP)
//   Mechanical neck pain: MCID 1.5, MDC 2.6 (Young 2018)
// Input: { score: number, context?: string }
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

export const NPRS_CONTEXT_OPTIONS = [
  { value: 'current',    label: 'Current pain' },
  { value: 'average24h', label: 'Average over last 24 hours' },
  { value: 'worst24h',   label: 'Worst over last 24 hours' },
  { value: 'best24h',    label: 'Best over last 24 hours' },
]

function classify(score) {
  if (score === 0) return { label: 'No pain',            color: 'green' }
  if (score <= 3)  return { label: 'Mild pain (1–3)',     color: 'green' }
  if (score <= 6)  return { label: 'Moderate pain (4–6)', color: 'amber' }
  return                  { label: 'Severe pain (7–10)',  color: 'red'   }
}

export function calcNPRS({ score, context = 'current' }) {
  const value = Number(score)
  if (!Number.isInteger(value) || value < 0 || value > 10) return null

  const { label, color } = classify(value)
  const contextLabel = NPRS_CONTEXT_OPTIONS.find(option => option.value === context)?.label
    ?? NPRS_CONTEXT_OPTIONS[0].label

  return {
    primaryValue: value,
    primaryUnit: '/10',
    interpretation: label,
    meta: { classColor: color, context, contextLabel },
  }
}

// Landing Error Scoring System (LESS) — clinical engine.
// Pure JS — no React/DOM/Supabase. The LESS (Padua 2009, Am J Sports Med
// 37:1996) is a clinician-rated jump-landing movement-quality screen: a
// drop-vertical-jump is scored for movement errors across 17 items. Items 1–15
// score 0–1; items 16–17 score 0–2, so the total ranges 0–19. A HIGHER error
// count = WORSE landing mechanics (lower = better).
//
// This engine records the total error count (0–19). LESS < 5 marks good landing
// mechanics; the < 5 cut-off derives from Padua's work (Padua 2009 development;
// prospective cut-point in elite-youth soccer, Padua 2015, J Athl Train 50:589 —
// sensitivity 86%, specificity 64%) — NOT from Grindem 2016, whose RTS battery
// did not include the LESS.
// Padua's original category labels (excellent / good / moderate / poor) vary
// across sources, so only the licence-clear < 5 cut-off is treated as a
// criterion; the amber/red bands below are descriptive thresholds for charting,
// not validated severity cut-offs.
//
// Input: { errors: integer 0–19 }.
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

const MAX_ERRORS = 19
const RTS_PASS = 5   // errors — LESS < 5 = good landing mechanics (Padua 2009; Padua 2015)

function classify(errors) {
  if (errors < RTS_PASS) return { label: 'Good landing mechanics (<5 errors)', color: 'green' }
  if (errors <= 6) return { label: 'Moderate landing errors (5–6)', color: 'amber' }
  return { label: 'Poor landing mechanics (>6 errors)', color: 'red' }
}

export function calcLESS({ errors }) {
  const n = Number(errors)
  if (!Number.isInteger(n) || n < 0 || n > MAX_ERRORS) return null

  const { label, color } = classify(n)
  return {
    primaryValue: n,
    primaryUnit: '/19',
    interpretation: label,
    meta: { classColor: color, meetsRTS: n < RTS_PASS },
  }
}

export const LESS_MAX_ERRORS = MAX_ERRORS
export const LESS_RTS_PASS = RTS_PASS

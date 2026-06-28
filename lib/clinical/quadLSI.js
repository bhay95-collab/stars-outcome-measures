// Quadriceps strength Limb Symmetry Index (LSI) — clinical engine.
// Pure JS — no React/DOM/Supabase. A field test, not a questionnaire: the
// clinician enters peak quadriceps strength for the involved and uninvolved
// limbs (same unit — isokinetic peak torque, isometric force, or dynamometry),
// and the LSI is involved / uninvolved × 100.
//
// Pass threshold for return to sport: LSI >= 90% (Grindem 2016, BJSM 50:804;
// Kyritsis 2016, BJSM 50:946 — quadriceps LSI < 90% at RTS was associated with
// a ~4x higher reinjury rate). The 80–89% band is a common late-rehab milestone
// (van Melick 2016 Dutch evidence-based ACL guideline). Bands below are
// descriptive; only the 90% pass cut-off is a published RTS criterion.
//
// Input: { involved: number, uninvolved: number } (> 0, same unit).
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

const RTS_PASS = 90       // % — return-to-sport quadriceps LSI cut-off (Grindem 2016)
const LATE_REHAB = 80     // % — late-rehab strength milestone (van Melick 2016)

function classify(lsi) {
  if (lsi >= RTS_PASS) return { label: 'Symmetrical (≥90%) — meets RTS strength cut-off', color: 'green' }
  if (lsi >= LATE_REHAB) return { label: 'Mild deficit (80–89%)', color: 'amber' }
  return { label: 'Strength deficit (<80%)', color: 'red' }
}

export function calcQuadLSI({ involved, uninvolved }) {
  const inv = Number(involved)
  const uninv = Number(uninvolved)
  if (!Number.isFinite(inv) || !Number.isFinite(uninv)) return null
  if (inv < 0 || uninv <= 0) return null

  const lsi = Math.round((inv / uninv) * 1000) / 10  // one decimal place
  const { label, color } = classify(lsi)

  return {
    primaryValue: lsi,
    primaryUnit: '%',
    interpretation: label,
    meta: { classColor: color, involved: inv, uninvolved: uninv, meetsRTS: lsi >= RTS_PASS },
  }
}

export const QUAD_LSI_RTS_PASS = RTS_PASS

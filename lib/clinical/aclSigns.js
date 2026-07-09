// ACL clinical signs — the two clinician-judged gate criteria of the early ACL
// rehab phases: full active knee extension and effusion trace–zero on the
// modified stroke test. Pure JS — no React/DOM/Supabase.
//
// Sources (no invented thresholds):
//   - Full active knee extension and effusion control gate the early phases in
//     criterion-based ACL frameworks (van Melick 2016, BJSM 50:1506).
//   - "Trace to zero" is the modified stroke test level (Sturgill 2009, JOSPT
//     39:845) used as the pass judgement by the RTS battery (Grindem 2016) and
//     the phase gates. Both signs are recorded as simple clinician judgements.
//
// Input: { fullExtension: bool, effusionTraceToZero: bool }
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }
// primaryValue counts the gate signs met (0–2, higher is better).

export function calcACLSigns({ fullExtension, effusionTraceToZero } = {}) {
  if (typeof fullExtension !== 'boolean' || typeof effusionTraceToZero !== 'boolean') return null

  const gateMet = fullExtension && effusionTraceToZero
  const metCount = (fullExtension ? 1 : 0) + (effusionTraceToZero ? 1 : 0)

  const extensionText = fullExtension
    ? 'Full active extension achieved'
    : 'Full active extension not yet achieved'
  const effusionText = effusionTraceToZero
    ? 'effusion trace–zero'
    : 'effusion above trace'
  const gateText = gateMet ? 'both gate signs settled' : 'gate signs outstanding'

  const classColor = gateMet ? 'green' : (metCount === 1 ? 'amber' : 'red')

  return {
    primaryValue: metCount,
    primaryUnit: '/2',
    interpretation: `${extensionText}; ${effusionText} — ${gateText}.`,
    meta: {
      fullExtension,
      effusionTraceToZero,
      gateMet,
      classColor,
    },
  }
}

// Derive phase-gate / battery inputs from a stored ACLSigns assessment's
// results object (null-safe — unknown stays null so gates read "Not recorded").
// Also reads rows saved by the earlier graded-effusion version of this measure,
// whose meta carried the same fullExtension/effusionTraceToZero keys.
export function signsFromResults(results) {
  const meta = results?.meta
  if (!meta || typeof meta.fullExtension !== 'boolean') {
    return { fullExtension: null, effusionTraceToZero: null }
  }
  return {
    fullExtension: meta.fullExtension,
    effusionTraceToZero: meta.effusionTraceToZero === true,
  }
}

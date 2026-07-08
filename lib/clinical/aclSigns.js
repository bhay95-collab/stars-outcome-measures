// ACL clinical signs — the two clinician-judged gate criteria of the early ACL
// rehab phases: full active knee extension and effusion graded on the modified
// stroke test. Pure JS — no React/DOM/Supabase.
//
// Sources (no invented thresholds):
//   - Full active knee extension and effusion control gate the early phases in
//     criterion-based ACL frameworks (van Melick 2016, BJSM 50:1506).
//   - Effusion grading uses the modified stroke test scale — zero, trace, 1+,
//     2+, 3+ (Sturgill 2009, JOSPT 39:845). "Trace to zero" is the pass level
//     used by the RTS battery (Grindem 2016) and the phase gates.
//
// Input: { fullExtension: bool, effusionGrade: 'zero'|'trace'|'1+'|'2+'|'3+' }
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }
// primaryValue is the ordinal effusion grade (0–4, lower is better) so the
// trend chart shows the knee settling over time.

export const EFFUSION_GRADES = [
  { value: 'zero', label: 'Zero — no wave with downstroke', ordinal: 0 },
  { value: 'trace', label: 'Trace — small wave on medial side', ordinal: 1 },
  { value: '1+', label: '1+ — larger bulge on downstroke', ordinal: 2 },
  { value: '2+', label: '2+ — effusion returns without downstroke', ordinal: 3 },
  { value: '3+', label: '3+ — too much fluid to move', ordinal: 4 },
]

const GATE_PASS_GRADES = new Set(['zero', 'trace'])

export function calcACLSigns({ fullExtension, effusionGrade } = {}) {
  if (fullExtension !== true && fullExtension !== false) return null
  const grade = EFFUSION_GRADES.find(g => g.value === effusionGrade)
  if (!grade) return null

  const effusionTraceToZero = GATE_PASS_GRADES.has(grade.value)
  const gateMet = fullExtension && effusionTraceToZero

  const extensionText = fullExtension
    ? 'Full active extension achieved'
    : 'Full active extension not yet achieved'
  const effusionText = effusionTraceToZero
    ? `effusion ${grade.value} (trace–zero)`
    : `effusion ${grade.value} (above trace)`
  const gateText = gateMet ? 'both gate signs settled' : 'gate signs outstanding'

  const classColor = gateMet ? 'green' : (fullExtension || effusionTraceToZero ? 'amber' : 'red')

  return {
    primaryValue: grade.ordinal,
    primaryUnit: 'grade',
    interpretation: `${extensionText}; ${effusionText} — ${gateText}.`,
    meta: {
      fullExtension,
      effusionGrade: grade.value,
      effusionTraceToZero,
      gateMet,
      classColor,
    },
  }
}

// Derive phase-gate / battery inputs from a stored ACLSigns assessment's
// results object (null-safe — unknown stays null so gates read "Not recorded").
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

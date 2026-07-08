// Criterion-based ACL rehabilitation phase ladder (surgical pathway, v1).
// Pure JS — no React/DOM/Supabase. Defines the six rehab phases and evaluates,
// from the patient's latest objective results, whether the gate OUT of a phase
// is met. The tool SHOWS readiness; the clinician advances the phase — it never
// auto-progresses a patient.
//
// Phase structure and gate thresholds follow widely-cited criterion-based
// frameworks (van Melick 2016 Dutch evidence-based ACL practice guideline, BJSM
// 50:1506; Buckthorpe 2019; the Melbourne ACL Rehabilitation Guide 2.0). Only
// published numeric milestones are used as gates:
//   - Quad LSI >= 80% = late-rehab / advanced-training milestone (van Melick).
//   - Hop LSI >= 80% = entry to advanced agility/plyometric work (van Melick).
//   - Full battery (quad+hop LSI >= 90%, 9-month gate, effusion) = RTS gate
//     (Grindem 2016 — evaluated by aclRts.js and passed in as rtsHardMet).
// Earlier phases gate on clinical signs (full extension, effusion control) that
// the clinician records; these are not invented numeric cut-offs.
//
// latest input: {
//   fullExtension: bool|null, effusionTraceToZero: bool|null,
//   quadLSI: number|null, hopMinLSI: number|null,
//   monthsSinceIndex: number|null, rtsHardMet: bool|null,
// }

export const ACL_PHASES = [
  {
    id: 1,
    name: 'Pre-op / prehab',
    focus: 'Settle the acute knee and prepare for surgery (or for non-op rehab).',
    goals: [
      'Restore full or near-full range of motion',
      'Minimise effusion and restore quadriceps activation',
      'Normalise gait; psychological preparation',
    ],
    gate: {
      summary: 'Ready for surgery / next phase: full extension restored and effusion settling.',
      checks: [
        { key: 'fullExtension', label: 'Full active knee extension', threshold: 'Achieved', source: 'van Melick 2016' },
        { key: 'effusion', label: 'Effusion settling (trace–zero)', threshold: 'Trace to zero', source: 'van Melick 2016' },
      ],
    },
  },
  {
    id: 2,
    name: 'Recovery from surgery',
    focus: 'Restore extension, control swelling, regain quadriceps control and normal gait.',
    goals: [
      'Full active knee extension equal to the other side',
      'Effusion controlled (trace to zero)',
      'Symmetrical gait without aids; good quadriceps control',
    ],
    gate: {
      summary: 'Progress to strengthening once extension is full and the knee is quiet.',
      checks: [
        { key: 'fullExtension', label: 'Full active knee extension', threshold: 'Achieved', source: 'van Melick 2016' },
        { key: 'effusion', label: 'Effusion trace–zero', threshold: 'Trace to zero', source: 'van Melick 2016' },
      ],
    },
  },
  {
    id: 3,
    name: 'Strength & neuromuscular control',
    focus: 'Build quadriceps/posterior-chain strength and single-leg control.',
    goals: [
      'Progressive resistance training; single-leg control',
      'Quadriceps strength LSI building toward 80%+',
    ],
    gate: {
      summary: 'Progress to running/agility once strength reaches the late-rehab milestone.',
      checks: [
        { key: 'quad80', label: 'Quadriceps strength LSI', threshold: '≥ 80%', source: 'van Melick 2016' },
      ],
    },
  },
  {
    id: 4,
    name: 'Running, agility & landing',
    focus: 'Reintroduce running, change-of-direction and jump-landing control.',
    goals: [
      'Criterion-based running progression (no pain/effusion flare)',
      'Plyometrics, agility and cutting with good mechanics',
      'Hop symmetry building toward 80%+',
    ],
    gate: {
      summary: 'Progress to the return-to-sport phase once strength and hop symmetry are well established.',
      checks: [
        { key: 'quad80', label: 'Quadriceps strength LSI', threshold: '≥ 80%', source: 'van Melick 2016' },
        { key: 'hop80', label: 'Hop battery limiting LSI', threshold: '≥ 80%', source: 'van Melick 2016' },
      ],
    },
  },
  {
    id: 5,
    name: 'Return to sport',
    focus: 'Pass the full RTS battery and stage a return to competition.',
    goals: [
      'Full RTS battery met (see the readiness dashboard)',
      'At least 9 months post-surgery',
      'Staged return: non-contact → contact drills → full practice → competition',
    ],
    gate: {
      summary: 'Battery met and time-gate reached — RTS decision is shared with the athlete (see caveat).',
      checks: [
        { key: 'rtsHardMet', label: 'Objective RTS battery met', threshold: 'All objective criteria', source: 'Grindem 2016' },
        { key: 'time9', label: 'Time since surgery', threshold: '≥ 9 months', source: 'Grindem 2016; Beischer 2020' },
      ],
    },
  },
  {
    id: 6,
    name: 'Secondary prevention',
    focus: 'Maintain strength and movement quality to reduce re-injury — ongoing.',
    goals: [
      'Continue an injury-prevention programme ≥ 2×/week (e.g. Nordics, Copenhagens)',
      'Maintain strength and hop symmetry',
      'Progress toward return to performance',
    ],
    gate: null, // terminal phase
  },
]

function evalCheck(key, latest) {
  switch (key) {
    case 'fullExtension':
      return latest.fullExtension === null || latest.fullExtension === undefined ? null : latest.fullExtension === true
    case 'effusion':
      return latest.effusionTraceToZero === null || latest.effusionTraceToZero === undefined ? null : latest.effusionTraceToZero === true
    case 'quad80':
      return latest.quadLSI === null || latest.quadLSI === undefined ? null : latest.quadLSI >= 80
    case 'hop80':
      return latest.hopMinLSI === null || latest.hopMinLSI === undefined ? null : latest.hopMinLSI >= 80
    case 'rtsHardMet':
      return latest.rtsHardMet === null || latest.rtsHardMet === undefined ? null : latest.rtsHardMet === true
    case 'time9':
      return latest.monthsSinceIndex === null || latest.monthsSinceIndex === undefined ? null : latest.monthsSinceIndex >= 9
    default:
      return null
  }
}

export function getACLPhase(phaseId) {
  return ACL_PHASES.find(p => p.id === phaseId) || null
}

export function evaluatePhaseGate(phaseId, latest = {}) {
  const phase = getACLPhase(phaseId)
  if (!phase) return null
  if (!phase.gate) {
    return { phaseId, checks: [], allMet: false, terminal: true }
  }

  const checks = phase.gate.checks.map(c => ({
    ...c,
    met: evalCheck(c.key, latest),
  }))

  // Gate is met only when every check is explicitly true (a null/unknown check
  // does not satisfy the gate — the clinician must record it first).
  const allMet = checks.every(c => c.met === true)

  return { phaseId, checks, allMet, terminal: false }
}

export const ACL_PHASE_COUNT = ACL_PHASES.length

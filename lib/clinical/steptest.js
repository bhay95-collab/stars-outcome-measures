// Step Test — clinical engine
// Count of steps onto a 7.5 cm block in 15 seconds, affected and non-affected legs
// Input: { affectedSteps, nonAffectedSteps? } — integers
// primaryValue = affectedSteps; non-affected stored in meta
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

const COMMUNITY_THRESHOLD = 10
const AI_FLAG_THRESHOLD   = 20  // asymmetry index % threshold

function classifyLeg(steps) {
  if (steps === 0)                 return { label: 'Unable to stand unsupported',           color: 'grey'  }
  if (steps < COMMUNITY_THRESHOLD) return { label: 'Below community threshold (<10 steps)', color: 'red'   }
  return                                  { label: 'Above community threshold (≥10 steps)', color: 'green' }
}

export function calcStepTest({ affectedSteps, nonAffectedSteps }) {
  const a = parseInt(affectedSteps, 10)
  const n = parseInt(nonAffectedSteps, 10)

  if (isNaN(a) || a < 0) return null

  const { label, color } = classifyLeg(a)

  const hasNonAffected = !isNaN(n) && n >= 0
  const asymmetryIndex = hasNonAffected && n > 0
    ? parseFloat((Math.abs(a - n) / n * 100).toFixed(1))
    : null
  const asymmetry = asymmetryIndex != null && asymmetryIndex > AI_FLAG_THRESHOLD

  const nonAffectedInterp = hasNonAffected ? classifyLeg(n) : null

  return {
    primaryValue: a,
    primaryUnit: 'steps',
    interpretation: label,
    meta: {
      classColor: color,
      nonAffectedSteps: hasNonAffected ? n : null,
      nonAffectedInterp: nonAffectedInterp?.label ?? null,
      nonAffectedColor: nonAffectedInterp?.color ?? null,
      asymmetryIndex,
      asymmetry,
    },
  }
}

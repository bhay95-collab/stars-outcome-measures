// Step Test — clinical engine
// Count of steps onto a step block in 15 seconds, each leg separately
// Input: { rightSteps, leftSteps } — integers
// primaryValue = right steps; left stored in meta
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

const COMMUNITY_THRESHOLD = 10

export function calcStepTest({ rightSteps, leftSteps }) {
  const r = parseInt(rightSteps, 10)
  const l = parseInt(leftSteps, 10)

  if (isNaN(r) || r < 0) return null

  const worstSide = isNaN(l) ? r : Math.min(r, l)
  const asymmetry = !isNaN(l) && Math.abs(r - l) > 2

  const meetsThreshold = worstSide >= COMMUNITY_THRESHOLD
  const label = meetsThreshold ? 'Meets community threshold' : 'Below community threshold'
  const color = meetsThreshold ? 'green' : 'red'

  return {
    primaryValue: r,
    primaryUnit: 'steps',
    interpretation: label,
    meta: {
      classColor: color,
      leftSteps: isNaN(l) ? null : l,
      asymmetry,
      meetsThreshold,
    },
  }
}

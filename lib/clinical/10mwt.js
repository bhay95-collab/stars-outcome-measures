// 10 Metre Walk Test clinical engine
// Ported verbatim from index.html calc10mwt(), comClass(), getComfortNorm()
// Returns standardised result shape: { primaryValue, primaryUnit, interpretation, meta }

import { NORM_M, NORM_F } from './constants.js'

/**
 * Ambulation classification from comfortable gait speed.
 * Verbatim from index.html comClass().
 *
 * @param {number} speed - m/s
 * @returns {{ label: string, color: string }}
 */
function comClass(speed) {
  if (speed < 0.4) return { label: 'Household ambulator',     color: 'chip-red'   }
  if (speed < 0.8) return { label: 'Limited community',       color: 'chip-amber' }
  if (speed < 1.2) return { label: 'Community ambulator',     color: 'chip-green' }
  return              { label: 'Full community ambulator', color: 'chip-green' }
}

/**
 * Comfortable gait speed norm from Bohannon & Andrews 2011 age/sex tables.
 * Verbatim from index.html getComfortNorm().
 *
 * @param {number} age
 * @param {'M'|'F'} gender
 * @returns {number|null}
 */
function getComfortNorm(age, gender) {
  const table = gender === 'M' ? NORM_M : NORM_F
  for (const [lo, hi, v] of table) {
    if (age >= lo && age <= hi) return v
  }
  return null
}

/**
 * Fast gait speed norm (linear regression — Bohannon 2008).
 *
 * @param {number} age
 * @param {'M'|'F'} gender
 * @returns {number|null}
 */
function getFastNorm(age, gender) {
  if (gender === 'M') return 1.79 - 0.0073 * age
  if (gender === 'F') return 1.59 - 0.0064 * age
  return null
}

/**
 * Calculate 10MWT result from raw inputs.
 * comfortTime is required; fastTime, age, gender are optional but improve output.
 *
 * @param {{ comfortTime: number, fastTime?: number, age?: number, gender?: 'M'|'F' }} inputs
 * @returns {{ primaryValue: number, primaryUnit: string, interpretation: string, meta: object } | null}
 */
export function calc10mwt({ comfortTime, fastTime, age, gender }) {
  if (!comfortTime || !isFinite(comfortTime) || comfortTime <= 0) return null

  const comfortSpeed = parseFloat((10 / comfortTime).toFixed(2))
  const cc = comClass(comfortSpeed)

  const hasAge = age != null && isFinite(age) && age > 0
  const hasGender = gender === 'M' || gender === 'F'
  const canNorm = hasAge && hasGender

  const comfortNorm = canNorm ? getComfortNorm(age, gender) : null
  const comfortPct = comfortNorm != null
    ? Math.round((comfortSpeed / comfortNorm) * 100)
    : null

  let fastSpeed = null
  let fastPct = null
  let fastClassification = null

  if (fastTime != null && isFinite(fastTime) && fastTime > 0) {
    fastSpeed = parseFloat((10 / fastTime).toFixed(2))
    fastClassification = comClass(fastSpeed).label
    const fastNorm = canNorm ? getFastNorm(age, gender) : null
    fastPct = fastNorm != null
      ? Math.round((fastSpeed / fastNorm) * 100)
      : null
  }

  return {
    primaryValue: comfortSpeed,
    primaryUnit: 'm/s',
    interpretation: cc.label,
    meta: {
      comfortSpeed,
      fastSpeed,
      comfortPct,
      fastPct,
      classification: cc.label,
      classColor: cc.color,
      fastClassification,
    },
  }
}

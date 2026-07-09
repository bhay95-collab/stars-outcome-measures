// Harris Hip Score (HHS) — clinician-administered hip composite, 0–100,
// higher = better. Pure JS — no React/DOM/Supabase.
//
// Structure and weights follow the original instrument (Harris 1969, JBJS
// 51-A:737; validated for hip OA/arthroplasty by Söderman & Malchau 2001):
//   - Pain /44 (single graded item)
//   - Function /47 = gait /33 (limp 11 + support 11 + distance 11)
//                  + activities /14 (stairs 4 + shoes/socks 4 + sitting 5
//                  + public transport 1)
//   - Absence of deformity /4 — ALL four criteria must be met (fixed flexion
//     contracture < 30°, fixed adduction < 10°, fixed internal rotation in
//     extension < 10°, limb-length discrepancy < 3.2 cm) or 0 points.
//   - Range of motion /5 — the widely used simplified total-arc banding
//     (flexion + abduction + adduction + external rotation + internal
//     rotation): 211–300° = 5, 161–210° = 4, 101–160° = 3, 61–100° = 2,
//     31–60° = 1, 0–30° = 0. This matches the 5-point cap of the original
//     index-factor method (Harris 1969) as administered in contemporary
//     practice and trial protocols.
//
// Bands (Harris 1969, universally cited): <70 poor, 70–79 fair, 80–89 good,
// 90–100 excellent. MCID post-THA ≈16 points (MCII 15.9–18, Singh 2016,
// BMC Musculoskelet Disord 17:256) — see mcid.js key 'hhs'.
//
// Input: { pain, limp, support, distance, stairs, shoesSocks, sitting,
//          transport, deformity: {4 booleans}, rom: {5 degree values} }
// Select values must be exact published option scores. Returns the standard
// data contract: { primaryValue, primaryUnit, interpretation, meta }.

export const HHS_PAIN_OPTIONS = [
  { value: 44, label: 'None, or ignores it' },
  { value: 40, label: 'Slight, occasional — no compromise in activities' },
  { value: 30, label: 'Mild — no effect on average activities; rarely moderate pain with unusual activity' },
  { value: 20, label: 'Moderate — tolerable but makes concessions; some limitation of ordinary activity or work' },
  { value: 10, label: 'Marked — serious limitation of activities' },
  { value: 0, label: 'Totally disabled — pain even in bed' },
]

export const HHS_LIMP_OPTIONS = [
  { value: 11, label: 'None' },
  { value: 8, label: 'Slight' },
  { value: 5, label: 'Moderate' },
  { value: 0, label: 'Severe' },
]

export const HHS_SUPPORT_OPTIONS = [
  { value: 11, label: 'None' },
  { value: 7, label: 'Cane for long walks' },
  { value: 5, label: 'Cane most of the time' },
  { value: 3, label: 'One crutch' },
  { value: 2, label: 'Two canes' },
  { value: 0, label: 'Two crutches, or unable to walk' },
]

export const HHS_DISTANCE_OPTIONS = [
  { value: 11, label: 'Unlimited' },
  { value: 8, label: 'Six blocks (~30 min)' },
  { value: 5, label: 'Two–three blocks (~10–15 min)' },
  { value: 2, label: 'Indoors only' },
  { value: 0, label: 'Bed and chair only' },
]

export const HHS_STAIRS_OPTIONS = [
  { value: 4, label: 'Normally, without using a railing' },
  { value: 2, label: 'Normally, using a railing' },
  { value: 1, label: 'In any manner' },
  { value: 0, label: 'Unable to do stairs' },
]

export const HHS_SHOES_OPTIONS = [
  { value: 4, label: 'With ease' },
  { value: 2, label: 'With difficulty' },
  { value: 0, label: 'Unable' },
]

export const HHS_SITTING_OPTIONS = [
  { value: 5, label: 'Comfortably in an ordinary chair for one hour' },
  { value: 3, label: 'On a high chair for 30 minutes' },
  { value: 0, label: 'Unable to sit comfortably in any chair' },
]

export const HHS_TRANSPORT_OPTIONS = [
  { value: 1, label: 'Able to enter public transportation' },
  { value: 0, label: 'Unable to use public transportation' },
]

export const HHS_DEFORMITY_CRITERIA = [
  { key: 'flexionContracture', label: 'Fixed flexion contracture < 30°' },
  { key: 'adduction', label: 'Fixed adduction < 10°' },
  { key: 'internalRotation', label: 'Fixed internal rotation in extension < 10°' },
  { key: 'legLength', label: 'Limb-length discrepancy < 3.2 cm' },
]

// max values are administrative input bounds (full anatomical arcs summing to
// the band table's 300° ceiling), not clinical thresholds.
export const HHS_ROM_FIELDS = [
  { key: 'flexion', label: 'Flexion', max: 140 },
  { key: 'abduction', label: 'Abduction', max: 40 },
  { key: 'adduction', label: 'Adduction', max: 40 },
  { key: 'externalRotation', label: 'External rotation', max: 40 },
  { key: 'internalRotation', label: 'Internal rotation', max: 40 },
]

// Simplified total-arc ROM banding (5-point cap per Harris 1969).
const ROM_BANDS = [
  { min: 211, points: 5 },
  { min: 161, points: 4 },
  { min: 101, points: 3 },
  { min: 61, points: 2 },
  { min: 31, points: 1 },
  { min: 0, points: 0 },
]

const SELECT_FIELDS = [
  { key: 'pain', options: HHS_PAIN_OPTIONS },
  { key: 'limp', options: HHS_LIMP_OPTIONS },
  { key: 'support', options: HHS_SUPPORT_OPTIONS },
  { key: 'distance', options: HHS_DISTANCE_OPTIONS },
  { key: 'stairs', options: HHS_STAIRS_OPTIONS },
  { key: 'shoesSocks', options: HHS_SHOES_OPTIONS },
  { key: 'sitting', options: HHS_SITTING_OPTIONS },
  { key: 'transport', options: HHS_TRANSPORT_OPTIONS },
]

// Bands: <70 poor, 70–79 fair, 80–89 good, 90–100 excellent (Harris 1969).
function classify(total) {
  if (total >= 90) return { band: 'Excellent (90–100)', color: 'green' }
  if (total >= 80) return { band: 'Good (80–89)', color: 'green' }
  if (total >= 70) return { band: 'Fair (70–79)', color: 'amber' }
  return { band: 'Poor (<70)', color: 'red' }
}

export function calcHHS(input = {}) {
  for (const field of SELECT_FIELDS) {
    if (!field.options.some(opt => opt.value === input[field.key])) return null
  }

  const deformity = input.deformity ?? {}
  for (const criterion of HHS_DEFORMITY_CRITERIA) {
    if (typeof deformity[criterion.key] !== 'boolean') return null
  }

  const rom = input.rom ?? {}
  let romTotalDegrees = 0
  for (const field of HHS_ROM_FIELDS) {
    const degrees = Number(rom[field.key])
    if (!Number.isFinite(degrees) || degrees < 0 || degrees > field.max) return null
    romTotalDegrees += degrees
  }

  const deformityPoints = HHS_DEFORMITY_CRITERIA.every(c => deformity[c.key]) ? 4 : 0
  const romPoints = ROM_BANDS.find(b => romTotalDegrees >= b.min).points

  const painPoints = input.pain
  const gaitPoints = input.limp + input.support + input.distance
  const activityPoints = input.stairs + input.shoesSocks + input.sitting + input.transport
  const total = painPoints + gaitPoints + activityPoints + deformityPoints + romPoints

  const { band, color } = classify(total)

  return {
    primaryValue: total,
    primaryUnit: '/100',
    interpretation: band,
    meta: {
      painPoints,
      gaitPoints,
      activityPoints,
      deformityPoints,
      romTotalDegrees,
      romPoints,
      classColor: color,
    },
  }
}

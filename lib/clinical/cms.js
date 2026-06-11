// Constant–Murley Score (CMS) — clinical engine (Constant & Murley 1987)
// 100 points: Pain /15 + ADL /20 (work 4, recreation 4, sleep 2, positioning 10)
// + ROM /40 (flexion, abduction, external rotation, internal rotation, each /10)
// + Strength /25 (1 point per 0.45 kg / 1 lb of abduction force, capped at 25).
// Higher = better. MCID ≈ 10.4 pts post rotator cuff repair (Kukkonen 2013);
// MIC 17 pts in long-standing subacromial pain (de Witte 2014) — range 9.8–19.9.
// No universal severity bands (age/sex-adjusted norms exist) — neutral colour.
// Input: { pain, adlWork, adlRecreation, adlSleep, adlPositioning,
//          romFlexion, romAbduction, romER, romIR, strengthKg }
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

const KG_PER_POINT = 0.453592 // 1 lb

export const CMS_POSITIONING_OPTIONS = [
  { value: 0,  label: 'Below waist' },
  { value: 2,  label: 'Up to waist' },
  { value: 4,  label: 'Up to xiphoid' },
  { value: 6,  label: 'Up to neck' },
  { value: 8,  label: 'Up to top of head' },
  { value: 10, label: 'Above head' },
]

export const CMS_ELEVATION_OPTIONS = [
  { value: 0,  label: '0–30°' },
  { value: 2,  label: '31–60°' },
  { value: 4,  label: '61–90°' },
  { value: 6,  label: '91–120°' },
  { value: 8,  label: '121–150°' },
  { value: 10, label: '151–180°' },
]

export const CMS_ER_OPTIONS = [
  { value: 0,  label: 'None of the positions possible' },
  { value: 2,  label: 'Hand behind head, elbow forward' },
  { value: 4,  label: 'Hand behind head, elbow back' },
  { value: 6,  label: 'Hand on top of head, elbow forward' },
  { value: 8,  label: 'Hand on top of head, elbow back' },
  { value: 10, label: 'Full elevation above head' },
]

export const CMS_IR_OPTIONS = [
  { value: 0,  label: 'Dorsum of hand to lateral thigh' },
  { value: 2,  label: 'Dorsum of hand to buttock' },
  { value: 4,  label: 'Dorsum of hand to lumbosacral junction' },
  { value: 6,  label: 'Dorsum of hand to waist (L3)' },
  { value: 8,  label: 'Dorsum of hand to T12' },
  { value: 10, label: 'Dorsum of hand to interscapular region (T7)' },
]

function isIntInRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max
}

export function calcCMS({
  pain, adlWork, adlRecreation, adlSleep, adlPositioning,
  romFlexion, romAbduction, romER, romIR, strengthKg,
}) {
  const painScore = Number(pain)
  const work = Number(adlWork)
  const recreation = Number(adlRecreation)
  const sleep = Number(adlSleep)
  const positioning = Number(adlPositioning)
  const flexion = Number(romFlexion)
  const abduction = Number(romAbduction)
  const er = Number(romER)
  const ir = Number(romIR)
  const kg = Number(strengthKg)

  if (!isIntInRange(painScore, 0, 15)) return null
  if (!isIntInRange(work, 0, 4) || !isIntInRange(recreation, 0, 4) || !isIntInRange(sleep, 0, 2)) return null
  const tenPointScale = [0, 2, 4, 6, 8, 10]
  if (![positioning, flexion, abduction, er, ir].every(v => tenPointScale.includes(v))) return null
  if (!isFinite(kg) || kg < 0 || kg > 50) return null

  const adlScore = work + recreation + sleep + positioning
  const romScore = flexion + abduction + er + ir
  const strengthScore = Math.min(25, Math.round(kg / KG_PER_POINT))
  const total = painScore + adlScore + romScore + strengthScore

  return {
    primaryValue: total,
    primaryUnit: '/100',
    interpretation: `Pain ${painScore}/15 · ADL ${adlScore}/20 · ROM ${romScore}/40 · Strength ${strengthScore}/25`,
    // No universal severity bands — interpret against MCID and age/sex norms.
    meta: {
      classColor: 'grey',
      pain: painScore,
      adl: adlScore,
      rom: romScore,
      strength: strengthScore,
      strengthKg: kg,
    },
  }
}

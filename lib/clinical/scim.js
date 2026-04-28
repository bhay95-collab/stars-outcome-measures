// Spinal Cord Independence Measure III — clinical engine
// 19 items across 3 subscales: Self-care (SC /20), Respiration & Sphincters (RS /36), Mobility (MOB /40)
// Input: { items: number[] } — array of 19 numeric scores

export const SCIM_ITEMS = [
  // Self-care (0–5)
  {
    sub: 'sc', label: 'Feeding', max: 3,
    opts: [
      { v: 0, t: '0 — Needs parenteral/gastrostomy feeding or total assistance' },
      { v: 1, t: '1 — Needs partial assistance or adapted equipment' },
      { v: 2, t: '2 — Independent with adapted utensils or supervision' },
      { v: 3, t: '3 — Independent' },
    ],
  },
  {
    sub: 'sc', label: 'Bathing — upper body', max: 3,
    opts: [
      { v: 0, t: '0 — Requires total assistance' },
      { v: 1, t: '1 — Requires partial assistance' },
      { v: 2, t: '2 — Independent with adapted equipment or supervision' },
      { v: 3, t: '3 — Independent' },
    ],
  },
  {
    sub: 'sc', label: 'Bathing — lower body', max: 3,
    opts: [
      { v: 0, t: '0 — Requires total assistance' },
      { v: 1, t: '1 — Requires partial assistance' },
      { v: 2, t: '2 — Independent with adapted equipment or supervision' },
      { v: 3, t: '3 — Independent' },
    ],
  },
  {
    sub: 'sc', label: 'Dressing — upper body', max: 4,
    opts: [
      { v: 0, t: '0 — Requires total assistance' },
      { v: 1, t: '1 — Requires partial assistance with non-adapted clothing' },
      { v: 2, t: '2 — Independent with adapted clothing or supervision' },
      { v: 3, t: '3 — Independent with adapted clothing' },
      { v: 4, t: '4 — Independent with non-adapted clothing' },
    ],
  },
  {
    sub: 'sc', label: 'Dressing — lower body', max: 4,
    opts: [
      { v: 0, t: '0 — Requires total assistance' },
      { v: 1, t: '1 — Requires partial assistance with non-adapted clothing' },
      { v: 2, t: '2 — Independent with adapted clothing or supervision' },
      { v: 3, t: '3 — Independent with adapted clothing' },
      { v: 4, t: '4 — Independent with non-adapted clothing' },
    ],
  },
  {
    sub: 'sc', label: 'Grooming', max: 3,
    opts: [
      { v: 0, t: '0 — Requires total assistance' },
      { v: 1, t: '1 — Requires partial assistance' },
      { v: 2, t: '2 — Independent with adapted equipment or supervision' },
      { v: 3, t: '3 — Independent' },
    ],
  },

  // Respiration & Sphincters (6–9)
  {
    sub: 'rs', label: 'Respiration', max: 10,
    opts: [
      { v: 0,  t: '0 — Requires tracheal tube (TT) and permanent/intermittent assisted ventilation' },
      { v: 2,  t: '2 — Requires TT; breathes spontaneously' },
      { v: 4,  t: '4 — Requires oxygen; substantial secretion management or deep suctioning' },
      { v: 6,  t: '6 — Independent; requires deep suctioning or substantial respiratory assistance' },
      { v: 8,  t: '8 — Independent; requires minor respiratory assistance (e.g. slight oxygen, nebulisation)' },
      { v: 10, t: '10 — Independent' },
    ],
  },
  {
    sub: 'rs', label: 'Sphincter management — bladder', max: 11,
    opts: [
      { v: 0,  t: '0 — Indwelling catheter' },
      { v: 3,  t: '3 — Residual urine >100 ml; no regular catheterisation' },
      { v: 6,  t: '6 — Residual urine <100 ml or intermittent self-catheterisation without assistance' },
      { v: 9,  t: '9 — Intermittent self-catheterisation; uses external/no catheter; dry' },
      { v: 11, t: '11 — Non-catheterised; residual urine <100 ml; continent' },
    ],
  },
  {
    sub: 'rs', label: 'Sphincter management — bowel', max: 10,
    opts: [
      { v: 0,  t: '0 — Irregular timing or very low frequency of bowel movements (<1 per 3 days)' },
      { v: 5,  t: '5 — Regular timing; requires assistance; not continent during transfer' },
      { v: 8,  t: '8 — Regular; independent with suppository/enema; continent during transfer' },
      { v: 10, t: '10 — Regular bowel movements; no assistance; continent' },
    ],
  },
  {
    sub: 'rs', label: 'Use of toilet', max: 5,
    opts: [
      { v: 0, t: '0 — Requires total assistance' },
      { v: 1, t: '1 — Requires partial assistance; does not clean self' },
      { v: 2, t: '2 — Requires partial assistance; cleans self independently' },
      { v: 4, t: '4 — Independent on standard toilet; requires adaptive equipment or supervision' },
      { v: 5, t: '5 — Independent on standard toilet; no adaptive equipment needed' },
    ],
  },

  // Mobility (10–18)
  {
    sub: 'mob', label: 'Mobility in bed / pressure injury prevention', max: 6,
    opts: [
      { v: 0, t: '0 — Requires total assistance' },
      { v: 2, t: '2 — Requires partial assistance' },
      { v: 3, t: '3 — Independent with adapted equipment' },
      { v: 6, t: '6 — Independent' },
    ],
  },
  {
    sub: 'mob', label: 'Transfers — bed to wheelchair', max: 2,
    opts: [
      { v: 0, t: '0 — Requires total assistance' },
      { v: 1, t: '1 — Requires partial assistance and/or adapted equipment' },
      { v: 2, t: '2 — Independent (or does not require wheelchair)' },
    ],
  },
  {
    sub: 'mob', label: 'Transfers — wheelchair to toilet/tub', max: 2,
    opts: [
      { v: 0, t: '0 — Requires total assistance' },
      { v: 1, t: '1 — Requires partial assistance and/or adapted equipment' },
      { v: 2, t: '2 — Independent (or does not require wheelchair)' },
    ],
  },
  {
    sub: 'mob', label: 'Indoor mobility (within 10 m)', max: 8,
    opts: [
      { v: 0, t: '0 — Requires total assistance' },
      { v: 1, t: '1 — Requires electric wheelchair or partial assistance with manual wheelchair' },
      { v: 2, t: '2 — Independent in manual wheelchair' },
      { v: 3, t: '3 — Requires supervision while walking' },
      { v: 6, t: '6 — Independent with walking aid' },
      { v: 8, t: '8 — Independent without walking aid' },
    ],
  },
  {
    sub: 'mob', label: 'Outdoor mobility (over 10 m)', max: 8,
    opts: [
      { v: 0, t: '0 — Requires total assistance' },
      { v: 1, t: '1 — Requires electric wheelchair or partial assistance with manual wheelchair' },
      { v: 2, t: '2 — Independent in manual wheelchair' },
      { v: 3, t: '3 — Requires supervision while walking' },
      { v: 6, t: '6 — Independent with walking aid' },
      { v: 8, t: '8 — Independent without walking aid' },
    ],
  },
  {
    sub: 'mob', label: 'Stair management', max: 4,
    opts: [
      { v: 0, t: '0 — Unable to climb/descend stairs' },
      { v: 1, t: '1 — Climbs/descends ≥3 steps with support/supervision of another person' },
      { v: 2, t: '2 — Climbs/descends ≥3 steps with a handrail or crutch/cane' },
      { v: 4, t: '4 — Climbs/descends ≥3 steps without any support' },
    ],
  },
  {
    sub: 'mob', label: 'Transfers — wheelchair to car', max: 2,
    opts: [
      { v: 0, t: '0 — Requires total assistance' },
      { v: 1, t: '1 — Requires partial assistance and/or adapted equipment' },
      { v: 2, t: '2 — Independent (or does not require wheelchair)' },
    ],
  },
  {
    sub: 'mob', label: 'Transfers — floor to wheelchair', max: 2,
    opts: [
      { v: 0, t: '0 — Requires assistance' },
      { v: 1, t: '1 — Independent with or without adapted equipment' },
      { v: 2, t: '2 — Does not use wheelchair' },
    ],
  },
  {
    sub: 'mob', label: 'Adaptive mobility (distance / environment)', max: 6,
    opts: [
      { v: 0, t: '0 — Requires total assistance outside' },
      { v: 2, t: '2 — Uses electric wheelchair independently' },
      { v: 4, t: '4 — Independent in manual wheelchair up to 100 m outdoors' },
      { v: 6, t: '6 — Walks independently (with or without aid) in all environments' },
    ],
  },
]

function classify(total) {
  if (total >= 80) return { label: 'High independence',      color: 'green' }
  if (total >= 50) return { label: 'Moderate dependence',    color: 'amber' }
  if (total >= 20) return { label: 'Significant dependence', color: 'red'   }
  return                  { label: 'Severe dependence',       color: 'red'   }
}

export function calcSCIM({ items }) {
  if (!items || items.length !== 19) return null

  const scores = items.map(Number)
  if (scores.some(s => isNaN(s))) return null

  let sc = 0, rs = 0, mob = 0
  SCIM_ITEMS.forEach((item, i) => {
    if (item.sub === 'sc')       sc  += scores[i]
    else if (item.sub === 'rs')  rs  += scores[i]
    else                         mob += scores[i]
  })

  const total = sc + rs + mob
  const { label, color } = classify(total)

  return {
    primaryValue: total,
    primaryUnit: '/100',
    interpretation: label,
    meta: { sc, rs, mob, classColor: color },
  }
}

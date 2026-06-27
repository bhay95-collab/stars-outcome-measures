// Olerud–Molander Ankle Score (OMAS) — clinical engine (Olerud & Molander 1984,
// Arch Orthop Trauma Surg 103(3):190–4). Patient-reported outcome for recovery
// after ankle fracture. 9 weighted items summed to a 0–100 total; higher = better.
//
// Item weights (max points), verified against the Turkish (Turhan 2017) and
// Brazilian (Castilho 2021) cross-cultural validations:
//   Pain 25 · Stiffness 10 · Swelling 10 · Stair-climbing 10 · Running 5 ·
//   Jumping 5 · Squatting 5 · Supports 10 · Work/ADL 20  → 100 total.
// Interpretation bands (Castilho 2021): 0–30 poor · 31–60 fair · 61–90 good ·
//   91–100 excellent.
// Change: anchored MCID ≈12.5 pts (ROC, 3–6 mo; published range 10.5–15,
//   Lehnert 2022, Arch Orthop Trauma Surg) — documented in mcid.js.
//
// Each item has its own option set with item-specific point values; an answer is
// valid only if it matches one of that item's allowed values. All 9 items are
// required (the original instrument has no missing-item rule).
// Input: { items: number[9] } in the canonical order below.
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

export const OMAS_ITEMS = [
  {
    key: 'pain',
    label: 'Pain',
    options: [
      { value: 25, label: 'None' },
      { value: 20, label: 'While walking on uneven ground' },
      { value: 10, label: 'While walking on even ground outdoors' },
      { value: 5, label: 'While walking indoors' },
      { value: 0, label: 'Constant and severe' },
    ],
  },
  {
    key: 'stiffness',
    label: 'Stiffness (morning or after activity)',
    options: [
      { value: 10, label: 'None' },
      { value: 0, label: 'Present' },
    ],
  },
  {
    key: 'swelling',
    label: 'Swelling',
    options: [
      { value: 10, label: 'None' },
      { value: 5, label: 'Only in the evening' },
      { value: 0, label: 'Constant' },
    ],
  },
  {
    key: 'stairs',
    label: 'Climbing stairs',
    options: [
      { value: 10, label: 'No difficulty' },
      { value: 5, label: 'Impaired' },
      { value: 0, label: 'Impossible' },
    ],
  },
  {
    key: 'running',
    label: 'Running',
    options: [
      { value: 5, label: 'Possible' },
      { value: 0, label: 'Impossible' },
    ],
  },
  {
    key: 'jumping',
    label: 'Jumping',
    options: [
      { value: 5, label: 'Possible' },
      { value: 0, label: 'Impossible' },
    ],
  },
  {
    key: 'squatting',
    label: 'Squatting',
    options: [
      { value: 5, label: 'No difficulty' },
      { value: 0, label: 'Impossible' },
    ],
  },
  {
    key: 'supports',
    label: 'Supports (walking aids)',
    options: [
      { value: 10, label: 'None' },
      { value: 5, label: 'Taping or wrapping' },
      { value: 0, label: 'Stick or crutch' },
    ],
  },
  {
    key: 'work',
    label: 'Work / activity level',
    options: [
      { value: 20, label: 'Same as before injury' },
      { value: 15, label: 'Loss of tempo' },
      { value: 10, label: 'Change to a simpler job / part-time' },
      { value: 0, label: 'Severely impaired work capacity' },
    ],
  },
]

// Allowed point values per item — an answer must match exactly (options are
// sparse, so a plain 0..max range check would let invalid values through).
const ITEM_VALUES = OMAS_ITEMS.map(item => new Set(item.options.map(opt => opt.value)))

function classify(total) {
  if (total >= 91) return { label: 'Excellent (91–100)', color: 'green' }
  if (total >= 61) return { label: 'Good (61–90)', color: 'green' }
  if (total >= 31) return { label: 'Fair (31–60)', color: 'amber' }
  return { label: 'Poor (0–30)', color: 'red' }
}

export function calcOMAS({ items }) {
  if (!Array.isArray(items) || items.length !== OMAS_ITEMS.length) return null

  const scores = items.map(Number)
  if (scores.some((value, index) => !Number.isInteger(value) || !ITEM_VALUES[index].has(value))) {
    return null
  }

  const total = scores.reduce((sum, value) => sum + value, 0)
  const { label, color } = classify(total)

  return {
    primaryValue: total,
    primaryUnit: '/100',
    interpretation: label,
    meta: { classColor: color, items: scores },
  }
}

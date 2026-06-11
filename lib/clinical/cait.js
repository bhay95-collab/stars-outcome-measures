// Cumberland Ankle Instability Tool (CAIT) — clinical engine (Hiller et al. 2006)
// 9 items with item-specific option sets, total 0–30, higher = MORE stable.
// Functional ankle instability cut-offs: ≤27 (Hiller 2006 original);
// ≤25 improves accuracy (Wright et al. 2014 recalibration). MDC ≈3 pts in
// reliability studies — no firmly established MCID, so a 3-point change is used
// as the meaningful-change threshold (documented in mcid.js).
// One ankle is scored per assessment. Free instrument, widely reproduced.
// Input: { items: number[9] } — each value must be a valid point for that item.
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

export const CAIT_ITEMS = [
  {
    label: 'I have pain in my ankle',
    options: [
      { value: 5, label: 'Never' },
      { value: 4, label: 'During sport' },
      { value: 3, label: 'Running on uneven surfaces' },
      { value: 2, label: 'Running on level surfaces' },
      { value: 1, label: 'Walking on uneven surfaces' },
      { value: 0, label: 'Walking on level surfaces' },
    ],
  },
  {
    label: 'My ankle feels UNSTABLE',
    options: [
      { value: 4, label: 'Never' },
      { value: 3, label: 'Sometimes during sport (not every time)' },
      { value: 2, label: 'Frequently during sport (every time)' },
      { value: 1, label: 'Sometimes during daily activity' },
      { value: 0, label: 'Frequently during daily activity' },
    ],
  },
  {
    label: 'When I make SHARP turns, my ankle feels UNSTABLE',
    options: [
      { value: 3, label: 'Never' },
      { value: 2, label: 'Sometimes during running' },
      { value: 1, label: 'Often when running' },
      { value: 0, label: 'When walking' },
    ],
  },
  {
    label: 'When going down the stairs, my ankle feels UNSTABLE',
    options: [
      { value: 3, label: 'Never' },
      { value: 2, label: 'If I go fast' },
      { value: 1, label: 'Occasionally' },
      { value: 0, label: 'Always' },
    ],
  },
  {
    label: 'My ankle feels UNSTABLE when standing on ONE leg',
    options: [
      { value: 2, label: 'Never' },
      { value: 1, label: 'On the ball of my foot' },
      { value: 0, label: 'With my foot flat' },
    ],
  },
  {
    label: 'My ankle feels UNSTABLE when',
    options: [
      { value: 3, label: 'Never' },
      { value: 2, label: 'I hop from side to side' },
      { value: 1, label: 'I hop on the spot' },
      { value: 0, label: 'When I jump' },
    ],
  },
  {
    label: 'My ankle feels UNSTABLE when (uneven ground)',
    options: [
      { value: 4, label: 'Never' },
      { value: 3, label: 'I run on uneven surfaces' },
      { value: 2, label: 'I jog on uneven surfaces' },
      { value: 1, label: 'I walk on uneven surfaces' },
      { value: 0, label: 'I walk on a flat surface' },
    ],
  },
  {
    label: 'TYPICALLY, when I start to roll over on my ankle, I can stop it',
    options: [
      { value: 3, label: 'Immediately' },
      { value: 2, label: 'Often' },
      { value: 1, label: 'Sometimes' },
      { value: 0, label: 'Never' },
      { value: 3, label: 'I have never rolled over on my ankle' },
    ],
  },
  {
    label: 'After a TYPICAL incident of my ankle rolling over, it returns to "normal"',
    options: [
      { value: 3, label: 'Almost immediately' },
      { value: 2, label: 'Less than one day' },
      { value: 1, label: '1–2 days' },
      { value: 0, label: 'More than 2 days' },
      { value: 3, label: 'I have never rolled over on my ankle' },
    ],
  },
]

// Maximum point value available for each item — used to validate inputs.
const ITEM_MAX = CAIT_ITEMS.map(item => Math.max(...item.options.map(opt => opt.value)))

function classify(total) {
  if (total >= 28) return { label: 'No functional instability (≥28)', color: 'green' }
  if (total >= 25) return { label: 'Possible instability (Hiller cut-off ≤27)', color: 'amber' }
  return { label: 'Functional ankle instability (≤24)', color: 'red' }
}

export function calcCAIT({ items }) {
  if (!Array.isArray(items) || items.length !== 9) return null

  const scores = items.map(Number)
  if (scores.some((value, index) => !Number.isInteger(value) || value < 0 || value > ITEM_MAX[index])) {
    return null
  }

  const total = scores.reduce((sum, value) => sum + value, 0)
  const { label, color } = classify(total)

  return {
    primaryValue: total,
    primaryUnit: '/30',
    interpretation: label,
    meta: { classColor: color, items: scores },
  }
}

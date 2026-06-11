// Lower Extremity Functional Scale (LEFS) — clinical engine
// 20 items, each scored 0 (extreme difficulty or unable) to 4 (no difficulty)
// Total = sum 0–80, higher = better. % of maximal function = total / 80 × 100.
// MCID 9 pts; MDC90 9 pts (Binkley et al. 1999, Phys Ther); pooled MDC90 6 (Mehta 2016).
// Graded change: 9 small · 12 moderate · 16 large (SRALab recommendation).
// No published severity bands — interpret via % of maximal function and change.
// All 20 items required (no developer-endorsed missing-item rule).
// Input: { items: number[20] }
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

export const LEFS_OPTIONS = [
  { value: 0, label: '0 — Extreme difficulty or unable' },
  { value: 1, label: '1 — Quite a bit of difficulty' },
  { value: 2, label: '2 — Moderate difficulty' },
  { value: 3, label: '3 — A little bit of difficulty' },
  { value: 4, label: '4 — No difficulty' },
]

export const LEFS_ITEMS = [
  { label: 'Any of your usual work, housework, or school activities' },
  { label: 'Your usual hobbies, recreational or sporting activities' },
  { label: 'Getting into or out of the bath' },
  { label: 'Walking between rooms' },
  { label: 'Putting on your shoes or socks' },
  { label: 'Squatting' },
  { label: 'Lifting an object, like a bag of groceries, from the floor' },
  { label: 'Performing light activities around your home' },
  { label: 'Performing heavy activities around your home' },
  { label: 'Getting into or out of a car' },
  { label: 'Walking 2 blocks' },
  { label: 'Walking a mile (1.6 km)' },
  { label: 'Going up or down 10 stairs (about 1 flight)' },
  { label: 'Standing for 1 hour' },
  { label: 'Sitting for 1 hour' },
  { label: 'Running on even ground' },
  { label: 'Running on uneven ground' },
  { label: 'Making sharp turns while running fast' },
  { label: 'Hopping' },
  { label: 'Rolling over in bed' },
]

export function calcLEFS({ items }) {
  if (!Array.isArray(items) || items.length !== 20) return null

  const scores = items.map(Number)
  if (scores.some(s => !Number.isInteger(s) || s < 0 || s > 4)) return null

  const total = scores.reduce((sum, s) => sum + s, 0)
  const percentMax = Math.round((total / 80) * 100)

  return {
    primaryValue: total,
    primaryUnit: '/80',
    interpretation: `${percentMax}% of maximal function`,
    // No published severity bands — colour stays neutral; meaning comes from change vs MCID.
    meta: { classColor: 'grey', percentMax, items: scores },
  }
}

// Back Pain Functional Scale (BPFS) — clinical engine
// 12 items, each scored 0 (unable to perform) to 5 (no difficulty)
// Total = sum 0–60, higher = better (Stratford et al. 2000, Phys Ther).
// MDC90 ≈ 6.5 pts — used as the change threshold; a formal MCID has not been
// firmly established for the BPFS, so changes ≥6.5 exceed measurement error.
// No published severity bands — interpret via % of maximum and change.
// Input: { items: number[12] }
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

export const BPFS_OPTIONS = [
  { value: 0, label: '0 — Unable to perform activity' },
  { value: 1, label: '1 — Extreme difficulty' },
  { value: 2, label: '2 — Quite a bit of difficulty' },
  { value: 3, label: '3 — Moderate difficulty' },
  { value: 4, label: '4 — A little bit of difficulty' },
  { value: 5, label: '5 — No difficulty' },
]

export const BPFS_ITEMS = [
  { label: 'Any of your usual work, housework, or school activities' },
  { label: 'Your usual hobbies, recreational or sporting activities' },
  { label: 'Performing heavy activities around your home' },
  { label: 'Bending or stooping' },
  { label: 'Putting on your shoes or socks' },
  { label: 'Lifting a box of groceries from the floor' },
  { label: 'Sleeping' },
  { label: 'Standing for 1 hour' },
  { label: 'Walking a mile (1.6 km)' },
  { label: 'Going up or down 2 flights of stairs (about 20 stairs)' },
  { label: 'Sitting for 1 hour' },
  { label: 'Driving for 1 hour' },
]

export function calcBPFS({ items }) {
  if (!Array.isArray(items) || items.length !== 12) return null

  const scores = items.map(Number)
  if (scores.some(s => !Number.isInteger(s) || s < 0 || s > 5)) return null

  const total = scores.reduce((sum, s) => sum + s, 0)
  const percentMax = Math.round((total / 60) * 100)

  return {
    primaryValue: total,
    primaryUnit: '/60',
    interpretation: `${percentMax}% of maximal function`,
    // No published severity bands — colour stays neutral; meaning comes from change vs MDC.
    meta: { classColor: 'grey', percentMax, items: scores },
  }
}

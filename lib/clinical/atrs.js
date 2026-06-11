// Achilles Tendon Total Rupture Score (ATRS) — clinical engine
// Nilsson-Helander & Silbernagel 2007 (Am J Sports Med). 10 items, each rated
// 0 (very limited / major symptoms) to 10 (not at all limited). Sum 0–100,
// higher = better recovery. No published severity bands — interpret via score
// and change. MDC ranges 6.8–18.5 pts across translations (group ~3–7,
// individual up to ~18); no single established MCID, so a 10-pt change is used
// as a pragmatic meaning-of-change threshold flagged as measurement-error-based
// in mcid.js. Free instrument (no licensing regime).
// Input: { items: number[10] } — each 0–10 integer.
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

export const ATRS_ITEMS = [
  'Are you limited due to decreased strength in the calf/Achilles tendon/foot?',
  'Are you limited due to fatigue in the calf/Achilles tendon/foot?',
  'Are you limited due to stiffness in the calf/Achilles tendon/foot?',
  'Are you limited due to pain in the calf/Achilles tendon/foot?',
  'Are you limited during activities of daily living?',
  'Are you limited when walking on uneven surfaces?',
  'Are you limited when walking quickly up the stairs or up a hill?',
  'Are you limited during activities that include running?',
  'Are you limited during activities that include jumping?',
  'Are you limited in performing hard physical labour?',
]

// 0 = very limited, 10 = not at all limited.
export const ATRS_OPTIONS = Array.from({ length: 11 }, (_, value) => ({
  value,
  label: value === 0 ? '0 — Very limited' : value === 10 ? '10 — Not at all limited' : String(value),
}))

export function calcATRS({ items }) {
  if (!Array.isArray(items) || items.length !== 10) return null

  const scores = items.map(Number)
  if (scores.some(value => !Number.isInteger(value) || value < 0 || value > 10)) return null

  const total = scores.reduce((sum, value) => sum + value, 0)

  return {
    primaryValue: total,
    primaryUnit: '/100',
    interpretation: `${total}/100 — higher reflects better Achilles function`,
    // No published severity bands — colour stays neutral; meaning comes from change vs MDC.
    meta: { classColor: 'grey', items: scores },
  }
}

// KOOS/HOOS shared scoring engine (Roos instrument family, koos.nu)
// Each subscale is scored independently and NEVER aggregated to a total —
// explicitly discouraged by the KOOS User's Guide (2012).
// Per subscale: 100 − (mean of answered items × 100 / 4) → 0–100, higher = better.
// Missing items: up to 2 per subscale permitted (classic rule, equivalent to
// mean substitution); more missing → subscale not scored (null, never imputed).

export const KOOS_MAX_MISSING_PER_SUBSCALE = 2

// Response option sets — labels map in order to scores 0 (best) … 4 (worst).
export const KF_OPTIONS = {
  freq:     ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
  freqRev:  ['Always', 'Often', 'Sometimes', 'Rarely', 'Never'],
  severity: ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'],
  painFreq: ['Never', 'Monthly', 'Weekly', 'Daily', 'Always'],
  aware:    ['Never', 'Monthly', 'Weekly', 'Daily', 'Constantly'],
  modified: ['Not at all', 'Mildly', 'Moderately', 'Severely', 'Totally'],
  troubled: ['Not at all', 'Mildly', 'Moderately', 'Severely', 'Extremely'],
}

/**
 * Score one KOOS/HOOS subscale.
 * @param {Array<number|null>} values - item scores 0–4, null/'' = unanswered
 * @param {number} expectedLength
 * @returns {{ score: number|null, missing: number } | null} null = structurally invalid input
 */
export function scoreKoosSubscale(values, expectedLength) {
  if (!Array.isArray(values) || values.length !== expectedLength) return null

  let sum = 0
  let answered = 0
  for (const value of values) {
    if (value == null || value === '') continue
    const numeric = Number(value)
    if (!Number.isInteger(numeric) || numeric < 0 || numeric > 4) return null
    sum += numeric
    answered++
  }

  const missing = expectedLength - answered
  if (answered === 0 || missing > KOOS_MAX_MISSING_PER_SUBSCALE) {
    return { score: null, missing }
  }

  const mean = sum / answered
  return { score: parseFloat((100 - (mean * 100) / 4).toFixed(1)), missing }
}

function formatSubscaleValue(score) {
  return score == null ? '—' : String(score)
}

/**
 * Score a full KOOS/HOOS questionnaire against its section definitions.
 * Pain is the designated primary subscale (most responsive; PASS anchor) —
 * if Pain cannot be scored the assessment is not scoreable.
 *
 * @param {Array<{ key: string, shortLabel: string, items: Array }>} sections
 * @param {Object<string, Array<number|null>>} itemsBySubscale
 * @returns {{ primaryValue, primaryUnit, interpretation, meta } | null}
 */
export function calcKoosFamily(sections, itemsBySubscale) {
  if (!itemsBySubscale || typeof itemsBySubscale !== 'object') return null

  const scores = {}
  const missing = {}
  for (const section of sections) {
    const result = scoreKoosSubscale(itemsBySubscale[section.key], section.items.length)
    if (result === null) return null
    scores[section.key] = result.score
    missing[section.key] = result.missing
  }

  if (scores.pain == null) return null

  const interpretation = sections
    .map(section => `${section.shortLabel} ${formatSubscaleValue(scores[section.key])}`)
    .join(' · ') + ' (100 = no problems)'

  const meta = { classColor: 'grey', missing }
  for (const section of sections) {
    if (section.key !== 'pain') meta[section.key] = scores[section.key]
  }

  return {
    primaryValue: scores.pain,
    primaryUnit: '/100',
    interpretation,
    meta,
  }
}

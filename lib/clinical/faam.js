// Foot and Ankle Ability Measure (FAAM) — clinical engine (Martin et al. 2005)
// Two separately scored subscales: ADL (21 items) and Sports (8 items).
// Each item 4 (no difficulty) … 0 (unable to do); N/A permitted when the
// activity is limited by something other than the foot/ankle.
// Subscale % = (sum of numeric scores) / (4 × numeric responses) × 100;
// N/A and blanks are excluded from numerator and denominator.
// Validity floor ≈90% of items must have a response (numeric or N/A):
// ADL ≥19 of 21, Sports ≥7 of 8, else the subscale is not scored.
// Sports may be skipped entirely (e.g. non-athletic presentations).
// Higher = better. MCID: ADL 8, Sports 9. MDC95: ADL 5.7, Sports 12.3 —
// note Sports MDC exceeds its MCID (handled by the MCID engine labels).
// CAI criteria (IAC, Gribble 2014; Carcia 2008): ADL <90% and/or Sport <80%
// indicate a self-reported functional deficit.
// Input: { adl: Array(21), sport: Array(8) } — values 0–4, 'na', or null/''
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

export const FAAM_OPTIONS = [
  { value: 4, label: 'No difficulty' },
  { value: 3, label: 'Slight difficulty' },
  { value: 2, label: 'Moderate difficulty' },
  { value: 1, label: 'Extreme difficulty' },
  { value: 0, label: 'Unable to do' },
  { value: 'na', label: 'N/A' },
]

export const FAAM_ADL_ITEMS = [
  { label: 'Standing' },
  { label: 'Walking on even ground' },
  { label: 'Walking on even ground without shoes' },
  { label: 'Walking up hills' },
  { label: 'Walking down hills' },
  { label: 'Going up stairs' },
  { label: 'Going down stairs' },
  { label: 'Walking on uneven ground' },
  { label: 'Stepping up and down curbs' },
  { label: 'Squatting' },
  { label: 'Coming up on your toes' },
  { label: 'Walking initially' },
  { label: 'Walking 5 minutes or less' },
  { label: 'Walking approximately 10 minutes' },
  { label: 'Walking 15 minutes or greater' },
  { label: 'Home responsibilities' },
  { label: 'Activities of daily living' },
  { label: 'Personal care' },
  { label: 'Light to moderate work (standing, walking)' },
  { label: 'Heavy work (push/pulling, climbing, carrying)' },
  { label: 'Recreational activities' },
]

export const FAAM_SPORT_ITEMS = [
  { label: 'Running' },
  { label: 'Jumping' },
  { label: 'Landing' },
  { label: 'Starting and stopping quickly' },
  { label: 'Cutting / lateral movements' },
  { label: 'Low impact activities' },
  { label: 'Ability to perform activity with your normal technique' },
  { label: 'Ability to participate in your desired sport as long as you would like' },
]

function scoreFaamSubscale(values, expectedLength, minResponses) {
  if (!Array.isArray(values) || values.length !== expectedLength) return null

  let sum = 0
  let numericCount = 0
  let responses = 0
  for (const value of values) {
    if (value == null || value === '') continue
    if (value === 'na') { responses++; continue }
    const numeric = Number(value)
    if (!Number.isInteger(numeric) || numeric < 0 || numeric > 4) return null
    sum += numeric
    numericCount++
    responses++
  }

  if (responses === 0) return { score: null, answered: 0 }
  if (responses < minResponses || numericCount === 0) return { score: null, answered: responses }

  return {
    score: parseFloat(((sum / (4 * numericCount)) * 100).toFixed(1)),
    answered: responses,
  }
}

export function calcFAAM({ adl, sport }) {
  const adlResult = scoreFaamSubscale(adl, 21, 19)
  const sportResult = scoreFaamSubscale(sport ?? Array(8).fill(null), 8, 7)
  if (adlResult === null || sportResult === null) return null
  if (adlResult.score == null) return null

  const deficits = []
  if (adlResult.score < 90) deficits.push('ADL <90%')
  if (sportResult.score != null && sportResult.score < 80) deficits.push('Sport <80%')

  const interpretation = deficits.length
    ? `ADL ${adlResult.score}% · Sport ${sportResult.score ?? '—'}% — functional deficit range (${deficits.join(', ')})`
    : `ADL ${adlResult.score}% · Sport ${sportResult.score ?? '—'}% — above functional deficit cutoffs`

  return {
    primaryValue: adlResult.score,
    primaryUnit: '%',
    interpretation,
    meta: {
      classColor: deficits.length ? 'amber' : 'green',
      sport: sportResult.score,
      adlAnswered: adlResult.answered,
      sportAnswered: sportResult.answered,
    },
  }
}

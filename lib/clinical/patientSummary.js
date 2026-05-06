import { MEASURES } from './measures'
import { getMCIDStatus } from './mcid'

export const SUMMARY_DOMAINS = [
  {
    id: 'mobility',
    label: 'Mobility & Ambulation',
    measureIds: ['10MWT', '6MWT', 'TUG', 'FAC', 'Step', 'HiMAT', 'AMP', 'BOOMER'],
  },
  {
    id: 'balance',
    label: 'Balance & Falls',
    measureIds: ['BBS', 'FGA', 'ABC', 'PASS', 'TIS', 'SARA', 'BOOMER', 'Step'],
  },
  {
    id: 'independence',
    label: 'Independence & ADL',
    measureIds: ['Barthel', 'SCIM', 'COVS', 'FAC', 'AMP'],
  },
  {
    id: 'neurology',
    label: 'Neurological Status',
    measureIds: ['ISNCSCI', 'SCIM', 'RPQ', 'BIVI'],
  },
  {
    id: 'symptoms',
    label: 'Symptoms & Participation',
    measureIds: ['FSS', 'HADS', 'PDQ8', 'RPQ', 'BIVI'],
  },
]

const COLOR_WEIGHT = { red: 3, amber: 2, grey: 1, green: 0 }

export function fmtDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function toFiniteNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function normalizeTone(value) {
  const raw = String(value ?? '').toLowerCase()
  if (raw.includes('red')) return 'red'
  if (raw.includes('amber') || raw.includes('yellow')) return 'amber'
  if (raw.includes('green')) return 'green'
  return 'grey'
}

export function formatPrimaryValue(value, measure) {
  if (value == null) return '-'
  const numericValue = toFiniteNumber(value)
  if (numericValue == null) return String(value)
  if (measure?.primaryUnit === 'sec' || measure?.primaryUnit === 'm/s') return numericValue.toFixed(2)
  if (Number.isInteger(numericValue)) return String(numericValue)
  return numericValue.toFixed(1)
}

export function formatResultValue(value, measure) {
  const formatted = formatPrimaryValue(value, measure)
  return [formatted, measure?.primaryUnit].filter(Boolean).join(' ')
}

export function groupAssessmentsByMeasure(assessments = []) {
  const groups = {}
  for (const assessment of assessments) {
    if (!groups[assessment.measure]) groups[assessment.measure] = []
    groups[assessment.measure].push(assessment)
  }
  Object.values(groups).forEach(list => {
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  })
  return groups
}

function normalizedScore(value, measure) {
  const numericValue = toFiniteNumber(value)
  if (numericValue == null || !measure?.chart) return null
  const { yMin = 0, yMax = 100 } = measure.chart
  if (yMax === yMin) return null
  const raw = ((numericValue - yMin) / (yMax - yMin)) * 100
  const oriented = measure.higherIsBetter === false ? 100 - raw : raw
  return Math.max(0, Math.min(100, Math.round(oriented)))
}

function getTrend(latest, previous, measure) {
  const latestValue = toFiniteNumber(latest?.results?.primaryValue)
  const previousValue = toFiniteNumber(previous?.results?.primaryValue)
  if (latestValue == null || previousValue == null || latestValue === previousValue) {
    return { label: 'Stable/unchanged', direction: 'stable', delta: 0 }
  }

  const rawDelta = latestValue - previousValue
  const improved = measure?.higherIsBetter === false ? rawDelta < 0 : rawDelta > 0
  const direction = improved ? 'improved' : 'declined'
  return {
    label: improved ? 'Improved' : 'Declined',
    direction,
    delta: rawDelta,
  }
}

function buildLatestEntries(groups) {
  return Object.keys(MEASURES)
    .filter(measureId => groups[measureId]?.length > 0)
    .map(measureId => {
      const measure = MEASURES[measureId]
      const latest = groups[measureId][0]
      const previous = groups[measureId][1] ?? null
      const numericValue = toFiniteNumber(latest.results?.primaryValue)
      const tone = normalizeTone(latest.results?.meta?.classColor)
      const trend = previous ? getTrend(latest, previous, measure) : null
      const score = normalizedScore(latest.results?.primaryValue, measure)
      const mcid = measure.mcidKey && previous && numericValue != null && toFiniteNumber(previous.results?.primaryValue) != null
        ? getMCIDStatus(measure.mcidKey, numericValue, toFiniteNumber(previous.results.primaryValue))
        : null

      return {
        measureId,
        measure,
        latest,
        previous,
        numericValue,
        score,
        tone,
        trend,
        mcid,
        valueLabel: formatResultValue(latest.results?.primaryValue, measure),
        interpretation: latest.results?.interpretation ?? 'No interpretation recorded',
      }
    })
}

function summarizeDomain(domain, entries) {
  const domainEntries = entries.filter(entry => domain.measureIds.includes(entry.measureId))
  if (!domainEntries.length) return { ...domain, entries: [], status: 'Not assessed', tone: 'grey', score: null, trend: 'No data' }

  const scoredEntries = domainEntries.filter(entry => entry.score != null)
  const score = scoredEntries.length
    ? Math.round(scoredEntries.reduce((sum, entry) => sum + entry.score, 0) / scoredEntries.length)
    : null
  const worstTone = domainEntries.reduce((worst, entry) =>
    COLOR_WEIGHT[entry.tone] > COLOR_WEIGHT[worst] ? entry.tone : worst
  , 'green')

  const latestImportant = [...domainEntries].sort((a, b) =>
    COLOR_WEIGHT[b.tone] - COLOR_WEIGHT[a.tone]
  )[0]

  const trendCounts = domainEntries.reduce((acc, entry) => {
    if (entry.trend?.direction) acc[entry.trend.direction] = (acc[entry.trend.direction] ?? 0) + 1
    return acc
  }, {})
  const trend = trendCounts.improved > trendCounts.declined
    ? 'Improving'
    : trendCounts.declined > trendCounts.improved
      ? 'Declining'
      : trendCounts.stable
        ? 'Stable'
        : 'Baseline'

  return {
    ...domain,
    entries: domainEntries,
    score,
    trend,
    tone: worstTone,
    status: latestImportant?.interpretation ?? 'Recorded',
  }
}

function buildTimeline(entries, groups) {
  return entries
    .flatMap(entry => {
      const list = groups[entry.measureId] ?? []
      return list.map(assessment => ({
        measureId: entry.measureId,
        date: assessment.created_at,
        score: normalizedScore(assessment.results?.primaryValue, entry.measure),
      }))
    })
    .filter(point => point.score != null)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
}

function buildFlags(entries) {
  return entries
    .filter(entry => ['red', 'amber'].includes(entry.tone))
    .sort((a, b) => COLOR_WEIGHT[b.tone] - COLOR_WEIGHT[a.tone])
    .slice(0, 6)
    .map(entry => ({
      tone: entry.tone,
      title: entry.measure.id,
      text: entry.interpretation,
      value: entry.valueLabel,
    }))
}

function buildInterpretation(entries, domains) {
  if (!entries.length) return ['No outcome measures have been recorded yet. Record a baseline assessment to populate the clinical overview.']

  const sentences = []
  const riskEntries = entries.filter(entry => ['red', 'amber'].includes(entry.tone))
  const improving = entries.filter(entry => entry.trend?.direction === 'improved')
  const declining = entries.filter(entry => entry.trend?.direction === 'declined')
  const assessedDomains = domains.filter(domain => domain.entries.length)

  sentences.push(`${entries.length} outcome measure${entries.length === 1 ? '' : 's'} recorded across ${assessedDomains.length} clinical domain${assessedDomains.length === 1 ? '' : 's'}.`)

  if (riskEntries.length) {
    const lead = riskEntries[0]
    sentences.push(`Current priority signal: ${lead.measure.name} is ${lead.valueLabel} (${lead.interpretation}).`)
  } else {
    sentences.push('Latest recorded measures are not currently flagging elevated clinical concern.')
  }

  if (improving.length || declining.length) {
    sentences.push(`${improving.length} measure${improving.length === 1 ? '' : 's'} improved and ${declining.length} declined compared with the previous recording where repeat data exists.`)
  } else {
    sentences.push('Repeat data is limited; trend interpretation should be treated as baseline until follow-up measures are recorded.')
  }

  return sentences
}

export function buildPatientSummary(patient, assessments = []) {
  const sortedAssessments = [...assessments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const groups = groupAssessmentsByMeasure(sortedAssessments)
  const entries = buildLatestEntries(groups)
  const domains = SUMMARY_DOMAINS.map(domain => summarizeDomain(domain, entries))
  const timeline = buildTimeline(entries, groups)
  const flags = buildFlags(entries)
  const interpretation = buildInterpretation(entries, domains)

  return {
    patient,
    assessments: sortedAssessments,
    groups,
    entries,
    domains,
    timeline,
    flags,
    interpretation,
    totals: {
      assessments: sortedAssessments.length,
      measures: entries.length,
      domains: domains.filter(domain => domain.entries.length).length,
      latestDate: sortedAssessments[0]?.created_at ?? null,
    },
  }
}

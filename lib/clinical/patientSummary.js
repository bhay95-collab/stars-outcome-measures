import { MEASURES } from './measures'
import { getMCIDStatus } from './mcid'
import { ISNCSCI_AIS_DETAIL } from './isncsci'

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

export function buildISNCSCISummaryRows(result) {
  const meta = result?.meta ?? {}
  if (!meta.aisGrade && !meta.nli) return []
  return [
    ['Neurological level of injury', meta.nli],
    ['AIS grade', meta.aisGrade ? `AIS ${meta.aisGrade}` : null],
    ['Complete / incomplete', meta.complete],
    ['Sensory level', meta.snsR || meta.snsL ? `R: ${meta.snsR ?? '-'} / L: ${meta.snsL ?? '-'}` : null],
    ['Motor level', meta.motR || meta.motL ? `R: ${meta.motR ?? '-'} / L: ${meta.motL ?? '-'}` : null],
    ['UEMS total', meta.uems ? `${meta.uems.total}/50` : null],
    ['LEMS total', meta.lems ? `${meta.lems.total}/50` : null],
    ['Light touch total', meta.lt ? `${meta.lt.total}/112` : null],
    ['Pin prick total', meta.pp ? `${meta.pp.total}/112` : null],
    ['ZPP sensory', meta.zppSns ? `R: ${meta.zppSns.r} / L: ${meta.zppSns.l}` : null],
    ['ZPP motor', meta.zppMot ? `R: ${meta.zppMot.r} / L: ${meta.zppMot.l}` : null],
  ].filter(([, value]) => value != null && value !== '')
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

  const isncsci = entries.find(entry => entry.measureId === 'ISNCSCI')
  const aisGrade = isncsci?.latest?.results?.meta?.aisGrade
  const detail = aisGrade ? ISNCSCI_AIS_DETAIL[aisGrade] : null
  if (detail?.prognosis) {
    sentences.push(`ISNCSCI prognosis (${detail.title}): ${detail.prognosis}`)
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

function localDateKey(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function changeText(entry) {
  if (!entry.previous || !entry.trend) return 'Baseline'
  if (entry.mcid) return entry.mcid.label
  const delta = toFiniteNumber(entry.trend.delta)
  if (delta == null || delta === 0) return 'Stable'
  const sign = delta > 0 ? '+' : ''
  return `${entry.trend.label} ${sign}${formatPrimaryValue(delta, entry.measure)}${entry.measure.primaryUnit ? ` ${entry.measure.primaryUnit}` : ''}`
}

export function buildTodayAssessmentRows(patient, assessments = [], date = new Date()) {
  const summary = buildPatientSummary(patient, assessments)
  const todayKey = localDateKey(date.toISOString())
  const latestEncounterId = summary.assessments.find(a => a.results?.meta?.encounterId)?.results?.meta?.encounterId ?? null

  const todayAssessments = summary.assessments.filter(assessment => {
    if (latestEncounterId) return assessment.results?.meta?.encounterId === latestEncounterId
    return localDateKey(assessment.created_at) === todayKey
  })
  const todayIds = new Set(todayAssessments.map(assessment => assessment.id))

  return summary.entries
    .filter(entry => todayIds.has(entry.latest.id))
    .map(entry => ({
      measureId: entry.measureId,
      measure: entry.measure.name,
      score: entry.valueLabel,
      interpretation: entry.interpretation,
      change: changeText(entry),
      date: entry.latest.created_at,
      isncsciRows: entry.measureId === 'ISNCSCI'
        ? buildISNCSCISummaryRows(entry.latest.results)
        : [],
    }))
}

export function buildMeasureTrendSeries(groups, measureId) {
  const measure = MEASURES[measureId]
  const records = [...(groups[measureId] ?? [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  if (!measure || !records.length) return []

  const primaryLabel = {
    '10MWT': 'Comfortable speed',
    TUG: 'Comfortable time',
    Step: 'Affected limb',
    HADS: 'Anxiety',
    SCIM: 'Total score',
  }[measureId] ?? measure.name

  const series = [
    {
      key: 'primary',
      label: primaryLabel,
      unit: measure.primaryUnit ?? '',
      mcidKey: measure.mcidKey,
      values: records.map(record => ({ date: record.created_at, value: toFiniteNumber(record.results?.primaryValue), record })),
    },
  ]

  if (measureId === '10MWT') {
    series.push({
      key: 'fastSpeed',
      label: 'Fast speed',
      unit: 'm/s',
      mcidKey: '10mwt-fast',
      values: records.map(record => ({ date: record.created_at, value: toFiniteNumber(record.results?.meta?.fastSpeed), record })),
    })
  }

  if (measureId === 'TUG') {
    series.push(
      {
        key: 'fastTime',
        label: 'Fast time',
        unit: 'sec',
        mcidKey: null,
        values: records.map(record => ({ date: record.created_at, value: toFiniteNumber(record.results?.meta?.fastTime), record })),
      },
      {
        key: 'dualTime',
        label: 'Dual-task time',
        unit: 'sec',
        mcidKey: null,
        values: records.map(record => ({ date: record.created_at, value: toFiniteNumber(record.results?.meta?.dualTime), record })),
      },
    )
  }

  if (measureId === 'Step') {
    series.push({
      key: 'nonAffectedSteps',
      label: 'Non-affected limb',
      unit: 'steps',
      mcidKey: null,
      values: records.map(record => ({ date: record.created_at, value: toFiniteNumber(record.results?.meta?.nonAffectedSteps), record })),
    })
  }

  if (measureId === 'HADS') {
    series.push({
      key: 'depressionScore',
      label: 'Depression',
      unit: '/21',
      mcidKey: 'hads-d',
      values: records.map(record => ({ date: record.created_at, value: toFiniteNumber(record.results?.meta?.depressionScore), record })),
    })
  }

  if (measureId === 'SCIM') {
    series.push(
      { key: 'sc', label: 'Self-care', unit: '/20', values: records.map(record => ({ date: record.created_at, value: toFiniteNumber(record.results?.meta?.sc), record })) },
      { key: 'rs', label: 'Respiration/sphincters', unit: '/40', values: records.map(record => ({ date: record.created_at, value: toFiniteNumber(record.results?.meta?.rs), record })) },
      { key: 'mob', label: 'Mobility', unit: '/40', values: records.map(record => ({ date: record.created_at, value: toFiniteNumber(record.results?.meta?.mob), record })) },
    )
  }

  return series
    .map(item => ({ ...item, values: item.values.filter(point => point.value != null) }))
    .filter(item => item.values.length > 0)
}

import { MEASURES } from './measures'
import { MCID_VALS, getMCIDStatus } from './mcid'
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

const PLAIN_DOMAIN_LABELS = {
  mobility: 'mobility and walking',
  balance: 'balance and falls risk',
  independence: 'daily activities',
  neurology: 'neurological function',
  symptoms: 'symptoms and participation',
}

const PLAIN_MEASURE_AREAS = {
  '10MWT': 'walking speed',
  '6MWT': 'walking endurance',
  TUG: 'standing, walking and turning',
  FAC: 'walking independence',
  Step: 'stepping ability',
  HiMAT: 'higher level mobility',
  AMP: 'mobility with a prosthesis',
  BOOMER: 'mobility and balance',
  BBS: 'balance',
  FGA: 'walking balance',
  ABC: 'confidence with balance',
  PASS: 'posture and balance',
  TIS: 'trunk control',
  SARA: 'coordination',
  Barthel: 'daily activities',
  SCIM: 'daily independence',
  COVS: 'functional independence',
  ISNCSCI: 'neurological function',
  FSS: 'fatigue',
  HADS: 'mood symptoms',
  PDQ8: 'quality of life',
  RPQ: 'post-concussion symptoms',
  BIVI: 'vision-related function',
}

function humanList(items) {
  const unique = [...new Set(items.filter(Boolean))]
  if (!unique.length) return ''
  if (unique.length === 1) return unique[0]
  if (unique.length === 2) return `${unique[0]}, as well as ${unique[1]}`
  return `${unique.slice(0, -1).join(', ')}, and ${unique[unique.length - 1]}`
}

function plainAreaForEntry(entry) {
  return PLAIN_MEASURE_AREAS[entry.measureId] || entry.measure?.name?.toLowerCase() || 'function'
}

function lowerFirst(value) {
  const text = String(value || '')
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text
}

function plainThresholdText(entry) {
  const threshold = MCID_VALS[entry.measure?.mcidKey]
  if (!threshold) return ''
  return `${threshold.thresh} ${threshold.unit}`
}

function plainMCIDSentence(entry) {
  if (!entry.previous || !entry.trend || !entry.mcid) return ''
  if (entry.trend.direction === 'stable') {
    return 'This is unchanged from the previous test and does not yet show a new measurable change.'
  }

  const thresholdText = plainThresholdText(entry)
  const thresholdClause = thresholdText ? ` of ${thresholdText}` : ''
  if (entry.trend.direction === 'improved') {
    return entry.mcid.meetsThreshold
      ? `This meets the clinically significant improvement threshold${thresholdClause}, indicating meaningful functional improvement.`
      : `This is a positive change, but it remains below the clinically significant improvement threshold${thresholdClause}.`
  }

  return `This represents deterioration compared with the previous test and should be monitored.`
}

function plainTrendVerb(entry) {
  if (!entry.trend || entry.trend.direction === 'stable') return 'remained stable'
  return entry.trend.direction === 'improved' ? 'improved' : 'declined'
}

function plainScoreSentence(entry) {
  const previousValue = toFiniteNumber(entry.previous?.results?.primaryValue)
  const currentLabel = entry.valueLabel
  const previousLabel = previousValue != null
    ? formatResultValue(previousValue, entry.measure)
    : null
  const interpretation = entry.interpretation

  if (previousLabel) {
    const mcid = plainMCIDSentence(entry)
    return `${entry.measure.name} results ${plainTrendVerb(entry)} from ${previousLabel} to ${currentLabel}. ${mcid || `The current interpretation is ${lowerFirst(interpretation)}.`}`
  }

  return `${entry.measure.name} currently records ${currentLabel}, interpreted as ${lowerFirst(interpretation)}. This provides a baseline for future comparison.`
}

function ambulationTargetSentence(speed, trendDirection) {
  if (speed == null) return ''
  if (speed < 0.4) {
    return trendDirection === 'improved'
      ? 'If this improvement trend continues, reaching 0.40 m/s would move into limited community ambulator range, with community ambulator range beginning at 0.80 m/s.'
      : 'The next walking-speed target is 0.40 m/s for limited community ambulator range, with community ambulator range beginning at 0.80 m/s.'
  }
  if (speed < 0.8) {
    return trendDirection === 'improved'
      ? 'If this improvement trend continues, reaching 0.80 m/s would move into community ambulator range, with full community ambulator range beginning at 1.20 m/s.'
      : 'The next walking-speed target is 0.80 m/s for community ambulator range, with full community ambulator range beginning at 1.20 m/s.'
  }
  if (speed < 1.2) {
    return trendDirection === 'improved'
      ? 'If this improvement trend continues, reaching 1.20 m/s would move into full community ambulator range.'
      : 'The next walking-speed target is 1.20 m/s for full community ambulator range.'
  }
  return 'This is already within the full community ambulator range for comfortable walking speed.'
}

function plain10MWTSentence(entry, patientLabel) {
  const currentSpeed = entry.numericValue
  const previousSpeed = toFiniteNumber(entry.previous?.results?.primaryValue)
  const currentLabel = entry.valueLabel
  const previousLabel = previousSpeed != null ? formatResultValue(previousSpeed, entry.measure) : null
  const classification = entry.latest?.results?.meta?.classification || entry.interpretation
  const comfortPct = entry.latest?.results?.meta?.comfortPct
  const fastSpeed = toFiniteNumber(entry.latest?.results?.meta?.fastSpeed)

  const change = previousLabel
    ? `10 Metre Walk Test results show comfortable walking speed ${plainTrendVerb(entry)} from ${previousLabel} to ${currentLabel}.`
    : `The latest 10 Metre Walk Test comfortable walking speed is ${currentLabel}.`

  const mcid = plainMCIDSentence(entry)
  const classificationText = `${patientLabel} currently sits in the ${lowerFirst(classification)} range${comfortPct != null ? ` at ${comfortPct}% of predicted comfortable walking speed` : ''}.`
  const fastText = fastSpeed != null ? ` Fast walking speed is ${formatResultValue(fastSpeed, entry.measure)}.` : ''
  const target = ambulationTargetSentence(currentSpeed, entry.trend?.direction)

  return [change, mcid, classificationText, target, fastText].filter(Boolean).join(' ')
}

function selectPlainDetailEntries(entries) {
  const scored = entries.filter(entry => entry.numericValue != null)
  const tenMWT = scored.find(entry => entry.measureId === '10MWT')
  const meaningfulImprovers = scored
    .filter(entry => entry.trend?.direction === 'improved')
    .sort((a, b) => Number(Boolean(b.mcid?.meetsThreshold)) - Number(Boolean(a.mcid?.meetsThreshold)))
  const priority = scored
    .filter(entry => ['red', 'amber'].includes(entry.tone))
    .sort((a, b) => COLOR_WEIGHT[b.tone] - COLOR_WEIGHT[a.tone])
  const repeated = scored.filter(entry => entry.previous)

  const selected = []
  for (const entry of [tenMWT, ...meaningfulImprovers, ...priority, ...repeated, ...scored]) {
    if (entry && !selected.some(item => item.measureId === entry.measureId)) selected.push(entry)
    if (selected.length >= 4) break
  }
  return selected
}

function buildPlainLanguageSummary(patient, entries, domains, latestDate) {
  const patientLabel = patient?.initials || 'the patient'
  if (!entries.length) {
    return `${patientLabel} does not yet have saved outcome measures. A baseline assessment is needed before a clear plain-language progress summary can be written.`
  }

  const assessedDomains = domains.filter(domain => domain.entries.length)
  const domainText = humanList(assessedDomains.map(domain => PLAIN_DOMAIN_LABELS[domain.id] || domain.label.toLowerCase()))
  const diagnosisText = patient?.diagnosis ? `, who has a diagnosis of ${patient.diagnosis},` : ''
  const dateText = latestDate ? ` recorded on ${fmtDate(latestDate)}` : ''

  const concernDomains = assessedDomains
    .filter(domain => ['red', 'amber'].includes(domain.tone))
    .sort((a, b) => COLOR_WEIGHT[b.tone] - COLOR_WEIGHT[a.tone])
    .map(domain => PLAIN_DOMAIN_LABELS[domain.id] || domain.label.toLowerCase())
    .slice(0, 3)
  const strongerDomains = assessedDomains
    .filter(domain => domain.tone === 'green')
    .map(domain => PLAIN_DOMAIN_LABELS[domain.id] || domain.label.toLowerCase())
    .slice(0, 2)
  const priorityEntry = [...entries]
    .filter(entry => ['red', 'amber'].includes(entry.tone))
    .sort((a, b) => COLOR_WEIGHT[b.tone] - COLOR_WEIGHT[a.tone])[0]
  const detailEntries = selectPlainDetailEntries(entries)

  const opening = `Based on the latest outcome measures${dateText}, ${patientLabel}${diagnosisText} has current information recorded across ${domainText || 'the measured areas'}.`
  const scoreDetail = detailEntries
    .map(entry => entry.measureId === '10MWT'
      ? plain10MWTSentence(entry, patientLabel)
      : plainScoreSentence(entry))
    .join(' ')

  const practical = concernDomains.length
    ? `Overall, the main current focus remains ${humanList(concernDomains.slice(0, 2))}${priorityEntry ? `, especially ${plainAreaForEntry(priorityEntry)}` : ''}.`
    : `Overall, the latest scores do not flag a major concern in the measured areas${strongerDomains.length ? `, with ${humanList(strongerDomains)} appearing more settled` : ''}.`

  return [opening, scoreDetail, practical].filter(Boolean).join(' ')
}

export function buildPatientSummary(patient, assessments = []) {
  const sortedAssessments = [...assessments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const outcomeAssessments = sortedAssessments.filter(assessment => MEASURES[assessment.measure])
  const groups = groupAssessmentsByMeasure(outcomeAssessments)
  const entries = buildLatestEntries(groups)
  const domains = SUMMARY_DOMAINS.map(domain => summarizeDomain(domain, entries))
  const timeline = buildTimeline(entries, groups)
  const flags = buildFlags(entries)
  const interpretation = buildInterpretation(entries, domains)
  const plainLanguageSummary = buildPlainLanguageSummary(patient, entries, domains, outcomeAssessments[0]?.created_at ?? null)

  return {
    patient,
    assessments: sortedAssessments,
    groups,
    entries,
    domains,
    timeline,
    flags,
    interpretation,
    plainLanguageSummary,
    totals: {
      assessments: outcomeAssessments.length,
      measures: entries.length,
      domains: domains.filter(domain => domain.entries.length).length,
      latestDate: outcomeAssessments[0]?.created_at ?? null,
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

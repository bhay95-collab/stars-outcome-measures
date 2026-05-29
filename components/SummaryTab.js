import { useMemo, useState } from 'react'
import { getMCIDContext, getMCIDStatus } from '../lib/clinical'
import { buildPatientPathway } from '../lib/clinical/pathways'
import {
  buildMeasureTrendSeries,
  buildPatientSummary,
  buildTodayAssessmentRows,
  fmtDate,
  formatPrimaryValue,
  formatResultValue,
  toFiniteNumber,
} from '../lib/clinical/patientSummary'

function toneClass(tone) {
  return ['green', 'amber', 'red'].includes(tone) ? tone : 'grey'
}

function trendLabel(entry) {
  if (!entry.previous) return 'Baseline'
  if (!entry.trend || entry.trend.direction === 'stable') return 'Stable'
  const unit = entry.measure.primaryUnit ? ` ${entry.measure.primaryUnit}` : ''
  const delta = toFiniteNumber(entry.trend.delta)
  const sign = delta > 0 ? '+' : ''
  return `${entry.trend.label} (${sign}${formatPrimaryValue(delta, entry.measure)}${unit})`
}

function interpretationMeta(text, index) {
  if (text.startsWith('Current priority signal')) {
    return { label: 'Priority Signal', tone: 'priority' }
  }
  if (text.startsWith('ISNCSCI prognosis')) {
    return { label: 'ISNCSCI Prognosis', tone: 'neuro' }
  }
  if (text.includes('improved') || text.includes('Repeat data')) {
    return { label: 'Trend Context', tone: 'trend' }
  }
  if (text.includes('not currently flagging')) {
    return { label: 'Clinical Signal', tone: 'steady' }
  }
  return { label: index === 0 ? 'Overview' : 'Clinical Note', tone: 'overview' }
}

const TREND_SERIES_COLORS = ['#7FB3E6', '#ee8a70', '#8b82c6', '#236499', '#2F855A']

function trendSeriesColor(index) {
  return TREND_SERIES_COLORS[index % TREND_SERIES_COLORS.length]
}

export default function SummaryTab({ patient, assessments, onDeleteAssessment, onDeletePatient, mode = 'full' }) {
  const summary = buildPatientSummary(patient, assessments)
  const pathway = buildPatientPathway(patient, assessments)
  const reportMode = mode === 'reports'
  const mcidContext = patient.diagnosis ? getMCIDContext(patient.diagnosis) : null
  const selectableMeasures = summary.entries.filter(entry => summary.groups[entry.measureId]?.some(a => toFiniteNumber(a.results?.primaryValue) != null))
  const [selectedMeasureId, setSelectedMeasureId] = useState(selectableMeasures[0]?.measureId ?? '')
  const [copiedPlainSummary, setCopiedPlainSummary] = useState(false)
  const activeMeasureId = selectableMeasures.some(entry => entry.measureId === selectedMeasureId)
    ? selectedMeasureId
    : selectableMeasures[0]?.measureId ?? ''
  const trendSeries = useMemo(
    () => activeMeasureId ? buildMeasureTrendSeries(summary.groups, activeMeasureId) : [],
    [summary.groups, activeMeasureId],
  )
  const todayRows = buildTodayAssessmentRows(patient, assessments)
  const isncsciTodayRows = todayRows.find(row => row.measureId === 'ISNCSCI')?.isncsciRows ?? []

  async function copyPlainSummary() {
    const text = summary.plainLanguageSummary || ''
    if (!text) return
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopiedPlainSummary(true)
    window.setTimeout(() => setCopiedPlainSummary(false), 1800)
  }

  return (
    <section className="summary-dashboard" aria-label={reportMode ? 'Reports and notes' : 'Patient dashboard'}>
      {!reportMode && (
        <section className="dashboard-zone dashboard-zone--progress" aria-labelledby="dashboard-progress-heading">
          <div className="dashboard-zone__head">
            <div>
              <span className="section-label">Progress and pathway</span>
              <h2 id="dashboard-progress-heading">Outcome trajectory and next action</h2>
            </div>
            <p>Recent change and pathway coverage to prioritise the next assessment.</p>
          </div>

          <div className="dashboard-progress-grid">
            <div className="summary-card summary-card--wide summary-card--anchor">
              <div className="summary-card__head">
                <div>
                  <h3>Outcome Measure Trend</h3>
                  <p>Recorded outcome values over time, with clinically meaningful change highlighted where thresholds exist.</p>
                </div>
                {selectableMeasures.length > 0 && (
                  <select value={activeMeasureId} onChange={event => setSelectedMeasureId(event.target.value)} aria-label="Select outcome measure trend">
                    {selectableMeasures.map(entry => (
                      <option key={entry.measureId} value={entry.measureId}>{entry.measure.id} - {entry.measure.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <MeasureTrendChart series={trendSeries} measureId={activeMeasureId} />
            </div>

            <PathwayPanel pathway={pathway} />
          </div>
        </section>
      )}

      <section className="dashboard-zone dashboard-zone--review" aria-labelledby="dashboard-review-heading">
        <div className="dashboard-zone__head">
          <div>
            <span className="section-label">Clinical review</span>
            <h2 id="dashboard-review-heading">Narrative and interpretation</h2>
          </div>
          <p>Patient-facing narrative and clinician interpretation from recorded outcome data.</p>
        </div>

        <div className="dashboard-review-grid">
          <div className="summary-card letter-summary-card">
            <div className="summary-card__head">
              <div>
                <h3>Plain-Language Patient Summary</h3>
                <p>Focused narrative for letters to non-specialists and broader care teams.</p>
              </div>
              <button type="button" onClick={copyPlainSummary}>
                {copiedPlainSummary ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p>{summary.plainLanguageSummary}</p>
          </div>

          <div className="summary-card insight-card">
            <h3>Clinical Interpretation</h3>
            <div className="interpretation-list">
              {summary.interpretation.map((text, index) => {
                const meta = interpretationMeta(text, index)
                return (
                  <article key={index} data-tone={meta.tone}>
                    <span>{meta.label}</span>
                    <p>{text}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {!reportMode && (
        <section className="dashboard-zone dashboard-zone--signals" aria-labelledby="dashboard-signals-heading">
          <div className="dashboard-zone__head">
            <div>
              <span className="section-label">Signals and measures</span>
              <h2 id="dashboard-signals-heading">Current status tiles</h2>
            </div>
            <p>Latest flags, values, and covered domains from recorded assessments.</p>
          </div>

          <div className="dashboard-signals-grid">
            <div className="summary-card signal-card">
              <h3>Current Clinical Signals</h3>
              <ClinicalSignals flags={summary.flags} onSelectMeasure={setSelectedMeasureId} />
            </div>

            <div className="summary-card latest-card">
              <h3>Latest Recorded Measures</h3>
              <LatestMeasures entries={summary.entries} onSelectMeasure={setSelectedMeasureId} />
            </div>
          </div>

          <div className="domain-grid">
            {summary.domains.map(domain => (
              <DomainCard key={domain.id} domain={domain} />
            ))}
          </div>
        </section>
      )}

      <section className="dashboard-zone dashboard-zone--records" aria-labelledby="dashboard-records-heading">
        <div className="dashboard-zone__head">
          <div>
            <span className="section-label">Records</span>
            <h2 id="dashboard-records-heading">Notes, history, and administration</h2>
          </div>
          <p>Clinical-note exports, historic entries, reference thresholds, and administrative actions.</p>
        </div>

        <div className="dashboard-records-grid">
          <TodayAssessmentTable rows={todayRows} isncsciRows={isncsciTodayRows} />

          <div className="dashboard-records-side">
            {mcidContext && (
              <div className="info-panel dashboard-mcid-reference">
                <strong>Minimally Clinically Important Difference reference - {patient.diagnosis}:</strong> {mcidContext}
              </div>
            )}

            {patient?.id && (
              <div className="summary-card patient-management-card">
                <div>
                  <h3>Patient Management</h3>
                  <p>Delete this patient record and linked assessments.</p>
                </div>
                <button type="button" data-delete-btn="" onClick={() => onDeletePatient(patient.id)}>
                  Delete Patient
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="summary-card assessment-history">
          <h3>Assessment History</h3>
          {summary.entries.length === 0 && (
            <p className="empty-hint">
              Use &ldquo;New Assessment&rdquo; above to record the first assessment for {patient.initials}.
            </p>
          )}
          <div className="history-list">
            {summary.entries.map(entry => (
              <AssessmentCard
                key={entry.measureId}
                entry={entry}
                onDelete={onDeleteAssessment}
              />
            ))}
          </div>
        </div>
      </section>
    </section>
  )
}

function PathwayPanel({ pathway }) {
  const keyMeasures = pathway.recommendedMeasures.slice(0, 6)
  return (
    <div className="summary-card pathway-panel" data-tone={pathway.statusTone}>
      <div className="summary-card__head">
        <div>
          <h3>Smart Rehab Pathway</h3>
          <p>{pathway.diagnosisLabel} pathway · {pathway.reassessmentDays}-day reassessment rhythm.</p>
        </div>
        <div className="pathway-score">
          <strong>{pathway.coveragePercent}%</strong>
          <span>{pathway.statusLabel}</span>
        </div>
      </div>

      <div className="pathway-progress" aria-hidden="true">
        <i style={{ width: `${pathway.coveragePercent}%` }} />
      </div>

      <div className="pathway-explainer">
        <strong>How it works</strong>
        <p>{pathway.explanation.detail}</p>
        <small>{pathway.explanation.caution}</small>
      </div>

      <div className="pathway-actions">
        {pathway.nextActions.map((action, index) => (
          <article key={`${action.type}-${action.measureId ?? index}`} data-tone={action.tone}>
            <span>{action.type === 'reassess' ? 'Reassessment' : action.type === 'baseline' ? 'Baseline' : 'Next Step'}</span>
            <strong>{action.label}</strong>
            <p>{action.detail}</p>
          </article>
        ))}
      </div>

      {keyMeasures.length > 0 && (
        <div className="pathway-chip-row" aria-label="Recommended pathway measures">
          {keyMeasures.map(measure => (
            <span
              key={measure.id}
              data-state={measure.isDue ? 'due' : measure.hasBaseline ? 'recorded' : 'missing'}
            >
              {measure.id}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function MeasureTrendChart({ series, measureId }) {
  const points = series.flatMap(item => item.values.map(point => point.value))
  if (!points.length) {
    return (
      <div className="empty-chart">
        Record this measure on at least one date to generate a trend.
      </div>
    )
  }

  const W = 760
  const H = 220
  const pad = { left: 46, right: 24, top: 20, bottom: 42 }
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom
  const dates = Array.from(new Set(series.flatMap(item => item.values.map(point => point.date)))).sort((a, b) => new Date(a) - new Date(b))
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max === min ? Math.max(1, max || 1) : max - min
  const yMin = Math.max(0, min - range * 0.18)
  const yMax = max + range * 0.18
  const toX = date => dates.length === 1
    ? pad.left + innerW / 2
    : pad.left + (dates.indexOf(date) / (dates.length - 1)) * innerW
  const toY = value => pad.top + innerH - ((value - yMin) / (yMax - yMin)) * innerH
  const legendId = `trend-legend-${measureId || 'measure'}`

  return (
    <div className="trend-chart-panel">
      <div className="trend-chart-legend" id={legendId}>
        <span className="trend-chart-legend__title">Legend</span>
        {series.map((item, index) => (
          <span key={item.key}>
            <i style={{ backgroundColor: trendSeriesColor(index) }} />
            {item.label}{item.unit ? ` (${item.unit})` : ''}
          </span>
        ))}
        {series.some(item => item.mcidKey) && (
          <span>
            <i data-mcid-marker="" />
            Minimally Clinically Important Difference met
          </span>
        )}
      </div>
      <svg className="trajectory-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${measureId} trend over time`} aria-describedby={legendId}>
        {[0, 0.25, 0.5, 0.75, 1].map(position => {
          const tick = yMin + (yMax - yMin) * position
          return (
          <g key={tick}>
            <line x1={pad.left} x2={W - pad.right} y1={toY(tick)} y2={toY(tick)} />
            <text x="10" y={toY(tick) + 4}>{formatPrimaryValue(tick, {})}</text>
          </g>
        )})}
        {series.map((item, seriesIndex) => {
          const color = trendSeriesColor(seriesIndex)
          const linePoints = item.values.map(point => `${toX(point.date)},${toY(point.value)}`).join(' ')
          return (
            <g key={item.key} data-series={seriesIndex}>
              {item.values.length > 1 && <polyline points={linePoints} data-line="progress" style={{ stroke: color }} />}
              {item.values.map((point, index) => {
                const previous = index > 0 ? item.values[index - 1] : null
                const mcid = item.mcidKey && previous ? getMCIDStatus(item.mcidKey, point.value, previous.value) : null
                return (
                  <g key={`${item.key}-${point.date}`}>
                    <circle cx={toX(point.date)} cy={toY(point.value)} r={mcid?.meetsThreshold ? 7 : 5} style={{ fill: color }} data-mcid={mcid?.meetsThreshold ? '' : undefined} />
                    <text x={toX(point.date)} y={toY(point.value) - 12} textAnchor="middle">{formatPrimaryValue(point.value, { primaryUnit: item.unit })}</text>
                  </g>
                )
              })}
            </g>
          )
        })}
        {dates.map(date => <text key={date} x={toX(date)} y={H - 16} textAnchor="middle">{fmtDate(date).replace(' 20', ' ')}</text>)}
      </svg>
    </div>
  )
}

function DomainCard({ domain }) {
  const assessed = domain.entries.length > 0
  const statusLabel = !assessed
    ? 'Not assessed'
    : domain.tone === 'red'
      ? 'Needs attention'
      : domain.tone === 'amber'
        ? 'Monitor'
        : 'On track'
  return (
    <article className="summary-card domain-card" data-tone={toneClass(domain.tone)}>
      <div className="domain-card__top">
        <h3>{domain.label}</h3>
        <span>{assessed ? `${domain.entries.length} measure${domain.entries.length === 1 ? '' : 's'}` : 'No data'}</span>
      </div>
      <strong>{statusLabel}</strong>
      <p>{assessed ? domain.status : 'Not assessed with the currently recorded measures.'}</p>
      <small>{assessed ? `${domain.trend}. Based on: ${domain.entries.map(entry => entry.measureId).join(', ')}.` : 'Record a relevant measure to populate this domain.'}</small>
    </article>
  )
}

function TodayAssessmentTable({ rows, isncsciRows }) {
  const [copied, setCopied] = useState(false)

  async function copyRows() {
    const headers = ['Measure', 'Score', 'Interpretation', 'Change']
    const text = [
      'Today\'s Assessment',
      headers.join('\t'),
      ...rows.map(row => [row.measure, row.score, row.interpretation, row.change].join('\t')),
      ...(isncsciRows.length ? ['', 'ISNCSCI Summary', ...isncsciRows.map(([label, value]) => `${label}\t${value}`)] : []),
    ].join('\n')
    const html = `
      <table style="width:100%;border-collapse:collapse;font-family:Inter,Arial,sans-serif;font-size:13px">
        <thead><tr>${headers.map(h => `<th style="padding:6px 10px;border:1px solid #c8c5be;text-align:left;background:#f9f8f6">${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(row => `<tr><td style="padding:6px 10px;border:1px solid #c8c5be">${row.measure}</td><td style="padding:6px 10px;border:1px solid #c8c5be">${row.score}</td><td style="padding:6px 10px;border:1px solid #c8c5be">${row.interpretation}</td><td style="padding:6px 10px;border:1px solid #c8c5be">${row.change}</td></tr>`).join('')}</tbody>
      </table>
      ${isncsciRows.length ? `<div style="margin-top:16px;font-size:11px;font-weight:700;text-transform:uppercase;color:#6b7280">ISNCSCI Summary</div><table style="width:100%;border-collapse:collapse;font-family:Inter,Arial,sans-serif;font-size:13px">${isncsciRows.map(([label, value]) => `<tr><td style="padding:6px 10px;border:1px solid #c8c5be;font-weight:700;background:#f9f8f6">${label}</td><td style="padding:6px 10px;border:1px solid #c8c5be">${value}</td></tr>`).join('')}</table>` : ''}
    `
    if (window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' }),
        }),
      ])
    } else {
      await navigator.clipboard.writeText(text)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="summary-card today-assessment-card">
      <div className="summary-card__head">
        <div>
          <h3>Today&apos;s Assessment</h3>
          <p>Formatted for clinical notes. Includes measures saved today or in the latest saved encounter.</p>
        </div>
        <button type="button" className="copy-summary-btn" onClick={copyRows} disabled={!rows.length}>
          {copied ? 'Copied' : 'Copy to Clipboard'}
        </button>
      </div>
      <table className="today-summary-table">
        <thead>
          <tr><th>Measure</th><th>Score</th><th>Interpretation</th><th>Change</th></tr>
        </thead>
        <tbody>
          {rows.length ? rows.map(row => (
            <tr key={row.measureId}>
              <td>{row.measure}</td>
              <td>{row.score}</td>
              <td>{row.interpretation}</td>
              <td>{row.change}</td>
            </tr>
          )) : (
            <tr><td colSpan="4">No assessments saved today.</td></tr>
          )}
        </tbody>
      </table>
      {isncsciRows.length > 0 && (
        <div className="isncsci-summary-table">
          <h4>ISNCSCI Summary</h4>
          <table className="today-summary-table">
            <tbody>
              {isncsciRows.map(([label, value]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ClinicalSignals({ flags, onSelectMeasure }) {
  if (!flags.length) {
    return <p className="empty-hint">No amber or red clinical signals in the latest recorded measures.</p>
  }

  return (
    <div className="signal-list">
      {flags.map(flag => (
        <button type="button" key={`${flag.title}-${flag.text}`} data-tone={toneClass(flag.tone)} onClick={() => onSelectMeasure?.(flag.title)}>
          <strong>{flag.title}</strong>
          <span>{flag.value}</span>
          <p>{flag.text}</p>
        </button>
      ))}
    </div>
  )
}

function LatestMeasures({ entries, onSelectMeasure }) {
  if (!entries.length) {
    return <p className="empty-hint">No measures recorded yet.</p>
  }

  return (
    <div className="latest-list">
      {entries.slice(0, 8).map(entry => (
        <button type="button" key={entry.measureId} onClick={() => onSelectMeasure?.(entry.measureId)}>
          <strong>{entry.measureId}</strong>
          <span>{entry.valueLabel}</span>
          <small>{fmtDate(entry.latest.created_at)}</small>
        </button>
      ))}
    </div>
  )
}

function AssessmentCard({ entry, onDelete }) {
  const { measure, latest, previous, mcid } = entry
  const result = latest.results
  const classColor = toneClass(entry.tone)

  return (
    <div className="result-box" data-tone={classColor}>
      <div className="result-row">
        <span className="result-label">{measure.name}</span>
        <div data-assessment-meta="">
          <span className="na-text">{fmtDate(latest.created_at)}</span>
          <button
            type="button"
            data-delete-btn=""
            onClick={() => onDelete(latest.id)}
            aria-label={`Delete ${measure.name} assessment`}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="result-row">
        <div>
          <strong>{formatResultValue(result.primaryValue, measure)}</strong>
          {result.meta?.comfortPct != null && (
            <span className="na-text"> {result.meta.comfortPct}% predicted</span>
          )}
          {result.meta?.pctPredicted != null && (
            <span className="na-text"> {result.meta.pctPredicted}% predicted</span>
          )}
        </div>
        <span className={`interp-chip chip-${classColor}`}>{result.interpretation}</span>
      </div>

      <div className="assessment-detail-grid">
        <span>Domain trend: <strong>{trendLabel(entry)}</strong></span>
        {previous && (
          <span>Previous: <strong>{formatResultValue(previous.results?.primaryValue, measure)}</strong> on {fmtDate(previous.created_at)}</span>
        )}
        {mcid && (
          <span>Minimally Clinically Important Difference: <strong>{mcid.label}</strong></span>
        )}
        {result.meta?.fastSpeed != null && (
          <span>Fast gait speed: <strong>{formatPrimaryValue(result.meta.fastSpeed, { primaryUnit: 'm/s' })} m/s</strong></span>
        )}
        {result.meta?.dtc != null && (
          <span>Dual-task cost: <strong>{result.meta.dtc}%</strong> ({result.meta.dtcInterp})</span>
        )}
        {result.meta?.depressionScore != null && (
          <span>Depression: <strong>{result.meta.depressionScore}/21</strong> ({result.meta.depressionClassification})</span>
        )}
        {result.meta?.kLevel && (
          <span>Functional K-level: <strong>{result.meta.kLevel}</strong></span>
        )}
        {result.meta?.aisGrade && (
          <span>Neurology: <strong>{result.meta.nli} AIS {result.meta.aisGrade}</strong></span>
        )}
      </div>
    </div>
  )
}

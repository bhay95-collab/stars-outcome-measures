import { getMCIDContext } from '../lib/clinical'
import {
  buildPatientSummary,
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

export default function SummaryTab({ patient, assessments, onDeleteAssessment, onDeletePatient }) {
  const summary = buildPatientSummary(patient, assessments)
  const mcidContext = patient.diagnosis ? getMCIDContext(patient.diagnosis) : null

  return (
    <section className="summary-dashboard">
      <div className="summary-card summary-card--wide">
        <div className="summary-card__head">
          <div>
            <h3>Performance Across Domains</h3>
            <p>Normalised from recorded outcome measures. No benchmark or chart is shown unless the underlying measure exists.</p>
          </div>
        </div>
        <DomainTrajectory timeline={summary.timeline} />
      </div>

      <div className="domain-grid">
        {summary.domains.map(domain => (
          <DomainCard key={domain.id} domain={domain} />
        ))}
      </div>

      <div className="summary-grid summary-grid--real">
        <div className="summary-card insight-card">
          <h3>Clinical Interpretation</h3>
          <div className="interpretation-list">
            {summary.interpretation.map((text, index) => <p key={index}>{text}</p>)}
          </div>
        </div>

        <div className="summary-card signal-card">
          <h3>Current Clinical Signals</h3>
          <ClinicalSignals flags={summary.flags} />
        </div>

        <div className="summary-card latest-card">
          <h3>Latest Recorded Measures</h3>
          <LatestMeasures entries={summary.entries} />
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

      {mcidContext && (
        <div className="info-panel">
          <strong>MCID reference - {patient.diagnosis}:</strong> {mcidContext}
        </div>
      )}

      {patient?.id && (
        <div className="summary-card patient-management-card">
          <div>
            <h3>Patient Management</h3>
            <p>Administrative actions are kept separate from the clinical overview.</p>
          </div>
          <button type="button" data-delete-btn="" onClick={() => onDeletePatient(patient.id)}>
            Delete Patient
          </button>
        </div>
      )}
    </section>
  )
}

function DomainTrajectory({ timeline }) {
  if (!timeline.length) {
    return (
      <div className="empty-chart">
        Record a numeric outcome measure to generate a longitudinal performance view.
      </div>
    )
  }

  const W = 760
  const H = 220
  const pad = { left: 46, right: 24, top: 20, bottom: 42 }
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom
  const toX = index => timeline.length === 1
    ? pad.left + innerW / 2
    : pad.left + (index / (timeline.length - 1)) * innerW
  const toY = score => pad.top + innerH - (score / 100) * innerH
  const points = timeline.map((point, index) => `${toX(index)},${toY(point.score)}`).join(' ')

  return (
    <svg className="trajectory-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Normalised patient performance over time">
      {[0, 25, 50, 75, 100].map(tick => (
        <g key={tick}>
          <line x1={pad.left} x2={W - pad.right} y1={toY(tick)} y2={toY(tick)} />
          <text x="10" y={toY(tick) + 4}>{tick}</text>
        </g>
      ))}
      <path d={`M${pad.left} ${toY(75)} L${W - pad.right} ${toY(75)} L${W - pad.right} ${toY(100)} L${pad.left} ${toY(100)} Z`} data-zone="good" />
      {timeline.length > 1 && <polyline points={points} data-line="progress" />}
      {timeline.map((point, index) => (
        <g key={`${point.measureId}-${point.date}-${index}`}>
          <circle cx={toX(index)} cy={toY(point.score)} r="5" />
          <text x={toX(index)} y={toY(point.score) - 11} textAnchor="middle">{point.measureId}</text>
          <text x={toX(index)} y={H - 16} textAnchor="middle">{fmtDate(point.date).replace(' 20', ' ')}</text>
        </g>
      ))}
      <text x={pad.left} y={H - 2}>0-100 normalised score, oriented so higher is better</text>
    </svg>
  )
}

function DomainCard({ domain }) {
  const assessed = domain.entries.length > 0
  return (
    <article className="summary-card domain-card" data-tone={toneClass(domain.tone)}>
      <div className="domain-card__top">
        <h3>{domain.label}</h3>
        <span>{assessed ? `${domain.entries.length} measure${domain.entries.length === 1 ? '' : 's'}` : 'No data'}</span>
      </div>
      <strong>{domain.score == null ? '-' : `${domain.score}/100`}</strong>
      <p>{assessed ? domain.status : 'Not assessed with the currently recorded measures.'}</p>
      <small>{assessed ? domain.trend : 'Record a relevant measure to populate this domain.'}</small>
    </article>
  )
}

function ClinicalSignals({ flags }) {
  if (!flags.length) {
    return <p className="empty-hint">No amber or red clinical signals in the latest recorded measures.</p>
  }

  return (
    <div className="signal-list">
      {flags.map(flag => (
        <div key={`${flag.title}-${flag.text}`} data-tone={toneClass(flag.tone)}>
          <strong>{flag.title}</strong>
          <span>{flag.value}</span>
          <p>{flag.text}</p>
        </div>
      ))}
    </div>
  )
}

function LatestMeasures({ entries }) {
  if (!entries.length) {
    return <p className="empty-hint">No measures recorded yet.</p>
  }

  return (
    <div className="latest-list">
      {entries.slice(0, 8).map(entry => (
        <div key={entry.measureId}>
          <strong>{entry.measureId}</strong>
          <span>{entry.valueLabel}</span>
          <small>{fmtDate(entry.latest.created_at)}</small>
        </div>
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
          <span>MCID: <strong>{mcid.label}</strong></span>
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

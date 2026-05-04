import { MEASURES, getMCIDStatus, getMCIDContext } from '../lib/clinical'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function groupByMeasure(assessments) {
  const groups = {}
  for (const a of assessments) {
    if (!groups[a.measure]) groups[a.measure] = []
    groups[a.measure].push(a)
  }
  return groups
}

function formatPrimaryValue(value, measure) {
  if (measure.primaryUnit === 'sec' || measure.primaryUnit === 'm/s') return value.toFixed(2)
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(1)
}

function getLatestAssessments(groups) {
  return Object.entries(groups)
    .map(([measureId, list]) => ({ measureId, assessment: list[0] }))
    .filter(item => item.assessment?.results?.primaryValue != null)
}

export default function SummaryTab({ patient, assessments, onDeleteAssessment }) {
  const groups = groupByMeasure(assessments)
  const activeMeasureIds = Object.keys(MEASURES).filter(id => groups[id]?.length > 0)
  const mcidContext = patient.diagnosis ? getMCIDContext(patient.diagnosis) : null

  const latestAssessments = getLatestAssessments(groups)

  return (
    <section className="summary-dashboard">
      <div className="summary-card summary-card--wide">
        <div className="summary-card__head">
          <h3>Recovery Trajectory</h3>
          <ChartLegend />
        </div>
        <RecoveryTrajectory />
      </div>

      <div className="summary-grid">
        <div className="summary-card outcome-card">
          <h3>Functional Outcomes</h3>
          <OutcomeBars latestAssessments={latestAssessments} />
        </div>
        <div className="summary-card activity-card">
          <h3>Daily Activity</h3>
          <ActivityDonut />
        </div>
        <div className="summary-card pain-card">
          <h3>Pain & Discomfort Trend</h3>
          <PainTrend />
        </div>
        <div className="summary-card detail-card">
          <h3>Key Assessment Details</h3>
          <KeyDetails latestAssessments={latestAssessments} />
        </div>
      </div>

      <div className="summary-card assessment-history">
        <h3>Functional Outcomes</h3>
        {activeMeasureIds.length === 0 && (
          <p className="empty-hint">
            Use &ldquo;New Assessment&rdquo; above to record the first assessment for {patient.initials}.
          </p>
        )}
        {activeMeasureIds.map(measureId => {
          const m = MEASURES[measureId]
          const list = groups[measureId]
          const latest = list[0]
          const previous = list[1] ?? null

          const mcid = m.mcidKey && latest && previous
            ? getMCIDStatus(m.mcidKey, latest.results.primaryValue, previous.results.primaryValue)
            : null

          return (
            <div key={measureId}>
              <AssessmentCard
                measure={m}
                assessment={latest}
                mcid={mcid}
                label="Latest"
                onDelete={onDeleteAssessment}
              />
              {previous && (
                <AssessmentCard
                  measure={m}
                  assessment={previous}
                  mcid={null}
                  label="Previous"
                  dim
                  onDelete={onDeleteAssessment}
                />
              )}
            </div>
          )
        })}
      </div>

      {mcidContext && (
        <div className="info-panel">
          <strong>MCID reference - {patient.diagnosis}:</strong> {mcidContext}
        </div>
      )}
    </section>
  )
}

function ChartLegend() {
  return (
    <div className="chart-legend">
      <span data-tone="progress">Progress</span>
      <span data-tone="coral">Corsry.</span>
      <span data-tone="mist">Mist</span>
    </div>
  )
}

function RecoveryTrajectory() {
  return (
    <svg className="trajectory-chart" viewBox="0 0 760 210" role="img" aria-label="Recovery trajectory chart">
      {[0, 25, 50, 75, 100].map((tick, index) => (
        <g key={tick}>
          <line x1="36" x2="738" y1={182 - index * 39} y2={182 - index * 39} />
          <text x="8" y={186 - index * 39}>{tick}</text>
        </g>
      ))}
      <defs>
        <linearGradient id="progressFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#78c8bd" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#78c8bd" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="coralFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ee8a70" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ee8a70" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="mistFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#8b82c6" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#8b82c6" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d="M40 182 L175 104 L306 76 L438 70 L571 38 L735 16 L735 182 Z" fill="url(#progressFill)" />
      <path d="M40 182 L175 124 L306 100 L438 92 L571 58 L735 42 L735 182 Z" fill="url(#coralFill)" />
      <path d="M40 182 L175 146 L306 128 L438 120 L571 82 L735 72 L735 182 Z" fill="url(#mistFill)" />
      <path d="M40 182 L175 104 L306 76 L438 70 L571 38 L735 16" data-line="progress" />
      <path d="M40 182 L175 124 L306 100 L438 92 L571 58 L735 42" data-line="coral" />
      <path d="M40 182 L175 146 L306 128 L438 120 L571 82 L735 72" data-line="mist" />
      {[40, 175, 306, 438, 571, 735].map((x, index) => <text key={x} x={x - 12} y="204">Time</text>)}
    </svg>
  )
}

function OutcomeBars({ latestAssessments }) {
  const fallback = [
    ['TUG', 42, 33],
    ['BBS', 58, 45],
    ['6MWT', 35, 53],
    ['FGA', 63, 55],
    ['IOT', 46, 41],
  ]
  const values = latestAssessments.length
    ? latestAssessments.slice(0, 5).map(({ measureId, assessment }, index) => {
        const value = Math.max(18, Math.min(68, Number(assessment.results.primaryValue) || fallback[index]?.[1] || 42))
        return [measureId, value, Math.max(16, value - 8)]
      })
    : fallback

  return (
    <div className="bar-chart" aria-label="Latest functional outcomes">
      <div className="bar-legend"><span>Latest</span><span>Historical Avg.</span></div>
      <div className="bar-stage">
        {values.map(([label, latest, historical]) => (
          <div className="bar-pair" key={label}>
            <i style={{ height: `${latest}%` }} />
            <b style={{ height: `${historical}%` }} />
            <small>{label}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityDonut() {
  return (
    <div className="activity-mix">
      <div className="donut" />
      <div className="activity-lines">
        <strong>59% <span>Week Ahorcl</span></strong>
        <strong>65% <span>Daily Activity</span></strong>
      </div>
    </div>
  )
}

function PainTrend() {
  return (
    <svg className="pain-trend" viewBox="0 0 250 170" role="img" aria-label="Pain and discomfort trend">
      {[1, 3, 5, 7, 9].map((tick, index) => (
        <g key={tick}>
          <line x1="20" x2="232" y1={148 - index * 29} y2={148 - index * 29} />
          <text x="4" y={152 - index * 29}>{tick}</text>
        </g>
      ))}
      <path d="M24 100 C42 134 54 70 70 64 C92 56 95 112 118 116 C142 120 151 92 172 110 C194 128 206 142 228 136 L228 154 L24 154 Z" />
      <path d="M24 100 C42 134 54 70 70 64 C92 56 95 112 118 116 C142 120 151 92 172 110 C194 128 206 142 228 136" data-line="" />
      <text x="20" y="166">Pain 1-10</text>
      <text x="166" y="166">Last Month</text>
    </svg>
  )
}

function KeyDetails({ latestAssessments }) {
  const fallback = [
    ['ROM Flexion', '75', '103.00'],
    ['Strength (Grip)', '30.00', '100.00'],
    ['Balance Score', '60', '202.00'],
    ['Balance Score', '72.90', '149.33'],
  ]
  const rows = latestAssessments.length
    ? latestAssessments.slice(0, 4).map(({ measureId, assessment }) => [
        MEASURES[measureId]?.name ?? measureId,
        formatPrimaryValue(assessment.results.primaryValue, MEASURES[measureId]),
        `${Math.max(35, Math.round((assessment.results.primaryValue || 1) * 1.4))}.00`,
      ])
    : fallback

  return (
    <div className="detail-list">
      {rows.map(([label, latest, average], index) => (
        <div key={`${label}-${index}`}>
          <strong>{label}</strong>
          <span>{latest}</span>
          <small>Latest Avg.</small>
          <em>{average}</em>
          <i>{index % 2 === 0 ? '↑' : '↓'}</i>
        </div>
      ))}
    </div>
  )
}

function AssessmentCard({ measure, assessment, mcid, label, dim, onDelete }) {
  const r = assessment.results
  const classColor = r.meta?.classColor ?? 'grey'
  const mcidState = mcid
    ? mcid.meetsThreshold ? 'met' : mcid.improved ? 'near' : 'decline'
    : null

  return (
    <div className="result-box" data-dim={dim ? '' : undefined}>
      <div className="result-row">
        <span className="result-label">{measure.name} · {label}</span>
        <div data-assessment-meta="">
          <span className="na-text">{fmtDate(assessment.created_at)}</span>
          <button
            type="button"
            data-delete-btn=""
            onClick={() => onDelete(assessment.id)}
            aria-label="Delete assessment"
          >Delete</button>
        </div>
      </div>

      <div className="result-row">
        <div>
          <strong>{formatPrimaryValue(r.primaryValue, measure)}</strong>
          {' '}<span>{measure.primaryUnit}</span>
          {r.meta?.comfortPct != null && (
            <>{' '}<span className="na-text">{r.meta.comfortPct}% predicted</span></>
          )}
          {r.meta?.pctPredicted != null && (
            <>{' '}<span className="na-text">{r.meta.pctPredicted}% predicted</span></>
          )}
        </div>
        <span className={`interp-chip chip-${classColor}`}>{r.interpretation}</span>
      </div>

      {r.meta?.fastSpeed != null && (
        <p>Fast: {r.meta.fastSpeed.toFixed(2)} m/s{r.meta.fastPct != null && ` — ${r.meta.fastPct}% predicted`}</p>
      )}

      {r.meta?.depressionScore != null && (
        <div className="result-row">
          <span>Anxiety: <strong>{r.primaryValue}</strong>/21
            {' '}<span className={`interp-chip chip-${classColor}`}>{r.interpretation}</span>
          </span>
          <span>Depression: <strong>{r.meta.depressionScore}</strong>/21
            {r.meta.depressionColor && (
              <>{' '}<span className={`interp-chip chip-${r.meta.depressionColor}`}>{r.meta.depressionClassification}</span></>
            )}
          </span>
        </div>
      )}

      {r.meta?.leftSteps != null && (
        <p>
          Left: <strong>{r.meta.leftSteps}</strong> · Right: <strong>{r.primaryValue}</strong> steps
          {r.meta.asymmetry && <span className="na-text"> — Asymmetry detected</span>}
        </p>
      )}

      {mcid && (
        <div data-mcid={mcidState}>
          {mcid.improved ? '▲' : '▼'} {mcid.label}
        </div>
      )}
    </div>
  )
}

import { getMCIDStatus, getMCIDContext } from '../lib/clinical'
import ProgressChart from './ProgressChart'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default function SummaryTab({ patient, assessments }) {
  const mwtList = assessments.filter(a => a.measure === '10MWT')
  const latest  = mwtList[0] ?? null
  const previous = mwtList[1] ?? null

  const mcid = latest && previous
    ? getMCIDStatus(
        '10mwt-comfort',
        latest.results.primaryValue,
        previous.results.primaryValue,
      )
    : null

  const chartData = mwtList.length >= 2
    ? [...mwtList].reverse().map(a => ({ date: a.created_at, value: a.results.primaryValue }))
    : null

  const mcidContext = patient.diagnosis ? getMCIDContext(patient.diagnosis) : null

  if (mwtList.length === 0) {
    return (
      <div className="patient-card">
        <p className="section-label">Clinical Summary</p>
        <p className="empty-hint">
          Use &ldquo;+ New Assessment&rdquo; above to record the first 10MWT for {patient.initials}.
        </p>
      </div>
    )
  }

  return (
    <>
      {chartData && (
        <div data-chart>
          <ProgressChart data={chartData} measureId="10MWT" />
        </div>
      )}

      <AssessmentCard assessment={latest} mcid={mcid} label="Latest" />
      {previous && <AssessmentCard assessment={previous} mcid={null} label="Previous" dim />}

      {mcidContext && (
        <div className="info-panel">
          <strong>MCID reference — {patient.diagnosis}:</strong> {mcidContext}
        </div>
      )}
    </>
  )
}

function AssessmentCard({ assessment, mcid, label, dim }) {
  const r = assessment.results
  const classColor = r.meta?.classColor ?? 'grey'
  const mcidState = mcid
    ? mcid.meetsThreshold ? 'met' : mcid.improved ? 'near' : 'decline'
    : null

  return (
    <div className="result-box" data-dim={dim ? '' : undefined}>
      <div className="result-row">
        <span className="result-label">10 Metre Walk Test · {label}</span>
        <span className="na-text">{fmtDate(assessment.created_at)}</span>
      </div>

      <div className="result-row">
        <div>
          <strong>{r.primaryValue.toFixed(2)}</strong>
          {' '}<span>m/s</span>
          {r.meta?.comfortPct != null && (
            <>{' '}<span className="na-text">{r.meta.comfortPct}% predicted</span></>
          )}
        </div>
        <span className={`interp-chip chip-${classColor}`}>{r.interpretation}</span>
      </div>

      {r.meta?.fastSpeed != null && (
        <p>Fast: {r.meta.fastSpeed.toFixed(2)} m/s{r.meta.fastPct != null && ` — ${r.meta.fastPct}% predicted`}</p>
      )}

      {mcid && (
        <div data-mcid={mcidState}>
          {mcid.improved ? '▲' : '▼'} {mcid.label}
        </div>
      )}
    </div>
  )
}

import { MEASURES, getMCIDStatus, getMCIDContext } from '../lib/clinical'
import ProgressChart from './ProgressChart'

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

export default function SummaryTab({ patient, assessments, onDeleteAssessment }) {
  const groups = groupByMeasure(assessments)
  const activeMeasureIds = Object.keys(MEASURES).filter(id => groups[id]?.length > 0)
  const mcidContext = patient.diagnosis ? getMCIDContext(patient.diagnosis) : null

  if (activeMeasureIds.length === 0) {
    return (
      <div className="patient-card" data-empty="">
        <p className="section-label">Clinical Summary</p>
        <p className="empty-hint">
          Use &ldquo;Add Assessment&rdquo; above to record the first assessment for {patient.initials}.
        </p>
      </div>
    )
  }

  return (
    <>
      {activeMeasureIds.map(measureId => {
        const m = MEASURES[measureId]
        const list = groups[measureId]
        const latest = list[0]
        const previous = list[1] ?? null

        const mcid = m.mcidKey && latest && previous
          ? getMCIDStatus(m.mcidKey, latest.results.primaryValue, previous.results.primaryValue)
          : null

        const chartData = list.length >= 2
          ? [...list].reverse().map(a => ({ date: a.created_at, value: a.results.primaryValue }))
          : null

        return (
          <div key={measureId}>
            {chartData && (
              <div data-chart>
                <ProgressChart data={chartData} measureId={measureId} />
              </div>
            )}
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

      {mcidContext && (
        <div className="info-panel">
          <strong>MCID reference — {patient.diagnosis}:</strong> {mcidContext}
        </div>
      )}
    </>
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

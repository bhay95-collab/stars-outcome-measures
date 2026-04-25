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

  const mcidContext = patient.condition ? getMCIDContext(patient.condition) : null

  return (
    <>
      <style jsx>{styles}</style>

      {mwtList.length === 0 ? (
        <div className="empty">
          <p className="empty-title">No assessments recorded</p>
          <p className="empty-hint">
            Use "+ New Assessment" above to record the first 10MWT for {patient.first_name}.
          </p>
        </div>
      ) : (
        <>
          {chartData && (
            <ProgressChart data={chartData} measureId="10MWT" />
          )}
          <div className="cards">
            <MWTCard assessment={latest} mcid={mcid} label="Latest" />
            {previous && (
              <MWTCard assessment={previous} mcid={null} label="Previous" dim />
            )}
          </div>
          {mcidContext && (
            <div className="context-panel">
              <p className="context-label">MCID reference — {patient.condition}</p>
              <p className="context-text">{mcidContext}</p>
            </div>
          )}
        </>
      )}
    </>
  )
}

function MWTCard({ assessment, mcid, label, dim }) {
  const r = assessment.results

  return (
    <>
      <style jsx>{cardStyles}</style>
      <div className={`card${dim ? ' card-dim' : ''}`}>
        <div className="card-header">
          <span className="measure-name">10 Metre Walk Test</span>
          <div className="card-right">
            <span className="card-label">{label}</span>
            <span className="card-date">{fmtDate(assessment.created_at)}</span>
          </div>
        </div>

        <div className="result-row">
          <span className="primary-value">{r.primaryValue.toFixed(2)}</span>
          <span className="primary-unit">m/s</span>
          <span className={`chip ${r.meta?.classColor ?? 'chip-grey'}`}>
            {r.interpretation}
          </span>
        </div>

        {r.meta?.comfortPct != null && (
          <p className="meta-line">{r.meta.comfortPct}% of age/sex predicted</p>
        )}

        {r.meta?.fastSpeed != null && (
          <p className="meta-line">
            Fast: {r.meta.fastSpeed.toFixed(2)} m/s
            {r.meta.fastPct != null && ` — ${r.meta.fastPct}% predicted`}
          </p>
        )}

        {mcid && (
          <div className={`mcid-row ${mcid.meetsThreshold ? 'mcid-met' : mcid.improved ? 'mcid-near' : 'mcid-decline'}`}>
            <span className="mcid-arrow">
              {mcid.improved ? '▲' : '▼'}
            </span>
            {mcid.label}
          </div>
        )}
      </div>
    </>
  )
}

const styles = `
  .empty {
    padding: 16px 0;
    max-width: 400px;
  }

  .empty-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--color-ink);
    margin-bottom: 8px;
  }

  .empty-hint {
    font-size: 13px;
    color: var(--color-muted);
    line-height: 1.6;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 560px;
  }

  .context-panel {
    margin-top: 16px;
    max-width: 560px;
    background: var(--color-primary-soft);
    border: 1px solid var(--color-secondary);
    border-radius: var(--radius-md);
    padding: 12px 16px;
  }

  .context-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--color-primary);
    margin-bottom: 6px;
  }

  .context-text {
    font-size: 12px;
    color: var(--color-muted);
    line-height: 1.6;
  }
`

const cardStyles = `
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 20px 24px;
    box-shadow: var(--shadow-sm);
  }

  .card-dim {
    opacity: 0.65;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .measure-name {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--color-subtle);
  }

  .card-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--color-primary);
    background: var(--color-primary-soft);
    border-radius: 999px;
    padding: 2px 8px;
  }

  .card-date {
    font-size: 12px;
    color: var(--color-muted);
  }

  .result-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 8px;
  }

  .primary-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-ink);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .primary-unit {
    font-size: 14px;
    color: var(--color-muted);
    margin-right: 4px;
  }

  .chip {
    font-size: 12px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 999px;
  }

  .chip-green { background: var(--color-primary-soft); color: var(--color-primary-dark); }
  .chip-amber { background: var(--color-surface-soft); color: var(--color-muted); }
  .chip-red   { background: var(--color-border);       color: var(--color-ink); }
  .chip-grey  { background: var(--color-surface-soft); color: var(--color-subtle); }

  .meta-line {
    font-size: 12px;
    color: var(--color-muted);
    margin-bottom: 3px;
  }

  .mcid-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border);
    font-size: 12px;
    font-weight: 500;
  }

  .mcid-met     { color: var(--color-primary-dark); }
  .mcid-near    { color: var(--color-muted); }
  .mcid-decline { color: var(--color-ink); }

  .mcid-arrow { font-size: 10px; }
`

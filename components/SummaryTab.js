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

  return (
    <>
      <style jsx>{styles}</style>

      {mwtList.length === 0 ? (
        <div className="empty">
          <p className="empty-eyebrow">Clinical Summary</p>
          <p className="empty-title">No assessments recorded</p>
          <p className="empty-hint">
            Use &ldquo;+ New Assessment&rdquo; above to record the first 10MWT for {patient.initials}.
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
              <p className="context-label">MCID reference — {patient.diagnosis}</p>
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
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 32px 28px;
    box-shadow: var(--shadow-sm);
    max-width: 480px;
  }

  .empty-eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--color-subtle);
    margin-bottom: 10px;
  }

  .empty-title {
    font-family: 'Source Serif 4', serif;
    font-size: 20px;
    font-weight: 600;
    color: var(--color-ink);
    margin-bottom: 8px;
    letter-spacing: -0.2px;
  }

  .empty-hint {
    font-size: 13px;
    color: var(--color-muted);
    line-height: 1.6;
  }

  .section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--color-subtle);
    margin-bottom: 12px;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 600px;
    margin-bottom: 20px;
  }

  .context-panel {
    max-width: 600px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 16px 20px;
    box-shadow: var(--shadow-sm);
  }

  .context-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--color-subtle);
    margin-bottom: 8px;
  }

  .context-text {
    font-size: 12px;
    color: var(--color-muted);
    line-height: 1.7;
  }
`

const cardStyles = `
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 20px 24px;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.15s;
  }

  .card:hover { box-shadow: var(--shadow-md); }

  .card-dim { opacity: 0.6; }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .measure-name {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--color-subtle);
  }

  .card-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: var(--color-primary);
    background: var(--color-primary-soft);
    border-radius: 999px;
    padding: 2px 8px;
  }

  .card-date {
    font-size: 12px;
    color: var(--color-subtle);
    font-variant-numeric: tabular-nums;
  }

  .result-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 10px;
  }

  .primary-value {
    font-family: 'Source Serif 4', serif;
    font-size: 32px;
    font-weight: 600;
    color: var(--color-ink);
    line-height: 1;
    letter-spacing: -0.5px;
  }

  .primary-unit {
    font-size: 13px;
    color: var(--color-subtle);
    margin-right: 6px;
  }

  .chip {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 999px;
    border: 1px solid;
  }

  .chip-green { background: #e8f4ef; color: #2d6a4f; border-color: #b7dfc9; }
  .chip-amber { background: #fef3e2; color: #a05c00; border-color: #f5d49a; }
  .chip-red   { background: #fdf0ec; color: #b5451b; border-color: #f0b8a2; }
  .chip-grey  { background: var(--color-surface-soft); color: var(--color-subtle); border-color: var(--color-border); }

  .meta-line {
    font-size: 12px;
    color: var(--color-muted);
    margin-bottom: 3px;
    line-height: 1.5;
  }

  .mcid-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--color-border);
    font-size: 12px;
    font-weight: 500;
    line-height: 1.4;
  }

  .mcid-met     { color: #2d6a4f; }
  .mcid-near    { color: var(--color-muted); }
  .mcid-decline { color: #b5451b; }
  .mcid-arrow   { font-size: 10px; }
`

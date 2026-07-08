import { RTS_CONTINUUM } from '../lib/clinical'

// Return-to-sport readiness dashboard (Module B) — presentational.
// Renders an already-evaluated RTS battery (evaluateRTSBattery output). It shows
// per-criterion status against published thresholds, the RTS continuum context,
// and the predictive-validity caveat. It NEVER renders a "cleared" stamp — the
// decision is the clinician's.

// Criteria the clinician can act on from here (time derives from the index
// date; licence-pending rows are hidden until the instruments are licensed).
const RECORDABLE_KEYS = new Set(['quad', 'hops', 'landing', 'effusion'])

function statusChip(criterion) {
  if (criterion.pending) {
    return <span className="interp-chip chip-grey">Pending licence</span>
  }
  if (!criterion.assessed) {
    return <span className="interp-chip chip-grey">Not assessed</span>
  }
  if (criterion.met === true) {
    return <span className="interp-chip chip-green">Met</span>
  }
  return <span className="interp-chip chip-red">Not met</span>
}

function formatValue(criterion) {
  if (criterion.value === null || criterion.value === undefined) return '—'
  if (criterion.unit) return `${criterion.value}${criterion.unit === '%' ? '%' : ` ${criterion.unit}`}`
  return String(criterion.value)
}

export default function RTSBatteryDashboard({ battery, onRecord }) {
  if (!battery) return null

  // Licence-pending instruments (IKDC, ACL-RSI) are hidden until licensed — no
  // substitute cut-off exists, so an ungradable row only adds noise.
  const visibleCriteria = battery.criteria.filter(c => !c.pending)

  const overallClass = battery.hardCriteriaMet ? 'green' : 'amber'
  const overallLabel = battery.hardCriteriaMet ? 'Objective core criteria met' : 'Criteria outstanding'

  return (
    <section className="summary-card" data-rts-battery="">
      <div className="summary-card__head">
        <div>
          <span className="section-label">Return-to-sport readiness battery</span>
          <p className="acl-meta">{battery.summary}</p>
        </div>
        <span className={`interp-chip chip-${overallClass}`}>{overallLabel}</span>
      </div>

      <table className="data-table">
        <thead>
          <tr><th>Criterion</th><th>Value</th><th>Threshold</th><th>Status</th></tr>
        </thead>
        <tbody>
          {visibleCriteria.map(c => (
            <tr key={c.key}>
              <td>{c.label}</td>
              <td>{formatValue(c)}</td>
              <td className="na-text">{c.threshold}</td>
              <td>
                {statusChip(c)}
                {onRecord && RECORDABLE_KEYS.has(c.key) && c.met !== true && (
                  <button type="button" className="acl-record-btn" onClick={() => onRecord(c.key)}>
                    {c.assessed ? 'Update' : 'Record'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="info-panel">
        <strong>Return-to-sport continuum (Bern 2016):</strong>{' '}
        {RTS_CONTINUUM.map((stage, i) => (
          <span key={stage.key}>
            {i > 0 ? ' → ' : ''}{stage.label} <span className="na-text">({stage.note})</span>
          </span>
        ))}
      </div>

      <div className="info-panel">
        <strong>Important:</strong> {battery.caveat}
      </div>
    </section>
  )
}

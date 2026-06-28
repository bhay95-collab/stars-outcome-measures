import { useState } from 'react'
import { calcLESS, LESS_MAX_ERRORS } from '../lib/clinical'

// Landing Error Scoring System — clinician-rated jump-landing screen.
// Enter the total error count (0–17) from the drop-vertical-jump rating.
export default function FormLESS({ onSubmit, loading }) {
  const [errors, setErrors] = useState('')

  const n = errors === '' ? NaN : Number(errors)
  const preview = Number.isInteger(n) ? calcLESS({ errors: n }) : null

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ errors: n }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr><th>Item</th><th>Value</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Total landing errors (0–{LESS_MAX_ERRORS})</td>
            <td>
              <input className="field-input" type="number" min="0" max={LESS_MAX_ERRORS} step="1"
                value={errors} onChange={e => setErrors(e.target.value)} required />
            </td>
          </tr>
          <tr>
            <td><strong>LESS score</strong></td>
            <td><strong>{preview ? `${preview.primaryValue}/17` : '—'}</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>LESS (Padua 2009):</strong> a clinician scores a drop-vertical-jump
        landing for movement errors across 17 items — higher = worse mechanics.
        LESS &lt; 5 = good landing mechanics in the return-to-sport screen
        (Grindem 2016). A supportive criterion, not a stand-alone clearance.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Landing Error Scoring System</span>
              <div><strong>{preview.primaryValue}/17</strong> errors</div>
            </div>
            <span className={`interp-chip chip-${preview.meta.classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Enter the total error count (whole number 0–17).</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

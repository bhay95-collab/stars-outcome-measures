import { useState } from 'react'
import { calcTUG } from '../lib/clinical'

export default function FormTUG({ onSubmit, loading }) {
  const [time, setTime] = useState('')

  const t = parseFloat(time)
  const preview = t > 0 ? calcTUG({ time: t }) : null
  const classColor = preview?.meta?.classColor ?? 'grey'

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ time: t }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Trial</th>
            <th>Time (sec)</th>
            <th>Classification</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>TUG</strong></td>
            <td>
              <input
                className="input-narrow"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="sec"
                value={time}
                onChange={e => setTime(e.target.value)}
                required
              />
            </td>
            <td>
              {preview ? (
                <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
              ) : (
                <span className="na-text">Enter time</span>
              )}
            </td>
            <td className="ref-note">Fall risk ≥13.5 s · MCID 2.0 s</td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>Classification (Bohannon 2006):</strong>{' '}
        &lt;10 s = Normal · 10–19 s = Mild impairment · 20–29 s = Moderate · ≥30 s = Severe.
        Fall risk threshold ≥13.5 s (Shumway-Cook 2000).
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Timed Up and Go</span>
              <div>
                <strong>{t.toFixed(2)}</strong>{' '}<span>sec</span>
                {preview.meta?.fallRisk && (
                  <>{' '}<span className="na-text">⚠ Fall risk</span></>
                )}
              </div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Enter TUG time to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

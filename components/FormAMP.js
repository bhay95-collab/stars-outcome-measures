import { useState } from 'react'
import { calcAMP } from '../lib/clinical'

export default function FormAMP({ onSubmit, loading }) {
  const [mode, setMode]   = useState('')
  const [score, setScore] = useState('')

  const scoreNum   = score === '' ? NaN : Number(score)
  const preview    = mode && !isNaN(scoreNum) ? calcAMP({ mode, score: scoreNum }) : null
  const classColor = preview?.meta?.classColor ?? 'grey'

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ mode, score: scoreNum }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Administration mode</td>
            <td>
              <select
                className="field-input"
                value={mode}
                onChange={e => setMode(e.target.value)}
                required
              >
                <option value="">— Select —</option>
                <option value="pro">With prosthesis (AMP-PRO)</option>
                <option value="nopro">Without prosthesis (AMP-noPRO)</option>
              </select>
            </td>
          </tr>
          <tr>
            <td>Total score (0–47)</td>
            <td>
              <input
                className="field-input input-narrow"
                type="number"
                min="0"
                max="47"
                step="1"
                placeholder="0–47"
                value={score}
                onChange={e => setScore(e.target.value)}
                required
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>K-level thresholds (Kegel 2001):</strong>{' '}
        K3–K4 = Community ambulator · K2 = Limited community · K1 = Household · K0 = Limited/no ambulation.
        No established MCID. ICC interrater = 0.99.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">AMP Score</span>
              <div><strong>{scoreNum}</strong><span> / 47</span></div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Select mode and enter score to calculate K-level.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

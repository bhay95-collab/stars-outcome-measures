import { useState } from 'react'
import { calcTIS } from '../lib/clinical'

export default function FormTIS({ onSubmit, loading }) {
  const [staticScore, setStaticScore]             = useState('')
  const [dynamicScore, setDynamicScore]           = useState('')
  const [coordinationScore, setCoordinationScore] = useState('')

  const s = staticScore       === '' ? NaN : Number(staticScore)
  const d = dynamicScore      === '' ? NaN : Number(dynamicScore)
  const c = coordinationScore === '' ? NaN : Number(coordinationScore)

  const allFilled  = !isNaN(s) && !isNaN(d) && !isNaN(c)
  const preview    = allFilled ? calcTIS({ staticScore: s, dynamicScore: d, coordinationScore: c }) : null
  const classColor = preview?.meta?.classColor ?? 'grey'
  const total      = allFilled ? s + d + c : null

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ staticScore: s, dynamicScore: d, coordinationScore: c }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Subscale</th>
            <th>Score</th>
            <th>Range</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Static balance</td>
            <td>
              <input
                className="input-narrow"
                type="number"
                min="0"
                max="7"
                step="1"
                placeholder="0–7"
                value={staticScore}
                onChange={e => setStaticScore(e.target.value)}
                required
              />
            </td>
            <td className="na-text">0–7</td>
          </tr>
          <tr>
            <td>Dynamic balance</td>
            <td>
              <input
                className="input-narrow"
                type="number"
                min="0"
                max="10"
                step="1"
                placeholder="0–10"
                value={dynamicScore}
                onChange={e => setDynamicScore(e.target.value)}
                required
              />
            </td>
            <td className="na-text">0–10</td>
          </tr>
          <tr>
            <td>Coordination</td>
            <td>
              <input
                className="input-narrow"
                type="number"
                min="0"
                max="6"
                step="1"
                placeholder="0–6"
                value={coordinationScore}
                onChange={e => setCoordinationScore(e.target.value)}
                required
              />
            </td>
            <td className="na-text">0–6</td>
          </tr>
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>{total !== null ? total : '—'}</strong></td>
            <td className="na-text">/ 23</td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>TIS (Verheyden 2004):</strong>{' '}
        17-item assessment collapsed into 3 subscales. ≥18 = Good trunk control ·
        12–17 = Moderate impairment · &lt;12 = Severe impairment.
        MCID = 3 pts. Patient seated edge of bed/plinth, thighs supported, feet flat, arms on lap.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">TIS Total Score</span>
              <div><strong>{total}</strong><span> / 23</span></div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Enter all three subscale scores to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

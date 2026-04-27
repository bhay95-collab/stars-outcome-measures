import { useState } from 'react'
import { calcBOOMER, BOOMER_ITEMS } from '../lib/clinical'

const EMPTY_ITEMS = Array(4).fill('')

export default function FormBOOMER({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores     = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled  = scores.every(s => !isNaN(s))
  const preview    = allFilled ? calcBOOMER({ items: scores }) : null
  const classColor = preview?.meta?.classColor ?? 'grey'

  function setItem(index, value) {
    setItems(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ items: scores }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Score (0–4)</th>
            <th>Scoring criteria</th>
          </tr>
        </thead>
        <tbody>
          {BOOMER_ITEMS.map((item, i) => (
            <tr key={i}>
              <td>
                <strong>{item.label}</strong>
                <br />
                <span className="na-text">{item.note}</span>
              </td>
              <td>
                <select
                  className="field-input input-narrow"
                  value={items[i]}
                  onChange={e => setItem(i, e.target.value)}
                  required
                >
                  <option value="">—</option>
                  {[0, 1, 2, 3, 4].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </td>
              <td className="na-text">
                {item.criteria.map((c, j) => (
                  <span key={j} style={{ display: 'block' }}>{j} = {c}</span>
                ))}
              </td>
            </tr>
          ))}
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>{allFilled ? scores.reduce((a, b) => a + b, 0) : '—'}</strong></td>
            <td className="na-text">/ 16</td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>BOOMER (Kuys &amp; Brauer 2006):</strong>{' '}
        4-component composite balance measure for elder rehabilitation. Each component 0–4.
        ≥12 = Good balance · 6–11 = Moderate deficit · &lt;6 = Significant impairment ·
        &lt;4 predicts RACF discharge. MCID = 2 pts.
        Note: TUG and Step Test components should be scored consistently with those assessments above.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">BOOMER Total Score</span>
              <div><strong>{preview.primaryValue}</strong><span> / 16</span></div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Complete all 4 components to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

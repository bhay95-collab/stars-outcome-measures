import { useState } from 'react'
import { calcABC, ABC_ITEMS } from '../lib/clinical'

const EMPTY_ITEMS = Array(16).fill('')

export default function FormABC({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores    = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled = scores.every(s => !isNaN(s))
  const preview   = allFilled ? calcABC({ items: scores }) : null
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
            <th>#</th>
            <th>Activity</th>
            <th>Confidence (%)</th>
          </tr>
        </thead>
        <tbody>
          {ABC_ITEMS.map((item, i) => (
            <tr key={i}>
              <td className="na-text">{i + 1}</td>
              <td>{item.label}</td>
              <td>
                <input
                  className="input-narrow"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="0–100"
                  value={items[i]}
                  onChange={e => setItem(i, e.target.value)}
                  required
                />
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={2}><strong>Mean confidence</strong></td>
            <td><strong>{preview ? `${preview.primaryValue}%` : '—'}</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>ABC Scale (Powell &amp; Myers 1995):</strong>{' '}
        Rate confidence 0–100% for each activity. &gt;80% = High functioning (lower fall risk) ·
        67–80% = Moderate · 50–66% = Moderate–low (elevated fall risk) · &lt;50% = High fall risk.
        MCID = 18.1%. MDC ≈ 15%.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">ABC Scale</span>
              <div>Mean: <strong>{preview.primaryValue}%</strong></div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Complete all 16 items to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

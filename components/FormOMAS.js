import { useState } from 'react'
import { calcOMAS, OMAS_ITEMS } from '../lib/clinical'

const EMPTY_ITEMS = Array(OMAS_ITEMS.length).fill('')

export default function FormOMAS({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores    = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled = scores.every(s => !isNaN(s))
  const preview   = allFilled ? calcOMAS({ items: scores }) : null

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
            <th>Item</th>
            <th>Response</th>
          </tr>
        </thead>
        <tbody>
          {OMAS_ITEMS.map((item, i) => (
            <tr key={item.key}>
              <td className="na-text">{i + 1}</td>
              <td>{item.label}</td>
              <td>
                <select
                  className="field-input"
                  value={items[i]}
                  onChange={e => setItem(i, e.target.value)}
                  required
                >
                  <option value="">—</option>
                  {item.options.map((opt, optIndex) => (
                    <option key={optIndex} value={opt.value}>{opt.label} ({opt.value})</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={2}><strong>Total</strong></td>
            <td><strong>{preview ? `${preview.primaryValue}/100` : '—'}</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>OMAS (Olerud &amp; Molander 1984):</strong>{' '}
        9 weighted items, total /100, higher = better recovery after ankle
        fracture. Bands: poor ≤30 · fair 31–60 · good 61–90 · excellent 91–100.
        Anchored MCID ≈12.5 pts (Lehnert 2022); change &lt;~5 pts is within
        measurement error.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Olerud–Molander Ankle Score</span>
              <div>Total: <strong>{preview.primaryValue}/100</strong></div>
            </div>
            <span className={`interp-chip chip-${preview.meta.classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Complete all 9 items to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

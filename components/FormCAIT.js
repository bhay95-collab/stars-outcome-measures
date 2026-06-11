import { useState } from 'react'
import { calcCAIT, CAIT_ITEMS } from '../lib/clinical'

const EMPTY_ITEMS = Array(CAIT_ITEMS.length).fill('')

export default function FormCAIT({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores    = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled = scores.every(s => !isNaN(s))
  const preview   = allFilled ? calcCAIT({ items: scores }) : null

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
            <th>Statement (score the affected ankle)</th>
            <th>Response</th>
          </tr>
        </thead>
        <tbody>
          {CAIT_ITEMS.map((item, i) => (
            <tr key={i}>
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
            <td><strong>{preview ? `${preview.primaryValue}/30` : '—'}</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>CAIT (Hiller 2006):</strong>{' '}
        9 items, total /30, higher = more stable. Functional ankle instability:
        ≤27 (Hiller cut-off) or ≤25 (Wright 2014 recalibration). Score one ankle
        per assessment; change of ~3 points exceeds measurement error.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Cumberland Ankle Instability Tool</span>
              <div>Total: <strong>{preview.primaryValue}/30</strong></div>
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

import { useState } from 'react'
import { calcPASS, PASS_ITEMS } from '../lib/clinical'

const EMPTY_ITEMS = Array(12).fill('')

export default function FormPASS({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores    = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled = scores.every(s => !isNaN(s))
  const preview   = allFilled ? calcPASS({ items: scores }) : null
  const classColor = preview?.meta?.classColor ?? 'grey'
  const total     = allFilled ? scores.reduce((sum, s) => sum + s, 0) : null

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
            <th>Score (0–3)</th>
          </tr>
        </thead>
        <tbody>
          {PASS_ITEMS.map((item, i) => (
            <tr key={i}>
              <td className="na-text">{i + 1}</td>
              <td>{item.label}</td>
              <td>
                <select
                  className="field-input input-narrow"
                  value={items[i]}
                  onChange={e => setItem(i, e.target.value)}
                  required
                >
                  <option value="">—</option>
                  {item.options.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={2}><strong>Total</strong></td>
            <td><strong>{total !== null ? `${total} / 36` : '—'}</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>PASS (Benaim 1999):</strong>{' '}
        ≥30 = Good postural control · 18–29 = Moderate impairment · 9–17 = ADL independence likely at 6 months if ≥9 at 2 weeks · &lt;9 = Significant impairment.
        MCID = 3 pts.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">PASS</span>
              <div><strong>{total}</strong><span> / 36</span></div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Complete all 12 items to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

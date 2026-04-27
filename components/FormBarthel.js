import { useState } from 'react'
import { calcBarthel, BARTHEL_ITEMS } from '../lib/clinical'

const EMPTY_ITEMS = Array(10).fill('')

export default function FormBarthel({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled = scores.every(s => !isNaN(s))
  const preview = allFilled ? calcBarthel({ items: scores }) : null
  const classColor = preview?.meta?.classColor ?? 'grey'
  const total = allFilled ? scores.reduce((sum, s) => sum + s, 0) : null

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
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {BARTHEL_ITEMS.map((item, i) => (
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
            <td><strong>{total !== null ? `${total} / 100` : '—'}</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>Barthel Index (Mahoney &amp; Barthel 1965):</strong>{' '}
        85–100 = Independent · 60–84 = Minimal dependence · 40–59 = Partial · 20–39 = High dependence · &lt;20 = Total dependence.
        MCID = 8 pts.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Barthel Index</span>
              <div><strong>{total}</strong><span> / 100</span></div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Complete all 10 items to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

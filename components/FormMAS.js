import { useState } from 'react'
import { calcMAS, MAS_ITEMS } from '../lib/clinical'

const EMPTY_ITEMS = Array(8).fill('')

export default function FormMAS({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores     = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled  = scores.every(s => !isNaN(s))
  const preview    = allFilled ? calcMAS({ items: scores }) : null
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
            <th>Item</th>
            <th>Score (0–6)</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {MAS_ITEMS.map((item, i) => (
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
                  {[0, 1, 2, 3, 4, 5, 6].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </td>
              <td className="na-text">{item.note}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={2}><strong>Total</strong></td>
            <td><strong>{allFilled ? scores.reduce((a, b) => a + b, 0) : '—'}</strong></td>
            <td className="na-text">/ 48</td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>MAS (Carr &amp; Shepherd 1985):</strong>{' '}
        8 items, each 0–6 (hierarchical). 0 = cannot attempt · 6 = optimal motor performance.
        Best of 3 attempts per item. ≥36 = Good motor function ·
        20–35 = Moderate impairment · &lt;20 = Significant impairment. MDC95 ≥ 2 pts.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">MAS Total Score</span>
              <div><strong>{preview.primaryValue}</strong><span> / 48</span></div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Complete all 8 items to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

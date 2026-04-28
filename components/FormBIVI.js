import { useState } from 'react'
import { calcBIVI, BIVI_ITEMS } from '../lib/clinical'

const EMPTY_ITEMS = Array(15).fill('')

const LIKERT_OPTS = [
  { v: 0, t: '0 — Not at all' },
  { v: 1, t: '1 — A little' },
  { v: 2, t: '2 — Quite a lot' },
  { v: 3, t: '3 — A great deal' },
]

export default function FormBIVI({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores     = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled  = scores.every(s => !isNaN(s))
  const preview    = allFilled ? calcBIVI({ items: scores }) : null
  const classColor = preview?.meta?.classColor ?? 'grey'
  const total      = allFilled ? scores.reduce((s, v) => s + v, 0) : null

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
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {BIVI_ITEMS.map((item, i) => (
            <tr key={i}>
              <td className="na-text">{i + 1}</td>
              <td>{item}</td>
              <td>
                <select
                  className="field-input input-narrow"
                  value={items[i]}
                  onChange={e => setItem(i, e.target.value)}
                  required
                >
                  <option value="">—</option>
                  {LIKERT_OPTS.map(o => (
                    <option key={o.v} value={o.v}>{o.t}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={2}><strong>Total</strong></td>
            <td><strong>{total !== null ? `${total} / 45` : '—'}</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>BIVI (Hepworth 2019):</strong>{' '}
        15-item patient-reported outcome. Range 0–45; higher score = greater vision impact on daily life.
        0–10 = Low impact · 11–25 = Moderate impact · &gt;25 = High impact.
        MCID not yet established.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">BIVI Total</span>
              <div><strong>{total}</strong><span> / 45</span></div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Rate all 15 items to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

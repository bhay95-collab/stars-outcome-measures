import { useState } from 'react'
import { calcRPQ, RPQ_ITEMS } from '../lib/clinical'

const EMPTY_ITEMS = Array(16).fill('')

const LIKERT_OPTS = [
  { v: 0, t: '0 — Not experienced at all' },
  { v: 1, t: '1 — No more of a problem' },
  { v: 2, t: '2 — Mild problem' },
  { v: 3, t: '3 — Moderate problem' },
  { v: 4, t: '4 — Severe problem' },
]

export default function FormRPQ({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores     = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled  = scores.every(s => !isNaN(s))
  const preview    = allFilled ? calcRPQ({ items: scores }) : null
  const classColor = preview?.meta?.classColor ?? 'grey'

  const rpq3Score  = allFilled ? scores.slice(0, 3).reduce((s, v) => s + v, 0) : null
  const rpq13Score = allFilled ? scores.slice(3).reduce((s, v) => s + v, 0) : null

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

  function renderSection(label, itemList, startIndex) {
    return (
      <>
        <tr>
          <td colSpan={3} style={{ paddingTop: '12px' }}>
            <strong>{label}</strong>
          </td>
        </tr>
        {itemList.map((item, i) => {
          const idx = startIndex + i
          return (
            <tr key={idx}>
              <td className="na-text">{idx + 1}</td>
              <td>{item}</td>
              <td>
                <select
                  className="field-input input-narrow"
                  value={items[idx]}
                  onChange={e => setItem(idx, e.target.value)}
                  required
                >
                  <option value="">—</option>
                  {LIKERT_OPTS.map(o => (
                    <option key={o.v} value={o.v}>{o.t}</option>
                  ))}
                </select>
              </td>
            </tr>
          )
        })}
      </>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Symptom</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {renderSection('RPQ-3 — Early symptoms', RPQ_ITEMS.rpq3, 0)}
          <tr>
            <td colSpan={2}><strong>RPQ-3 subtotal</strong></td>
            <td><strong>{rpq3Score !== null ? `${rpq3Score} / 12` : '—'}</strong></td>
          </tr>
          {renderSection('RPQ-13 — Late symptoms', RPQ_ITEMS.rpq13, 3)}
          <tr>
            <td colSpan={2}><strong>RPQ-13 subtotal</strong></td>
            <td><strong>{rpq13Score !== null ? `${rpq13Score} / 52` : '—'}</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>RPQ (King 1995):</strong>{' '}
        RPQ-3 (headaches, dizziness, nausea) max 12 · RPQ-13 (late symptoms) max 52 · Total max 64.
        PCS indicator: &gt;3 symptoms rated ≥ moderate at 3+ months post-injury.
        0 = Not experienced · 1 = No more a problem · 2 = Mild · 3 = Moderate · 4 = Severe.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">RPQ Total</span>
              <div><strong>{preview.primaryValue}</strong><span> / 64</span></div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Rate all 16 symptoms to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

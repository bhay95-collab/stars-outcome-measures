import { useState } from 'react'
import { calcFSS, FSS_ITEMS } from '../lib/clinical'

const EMPTY_ITEMS = Array(9).fill('')

export default function FormFSS({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled = scores.every(s => !isNaN(s))
  const preview = allFilled ? calcFSS({ items: scores }) : null
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
            <th>Statement</th>
            <th>Score (1–7)</th>
          </tr>
        </thead>
        <tbody>
          {FSS_ITEMS.map((item, i) => (
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
                  {[1, 2, 3, 4, 5, 6, 7].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={2}><strong>Total · Mean</strong></td>
            <td>
              <strong>
                {allFilled
                  ? `${scores.reduce((s, v) => s + v, 0)} · ${(scores.reduce((s, v) => s + v, 0) / 9).toFixed(1)}`
                  : '—'}
              </strong>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>Scoring (Krupp 1989):</strong>{' '}
        1 = strongly disagree · 7 = strongly agree. Mean ≥4 (total ≥36) = clinically significant fatigue.
        MCID ≈1.9 on mean scale; MDC 1.55 (MS).
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Fatigue Severity Scale</span>
              <div>
                <strong>{preview.primaryValue}</strong><span> / 63</span>
                {' '}<span className="na-text">(mean {preview.meta.mean})</span>
              </div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
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

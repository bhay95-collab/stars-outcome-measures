import { useState } from 'react'
import { calcHADS, HADS_ITEMS } from '../lib/clinical'

const EMPTY_ITEMS = Array(14).fill('')

export default function FormHADS({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled = scores.every(s => !isNaN(s))
  const preview = allFilled ? calcHADS({ items: scores }) : null

  const anxietyColor    = preview?.meta?.classColor ?? 'grey'
  const depressionColor = preview?.meta?.depressionColor ?? 'grey'

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
            <th>Sub</th>
            <th>Item</th>
            <th>Score (0–3)</th>
          </tr>
        </thead>
        <tbody>
          {HADS_ITEMS.map((item, i) => (
            <tr key={i}>
              <td className="na-text">{i + 1}</td>
              <td className="na-text">{item.subscale}</td>
              <td>{item.text}</td>
              <td>
                <select
                  className="field-input input-narrow"
                  value={items[i]}
                  onChange={e => setItem(i, e.target.value)}
                  required
                >
                  <option value="">—</option>
                  {[0, 1, 2, 3].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="info-panel">
        <strong>Scoring (Zigmond &amp; Snaith 1983):</strong>{' '}
        0–7 = Normal · 8–10 = Borderline · 11–21 = Probable case.
        MCID ≈1.5 pts per subscale. A = Anxiety items (odd); D = Depression items (even).
      </div>

      <div className="result-box">
        {preview ? (
          <>
            <div className="result-row">
              <div>
                <span className="result-label">Anxiety (A)</span>
                <div><strong>{preview.primaryValue}</strong><span> / 21</span></div>
              </div>
              <span className={`interp-chip chip-${anxietyColor}`}>{preview.interpretation}</span>
            </div>
            <div className="result-row">
              <div>
                <span className="result-label">Depression (D)</span>
                <div><strong>{preview.meta.depressionScore}</strong><span> / 21</span></div>
              </div>
              <span className={`interp-chip chip-${depressionColor}`}>{preview.meta.depressionClassification}</span>
            </div>
          </>
        ) : (
          <em>Complete all 14 items to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

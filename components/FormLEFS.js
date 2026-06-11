import { useState } from 'react'
import { calcLEFS, LEFS_ITEMS, LEFS_OPTIONS } from '../lib/clinical'

const EMPTY_ITEMS = Array(20).fill('')

export default function FormLEFS({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores    = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled = scores.every(s => !isNaN(s))
  const preview   = allFilled ? calcLEFS({ items: scores }) : null

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
            <th>Today, do you or would you have any difficulty with…</th>
            <th>Response</th>
          </tr>
        </thead>
        <tbody>
          {LEFS_ITEMS.map((item, i) => (
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
                  {LEFS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={2}><strong>Total</strong></td>
            <td><strong>{preview ? `${preview.primaryValue}/80` : '—'}</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>LEFS (Binkley 1999):</strong>{' '}
        20 items, each 0 (extreme difficulty or unable) to 4 (no difficulty); total /80,
        higher = better function. MCID and MDC90 = 9 points; change of 9 = small,
        12 = moderate, 16 = large. Healthy adults score near 80.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Lower Extremity Functional Scale</span>
              <div>Total: <strong>{preview.primaryValue}/80</strong></div>
            </div>
            <span className={`interp-chip chip-${preview.meta.classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Complete all 20 items to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

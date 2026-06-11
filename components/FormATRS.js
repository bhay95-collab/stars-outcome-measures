import { useState } from 'react'
import { calcATRS, ATRS_ITEMS, ATRS_OPTIONS } from '../lib/clinical'

const EMPTY_ITEMS = Array(ATRS_ITEMS.length).fill('')

export default function FormATRS({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores    = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled = scores.every(s => !isNaN(s))
  const preview   = allFilled ? calcATRS({ items: scores }) : null

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
            <th>Limitation due to your injured Achilles tendon</th>
            <th>Response (0 very limited – 10 none)</th>
          </tr>
        </thead>
        <tbody>
          {ATRS_ITEMS.map((label, i) => (
            <tr key={i}>
              <td className="na-text">{i + 1}</td>
              <td>{label}</td>
              <td>
                <select
                  className="field-input input-narrow"
                  value={items[i]}
                  onChange={e => setItem(i, e.target.value)}
                  required
                >
                  <option value="">—</option>
                  {ATRS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
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
        <strong>ATRS (Nilsson-Helander 2007):</strong>{' '}
        10 items, each 0 (very limited) to 10 (no limitation); total /100,
        higher = better Achilles function. No formal severity bands — track the
        score and change over time (MDC ≈7–18 points across studies).
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Achilles Tendon Total Rupture Score</span>
              <div>Total: <strong>{preview.primaryValue}/100</strong></div>
            </div>
            <span className={`interp-chip chip-${preview.meta.classColor}`}>{preview.interpretation}</span>
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

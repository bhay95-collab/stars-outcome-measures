import { useState } from 'react'
import { calcBPFS, BPFS_ITEMS, BPFS_OPTIONS } from '../lib/clinical'

const EMPTY_ITEMS = Array(12).fill('')

export default function FormBPFS({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores    = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled = scores.every(s => !isNaN(s))
  const preview   = allFilled ? calcBPFS({ items: scores }) : null

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
            <th>Because of your back, do you have any difficulty with…</th>
            <th>Response</th>
          </tr>
        </thead>
        <tbody>
          {BPFS_ITEMS.map((item, i) => (
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
                  {BPFS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={2}><strong>Total</strong></td>
            <td><strong>{preview ? `${preview.primaryValue}/60` : '—'}</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>BPFS (Stratford 2000):</strong>{' '}
        12 items, each 0 (unable) to 5 (no difficulty); total /60, higher = better function.
        Change ≥6.5 points exceeds measurement error (MDC90); a formal MCID has not been
        established for this scale.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Back Pain Functional Scale</span>
              <div>Total: <strong>{preview.primaryValue}/60</strong></div>
            </div>
            <span className={`interp-chip chip-${preview.meta.classColor}`}>{preview.interpretation}</span>
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

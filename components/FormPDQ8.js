import { useState } from 'react'
import { calcPDQ8, PDQ8_ITEMS, PDQ8_OPTIONS } from '../lib/clinical'

const EMPTY_ITEMS = Array(8).fill('')

export default function FormPDQ8({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores    = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled = scores.every(s => !isNaN(s))
  const preview   = allFilled ? calcPDQ8({ items: scores }) : null
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
            <th>In the past month, how often have you…</th>
            <th>Response</th>
          </tr>
        </thead>
        <tbody>
          {PDQ8_ITEMS.map((item, i) => (
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
                  {PDQ8_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={2}><strong>Summary Index (SI)</strong></td>
            <td><strong>{preview ? `${preview.primaryValue} SI` : '—'}</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>PDQ-8 (Jenkinson 1997):</strong>{' '}
        SI = (sum / 32) × 100. ≤20 = Mild impact · 21–40 = Moderate · 41–60 = Significant · &gt;60 = Severe impact on quality of life.
        MCID = 6.5 pts SI.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">PDQ-8</span>
              <div>SI: <strong>{preview.primaryValue}</strong></div>
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

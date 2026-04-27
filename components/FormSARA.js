import { useState } from 'react'
import { calcSARA, SARA_ITEMS } from '../lib/clinical'

const EMPTY_ITEMS = Array(8).fill('')

export default function FormSARA({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores    = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled = scores.every(s => !isNaN(s))
  const preview   = allFilled ? calcSARA({ items: scores }) : null
  const classColor = preview?.meta?.classColor ?? 'grey'
  const total     = allFilled ? scores.reduce((sum, s) => sum + s, 0) : null

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
            <th>Domain</th>
            <th>Score</th>
            <th>Max</th>
          </tr>
        </thead>
        <tbody>
          {SARA_ITEMS.map((item, i) => (
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
              <td className="na-text">{item.options[item.options.length - 1]}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={2}><strong>Total</strong></td>
            <td><strong>{total !== null ? total : '—'}</strong></td>
            <td className="na-text">/ 40</td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>SARA (Schmitz-Hübsch 2006):</strong>{' '}
        0 = No ataxia · 1–10 = Mild · 11–20 = Moderate · &gt;20 = Severe.
        MDC &lt;3.5 pts. MCID = 2.3 pts. Score &gt;10 = moderate, &gt;20 = severe.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">SARA</span>
              <div><strong>{total}</strong><span> / 40</span></div>
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

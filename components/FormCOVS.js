import { useState } from 'react'
import { calcCOVS, COVS_ITEMS } from '../lib/clinical'

const EMPTY_ITEMS = Array(13).fill('')

export default function FormCOVS({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores     = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled  = scores.every(s => !isNaN(s))
  const preview    = allFilled ? calcCOVS({ items: scores }) : null
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
      <div className="info-panel" style={{ marginBottom: 0 }}>
        <strong>Scoring (all items):</strong>{' '}
        1 = Fully dependent · 2 = Max assist · 3 = Mod assist · 4 = Min assist/supervision ·
        5 = Modified independence (aid/device) · 6 = Modified independence (time/safety) · 7 = Normal independent function
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th>Score (1–7)</th>
          </tr>
        </thead>
        <tbody>
          {COVS_ITEMS.map((item, i) => (
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
                  {[1, 2, 3, 4, 5, 6, 7].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={2}><strong>Total</strong></td>
            <td><strong>{allFilled ? scores.reduce((a, b) => a + b, 0) : '—'}</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>COVS (Seaby &amp; Torrance 1989):</strong>{' '}
        Range 13–91. MDC ≈ 4 pts. MCID = 6 pts. ICC &gt;0.97. Mean admission stroke ≈50/91;
        mean discharge stroke ≈67/91. Score ≥68 associated with discharge home.
        Strong correlation with FIM (ρ=0.82) and BBS (ρ=0.895).
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">COVS Total Score</span>
              <div><strong>{preview.primaryValue}</strong><span> / 91</span></div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Complete all 13 items to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

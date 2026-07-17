import { useState } from 'react'
import { calcCSI, CSI_ITEMS, CSI_RESPONSE_OPTIONS, CSI_PART_B_ITEMS } from '../lib/clinical'

const EMPTY_ITEMS = Array(CSI_ITEMS.length).fill('')
const EMPTY_PART_B = Array(CSI_PART_B_ITEMS.length).fill(false)

export default function FormCSI({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)
  const [partB, setPartB] = useState(EMPTY_PART_B)

  const scores    = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled = scores.every(s => !isNaN(s))
  const preview   = allFilled ? calcCSI({ items: scores, partB }) : null

  function setItem(index, value) {
    setItems(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function togglePartB(index) {
    setPartB(prev => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ items: scores, partB }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Statement (Never – Always)</th>
            <th>Response</th>
          </tr>
        </thead>
        <tbody>
          {CSI_ITEMS.map((label, i) => (
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
                  {CSI_RESPONSE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="info-panel">
        <strong>Part B — diagnosis history (Neblett 2018):</strong>{' '}
        Informational only — not scored, not added to the total. Tick any diagnosis
        the patient has previously received.
      </div>

      <div className="csi-part-b">
        {CSI_PART_B_ITEMS.map((label, i) => (
          <label key={label}>
            <input type="checkbox" checked={partB[i]} onChange={() => togglePartB(i)} />
            {label}
          </label>
        ))}
      </div>

      <div className="info-panel">
        <strong>CSI (Mayer 2012; Neblett 2013):</strong>{' '}
        25 items, 0–100, higher = worse. Severity bands: subclinical 0–29 / mild 30–39 /
        moderate 40–49 / severe 50–59 / extreme 60–100. A score ≥40 is the published
        cutoff for central sensitization. No MCID or MDC has been established for this
        measure — change is reported as a raw point difference only.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Central Sensitization Inventory</span>
              <div>Score: <strong>{preview.primaryValue}/100</strong></div>
            </div>
            <span className={`interp-chip chip-${preview.meta.classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Complete all 25 items to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

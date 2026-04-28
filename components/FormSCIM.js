import { useState } from 'react'
import { calcSCIM, SCIM_ITEMS, MCID_VALS } from '../lib/clinical'

const EMPTY_ITEMS = Array(19).fill('')

const SC_ITEMS  = SCIM_ITEMS.filter(it => it.sub === 'sc')
const RS_ITEMS  = SCIM_ITEMS.filter(it => it.sub === 'rs')
const MOB_ITEMS = SCIM_ITEMS.filter(it => it.sub === 'mob')

function globalIndex(item) {
  return SCIM_ITEMS.indexOf(item)
}

export default function FormSCIM({ onSubmit, loading }) {
  const [items, setItems]    = useState(EMPTY_ITEMS)
  const [prevScore, setPrev] = useState('')

  const scores     = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled  = scores.every(s => !isNaN(s))
  const preview    = allFilled ? calcSCIM({ items: scores }) : null
  const classColor = preview?.meta?.classColor ?? 'grey'

  const mcidThresh = MCID_VALS['scim']?.thresh
  const prevNum    = prevScore === '' ? NaN : Number(prevScore)
  const delta      = preview && !isNaN(prevNum) ? preview.primaryValue - prevNum : null
  const mcidMet    = delta !== null && mcidThresh != null ? Math.abs(delta) >= mcidThresh : null

  const scTotal  = preview?.meta?.sc  ?? null
  const rsTotal  = preview?.meta?.rs  ?? null
  const mobTotal = preview?.meta?.mob ?? null

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

  function renderSection(title, sectionItems, subTotal, subMax) {
    return (
      <>
        <tr>
          <td colSpan={3} style={{ paddingTop: '14px', paddingBottom: '2px' }}>
            <strong>{title}</strong>
          </td>
        </tr>
        {sectionItems.map(item => {
          const idx = globalIndex(item)
          return (
            <tr key={idx}>
              <td>{item.label}</td>
              <td className="na-text">/{item.max}</td>
              <td>
                <select
                  className="field-input input-narrow"
                  value={items[idx]}
                  onChange={e => setItem(idx, e.target.value)}
                  required
                >
                  <option value="">—</option>
                  {item.opts.map(o => (
                    <option key={o.v} value={o.v}>{o.t}</option>
                  ))}
                </select>
              </td>
            </tr>
          )
        })}
        <tr>
          <td><strong>Subtotal</strong></td>
          <td className="na-text">/{subMax}</td>
          <td><strong>{subTotal !== null ? subTotal : '—'}</strong></td>
        </tr>
      </>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Max</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {renderSection('Self-care', SC_ITEMS, scTotal, 20)}
          {renderSection('Respiration & Sphincters', RS_ITEMS, rsTotal, 36)}
          {renderSection('Mobility', MOB_ITEMS, mobTotal, 40)}
          <tr>
            <td><strong>Total</strong></td>
            <td className="na-text">/100</td>
            <td><strong>{preview ? preview.primaryValue : '—'}</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>SCIM-III (Itzkovich 2007):</strong>{' '}
        Self-care /20 · Respiration &amp; Sphincters /36 · Mobility /40.
        MCID ≈ 5 pts. ≥80 = High independence · 50–79 = Moderate dependence · 20–49 = Significant dependence · &lt;20 = Severe dependence.
      </div>

      {preview && (
        <div className="info-panel" style={{ marginTop: 0 }}>
          <strong>MCID tracker</strong> — previous score:
          <input
            className="field-input input-narrow"
            type="number"
            min="0"
            max="100"
            step="1"
            placeholder="—"
            value={prevScore}
            onChange={e => setPrev(e.target.value)}
            style={{ marginLeft: 8, width: 64 }}
          />
          {delta !== null && (
            <span style={{ marginLeft: 12 }}>
              Δ {delta > 0 ? '+' : ''}{delta} pts
              {mcidMet != null && (
                <span style={{ marginLeft: 8, fontWeight: 600, color: mcidMet ? '#2d6a4f' : '#a05c00' }}>
                  {mcidMet ? '✓ MCID met' : '✗ Below MCID'}
                </span>
              )}
            </span>
          )}
        </div>
      )}

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">SCIM-III Total</span>
              <div><strong>{preview.primaryValue}</strong><span> / 100</span></div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Complete all 19 items to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

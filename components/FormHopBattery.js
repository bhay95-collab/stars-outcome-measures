import { useState } from 'react'
import { calcHopBattery } from '../lib/clinical'

// Single-leg hop battery — clinician field test. Distance hops in the same unit
// (cm or m); the 6-m timed hop in seconds. Each row: involved vs uninvolved.
const HOPS = [
  { key: 'single', label: 'Single hop for distance', invField: 'singleInv', unField: 'singleUninv', unit: 'cm' },
  { key: 'triple', label: 'Triple hop for distance', invField: 'tripleInv', unField: 'tripleUninv', unit: 'cm' },
  { key: 'crossover', label: 'Triple crossover hop', invField: 'crossInv', unField: 'crossUninv', unit: 'cm' },
  { key: 'timed', label: '6-metre timed hop', invField: 'timedInv', unField: 'timedUninv', unit: 's' },
]

const EMPTY = { singleInv: '', singleUninv: '', tripleInv: '', tripleUninv: '', crossInv: '', crossUninv: '', timedInv: '', timedUninv: '' }

export default function FormHopBattery({ onSubmit, loading }) {
  const [v, setV] = useState(EMPTY)

  const numeric = Object.fromEntries(Object.entries(v).map(([k, val]) => [k, val === '' ? NaN : Number(val)]))
  const allFilled = Object.values(numeric).every(n => !isNaN(n) && n > 0)
  const preview = allFilled ? calcHopBattery(numeric) : null

  function setField(field, value) {
    setV(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ ...numeric }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr><th>Hop test</th><th>Involved</th><th>Uninvolved</th><th>LSI</th></tr>
        </thead>
        <tbody>
          {HOPS.map(hop => (
            <tr key={hop.key}>
              <td>{hop.label} <span className="na-text">({hop.unit})</span></td>
              <td>
                <input className="field-input" type="number" min="0" step="any"
                  value={v[hop.invField]} onChange={e => setField(hop.invField, e.target.value)} required />
              </td>
              <td>
                <input className="field-input" type="number" min="0" step="any"
                  value={v[hop.unField]} onChange={e => setField(hop.unField, e.target.value)} required />
              </td>
              <td>{preview ? `${preview.meta[hop.key]}%` : '—'}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={3}><strong>Limiting hop LSI</strong></td>
            <td><strong>{preview ? `${preview.primaryValue}%` : '—'}</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>Hop battery:</strong> distance hops LSI = involved ÷ uninvolved × 100;
        the timed hop inverts (faster = better). Each hop must reach ≥ 90% for the
        battery to pass (Reid 2007; Grindem 2016) — the limiting (weakest) hop is the
        score. The battery supports, but does not replace, the RTS decision.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Single-Leg Hop Battery</span>
              <div>Limiting LSI: <strong>{preview.primaryValue}%</strong></div>
            </div>
            <span className={`interp-chip chip-${preview.meta.classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Enter all four hops (both limbs) to calculate symmetry.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

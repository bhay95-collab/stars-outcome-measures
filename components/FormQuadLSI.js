import { useState } from 'react'
import { calcQuadLSI } from '../lib/clinical'

// Quadriceps strength Limb Symmetry Index — clinician field test.
// Enter peak strength for both limbs in the SAME unit (Nm, kg, or N); the unit
// cancels in the ratio so any consistent unit is valid.
export default function FormQuadLSI({ onSubmit, loading }) {
  const [involved, setInvolved] = useState('')
  const [uninvolved, setUninvolved] = useState('')

  const inv = involved === '' ? NaN : Number(involved)
  const uninv = uninvolved === '' ? NaN : Number(uninvolved)
  const preview = (!isNaN(inv) && !isNaN(uninv)) ? calcQuadLSI({ involved: inv, uninvolved: uninv }) : null

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ involved: inv, uninvolved: uninv }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr><th>Limb</th><th>Peak quadriceps strength (Nm / kg / N)</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Involved (operated) limb</td>
            <td>
              <input className="field-input" type="number" min="0" step="any"
                value={involved} onChange={e => setInvolved(e.target.value)} required />
            </td>
          </tr>
          <tr>
            <td>Uninvolved limb</td>
            <td>
              <input className="field-input" type="number" min="0" step="any"
                value={uninvolved} onChange={e => setUninvolved(e.target.value)} required />
            </td>
          </tr>
          <tr>
            <td><strong>Limb Symmetry Index</strong></td>
            <td><strong>{preview ? `${preview.primaryValue}%` : '—'}</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>Quadriceps LSI:</strong> involved ÷ uninvolved × 100. Both limbs in
        the same unit (isokinetic peak torque, isometric force, or dynamometry).
        Return-to-sport cut-off ≥ 90% (Grindem 2016); 80% is a late-rehab milestone
        (van Melick 2016). LSI alone does not clear an athlete for sport.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Quadriceps Strength LSI</span>
              <div><strong>{preview.primaryValue}%</strong></div>
            </div>
            <span className={`interp-chip chip-${preview.meta.classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Enter both limb strengths to calculate the LSI.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

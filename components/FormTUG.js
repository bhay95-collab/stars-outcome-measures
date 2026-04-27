import { useState } from 'react'
import { calcTUG } from '../lib/clinical'

export default function FormTUG({ onSubmit, loading }) {
  const [time,     setTime]     = useState('')
  const [fastTime, setFastTime] = useState('')
  const [dualTime, setDualTime] = useState('')

  const t  = parseFloat(time)     || null
  const ft = parseFloat(fastTime) || null
  const dt = parseFloat(dualTime) || null

  const preview    = t > 0 ? calcTUG({ time: t, fastTime: ft, dualTime: dt }) : null
  const classColor = preview?.meta?.classColor ?? 'grey'

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ time: t, fastTime: ft, dualTime: dt }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Condition</th>
            <th>Time (sec)</th>
            <th>Classification</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Comfortable pace</strong></td>
            <td>
              <input
                className="input-narrow"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="sec"
                value={time}
                onChange={e => setTime(e.target.value)}
                required
              />
            </td>
            <td>
              {preview ? (
                <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
              ) : (
                <span className="na-text">Enter time</span>
              )}
            </td>
            <td className="ref-note" rowSpan={3}>
              Fall risk &gt;13.5 s · MCID 2.0 s<br/>
              Fast pace normal &lt;8 s<br/>
              DTC &gt;20% = significant
            </td>
          </tr>
          <tr>
            <td><strong>Fast pace</strong></td>
            <td>
              <input
                className="input-narrow"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="sec"
                value={fastTime}
                onChange={e => setFastTime(e.target.value)}
              />
            </td>
            <td>
              {preview?.meta?.fastInterp ? (
                <span className={`interp-chip chip-${preview.meta.fastColor}`}>{preview.meta.fastInterp}</span>
              ) : (
                <span className="na-text">Optional</span>
              )}
            </td>
          </tr>
          <tr>
            <td><strong>Dual task</strong></td>
            <td>
              <input
                className="input-narrow"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="sec"
                value={dualTime}
                onChange={e => setDualTime(e.target.value)}
              />
            </td>
            <td>
              {preview?.meta?.dtcInterp ? (
                <span className={`interp-chip chip-${preview.meta.dtcColor}`}>{preview.meta.dtcInterp}</span>
              ) : (
                <span className="na-text">Optional</span>
              )}
            </td>
          </tr>
          {preview?.meta?.dtc != null && (
            <tr>
              <td colSpan={2} className="ref-note">Dual-task cognitive cost (DTC)</td>
              <td colSpan={2}>
                <strong>{preview.meta.dtc}%</strong>{' '}
                <span className={`interp-chip chip-${preview.meta.dtcColor}`}>{preview.meta.dtcInterp}</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="info-panel">
        <strong>TUG (Podsiadlo &amp; Richardson 1991):</strong>{' '}
        Comfortable: &lt;10 s = Normal · &lt;13.5 s = Mildly impaired · ≥13.5 s = Fall risk.
        Fast pace: &lt;8 s = Normal. DTC = (dual − comfortable) / comfortable × 100%;
        &gt;20% = significant cognitive-motor interference.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Timed Up and Go</span>
              <div>
                Comfortable: <strong>{t?.toFixed(2)}</strong> sec
                {ft && <> · Fast: <strong>{ft.toFixed(2)}</strong> sec</>}
                {dt && <> · Dual: <strong>{dt.toFixed(2)}</strong> sec</>}
                {preview.meta?.fallRisk && (
                  <>{' '}<span className="na-text">⚠ Fall risk</span></>
                )}
              </div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Enter comfortable pace time to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

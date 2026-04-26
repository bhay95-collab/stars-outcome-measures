import { useState } from 'react'
import { calc10mwt } from '../lib/clinical'

export default function Form10MWT({ patient, onSubmit, loading }) {
  const [comfortTime, setComfortTime] = useState('')
  const [fastTime, setFastTime] = useState('')

  const age = patient.dob_year ? new Date().getFullYear() - patient.dob_year : null
  const ct = parseFloat(comfortTime)
  const ft = parseFloat(fastTime)

  const preview = ct > 0
    ? calc10mwt({
        comfortTime: ct,
        fastTime: ft > 0 ? ft : null,
        age,
        gender: patient.gender,
      })
    : null

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit(
      { comfortTime: ct, fastTime: ft > 0 ? ft : null },
      preview,
    )
  }

  const comfortSpeed = preview ? preview.primaryValue.toFixed(2) : '—'
  const comfortPct = preview?.meta?.comfortPct != null ? `${preview.meta.comfortPct}%` : '—'
  const fastSpeed = preview?.meta?.fastSpeed != null ? preview.meta.fastSpeed.toFixed(2) : '—'
  const classColor = preview?.meta?.classColor ?? 'grey'

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Condition</th>
            <th>Time (sec)</th>
            <th>Speed (m/s)</th>
            <th>% Predicted</th>
            <th>Community Classification</th>
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
                value={comfortTime}
                onChange={e => setComfortTime(e.target.value)}
                required
              />
            </td>
            <td><span className="calc-value">{comfortSpeed}</span></td>
            <td><span className="calc-value">{comfortPct}</span></td>
            <td>
              {preview ? (
                <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
              ) : (
                <span className="na-text">Enter time</span>
              )}
            </td>
            <td className="ref-note">MDC=0.10 m/s; MCID=0.06 m/s (stroke)</td>
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
            <td colSpan={4}>
              <span className="calc-value">{fastSpeed}</span>
              {preview?.meta?.fastPct != null && (
                <span className="na-text"> — {preview.meta.fastPct}% predicted</span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>Community classification (Lusardi 2003):</strong>{' '}
        &lt;0.4 m/s = Household ambulator · 0.4–0.79 = Limited community · 0.8–1.19 = Community ambulator · ≥1.2 = Full community ambulator.
        {!age && ' Enter birth year in Patient Details for % predicted.'}
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Comfortable Speed</span>
              <div>
                <strong>{comfortSpeed}</strong>
                {' '}<span>m/s</span>
                {preview.meta?.comfortPct != null && (
                  <>{' '}<span className="na-text">{preview.meta.comfortPct}% predicted</span></>
                )}
              </div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Enter comfortable walk time to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

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
    <>
      <style jsx>{styles}</style>
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
                  <span className="fast-pct"> — {preview.meta.fastPct}% predicted</span>
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
              <div className="result-left">
                <p className="result-label">Comfortable Speed</p>
                <div className="result-speed-row">
                  <span className="result-speed">{comfortSpeed}</span>
                  <span className="result-unit">m/s</span>
                  {preview.meta?.comfortPct != null && (
                    <span className="result-pct">{preview.meta.comfortPct}% predicted</span>
                  )}
                </div>
              </div>
              <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
            </div>
          ) : (
            <p className="result-pending">Enter comfortable walk time to calculate results.</p>
          )}
          <button type="submit" className="save-btn" disabled={!preview || loading}>
            {loading ? 'Saving…' : 'Save assessment'}
          </button>
        </div>
      </form>
    </>
  )
}

const styles = `
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .data-table th {
    text-align: left;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--color-subtle);
    padding: 0 10px 8px;
    border-bottom: 2px solid var(--color-border);
  }

  .data-table td {
    padding: 8px 10px;
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }

  .data-table tr:last-child td { border-bottom: none; }

  .data-table tbody tr:hover td { background: var(--color-surface-soft); }

  .input-narrow {
    width: 110px;
    background: #fffef9;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 6px 10px;
    font-family: monospace;
    font-size: 13px;
    color: var(--color-ink);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .input-narrow:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(35, 100, 153, 0.1);
    background: #fff;
  }

  .calc-value {
    font-family: monospace;
    font-size: 13px;
    color: var(--color-primary);
    font-weight: 500;
  }

  .fast-pct {
    font-size: 12px;
    color: var(--color-muted);
    margin-left: 4px;
  }

  .na-text {
    color: var(--color-subtle);
    font-style: italic;
    font-size: 12px;
  }

  .ref-note {
    font-size: 11px;
    color: var(--color-subtle);
    font-style: italic;
    line-height: 1.4;
    max-width: 200px;
  }

  .interp-chip {
    display: inline-flex;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 99px;
    border: 1px solid;
    white-space: nowrap;
  }

  .chip-green { background: #e8f4ef; color: #2d6a4f; border-color: #b7dfc9; }
  .chip-amber { background: #fef3e2; color: #a05c00; border-color: #f5d49a; }
  .chip-red   { background: #fdf0ec; color: #b5451b; border-color: #f0b8a2; }
  .chip-grey  { background: var(--color-surface-soft); color: var(--color-subtle); border-color: var(--color-border); }

  .info-panel {
    padding: 14px 16px;
    background: var(--color-primary-soft);
    border: 1px solid var(--color-secondary);
    border-radius: var(--radius-sm);
    font-size: 12px;
    color: var(--color-primary-dark);
    line-height: 1.6;
    margin-top: 14px;
  }

  .result-box {
    background: var(--color-surface-soft);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 16px 20px;
    margin-top: 20px;
  }

  .result-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .result-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: var(--color-subtle);
    margin-bottom: 4px;
  }

  .result-speed-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .result-speed {
    font-family: 'Source Serif 4', serif;
    font-size: 28px;
    font-weight: 600;
    color: var(--color-ink);
    line-height: 1;
  }

  .result-unit {
    font-size: 14px;
    color: var(--color-muted);
  }

  .result-pct {
    font-size: 12px;
    color: var(--color-muted);
  }

  .result-pending {
    font-size: 13px;
    color: var(--color-subtle);
    font-style: italic;
    margin-bottom: 16px;
  }

  .save-btn {
    width: 100%;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-surface);
    background: var(--color-primary);
    border: none;
    border-radius: var(--radius-md);
    padding: 12px 24px;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .save-btn:hover { opacity: 0.9; }
  .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`

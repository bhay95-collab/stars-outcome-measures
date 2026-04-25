import { useState } from 'react'
import { calc10mwt } from '../lib/clinical'

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const today = new Date()
  const dob = new Date(dateOfBirth)
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

export default function Form10MWT({ patient, onSubmit, loading }) {
  const [comfortTime, setComfortTime] = useState('')
  const [fastTime, setFastTime] = useState('')

  const age = calculateAge(patient.date_of_birth)
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

  return (
    <>
      <style jsx>{styles}</style>
      <form onSubmit={handleSubmit}>
        <p className="measure-label">10 Metre Walk Test</p>

        <div className="field">
          <label htmlFor="f10-comfort">Comfortable walk time *</label>
          <div className="input-row">
            <input
              id="f10-comfort"
              type="number"
              min="0.1"
              step="0.1"
              value={comfortTime}
              onChange={e => setComfortTime(e.target.value)}
              placeholder="e.g. 8.5"
              required
            />
            <span className="unit">seconds</span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="f10-fast">
            Fast walk time <span className="optional">(optional)</span>
          </label>
          <div className="input-row">
            <input
              id="f10-fast"
              type="number"
              min="0.1"
              step="0.1"
              value={fastTime}
              onChange={e => setFastTime(e.target.value)}
              placeholder="e.g. 6.2"
            />
            <span className="unit">seconds</span>
          </div>
        </div>

        {preview && (
          <div className="preview">
            <div className="preview-row">
              <span className="speed">{preview.primaryValue.toFixed(2)}</span>
              <span className="speed-unit">m/s</span>
              <span className={`chip ${preview.meta.classColor ?? 'chip-green'}`}>
                {preview.interpretation}
              </span>
            </div>
            {preview.meta.comfortPct != null && (
              <p className="pct">{preview.meta.comfortPct}% of age/sex predicted</p>
            )}
            {preview.meta.fastSpeed != null && (
              <p className="fast-row">
                Fast: {preview.meta.fastSpeed.toFixed(2)} m/s
                {preview.meta.fastPct != null && ` — ${preview.meta.fastPct}% predicted`}
              </p>
            )}
          </div>
        )}

        <button type="submit" className="save-btn" disabled={!preview || loading}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </form>
    </>
  )
}

const styles = `
  .measure-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--color-subtle);
    margin-bottom: 20px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  label {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-ink);
  }

  .optional {
    font-weight: 400;
    color: var(--color-muted);
  }

  .input-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  input {
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    color: var(--color-ink);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    outline: none;
    width: 140px;
    transition: border-color 0.15s;
  }

  input:focus { border-color: var(--color-primary); }

  .unit { font-size: 13px; color: var(--color-muted); }

  .preview {
    background: var(--color-surface-soft);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 16px;
    margin: 16px 0 24px;
  }

  .preview-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .speed {
    font-size: 26px;
    font-weight: 700;
    color: var(--color-ink);
    font-variant-numeric: tabular-nums;
  }

  .speed-unit {
    font-size: 14px;
    color: var(--color-muted);
    margin-right: 4px;
  }

  .chip {
    font-size: 12px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 999px;
  }

  .chip-green { background: var(--color-primary-soft); color: var(--color-primary-dark); }
  .chip-amber { background: var(--color-surface-soft); color: var(--color-muted); }
  .chip-red   { background: var(--color-border);       color: var(--color-ink); }

  .pct { font-size: 12px; color: var(--color-muted); margin-bottom: 2px; }
  .fast-row { font-size: 12px; color: var(--color-muted); margin-top: 4px; }

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

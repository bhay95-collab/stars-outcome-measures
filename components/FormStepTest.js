import { useState } from 'react'
import { calcStepTest } from '../lib/clinical'

export default function FormStepTest({ onSubmit, loading }) {
  const [rightSteps, setRightSteps] = useState('')
  const [leftSteps, setLeftSteps]   = useState('')

  const r = rightSteps !== '' ? parseInt(rightSteps, 10) : null
  const l = leftSteps  !== '' ? parseInt(leftSteps,  10) : null

  const preview = r !== null ? calcStepTest({ rightSteps: r, leftSteps: l ?? undefined }) : null
  const classColor = preview?.meta?.classColor ?? 'grey'

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ rightSteps: r, leftSteps: l }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Side</th>
            <th>Steps (15 sec)</th>
            <th>Result</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Right leg</strong></td>
            <td>
              <input
                className="input-narrow"
                type="number"
                step="1"
                min="0"
                placeholder="steps"
                value={rightSteps}
                onChange={e => setRightSteps(e.target.value)}
                required
              />
            </td>
            <td>
              {preview ? (
                <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
              ) : (
                <span className="na-text">Enter steps</span>
              )}
            </td>
            <td className="ref-note" rowSpan={2}>Community threshold ≥10 steps</td>
          </tr>
          <tr>
            <td><strong>Left leg</strong></td>
            <td>
              <input
                className="input-narrow"
                type="number"
                step="1"
                min="0"
                placeholder="steps"
                value={leftSteps}
                onChange={e => setLeftSteps(e.target.value)}
              />
            </td>
            <td>
              {preview?.meta?.asymmetry && (
                <span className="na-text">⚠ Asymmetry</span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>Step Test (Hill 1996):</strong>{' '}
        Count steps onto a 7.5 cm block in 15 seconds per leg. Community ambulation threshold ≥10 steps.
        Asymmetry flagged when sides differ by &gt;2 steps.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Step Test</span>
              <div>
                R: <strong>{r}</strong> · L: <strong>{l ?? '—'}</strong>
                <span> steps</span>
                {preview.meta?.asymmetry && (
                  <>{' '}<span className="na-text">⚠ Asymmetry detected</span></>
                )}
              </div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Enter right leg step count to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

import { useState } from 'react'
import { calcStepTest } from '../lib/clinical'

export default function FormStepTest({ onSubmit, loading }) {
  const [affectedSteps,    setAffectedSteps]    = useState('')
  const [nonAffectedSteps, setNonAffectedSteps] = useState('')

  const a = affectedSteps    !== '' ? parseInt(affectedSteps,    10) : null
  const n = nonAffectedSteps !== '' ? parseInt(nonAffectedSteps, 10) : null

  const preview    = a !== null ? calcStepTest({ affectedSteps: a, nonAffectedSteps: n ?? undefined }) : null
  const classColor = preview?.meta?.classColor ?? 'grey'

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ affectedSteps: a, nonAffectedSteps: n }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Leg</th>
            <th>Steps (15 sec)</th>
            <th>Classification</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Affected leg</strong></td>
            <td>
              <input
                className="input-narrow"
                type="number"
                step="1"
                min="0"
                placeholder="steps"
                value={affectedSteps}
                onChange={e => setAffectedSteps(e.target.value)}
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
            <td className="ref-note" rowSpan={2}>
              Community threshold ≥10 steps<br/>
              Asymmetry flagged when AI &gt;20%
            </td>
          </tr>
          <tr>
            <td><strong>Non-affected leg</strong></td>
            <td>
              <input
                className="input-narrow"
                type="number"
                step="1"
                min="0"
                placeholder="steps"
                value={nonAffectedSteps}
                onChange={e => setNonAffectedSteps(e.target.value)}
              />
            </td>
            <td>
              {preview?.meta?.nonAffectedInterp ? (
                <span className={`interp-chip chip-${preview.meta.nonAffectedColor}`}>{preview.meta.nonAffectedInterp}</span>
              ) : (
                <span className="na-text">Optional</span>
              )}
            </td>
          </tr>
          {preview?.meta?.asymmetryIndex != null && (
            <tr>
              <td colSpan={2} className="ref-note">Asymmetry Index (AI)</td>
              <td colSpan={2}>
                <strong>{preview.meta.asymmetryIndex}%</strong>
                {preview.meta.asymmetry && (
                  <>{' '}<span className="na-text">⚠ Asymmetry detected (&gt;20%)</span></>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="info-panel">
        <strong>Step Test (Hill 1996):</strong>{' '}
        Count steps onto a 7.5 cm block in 15 seconds per leg. Community ambulation threshold ≥10 steps.
        Asymmetry Index (AI) = |affected − non-affected| / non-affected × 100%; flagged when AI &gt;20%.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Step Test</span>
              <div>
                Affected: <strong>{a}</strong>
                {n !== null && <> · Non-affected: <strong>{n}</strong></>}
                <span> steps</span>
                {preview.meta?.asymmetry && (
                  <>{' '}<span className="na-text">⚠ Asymmetry {preview.meta.asymmetryIndex}%</span></>
                )}
              </div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Enter affected leg step count to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

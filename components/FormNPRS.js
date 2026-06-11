import { useState } from 'react'
import { calcNPRS, NPRS_CONTEXT_OPTIONS } from '../lib/clinical'

const SCORE_OPTIONS = Array.from({ length: 11 }, (_, i) => i)

export default function FormNPRS({ onSubmit, loading }) {
  const [score, setScore] = useState(null)
  const [context, setContext] = useState('current')

  const preview    = score != null ? calcNPRS({ score, context }) : null
  const classColor = preview?.meta?.classColor ?? 'grey'

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ score, context }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field-group">
        <label className="field-label" htmlFor="nprs-context">Pain being rated</label>
        <select
          id="nprs-context"
          className="field-input"
          value={context}
          onChange={e => setContext(e.target.value)}
        >
          {NPRS_CONTEXT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <span className="field-label" id="nprs-scale-label">
          Pain intensity — 0 (no pain) to 10 (worst pain imaginable)
        </span>
        <div data-numeric-scale="" role="radiogroup" aria-labelledby="nprs-scale-label">
          {SCORE_OPTIONS.map(value => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={score === value}
              data-active={score === value ? '' : undefined}
              onClick={() => setScore(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="info-panel">
        <strong>NPRS:</strong>{' '}
        0 = No pain · 1–3 = Mild · 4–6 = Moderate · 7–10 = Severe.
        MCID ≈ 2 points or ~30% reduction (Farrar 2001; Childs 2005).
        Record the same pain context (e.g. current vs 24-hour average) at each reassessment.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Numeric Pain Rating Scale</span>
              <div>
                {preview.meta.contextLabel}: <strong>{preview.primaryValue}/10</strong>
              </div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Select a pain rating to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

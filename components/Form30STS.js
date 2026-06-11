import { useState } from 'react'
import { calc30STS } from '../lib/clinical'

export default function Form30STS({ patient, onSubmit, loading }) {
  const [stands, setStands] = useState('')

  const age = patient?.dob_year ? new Date().getFullYear() - patient.dob_year : null
  const count = stands === '' ? null : Number(stands)
  const preview = count != null ? calc30STS({ stands: count, age, gender: patient?.gender }) : null
  const classColor = preview?.meta?.classColor ?? 'grey'

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ stands: count, age, gender: patient?.gender ?? null }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field-group">
        <label className="field-label" htmlFor="sts30-stands">Full stands completed in 30 seconds</label>
        <input
          id="sts30-stands"
          className="field-input input-narrow"
          type="number"
          min="0"
          max="60"
          step="1"
          placeholder="stands"
          value={stands}
          onChange={e => setStands(e.target.value)}
          required
        />
      </div>

      <div className="info-panel">
        <strong>30s-STS (Rikli &amp; Jones 1999):</strong>{' '}
        Standard chair (≈43 cm), arms crossed over chest; count full stands in 30 seconds.
        Age/sex normal ranges apply from 60–94 yr. &lt;12 stands = reduced physical function
        in knee OA. Change ≥2.5 stands exceeds individual measurement error (MDC).
        {!age && ' Enter birth year in Patient Details for age-norm comparison.'}
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">30-Second Sit to Stand</span>
              <div>
                Stands: <strong>{preview.primaryValue}</strong>
                {preview.meta.normRange && (
                  <> · Age norm: {preview.meta.normRange.lo}–{preview.meta.normRange.hi}</>
                )}
              </div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Enter the number of stands to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

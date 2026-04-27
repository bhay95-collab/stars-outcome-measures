import { useState } from 'react'
import { calc6MWT } from '../lib/clinical'

export default function Form6MWT({ patient, onSubmit, loading }) {
  const [distance, setDistance] = useState('')
  const [height, setHeight]     = useState('')
  const [weight, setWeight]     = useState('')

  const age = patient.dob_year ? new Date().getFullYear() - patient.dob_year : null
  const d = parseFloat(distance)
  const preview = d > 0
    ? calc6MWT({
        distance: d,
        age,
        gender: patient.gender,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
      })
    : null
  const classColor = preview?.meta?.classColor ?? 'grey'

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit(
      {
        distance: d,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
      },
      preview,
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Measurement</th>
            <th>Value</th>
            <th>% Predicted</th>
            <th>Classification</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Distance walked</strong></td>
            <td>
              <input
                className="input-narrow"
                type="number"
                step="1"
                min="1"
                placeholder="m"
                value={distance}
                onChange={e => setDistance(e.target.value)}
                required
              />
              <span className="na-text"> m</span>
            </td>
            <td>
              <span className="calc-value">
                {preview?.meta?.pctPredicted != null ? `${preview.meta.pctPredicted}%` : '—'}
              </span>
            </td>
            <td>
              {preview ? (
                <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
              ) : (
                <span className="na-text">Enter distance</span>
              )}
            </td>
          </tr>
          <tr>
            <td><strong>Height</strong> <span className="na-text">(optional)</span></td>
            <td>
              <input
                className="input-narrow"
                type="number"
                step="1"
                min="100"
                max="250"
                placeholder="cm"
                value={height}
                onChange={e => setHeight(e.target.value)}
              />
              <span className="na-text"> cm</span>
            </td>
            <td colSpan={2} className="na-text">Required for % predicted</td>
          </tr>
          <tr>
            <td><strong>Weight</strong> <span className="na-text">(optional)</span></td>
            <td>
              <input
                className="input-narrow"
                type="number"
                step="0.5"
                min="20"
                max="300"
                placeholder="kg"
                value={weight}
                onChange={e => setWeight(e.target.value)}
              />
              <span className="na-text"> kg</span>
            </td>
            <td colSpan={2} className="na-text">Required for % predicted</td>
          </tr>
        </tbody>
      </table>

      <div className="info-panel">
        <strong>% predicted (Enright &amp; Sherrill 1998):</strong>{' '}
        Requires height, weight, age, and sex. Classification: ≥500 m = Excellent · 400–499 m = Good · 300–399 m = Fair · &lt;300 m = Limited.
        MCID ≈25 m; MDC ≈54 m.
        {!age && ' Enter birth year in Patient Details for age-adjusted % predicted.'}
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">6 Minute Walk Test</span>
              <div>
                <strong>{d}</strong>{' '}<span>m</span>
                {preview.meta?.pctPredicted != null && (
                  <>{' '}<span className="na-text">{preview.meta.pctPredicted}% predicted</span></>
                )}
              </div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Enter distance walked to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

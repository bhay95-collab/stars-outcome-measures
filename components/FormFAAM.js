import { useState } from 'react'
import { calcFAAM, FAAM_ADL_ITEMS, FAAM_SPORT_ITEMS, FAAM_OPTIONS } from '../lib/clinical'

function SubscaleTable({ title, intro, items, values, onChange, scoreLabel }) {
  return (
    <div data-measure-section="">
      <div data-measure-section-head="">
        <strong>{title}</strong>
        <span>{scoreLabel}</span>
      </div>
      <p className="na-text">{intro}</p>
      <table className="data-table">
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className="na-text">{i + 1}</td>
              <td>{item.label}</td>
              <td>
                <select
                  className="field-input input-narrow"
                  value={values[i]}
                  onChange={e => onChange(i, e.target.value)}
                  aria-label={`${title} item ${i + 1}: ${item.label}`}
                >
                  <option value="">—</option>
                  {FAAM_OPTIONS.map(opt => (
                    <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function toEngineValues(values) {
  return values.map(v => (v === '' ? null : v === 'na' ? 'na' : Number(v)))
}

export default function FormFAAM({ onSubmit, loading }) {
  const [adl, setAdl] = useState(Array(21).fill(''))
  const [sport, setSport] = useState(Array(8).fill(''))

  const engineAdl = toEngineValues(adl)
  const engineSport = toEngineValues(sport)
  const preview = calcFAAM({ adl: engineAdl, sport: engineSport })
  const sportStarted = engineSport.some(v => v != null)
  const sportPending = sportStarted && preview && preview.meta.sport == null

  function setItem(setter) {
    return (index, value) => setter(prev => prev.map((item, i) => (i === index ? value : item)))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ adl: engineAdl, sport: engineSport }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <SubscaleTable
        title="Activities of daily living (21 items)"
        intro="Because of your foot and ankle, how much difficulty do you have with the following? Use N/A only if the activity is limited by something other than the foot or ankle."
        items={FAAM_ADL_ITEMS}
        values={adl}
        onChange={setItem(setAdl)}
        scoreLabel={preview ? `ADL: ${preview.primaryValue}%` : 'Needs ≥19 of 21 responses'}
      />

      <SubscaleTable
        title="Sports (8 items — optional)"
        intro="How much difficulty do you have with the following sporting activities? Skip this subscale entirely if not relevant."
        items={FAAM_SPORT_ITEMS}
        values={sport}
        onChange={setItem(setSport)}
        scoreLabel={preview?.meta?.sport != null ? `Sport: ${preview.meta.sport}%` : sportStarted ? 'Needs ≥7 of 8 responses' : 'Not administered'}
      />

      <div className="info-panel">
        <strong>FAAM (Martin 2005):</strong>{' '}
        Each subscale scored as % (100 = no dysfunction). Functional deficit cutoffs:
        ADL &lt;90%, Sport &lt;80% (chronic ankle instability criteria, IAC 2014).
        MCID: ADL 8, Sport 9 points. MDC95: ADL 5.7, Sport 12.3 — Sport changes under
        12.3 points sit within measurement error.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Foot and Ankle Ability Measure</span>
              <div>
                ADL: <strong>{preview.primaryValue}%</strong>
                {preview.meta.sport != null && <> · Sport: <strong>{preview.meta.sport}%</strong></>}
              </div>
              {sportPending && (
                <div className="na-text">Sports subscale incomplete — answer ≥7 of 8 items or clear it.</div>
              )}
            </div>
            <span className={`interp-chip chip-${preview.meta.classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Complete at least 19 of the 21 ADL items (N/A counts as a response) to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

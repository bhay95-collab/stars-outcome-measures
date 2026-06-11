import { useState } from 'react'
import {
  calcCMS,
  CMS_POSITIONING_OPTIONS,
  CMS_ELEVATION_OPTIONS,
  CMS_ER_OPTIONS,
  CMS_IR_OPTIONS,
} from '../lib/clinical'

function OptionSelect({ id, label, value, onChange, options }) {
  return (
    <tr>
      <td>{label}</td>
      <td>
        <select
          id={id}
          className="field-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          aria-label={label}
        >
          <option value="">—</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label} ({opt.value} pts)</option>
          ))}
        </select>
      </td>
    </tr>
  )
}

export default function FormCMS({ onSubmit, loading }) {
  const [pain, setPain] = useState('')
  const [adlWork, setAdlWork] = useState('')
  const [adlRecreation, setAdlRecreation] = useState('')
  const [adlSleep, setAdlSleep] = useState('')
  const [adlPositioning, setAdlPositioning] = useState('')
  const [romFlexion, setRomFlexion] = useState('')
  const [romAbduction, setRomAbduction] = useState('')
  const [romER, setRomER] = useState('')
  const [romIR, setRomIR] = useState('')
  const [strengthKg, setStrengthKg] = useState('')

  const inputs = {
    pain: pain === '' ? NaN : Number(pain),
    adlWork: adlWork === '' ? NaN : Number(adlWork),
    adlRecreation: adlRecreation === '' ? NaN : Number(adlRecreation),
    adlSleep: adlSleep === '' ? NaN : Number(adlSleep),
    adlPositioning: adlPositioning === '' ? NaN : Number(adlPositioning),
    romFlexion: romFlexion === '' ? NaN : Number(romFlexion),
    romAbduction: romAbduction === '' ? NaN : Number(romAbduction),
    romER: romER === '' ? NaN : Number(romER),
    romIR: romIR === '' ? NaN : Number(romIR),
    strengthKg: strengthKg === '' ? NaN : Number(strengthKg),
  }
  const preview = calcCMS(inputs)

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit(inputs, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div data-measure-section="">
        <div data-measure-section-head="">
          <strong>Pain &amp; activities of daily living (/35)</strong>
          <span>{preview ? `Pain ${preview.meta.pain}/15 · ADL ${preview.meta.adl}/20` : 'Pending'}</span>
        </div>
        <table className="data-table">
          <tbody>
            <tr>
              <td>Pain (15 = no pain, 0 = severe pain)</td>
              <td>
                <input
                  className="field-input input-narrow"
                  type="number" min="0" max="15" step="1"
                  placeholder="0–15"
                  value={pain}
                  onChange={e => setPain(e.target.value)}
                  required
                  aria-label="Pain score 0 to 15"
                />
              </td>
            </tr>
            <tr>
              <td>Work — full activity possible (0–4)</td>
              <td>
                <input
                  className="field-input input-narrow"
                  type="number" min="0" max="4" step="1"
                  placeholder="0–4"
                  value={adlWork}
                  onChange={e => setAdlWork(e.target.value)}
                  required
                  aria-label="Work score 0 to 4"
                />
              </td>
            </tr>
            <tr>
              <td>Recreation/sport — full activity possible (0–4)</td>
              <td>
                <input
                  className="field-input input-narrow"
                  type="number" min="0" max="4" step="1"
                  placeholder="0–4"
                  value={adlRecreation}
                  onChange={e => setAdlRecreation(e.target.value)}
                  required
                  aria-label="Recreation score 0 to 4"
                />
              </td>
            </tr>
            <tr>
              <td>Sleep — undisturbed (0–2)</td>
              <td>
                <input
                  className="field-input input-narrow"
                  type="number" min="0" max="2" step="1"
                  placeholder="0–2"
                  value={adlSleep}
                  onChange={e => setAdlSleep(e.target.value)}
                  required
                  aria-label="Sleep score 0 to 2"
                />
              </td>
            </tr>
            <OptionSelect
              id="cms-positioning"
              label="Pain-free hand positioning"
              value={adlPositioning}
              onChange={setAdlPositioning}
              options={CMS_POSITIONING_OPTIONS}
            />
          </tbody>
        </table>
      </div>

      <div data-measure-section="">
        <div data-measure-section-head="">
          <strong>Range of motion (/40) &amp; strength (/25)</strong>
          <span>{preview ? `ROM ${preview.meta.rom}/40 · Strength ${preview.meta.strength}/25` : 'Pending'}</span>
        </div>
        <table className="data-table">
          <tbody>
            <OptionSelect id="cms-flexion" label="Forward flexion" value={romFlexion} onChange={setRomFlexion} options={CMS_ELEVATION_OPTIONS} />
            <OptionSelect id="cms-abduction" label="Abduction" value={romAbduction} onChange={setRomAbduction} options={CMS_ELEVATION_OPTIONS} />
            <OptionSelect id="cms-er" label="External rotation" value={romER} onChange={setRomER} options={CMS_ER_OPTIONS} />
            <OptionSelect id="cms-ir" label="Internal rotation" value={romIR} onChange={setRomIR} options={CMS_IR_OPTIONS} />
            <tr>
              <td>Abduction strength (kg — 90° abduction, sustained 5 s)</td>
              <td>
                <input
                  className="field-input input-narrow"
                  type="number" min="0" max="50" step="0.1"
                  placeholder="kg"
                  value={strengthKg}
                  onChange={e => setStrengthKg(e.target.value)}
                  required
                  aria-label="Abduction strength in kilograms"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="info-panel">
        <strong>Constant–Murley Score (Constant &amp; Murley 1987):</strong>{' '}
        Pain /15 + ADL /20 + ROM /40 + strength /25 = /100, higher = better.
        Strength scores 1 point per 0.45 kg of abduction force, capped at 25.
        MCID ≈ 10.4 points post rotator cuff repair (Kukkonen 2013); ≈17 points in
        long-standing subacromial pain.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Constant–Murley Score</span>
              <div>Total: <strong>{preview.primaryValue}/100</strong></div>
            </div>
            <span className={`interp-chip chip-${preview.meta.classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Complete all components to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

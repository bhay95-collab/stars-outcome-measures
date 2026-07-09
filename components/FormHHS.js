import { useState } from 'react'
import {
  calcHHS,
  HHS_PAIN_OPTIONS, HHS_LIMP_OPTIONS, HHS_SUPPORT_OPTIONS, HHS_DISTANCE_OPTIONS,
  HHS_STAIRS_OPTIONS, HHS_SHOES_OPTIONS, HHS_SITTING_OPTIONS, HHS_TRANSPORT_OPTIONS,
  HHS_DEFORMITY_CRITERIA, HHS_ROM_FIELDS,
} from '../lib/clinical'

// Harris Hip Score — clinician-administered composite (Harris 1969).
// Pain and function are graded selects; deformity is four exam criteria that
// must ALL be met for the 4 points; ROM is measured degrees per movement,
// scored by total-arc bands. The engine (lib/clinical/harrisHip.js) validates
// every value against the published option scores.
const SELECT_SECTIONS = [
  {
    heading: 'Pain',
    fields: [{ key: 'pain', label: 'Pain (44 points)', options: HHS_PAIN_OPTIONS }],
  },
  {
    heading: 'Function — gait (33 points)',
    fields: [
      { key: 'limp', label: 'Limp', options: HHS_LIMP_OPTIONS },
      { key: 'support', label: 'Walking support', options: HHS_SUPPORT_OPTIONS },
      { key: 'distance', label: 'Distance walked', options: HHS_DISTANCE_OPTIONS },
    ],
  },
  {
    heading: 'Function — activities (14 points)',
    fields: [
      { key: 'stairs', label: 'Stairs', options: HHS_STAIRS_OPTIONS },
      { key: 'shoesSocks', label: 'Shoes and socks', options: HHS_SHOES_OPTIONS },
      { key: 'sitting', label: 'Sitting', options: HHS_SITTING_OPTIONS },
      { key: 'transport', label: 'Public transportation', options: HHS_TRANSPORT_OPTIONS },
    ],
  },
]

const EMPTY_SELECTS = { pain: '', limp: '', support: '', distance: '', stairs: '', shoesSocks: '', sitting: '', transport: '' }
const EMPTY_ROM = { flexion: '', abduction: '', adduction: '', externalRotation: '', internalRotation: '' }
const NO_DEFORMITY = { flexionContracture: false, adduction: false, internalRotation: false, legLength: false }

export default function FormHHS({ onSubmit, loading }) {
  const [selects, setSelects] = useState(EMPTY_SELECTS)
  const [deformity, setDeformity] = useState(NO_DEFORMITY)
  const [rom, setRom] = useState(EMPTY_ROM)

  const inputs = {
    ...Object.fromEntries(Object.entries(selects).map(([k, v]) => [k, v === '' ? null : Number(v)])),
    deformity,
    rom: Object.fromEntries(Object.entries(rom).map(([k, v]) => [k, v === '' ? NaN : Number(v)])),
  }
  const preview = calcHHS(inputs)
  const romTotal = Object.values(inputs.rom).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0)

  function setSelect(key, value) {
    setSelects(prev => ({ ...prev, [key]: value }))
  }

  function setCriterion(key, checked) {
    setDeformity(prev => ({ ...prev, [key]: checked }))
  }

  function setRomField(key, value) {
    setRom(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit(inputs, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      {SELECT_SECTIONS.map(section => (
        <div key={section.heading}>
          <span className="section-label">{section.heading}</span>
          {section.fields.map(field => (
            <div key={field.key} className="field-group">
              <label htmlFor={`hhs-${field.key}`} className="field-label">{field.label}</label>
              <select
                id={`hhs-${field.key}`}
                className="field-input"
                value={selects[field.key]}
                onChange={e => setSelect(field.key, e.target.value)}
                required
              >
                <option value="">Select…</option>
                {field.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label} ({opt.value})</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      ))}

      <div>
        <span className="section-label">Absence of deformity (4 points — all four required)</span>
        <div className="acl-signs">
          {HHS_DEFORMITY_CRITERIA.map(criterion => (
            <label key={criterion.key}>
              <input
                type="checkbox"
                checked={deformity[criterion.key]}
                onChange={e => setCriterion(criterion.key, e.target.checked)}
              />
              {criterion.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className="section-label">Range of motion (5 points — total arc)</span>
        <table className="data-table">
          <thead>
            <tr><th>Movement</th><th>Degrees</th></tr>
          </thead>
          <tbody>
            {HHS_ROM_FIELDS.map(field => (
              <tr key={field.key}>
                <td>{field.label} <span className="na-text">(0–{field.max}°)</span></td>
                <td>
                  <input
                    className="field-input" type="number" min="0" max={field.max} step="1"
                    value={rom[field.key]} onChange={e => setRomField(field.key, e.target.value)} required
                  />
                </td>
              </tr>
            ))}
            <tr>
              <td><strong>Total arc</strong></td>
              <td><strong>{romTotal}°{preview ? ` → ${preview.meta.romPoints}/5` : ''}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="info-panel">
        <strong>Harris Hip Score (Harris 1969):</strong> pain /44, function /47,
        absence of deformity /4 (all four criteria or 0), range of motion /5 by
        total-arc bands. Bands: &lt;70 poor, 70–79 fair, 80–89 good, 90–100
        excellent. MCID ≈16 points post-THA (Singh 2016). Clinician-administered —
        includes a physical examination.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Harris Hip Score</span>
              <div><strong>{preview.primaryValue}/100</strong></div>
            </div>
            <span className={`interp-chip chip-${preview.meta.classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Complete all sections (grades, deformity criteria, and ROM degrees) to score.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

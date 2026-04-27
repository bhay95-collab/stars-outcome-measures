import { useState } from 'react'
import { calcFAC } from '../lib/clinical'

const FAC_OPTIONS = [
  { value: 0, desc: 'Non-functional ambulator — does not walk, or needs assistance of 2+ people' },
  { value: 1, desc: 'Dependent — requires continuous manual support from one person' },
  { value: 2, desc: 'Dependent — requires intermittent support from one person' },
  { value: 3, desc: 'Dependent — requires verbal cueing or stand-by supervision only' },
  { value: 4, desc: 'Independent on level surfaces (cannot manage stairs, slopes, or uneven ground independently)' },
  { value: 5, desc: 'Fully independent — on all surfaces including stairs and uneven ground' },
]

export default function FormFAC({ onSubmit, loading }) {
  const [level, setLevel] = useState('')

  const l = level !== '' ? parseInt(level, 10) : null
  const preview = l !== null ? calcFAC({ level: l }) : null
  const classColor = preview?.meta?.classColor ?? 'grey'

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ level: l }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Level</th>
            <th>Description</th>
            <th>Selected</th>
          </tr>
        </thead>
        <tbody>
          {FAC_OPTIONS.map(opt => (
            <tr key={opt.value}>
              <td>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="fac-level"
                    value={opt.value}
                    checked={level === String(opt.value)}
                    onChange={e => setLevel(e.target.value)}
                  />
                  <strong>{opt.value}</strong>
                </label>
              </td>
              <td>{opt.desc}</td>
              <td>
                {level === String(opt.value) && preview
                  ? <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
                  : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="info-panel">
        <strong>Functional Ambulation Classification (Holden 1984):</strong>{' '}
        Ordinal scale 0–5. Levels 0–2 = dependent; 3 = supervised; 4–5 = independent.
        No formal MCID established.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">FAC Level</span>
              <div><strong>{l}</strong><span> / 5</span></div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Select a FAC level to record the result.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

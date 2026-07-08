import { useState } from 'react'
import { calcACLSigns, EFFUSION_GRADES } from '../lib/clinical'

// ACL clinical signs — clinician-judged gate criteria: full active knee
// extension (achieved / not achieved) and effusion graded on the modified
// stroke test (Sturgill 2009). Saved as a normal assessment so the ACL phase
// gates and RTS battery read the latest recorded signs.
export default function FormACLSigns({ onSubmit, loading }) {
  const [extension, setExtension] = useState('')
  const [effusionGrade, setEffusionGrade] = useState('')

  const fullExtension = extension === '' ? null : extension === 'yes'
  const preview = fullExtension !== null && effusionGrade !== ''
    ? calcACLSigns({ fullExtension, effusionGrade })
    : null

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ fullExtension, effusionGrade }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field-group">
        <label htmlFor="acl-signs-extension" className="field-label">Full active knee extension (equal to the other side)</label>
        <select id="acl-signs-extension" className="field-input" value={extension} onChange={e => setExtension(e.target.value)} required>
          <option value="">Select…</option>
          <option value="yes">Achieved</option>
          <option value="no">Not achieved</option>
        </select>
      </div>

      <div className="field-group">
        <label htmlFor="acl-signs-effusion" className="field-label">Effusion — modified stroke test</label>
        <select id="acl-signs-effusion" className="field-input" value={effusionGrade} onChange={e => setEffusionGrade(e.target.value)} required>
          <option value="">Select grade…</option>
          {EFFUSION_GRADES.map(g => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      </div>

      <div className="info-panel">
        <strong>Gate criteria:</strong> full active extension and effusion trace–zero
        gate the early ACL rehab phases (van Melick 2016); effusion is graded on the
        modified stroke test (Sturgill 2009) and trace–zero is also the RTS battery
        pass level (Grindem 2016). Both are clinician judgements — recording them
        here feeds the phase gate and readiness battery.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">ACL clinical signs</span>
              <div><strong>{preview.interpretation}</strong></div>
            </div>
            <span className={`interp-chip chip-${preview.meta.classColor}`}>
              {preview.meta.gateMet ? 'Gate signs met' : 'Outstanding'}
            </span>
          </div>
        ) : (
          <em>Select both signs to record them.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

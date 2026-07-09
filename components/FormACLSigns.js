import { useState } from 'react'
import { calcACLSigns } from '../lib/clinical'

// ACL clinical signs — two clinician-judged checkboxes: full active knee
// extension and effusion trace–zero (modified stroke test, Sturgill 2009).
// Saved as a normal assessment so the ACL phase gates and RTS battery read the
// latest recorded signs. initialSigns pre-fills from the last saved entry.
export default function FormACLSigns({ onSubmit, loading, initialSigns }) {
  const [fullExtension, setFullExtension] = useState(initialSigns?.fullExtension === true)
  const [effusionTraceToZero, setEffusionTraceToZero] = useState(initialSigns?.effusionTraceToZero === true)

  const preview = calcACLSigns({ fullExtension, effusionTraceToZero })

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ fullExtension, effusionTraceToZero }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="acl-signs">
        <label>
          <input type="checkbox" checked={fullExtension} onChange={e => setFullExtension(e.target.checked)} />
          Full active knee extension (equal to the other side)
        </label>
        <label>
          <input type="checkbox" checked={effusionTraceToZero} onChange={e => setEffusionTraceToZero(e.target.checked)} />
          Effusion trace–zero (modified stroke test)
        </label>
      </div>

      <div className="info-panel">
        <strong>Gate criteria:</strong> both signs are clinician judgements — tick what
        is true today and save. They gate the early ACL rehab phases (van Melick 2016)
        and effusion trace–zero is the RTS battery pass level (Sturgill 2009; Grindem 2016).
      </div>

      <div className="result-box">
        {preview && (
          <div className="result-row">
            <span className="result-label">ACL clinical signs</span>
            <span className={`interp-chip chip-${preview.meta.classColor}`}>
              {preview.meta.gateMet ? 'Gate signs met' : 'Outstanding'}
            </span>
          </div>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save clinical signs'}
        </button>
      </div>
    </form>
  )
}

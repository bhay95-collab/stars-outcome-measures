import { useState } from 'react'
import { calcFTSTS } from '../lib/clinical'

export default function FormFTSTS({ onSubmit, loading }) {
  const [time, setTime] = useState('')

  const seconds = parseFloat(time) || null
  const preview = seconds > 0 ? calcFTSTS({ time: seconds }) : null
  const classColor = preview?.meta?.classColor ?? 'grey'

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ time: seconds }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field-group">
        <label className="field-label" htmlFor="ftsts-time">Time to complete 5 stands (seconds)</label>
        <input
          id="ftsts-time"
          className="field-input input-narrow"
          type="number"
          min="0.1"
          step="0.1"
          placeholder="sec"
          value={time}
          onChange={e => setTime(e.target.value)}
          required
        />
      </div>

      <div className="info-panel">
        <strong>Five Times Sit to Stand:</strong>{' '}
        Standard chair, arms crossed; time 5 full stands performed as quickly as possible.
        ≥12 s — assess falls risk further · &gt;15 s — associated with recurrent falls
        (community-dwelling ≥65 yr). Age norms (Bohannon 2006): 60s ≈ 11.4 s · 70s ≈ 12.6 s ·
        80s ≈ 14.8 s. MCID 2.3 s.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Five Times Sit to Stand</span>
              <div>Time: <strong>{preview.primaryValue}</strong> sec</div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Enter the time to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

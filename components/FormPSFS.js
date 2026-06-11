import { useState } from 'react'
import { calcPSFS, getPreviousPSFSActivities, PSFS_MAX_ACTIVITIES } from '../lib/clinical'

const SCORE_OPTIONS = Array.from({ length: 11 }, (_, i) => i)

function buildInitialRows(assessments) {
  const previous = getPreviousPSFSActivities(assessments)
  if (previous) {
    return previous.map(activity => ({ name: activity.name, score: null, previousScore: activity.score }))
  }
  return [
    { name: '', score: null, previousScore: null },
    { name: '', score: null, previousScore: null },
    { name: '', score: null, previousScore: null },
  ]
}

export default function FormPSFS({ assessments, onSubmit, loading }) {
  const [rows, setRows] = useState(() => buildInitialRows(assessments))
  const isFollowUp = rows.some(row => row.previousScore != null)

  const ratedRows = rows.filter(row => row.name.trim() && row.score != null)
  const preview = ratedRows.length
    ? calcPSFS({ activities: ratedRows.map(row => ({ name: row.name, score: row.score })) })
    : null
  const incomplete = rows.some(row => (row.name.trim() && row.score == null) || (!row.name.trim() && row.score != null))

  function updateRow(index, patch) {
    setRows(prev => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function addRow() {
    setRows(prev => (prev.length < PSFS_MAX_ACTIVITIES
      ? [...prev, { name: '', score: null, previousScore: null }]
      : prev))
  }

  function removeRow(index) {
    setRows(prev => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || incomplete || loading) return
    onSubmit({ activities: preview.meta.activities }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      {isFollowUp && (
        <div className="info-panel">
          <strong>Reassessment:</strong>{' '}
          The activities nominated at the previous PSFS have been carried over.
          Re-rate the same activities — swapping activities mid-episode makes scores non-comparable.
        </div>
      )}

      {rows.map((row, index) => (
        <div key={index} className="field-group" data-psfs-activity="">
          <label className="field-label" htmlFor={`psfs-activity-${index}`}>
            Activity {index + 1}
            {row.previousScore != null && (
              <span className="na-text">{' '}· previous rating {row.previousScore}/10</span>
            )}
          </label>
          <div data-psfs-activity-row="">
            <input
              id={`psfs-activity-${index}`}
              className="field-input"
              type="text"
              placeholder="e.g. Lifting my child, walking the dog, sitting through a movie"
              value={row.name}
              onChange={e => updateRow(index, { name: e.target.value })}
            />
            {rows.length > 1 && row.previousScore == null && (
              <button
                type="button"
                data-remove-activity=""
                onClick={() => removeRow(index)}
                aria-label={`Remove activity ${index + 1}`}
              >×</button>
            )}
          </div>
          <div data-numeric-scale="" role="radiogroup" aria-label={`Rating for activity ${index + 1} — 0 unable, 10 pre-injury level`}>
            {SCORE_OPTIONS.map(value => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={row.score === value}
                data-active={row.score === value ? '' : undefined}
                onClick={() => updateRow(index, { score: value })}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}

      {!isFollowUp && rows.length < PSFS_MAX_ACTIVITIES && (
        <button type="button" data-secondary="" onClick={addRow} style={{ width: 'auto', padding: '8px 16px' }}>
          Add activity
        </button>
      )}

      <div className="info-panel">
        <strong>PSFS (Stratford 1995):</strong>{' '}
        Patient nominates 3–5 important activities they struggle with; each rated
        0 (unable) to 10 (pre-injury level). Score = average. MCID ≈ 2 points
        (1.2 upper limb · 2.2 cervical radiculopathy). No severity bands by design —
        interpret change against the patient&apos;s own baseline.
      </div>

      <div className="result-box">
        {preview && !incomplete ? (
          <div className="result-row">
            <div>
              <span className="result-label">Patient Specific Functional Scale</span>
              <div>Average: <strong>{preview.primaryValue}/10</strong> ({ratedRows.length} activit{ratedRows.length === 1 ? 'y' : 'ies'})</div>
            </div>
            <span className={`interp-chip chip-${preview.meta.classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Name each activity and select its 0–10 rating to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || incomplete || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}

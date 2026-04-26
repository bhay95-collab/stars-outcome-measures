import { useState } from 'react'

function formatDob(iso) {
  if (!iso) return null
  const [year, month, day] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`
}

export default function PatientList({ patients, selectedId, onSelect, onNew }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? patients.filter(p =>
        (p.initials ?? '').toLowerCase().includes(query.trim().toLowerCase())
      )
    : patients

  const emptyText = patients.length === 0
    ? 'No patients yet.'
    : `No results for "${query}"`

  return (
    <div className="patient-card">
      <span className="section-label">Patients</span>

      <input
        className="field-input"
        type="text"
        placeholder="Search patients…"
        aria-label="Search patients"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      <ul>
        {filtered.length === 0 ? (
          <li role="presentation">{emptyText}</li>
        ) : (
          filtered.map(p => (
            <li
              key={p.id}
              role="button"
              tabIndex={0}
              aria-selected={p.id === selectedId}
              data-initials={p.initials?.charAt(0) ?? '?'}
              onClick={() => onSelect(p)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onSelect(p)}
            >
              <strong>{p.initials}</strong>
              {(p.dob || p.dob_year) && <span>{p.dob ? formatDob(p.dob) : `b. ${p.dob_year}`}</span>}
              {p.diagnosis && <span>{p.diagnosis}</span>}
            </li>
          ))
        )}
      </ul>

      <button type="button" onClick={onNew}>+ New Patient</button>
    </div>
  )
}

function calculateAge(dobYear) {
  if (!dobYear) return null
  return new Date().getFullYear() - dobYear
}

export default function PatientHeader({ patient, onViewChange, activeView }) {
  const age = calculateAge(patient.dob_year)
  const genderLabel =
    patient.gender === 'M' ? 'Male' :
    patient.gender === 'F' ? 'Female' :
    patient.gender ?? '—'

  return (
    <div className="patient-card">
      <div className="section-label">Patient Details</div>
      <div className="patient-grid">
        <div className="field-group">
          <span className="field-label">Patient</span>
          <span>{patient.initials ?? '—'}</span>
        </div>
        <div className="field-group">
          <span className="field-label">Age</span>
          <span>{age != null ? `${age} yrs` : '—'}</span>
        </div>
        <div className="field-group">
          <span className="field-label">Gender</span>
          <span>{genderLabel}</span>
        </div>
        <div className="field-group" data-field="diagnosis">
          <span className="field-label">Diagnosis</span>
          <span>{patient.diagnosis ?? '—'}</span>
        </div>
      </div>
      <div data-view-toggle="">
        <button
          type="button"
          data-active={activeView === 'summary' ? '' : undefined}
          onClick={() => onViewChange('summary')}
        >Summary</button>
        <button
          type="button"
          data-active={activeView === 'assessment' ? '' : undefined}
          onClick={() => onViewChange('assessment')}
        >Add Assessment</button>
      </div>
    </div>
  )
}

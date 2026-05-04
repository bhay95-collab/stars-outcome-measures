function calculateAge(dobYear) {
  if (!dobYear) return null
  return new Date().getFullYear() - dobYear
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PatientHeader({ patient, assessments, onViewChange, activeView, onDeletePatient }) {
  const age = calculateAge(patient.dob_year)
  const genderLabel =
    patient.gender === 'M' ? 'Male' :
    patient.gender === 'F' ? 'Female' :
    patient.gender ?? '—'
  const recoveryProgress = Math.min(30 + (assessments?.length ?? 0) * 8, 92)
  const riskLabel = assessments?.length ? 'Low risk' : 'Review'

  return (
    <section className="patient-summary-card">
      <div className="patient-summary-card__head">
        <h2>Patient Summary</h2>
        <button type="button" onClick={() => onViewChange('summary')}>View Full Report</button>
      </div>
      <div className="patient-summary-card__body">
        <div className="patient-photo" aria-hidden="true">{patient.initials?.slice(0, 2) ?? 'RM'}</div>
        <div className="patient-identity">
          <h3>{patient.initials ? `Patient ${patient.initials}` : 'Patient Profile'}</h3>
          <p>{patient.diagnosis ?? 'Patient Profile'}</p>
        </div>
        <div className="summary-divider" />
        <div className="summary-block">
          <span>Next Appointment</span>
          <strong>{formatDate(assessments?.[0]?.created_at || patient.created_at)}</strong>
          <small>{age != null ? `${age} yrs` : 'Age not set'} / {genderLabel}</small>
        </div>
        <div className="summary-divider" />
        <div className="summary-block">
          <span>Recovery Progress</span>
          <div className="mini-progress" aria-label={`${recoveryProgress}% recovery progress`}>
            <i style={{ width: `${recoveryProgress}%` }} />
          </div>
          <small>{recoveryProgress}% recovery progress</small>
        </div>
        <div className="summary-divider" />
        <div className="summary-block">
          <span>Alerts</span>
          <em>{riskLabel}</em>
          <button type="button" data-delete-btn="" onClick={() => onDeletePatient(patient.id)}>Delete Patient</button>
        </div>
      </div>
    </section>
  )
}

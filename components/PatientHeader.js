function calculateAge(dobYear) {
  if (!dobYear) return null
  return new Date().getFullYear() - dobYear
}

export default function PatientHeader({ patient, onRecord }) {
  const age = calculateAge(patient.dob_year)
  const genderLabel =
    patient.gender === 'M' ? 'Male' :
    patient.gender === 'F' ? 'Female' :
    patient.gender ?? '—'

  return (
    <>
      <style jsx>{styles}</style>
      <div className="patient-card">
        <div className="section-label">Patient Details</div>
        <div className="patient-grid">
          <div className="field-group">
            <span className="field-label">Patient</span>
            <span className="field-value">{patient.initials ?? '—'}</span>
          </div>
          <div className="field-group">
            <span className="field-label">Age</span>
            <span className="field-value">{age != null ? `${age} yrs` : '—'}</span>
          </div>
          <div className="field-group">
            <span className="field-label">Gender</span>
            <span className="field-value">{genderLabel}</span>
          </div>
          <div className="field-group">
            <span className="field-label">Diagnosis</span>
            <span className="field-value">{patient.diagnosis ?? '—'}</span>
          </div>
        </div>
        <button className="assessment-btn" onClick={onRecord}>+ New Assessment</button>
      </div>
    </>
  )
}

const styles = `
  .patient-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 20px 24px;
    margin-bottom: 20px;
    box-shadow: var(--shadow-sm);
  }

  .section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--color-subtle);
    margin-bottom: 14px;
  }

  .patient-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px 20px;
    margin-bottom: 16px;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .field-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--color-muted);
  }

  .field-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-ink);
    line-height: 1.4;
  }

  .assessment-btn {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    background: var(--color-primary);
    border: none;
    border-radius: var(--radius-sm);
    padding: 9px 18px;
    cursor: pointer;
    transition: opacity 0.15s;
    letter-spacing: 0.1px;
  }

  .assessment-btn:hover { opacity: 0.88; }
`

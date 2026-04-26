function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const today = new Date()
  const dob = new Date(dateOfBirth)
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

export default function PatientHeader({ patient, onRecord }) {
  const age = calculateAge(patient.date_of_birth)
  const genderLabel =
    patient.gender === 'M' ? 'Male' :
    patient.gender === 'F' ? 'Female' :
    patient.gender ?? null

  return (
    <>
      <style jsx>{styles}</style>
      <div className="header">
        <div className="header-left">
          <p className="eyebrow">Patient</p>
          <h2 className="name">{patient.first_name} {patient.last_name}</h2>
          <div className="meta">
            {age != null && <span className="meta-item">Age {age}</span>}
            {genderLabel && <span className="meta-item">{genderLabel}</span>}
            {patient.diagnosis && (
              <span className="diagnosis-chip">{patient.diagnosis}</span>
            )}
          </div>
        </div>
        <button className="assess-btn" onClick={onRecord}>+ New Assessment</button>
      </div>
    </>
  )
}

const styles = `
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--color-border);
  }

  .header-left { flex: 1; min-width: 0; }

  .eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--color-subtle);
    margin-bottom: 6px;
  }

  .name {
    font-family: 'Source Serif 4', serif;
    font-size: 26px;
    font-weight: 600;
    color: var(--color-ink);
    line-height: 1.2;
    letter-spacing: -0.4px;
    margin-bottom: 10px;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .meta-item {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 500;
    color: var(--color-muted);
    background: var(--color-surface-soft);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    padding: 3px 10px;
    line-height: 1.6;
  }

  .diagnosis-chip {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: var(--color-primary-dark);
    background: var(--color-primary-soft);
    border: 1px solid rgba(35,100,153,0.2);
    border-radius: 999px;
    padding: 3px 10px;
    line-height: 1.6;
  }

  .assess-btn {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    background: var(--color-primary);
    border: none;
    border-radius: var(--radius-sm);
    padding: 9px 18px;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: opacity 0.15s;
    letter-spacing: 0.1px;
  }

  .assess-btn:hover { opacity: 0.88; }
`

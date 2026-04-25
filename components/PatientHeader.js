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
          <h2 className="name">{patient.first_name} {patient.last_name}</h2>
          <div className="meta">
            {age != null && <span className="meta-item">Age {age}</span>}
            {genderLabel && <span className="meta-item">{genderLabel}</span>}
            {patient.condition && (
              <span className="meta-item condition">{patient.condition}</span>
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

  .header-left {
    flex: 1;
    min-width: 0;
  }

  .name {
    font-family: 'Source Serif 4', serif;
    font-size: 24px;
    font-weight: 600;
    color: var(--color-ink);
    line-height: 1.2;
    margin-bottom: 8px;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .meta-item {
    font-size: 12px;
    color: var(--color-muted);
    background: var(--color-surface-soft);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    padding: 4px 12px;
  }

  .condition {
    color: var(--color-primary);
    background: var(--color-primary-soft);
    border-color: var(--color-secondary);
  }

  .assess-btn {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-surface);
    background: var(--color-primary);
    border: none;
    border-radius: var(--radius-sm);
    padding: 8px 16px;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: opacity 0.15s;
  }

  .assess-btn:hover { opacity: 0.88; }
`

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const today = new Date()
  const dob = new Date(dateOfBirth)
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

export default function PatientHeader({ patient }) {
  const age = calculateAge(patient.date_of_birth)
  const genderLabel =
    patient.gender === 'M' ? 'Male' :
    patient.gender === 'F' ? 'Female' :
    patient.gender ?? null

  return (
    <>
      <style jsx>{styles}</style>
      <div className="header">
        <h2 className="name">{patient.first_name} {patient.last_name}</h2>
        <div className="meta">
          {age != null && <span className="meta-item">Age {age}</span>}
          {genderLabel && <span className="meta-item">{genderLabel}</span>}
          {patient.condition && (
            <span className="meta-item condition">{patient.condition}</span>
          )}
        </div>
      </div>
    </>
  )
}

const styles = `
  .header {
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--color-border);
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
    gap: 6px;
    align-items: center;
  }

  .meta-item {
    font-size: 12px;
    color: var(--color-muted);
    background: var(--color-surface-soft);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    padding: 3px 10px;
  }

  .condition {
    color: var(--color-primary);
    background: var(--color-primary-soft);
    border-color: var(--color-secondary);
  }
`

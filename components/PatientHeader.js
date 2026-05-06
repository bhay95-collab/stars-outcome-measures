import { buildPatientSummary, fmtDate } from '../lib/clinical/patientSummary'

function calculateAge(dobYear) {
  if (!dobYear) return null
  return new Date().getFullYear() - dobYear
}

function genderLabel(gender) {
  if (gender === 'M') return 'Male'
  if (gender === 'F') return 'Female'
  return gender || '-'
}

export default function PatientHeader({ patient, assessments, onViewReport, reportLoading }) {
  const age = calculateAge(patient.dob_year)
  const summary = buildPatientSummary(patient, assessments)

  return (
    <section className="patient-summary-card">
      <div className="patient-summary-card__head">
        <div>
          <h2>Name</h2>
          <p>{patient.initials || 'Unnamed patient'}</p>
        </div>
        <button type="button" onClick={onViewReport} disabled={reportLoading || assessments.length === 0}>
          {reportLoading ? 'Generating…' : 'View Full Report'}
        </button>
      </div>

      <div className="patient-summary-card__body patient-summary-card__body--real">
        <div className="summary-block">
          <span>Diagnosis</span>
          <strong>{patient.diagnosis || 'Not recorded'}</strong>
          <small>Primary clinical context</small>
        </div>
        <div className="summary-block">
          <span>Demographics</span>
          <strong>{age != null ? `${age} years` : 'Age not set'}</strong>
          <small>{genderLabel(patient.gender)}</small>
        </div>
        <div className="summary-block">
          <span>Latest Assessment</span>
          <strong>{fmtDate(summary.totals.latestDate)}</strong>
          <small>{summary.totals.assessments} assessment{summary.totals.assessments === 1 ? '' : 's'} recorded</small>
        </div>
        <div className="summary-block">
          <span>Measures Recorded</span>
          <strong>{summary.totals.measures}</strong>
          <small>{summary.totals.domains} clinical domain{summary.totals.domains === 1 ? '' : 's'} covered</small>
        </div>
      </div>
    </section>
  )
}

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
  const coverage = Math.min(100, Math.round((summary.totals.domains / 5) * 100))

  return (
    <section className="patient-summary-card">
      <div className="patient-summary-card__head">
        <div className="patient-summary-card__intro">
          <span className="section-label">Patient Overview</span>
          <h2>{patient.initials || 'Unnamed patient'}</h2>
          <p>{patient.diagnosis || 'Diagnosis not recorded'}</p>
        </div>
        <button type="button" onClick={onViewReport} disabled={reportLoading || assessments.length === 0}>
          {reportLoading ? 'Generating…' : 'View Full Report'}
        </button>
      </div>

      <div className="patient-summary-card__body patient-summary-card__body--real">
        <div className="patient-identity">
          <div className="patient-identity__mark" aria-hidden="true">
            <span>{patient.initials?.charAt(0) || '?'}</span>
            <i /><i /><i />
          </div>
          <small>Clinical snapshot</small>
          <strong>{coverage}% domain coverage</strong>
          <div className="mini-progress" aria-hidden="true"><i style={{ width: `${coverage}%` }} /></div>
        </div>
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

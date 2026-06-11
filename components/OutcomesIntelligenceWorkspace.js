import { useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { fmtDate } from '../lib/clinical/patientSummary'
import { exportServiceOutcomesPdf } from '../lib/clinical/serviceReportPdf'

function rateText(rate, met, eligible) {
  if (rate == null) return '—'
  return `${rate}% (${met}/${eligible})`
}

function CaseloadStats({ model }) {
  return (
    <div className="workspace-stat-grid">
      <div>
        <span>Patients with assessments</span>
        <strong>{model.totals.patientsWithAssessments} / {model.totals.patientCount}</strong>
      </div>
      <div>
        <span>Assessments recorded</span>
        <strong>{model.totals.assessmentCount}</strong>
      </div>
      <div>
        <span>Improvement rate</span>
        <strong>{model.overall.improvementRate == null ? '—' : `${model.overall.improvementRate}%`}</strong>
      </div>
      <div>
        <span>MCID achievement</span>
        <strong>{model.overall.mcidRate == null ? '—' : `${model.overall.mcidRate}%`}</strong>
      </div>
    </div>
  )
}

function HighlightsCard({ model }) {
  return (
    <section className="summary-card" aria-label="Service highlights">
      <div className="summary-card__head">
        <div>
          <h3>Service Highlights</h3>
          <p>
            {model.totals.firstAssessmentAt
              ? `Outcome data ${fmtDate(model.totals.firstAssessmentAt)} – ${fmtDate(model.totals.latestAssessmentAt)}.`
              : 'No outcome data recorded yet.'}
          </p>
        </div>
      </div>
      <ul className="app-insights__highlights">
        {model.highlights.map((text, index) => <li key={index}>{text}</li>)}
      </ul>
      <p className="app-insights__caution">{model.explanation.caution}</p>
    </section>
  )
}

function MeasureOutcomesCard({ model }) {
  return (
    <section className="summary-card" aria-label="Outcomes by measure">
      <div className="summary-card__head">
        <div>
          <h3>Outcomes by Measure</h3>
          <p>Baseline-to-latest change for every patient with repeat results on the same measure.</p>
        </div>
      </div>
      {model.measureRows.length ? (
        <div className="app-insights__table-scroll">
          <table className="app-insights__table">
            <thead>
              <tr>
                <th scope="col">Measure</th>
                <th scope="col">Patients</th>
                <th scope="col">Repeated</th>
                <th scope="col">Improved</th>
                <th scope="col">Declined</th>
                <th scope="col">MCID met</th>
              </tr>
            </thead>
            <tbody>
              {model.measureRows.map(row => (
                <tr key={row.measureId}>
                  <td>{row.name}</td>
                  <td>{row.patientCount}</td>
                  <td>{row.pairCount}</td>
                  <td data-tone={row.improvedCount ? 'good' : undefined}>
                    {row.pairCount ? `${row.improvedCount} (${row.improvementRate}%)` : '—'}
                  </td>
                  <td data-tone={row.declinedCount ? 'concern' : undefined}>
                    {row.pairCount ? row.declinedCount : '—'}
                  </td>
                  <td data-tone={row.mcidMetCount ? 'good' : undefined}>
                    {row.hasMcid ? rateText(row.mcidRate, row.mcidMetCount, row.mcidEligibleCount) : 'No published MCID'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="app-insights__empty">No outcome measures recorded yet. Saved assessments will appear here automatically.</p>
      )}
    </section>
  )
}

function CohortCard({ cohort }) {
  return (
    <article className="app-insights__cohort" data-tone={cohort.declinedCount ? 'concern' : cohort.pairCount ? 'good' : 'neutral'}>
      <header>
        <strong>{cohort.label}</strong>
        <span>{cohort.patientCount} patient{cohort.patientCount === 1 ? '' : 's'}</span>
      </header>
      <dl>
        <div>
          <dt>Assessments</dt>
          <dd>{cohort.assessmentCount}</dd>
        </div>
        <div>
          <dt>Improvement</dt>
          <dd>{cohort.pairCount ? `${cohort.improvedCount}/${cohort.pairCount} (${cohort.improvementRate}%)` : '—'}</dd>
        </div>
        <div>
          <dt>MCID met</dt>
          <dd>{cohort.mcidEligibleCount ? `${cohort.mcidMetCount}/${cohort.mcidEligibleCount} (${cohort.mcidRate}%)` : '—'}</dd>
        </div>
      </dl>
      {cohort.topMeasures.length > 0 && (
        <div className="app-insights__cohort-measures" aria-label="Most used measures">
          {cohort.topMeasures.map(measureId => <span key={measureId}>{measureId}</span>)}
        </div>
      )}
      <p>
        {cohort.pairCount
          ? cohort.declinedCount
            ? `${cohort.declinedCount} repeated measure${cohort.declinedCount === 1 ? '' : 's'} declined — review affected patients.`
            : 'Repeat data recorded across this cohort.'
          : 'No repeat results yet — change reporting unavailable for this cohort.'}
      </p>
    </article>
  )
}

export default function OutcomesIntelligenceWorkspace({ model, loading, onRefresh }) {
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  async function handleExport() {
    if (!model || exporting) return
    setExporting(true)
    setExportError('')
    try {
      await exportServiceOutcomesPdf({ model })
    } catch (error) {
      setExportError(`Report export failed: ${error.message}`)
    } finally {
      setExporting(false)
    }
  }

  if (loading && !model) {
    return (
      <div className="directory-stack app-insights" aria-busy="true">
        <section className="summary-card">
          <div className="summary-card__head">
            <div>
              <h3>Outcomes Intelligence</h3>
              <p>Loading caseload outcome data…</p>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (!model) {
    return (
      <div className="directory-stack app-insights">
        <section className="summary-card">
          <div className="summary-card__head">
            <div>
              <h3>Outcomes Intelligence</h3>
              <p>Caseload outcome data could not be loaded.</p>
            </div>
            <button type="button" className="app-insights__refresh" onClick={onRefresh}>
              <RefreshCw size={15} aria-hidden="true" /> Retry
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="directory-stack app-insights">
      <section className="summary-card" aria-label="Caseload overview">
        <div className="summary-card__head">
          <div>
            <h3>Caseload Overview</h3>
            <p>{model.explanation.short}</p>
          </div>
          <div className="app-insights__head-actions">
            <button type="button" className="app-insights__refresh" onClick={onRefresh} disabled={loading}>
              <RefreshCw size={15} aria-hidden="true" /> {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              type="button"
              className="app-insights__export"
              onClick={handleExport}
              disabled={exporting || !model.totals.assessmentCount}
            >
              <Download size={15} aria-hidden="true" /> {exporting ? 'Preparing…' : 'Export service report'}
            </button>
          </div>
        </div>
        <CaseloadStats model={model} />
        {exportError && <p className="app-insights__error" role="alert">{exportError}</p>}
      </section>

      <HighlightsCard model={model} />
      <MeasureOutcomesCard model={model} />

      <section className="summary-card" aria-label="Diagnosis cohorts">
        <div className="summary-card__head">
          <div>
            <h3>Diagnosis Cohorts</h3>
            <p>Outcomes grouped by recorded diagnosis. Patients without a mapped diagnosis are grouped separately.</p>
          </div>
        </div>
        {model.cohorts.length ? (
          <div className="app-insights__cohort-grid">
            {model.cohorts.map(cohort => <CohortCard key={cohort.label} cohort={cohort} />)}
          </div>
        ) : (
          <p className="app-insights__empty">No patients recorded yet.</p>
        )}
      </section>

      <section className="summary-card" aria-label="Method">
        <div className="summary-card__head">
          <div>
            <h3>How These Figures Are Calculated</h3>
          </div>
        </div>
        <p className="app-insights__method">{model.explanation.method}</p>
        {model.totals.patientReportedCount > 0 && (
          <p className="app-insights__method">
            {model.totals.patientReportedCount} of the included results were patient-reported follow-up responses; the remainder were recorded in clinic.
          </p>
        )}
        <p className="app-insights__caution">The exported report contains aggregate service data only — no patient identifiers are included.</p>
      </section>
    </div>
  )
}

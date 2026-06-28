import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MEASURES, DOMAIN_LABELS, measureHasDomain } from '../lib/clinical'
import Form10MWT from './Form10MWT'
import FormTUG from './FormTUG'
import FormBBS from './FormBBS'
import Form6MWT from './Form6MWT'
import FormFAC from './FormFAC'
import FormFSS from './FormFSS'
import FormHADS from './FormHADS'
import FormBarthel from './FormBarthel'
import FormStepTest from './FormStepTest'
import FormPASS from './FormPASS'
import FormFGA from './FormFGA'
import FormSARA from './FormSARA'
import FormPDQ8 from './FormPDQ8'
import FormABC from './FormABC'
import FormTIS from './FormTIS'
import FormMAS from './FormMAS'
import FormCOVS from './FormCOVS'
import FormBOOMER from './FormBOOMER'
import FormHiMAT from './FormHiMAT'
import FormAMP from './FormAMP'
import FormSCIM from './FormSCIM'
import FormRPQ from './FormRPQ'
import FormBIVI from './FormBIVI'
import FormISNCSCI from './FormISNCSCI'
import FormNPRS from './FormNPRS'
import FormPSFS from './FormPSFS'
import FormLEFS from './FormLEFS'
import FormBPFS from './FormBPFS'
import FormKOOS from './FormKOOS'
import FormHOOS from './FormHOOS'
import FormHAGOS from './FormHAGOS'
import FormFAAM from './FormFAAM'
import Form30STS from './Form30STS'
import FormFTSTS from './FormFTSTS'
import FormCMS from './FormCMS'
import FormCAIT from './FormCAIT'
import FormATRS from './FormATRS'
import FormFABQ from './FormFABQ'
import FormOMAS from './FormOMAS'
import FormQuadLSI from './FormQuadLSI'
import FormHopBattery from './FormHopBattery'
import FormLESS from './FormLESS'
import ThreeBarMotif from './ThreeBarMotif'

const IMPLEMENTED = new Set(['10MWT', 'TUG', 'BBS', '6MWT', 'FAC', 'FSS', 'HADS', 'Barthel', 'Step', 'PASS', 'FGA', 'SARA', 'PDQ8', 'ABC', 'TIS', 'MAS', 'COVS', 'BOOMER', 'HiMAT', 'AMP', 'SCIM', 'RPQ', 'BIVI', 'ISNCSCI', 'NPRS', 'PSFS', 'LEFS', 'BPFS', 'KOOS', 'HOOS', 'HAGOS', 'FAAM', '30STS', 'FTSTS', 'CMS', 'CAIT', 'ATRS', 'FABQ', 'OMAS', 'QuadLSI', 'HopBattery', 'LESS'])
const CATEGORY_ORDER = ['performance', 'independence', 'questionnaire']
const CATEGORY_LABELS = {
  performance: 'Performance',
  independence: 'Independence',
  questionnaire: 'Questionnaire',
}
const DOMAIN_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'rehab', label: DOMAIN_LABELS.rehab },
  { id: 'msk', label: DOMAIN_LABELS.msk },
]

function focusToDomain(focus) {
  return focus === 'rehab' || focus === 'msk' ? focus : 'all'
}

function getInitialMeasure(pathway) {
  const candidates = [
    pathway?.preferredMeasureId,
    ...(pathway?.missingMeasures ?? []).map(item => item.id),
    ...(pathway?.dueMeasures ?? []).map(item => item.id),
    ...(pathway?.recommendedMeasures ?? []).map(item => item.id),
    '10MWT',
  ]
  return candidates.find(id => id && IMPLEMENTED.has(id) && MEASURES[id]) ?? '10MWT'
}

function getSelectableMeasure(measureId) {
  return measureId && IMPLEMENTED.has(measureId) && MEASURES[measureId] ? measureId : null
}

function getPathwayStatus(pathway, measureId) {
  if (!pathway?.recommendedMeasures?.some(item => item.id === measureId)) return null
  if (pathway.dueMeasures?.some(item => item.id === measureId)) return { state: 'due', label: 'Due' }
  if (pathway.missingMeasures?.some(item => item.id === measureId)) return { state: 'missing', label: 'Baseline' }
  return { state: 'recorded', label: 'Pathway' }
}

function measuresInCat(cat, domain) {
  return Object.values(MEASURES).filter(m => m.category === cat && measureHasDomain(m, domain))
}

function makeEncounterId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `encounter-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function MeasureEntry({
  patient,
  userId,
  pathway,
  clinicalFocus,
  assessments,
  initialMeasureId,
  activeMeasureId,
  onSaved,
  onDone,
  onDirtyChange,
}) {
  const initialMeasure = getSelectableMeasure(activeMeasureId) ?? getSelectableMeasure(initialMeasureId) ?? getInitialMeasure(pathway)
  const [activeMeasure, setActiveMeasure] = useState(initialMeasure)
  const [activeCategory, setActiveCategory] = useState(MEASURES[initialMeasure]?.category ?? 'performance')
  // Default the domain filter to the clinician's focus, widening to All when
  // the requested measure (e.g. a pathway recommendation) sits outside it.
  const [domainFilter, setDomainFilter] = useState(() => {
    const preferred = focusToDomain(clinicalFocus)
    return measureHasDomain(MEASURES[initialMeasure], preferred) ? preferred : 'all'
  })
  const [completed, setCompleted] = useState(new Set())
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [assessmentSaveState, setAssessmentSaveState] = useState('idle')
  const [assessmentSaveNotice, setAssessmentSaveNotice] = useState(null)
  const [formResetCount, setFormResetCount] = useState(0)
  const [repeatWeeks, setRepeatWeeks] = useState(null)
  const assessmentSaveTimer = useRef(null)

  function clearAssessmentSaveTimer() {
    if (assessmentSaveTimer.current) {
      clearTimeout(assessmentSaveTimer.current)
      assessmentSaveTimer.current = null
    }
  }

  useEffect(() => {
    onDirtyChange?.(drafts.length > 0)
  }, [drafts.length, onDirtyChange])

  useEffect(() => clearAssessmentSaveTimer, [])

  useEffect(() => {
    const nextMeasure = getSelectableMeasure(activeMeasureId) ?? getSelectableMeasure(initialMeasureId) ?? getInitialMeasure(pathway)
    if (!drafts.length && nextMeasure && MEASURES[nextMeasure]) {
      setActiveMeasure(nextMeasure)
      setActiveCategory(MEASURES[nextMeasure].category)
      // Requested measure outside the current domain filter — widen so the
      // nav reflects the active form.
      setDomainFilter(prev => measureHasDomain(MEASURES[nextMeasure], prev) ? prev : 'all')
    }
  }, [activeMeasureId, drafts.length, initialMeasureId, patient?.id, pathway?.preferredMeasureId])

  function handleDomainChange(domain) {
    setDomainFilter(domain)
    if (measureHasDomain(MEASURES[activeMeasure], domain)) return
    const next =
      measuresInCat(activeCategory, domain).find(m => IMPLEMENTED.has(m.id)) ??
      Object.values(MEASURES).find(m => measureHasDomain(m, domain) && IMPLEMENTED.has(m.id))
    if (next) {
      setActiveMeasure(next.id)
      setActiveCategory(next.category)
    }
  }

  function handleSubmit(inputs, results) {
    if (assessmentSaveState === 'saving') return

    const measureId = activeMeasure
    const measureInfo = MEASURES[measureId]

    clearAssessmentSaveTimer()
    setError('')
    setAssessmentSaveState('saving')
    setAssessmentSaveNotice({
      title: `Saving ${measureInfo?.id ?? measureId} assessment`,
      detail: 'Adding the scored assessment to this encounter.',
    })

    assessmentSaveTimer.current = setTimeout(() => {
      setDrafts(prev => {
        const next = prev.filter(item => item.measure !== measureId)
        return [...next, { measure: measureId, inputs, results }]
      })
      setCompleted(prev => new Set([...prev, measureId]))
      setFormResetCount(prev => prev + 1)
      setAssessmentSaveState('saved')
      setAssessmentSaveNotice({
        title: `${measureInfo?.id ?? measureId} assessment saved`,
        detail: 'Fields reset. This assessment is pending in the encounter.',
      })

      assessmentSaveTimer.current = setTimeout(() => {
        setAssessmentSaveState('idle')
        setAssessmentSaveNotice(null)
        assessmentSaveTimer.current = null
      }, 4200)
    }, 450)
  }

  async function saveEncounter() {
    if (!drafts.length || loading) return
    setLoading(true)
    setError('')

    const encounterId = makeEncounterId()
    const encounterDate = new Date().toISOString()
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000
    const ALLOWED_REPEAT_WEEKS = new Set([2, 4, 6, 8])
    const validatedWeeks = repeatWeeks !== null && ALLOWED_REPEAT_WEEKS.has(Number(repeatWeeks)) ? Number(repeatWeeks) : null
    const nextAssessmentAt = validatedWeeks
      ? new Date(Date.now() + validatedWeeks * WEEK_MS).toISOString()
      : null
    const rows = drafts.map(item => ({
      user_id: userId,
      patient_id: patient.id,
      measure: item.measure,
      inputs: item.inputs,
      results: {
        ...item.results,
        meta: {
          ...(item.results?.meta ?? {}),
          encounterId,
          encounterDate,
        },
      },
      ...(nextAssessmentAt ? { next_assessment_at: nextAssessmentAt } : {}),
    }))

    const { data, error: insertError } = await supabase
      .from('assessments')
      .insert(rows)
      .select()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setDrafts([])
    setCompleted(new Set())
    setRepeatWeeks(null)
    setLoading(false)
    onSaved(data ?? [])
  }

  function handleDone() {
    if (drafts.length && !window.confirm('You have unsaved assessments in this encounter. Leave without saving?')) return
    setDrafts([])
    onDone()
  }

  const activeMeasureInfo = MEASURES[activeMeasure]
  const assessmentSaving = assessmentSaveState === 'saving'
  const formLoading = loading || assessmentSaving
  const formInstanceKey = `${activeMeasure}-${formResetCount}`

  return (
    <div data-measure-panel="">
      <div className="measure-header">
        <div className="measure-header__copy">
          <span className="section-label">Assessment Workspace</span>
          <div className="measure-title">New Encounter</div>
          <div className="measure-subtitle">
            {patient.initials} · Add one or more measures, then save the encounter.
          </div>
        </div>
        <div className="measure-header__stats" aria-label="Encounter status">
          {pathway && (
            <div>
              <span>Pathway</span>
              <strong>{pathway.coveragePercent}%</strong>
            </div>
          )}
          <div>
            <span>Active measure</span>
            <strong>{activeMeasureInfo?.id || activeMeasure}</strong>
          </div>
          <div>
            <span>Category</span>
            <strong>{CATEGORY_LABELS[activeCategory]}</strong>
          </div>
          <div>
            <span>Pending</span>
            <strong>{drafts.length}</strong>
          </div>
        </div>
        {pathway && (
          <div className="measure-header__pathway">
            <strong>Smart pathway guide</strong>
            <span>{pathway.explanation.badgeHelp}</span>
            {pathway.nextActions?.[0]?.detail && <em>{pathway.nextActions[0].detail}</em>}
          </div>
        )}
      </div>

      <div data-measure-domain-filter="" role="group" aria-label="Filter measures by clinical domain">
        <span>Domain</span>
        {DOMAIN_FILTERS.map(domain => (
          <button
            key={domain.id}
            type="button"
            data-active={domainFilter === domain.id ? '' : undefined}
            disabled={assessmentSaving}
            onClick={() => handleDomainChange(domain.id)}
          >
            {domain.label}
          </button>
        ))}
      </div>

      <div data-measure-tabs="">
        {CATEGORY_ORDER.map(cat => (
          <button
            key={cat}
            type="button"
            data-active={activeCategory === cat ? '' : undefined}
            disabled={assessmentSaving}
            onClick={() => setActiveCategory(cat)}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div data-measure-layout="">

        <nav data-measure-nav="" data-collapsed={navCollapsed ? '' : undefined}>
          <button
            type="button"
            data-nav-toggle=""
            onClick={() => setNavCollapsed(prev => !prev)}
            title={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {navCollapsed ? '›' : '‹'}
          </button>
          {CATEGORY_ORDER.filter(cat => cat === activeCategory).map(cat => (
            <div key={cat} data-measure-group="">
              {measuresInCat(cat, domainFilter).map(m => {
                const pathwayStatus = getPathwayStatus(pathway, m.id)
                return (
                  <button
                    key={m.id}
                    data-measure-btn=""
                    data-active={activeMeasure === m.id ? '' : undefined}
                    data-done={completed.has(m.id) ? '' : undefined}
                    data-unavailable={!IMPLEMENTED.has(m.id) ? '' : undefined}
                    data-pathway={pathwayStatus?.state}
                    disabled={assessmentSaving || !IMPLEMENTED.has(m.id)}
                    onClick={() => setActiveMeasure(m.id)}
                  >
                    <div data-measure-label="">
                      <span data-measure-abbr="">{m.id}</span>
                      {!navCollapsed && <span data-measure-name="">{m.name}</span>}
                    </div>
                    {pathwayStatus && !navCollapsed && <span data-pathway-badge={pathwayStatus.state}>{pathwayStatus.label}</span>}
                    {completed.has(m.id) && !navCollapsed && <span data-done-badge="">✓</span>}
                    {!IMPLEMENTED.has(m.id) && !navCollapsed && <span data-soon-badge="">Soon</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div data-measure-form="">
          {assessmentSaveNotice && (
            <div
              data-assessment-save-status=""
              data-state={assessmentSaveState}
              role="status"
              aria-live="polite"
            >
              <span data-assessment-save-icon="">
                {assessmentSaving ? (
                  <ThreeBarMotif size="xs" loading label="Saving assessment" />
                ) : '✓'}
              </span>
              <div>
                <strong>{assessmentSaveNotice.title}</strong>
                <p>{assessmentSaveNotice.detail}</p>
              </div>
            </div>
          )}
          {drafts.length > 0 && (
            <div data-encounter-draft="">
              <strong>Pending in this encounter:</strong>
              {drafts.map(item => <span key={item.measure}>{item.measure}</span>)}
            </div>
          )}
          <div key={formInstanceKey} data-assessment-form-instance="" data-saving={assessmentSaving ? '' : undefined} aria-busy={assessmentSaving}>
            {activeMeasure === '10MWT'   && <Form10MWT   patient={patient} onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'TUG'     && <FormTUG     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'BBS'     && <FormBBS     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === '6MWT'    && <Form6MWT    patient={patient} onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'FAC'     && <FormFAC     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'FSS'     && <FormFSS     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'HADS'    && <FormHADS    onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'Barthel' && <FormBarthel onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'Step'    && <FormStepTest onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'PASS'    && <FormPASS     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'FGA'     && <FormFGA      onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'SARA'    && <FormSARA     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'PDQ8'    && <FormPDQ8     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'ABC'     && <FormABC      onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'TIS'    && <FormTIS     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'MAS'    && <FormMAS     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'COVS'   && <FormCOVS    onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'BOOMER' && <FormBOOMER  onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'HiMAT'  && <FormHiMAT   onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'AMP'    && <FormAMP     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'SCIM'   && <FormSCIM    onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'RPQ'     && <FormRPQ      onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'BIVI'    && <FormBIVI     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'ISNCSCI' && <FormISNCSCI  patient={patient} onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'NPRS'    && <FormNPRS     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'PSFS'    && <FormPSFS     key={`psfs-${patient?.id}`} assessments={assessments} onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'LEFS'    && <FormLEFS     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'BPFS'    && <FormBPFS     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'KOOS'    && <FormKOOS     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'HOOS'    && <FormHOOS     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'HAGOS'   && <FormHAGOS    onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'FAAM'    && <FormFAAM     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === '30STS'   && <Form30STS    patient={patient} onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'FTSTS'   && <FormFTSTS    onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'CMS'     && <FormCMS      onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'CAIT'    && <FormCAIT     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'ATRS'    && <FormATRS     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'FABQ'    && <FormFABQ     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'OMAS'    && <FormOMAS     onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'QuadLSI'    && <FormQuadLSI    onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'HopBattery' && <FormHopBattery onSubmit={handleSubmit} loading={formLoading} />}
            {activeMeasure === 'LESS'       && <FormLESS       onSubmit={handleSubmit} loading={formLoading} />}
          </div>
          {error && <p className="error">{error}</p>}
        </div>

      </div>

      <div data-measure-footer="">
        <div className="encounter-repeat">
          <label htmlFor="encounter-repeat-select">Schedule repeat</label>
          <select
            id="encounter-repeat-select"
            value={repeatWeeks ?? ''}
            disabled={!drafts.length || loading || assessmentSaving}
            onChange={e => setRepeatWeeks(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Skip</option>
            <option value="2">2 weeks</option>
            <option value="4">4 weeks</option>
            <option value="6">6 weeks</option>
            <option value="8">8 weeks</option>
          </select>
        </div>
        <button type="button" data-secondary="" disabled={assessmentSaving} onClick={handleDone}>Done</button>
        <button type="button" data-save-encounter="" disabled={!drafts.length || loading || assessmentSaving} onClick={saveEncounter}>
          {loading ? (
            <span className="button-loading">
              <ThreeBarMotif size="xs" tone="light" loading label="Saving encounter" />
              Saving…
            </span>
          ) : `Save Encounter${drafts.length ? ` (${drafts.length})` : ''}`}
        </button>
      </div>
    </div>
  )
}

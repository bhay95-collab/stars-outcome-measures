import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MEASURES } from '../lib/clinical'
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
import ThreeBarMotif from './ThreeBarMotif'

const IMPLEMENTED = new Set(['10MWT', 'TUG', 'BBS', '6MWT', 'FAC', 'FSS', 'HADS', 'Barthel', 'Step', 'PASS', 'FGA', 'SARA', 'PDQ8', 'ABC', 'TIS', 'MAS', 'COVS', 'BOOMER', 'HiMAT', 'AMP', 'SCIM', 'RPQ', 'BIVI', 'ISNCSCI'])
const CATEGORY_ORDER = ['performance', 'independence', 'questionnaire']
const CATEGORY_LABELS = {
  performance: 'Performance',
  independence: 'Independence',
  questionnaire: 'Questionnaire',
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

function getPathwayStatus(pathway, measureId) {
  if (!pathway?.recommendedMeasures?.some(item => item.id === measureId)) return null
  if (pathway.dueMeasures?.some(item => item.id === measureId)) return { state: 'due', label: 'Due' }
  if (pathway.missingMeasures?.some(item => item.id === measureId)) return { state: 'missing', label: 'Baseline' }
  return { state: 'recorded', label: 'Pathway' }
}

function measuresInCat(cat) {
  return Object.values(MEASURES).filter(m => m.category === cat)
}

function makeEncounterId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `encounter-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function MeasureEntry({ patient, userId, pathway, onSaved, onDone, onDirtyChange }) {
  const initialMeasure = getInitialMeasure(pathway)
  const [activeMeasure, setActiveMeasure] = useState(initialMeasure)
  const [activeCategory, setActiveCategory] = useState(MEASURES[initialMeasure]?.category ?? 'performance')
  const [completed, setCompleted] = useState(new Set())
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [assessmentSaveState, setAssessmentSaveState] = useState('idle')
  const [assessmentSaveNotice, setAssessmentSaveNotice] = useState(null)
  const [formResetCount, setFormResetCount] = useState(0)
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
    const nextMeasure = getInitialMeasure(pathway)
    if (!drafts.length && nextMeasure && MEASURES[nextMeasure]) {
      setActiveMeasure(nextMeasure)
      setActiveCategory(MEASURES[nextMeasure].category)
    }
  }, [drafts.length, patient?.id, pathway?.preferredMeasureId])

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
              {measuresInCat(cat).map(m => {
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
          </div>
          {error && <p className="error">{error}</p>}
        </div>

      </div>

      <div data-measure-footer="">
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

import { useEffect, useState } from 'react'
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

function measuresInCat(cat) {
  return Object.values(MEASURES).filter(m => m.category === cat)
}

function makeEncounterId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `encounter-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function MeasureEntry({ patient, userId, onSaved, onDone, onDirtyChange }) {
  const [activeMeasure, setActiveMeasure] = useState('10MWT')
  const [activeCategory, setActiveCategory] = useState('performance')
  const [completed, setCompleted] = useState(new Set())
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [navCollapsed, setNavCollapsed] = useState(false)

  useEffect(() => {
    onDirtyChange?.(drafts.length > 0)
  }, [drafts.length, onDirtyChange])

  function handleSubmit(inputs, results) {
    setError('')
    setDrafts(prev => {
      const next = prev.filter(item => item.measure !== activeMeasure)
      return [...next, { measure: activeMeasure, inputs, results }]
    })
    setCompleted(prev => new Set([...prev, activeMeasure]))
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
          <div className="measure-header__motif"><ThreeBarMotif size="sm" /></div>
        </div>
      </div>

      <div data-measure-tabs="">
        {CATEGORY_ORDER.map(cat => (
          <button
            key={cat}
            type="button"
            data-active={activeCategory === cat ? '' : undefined}
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
              {measuresInCat(cat).map(m => (
                <button
                  key={m.id}
                  data-measure-btn=""
                  data-active={activeMeasure === m.id ? '' : undefined}
                  data-done={completed.has(m.id) ? '' : undefined}
                  data-unavailable={!IMPLEMENTED.has(m.id) ? '' : undefined}
                  disabled={!IMPLEMENTED.has(m.id)}
                  onClick={() => setActiveMeasure(m.id)}
                >
                  <div data-measure-label="">
                    <span data-measure-abbr="">{m.id}</span>
                    {!navCollapsed && <span data-measure-name="">{m.name}</span>}
                  </div>
                  {completed.has(m.id) && !navCollapsed && <span data-done-badge="">✓</span>}
                  {!IMPLEMENTED.has(m.id) && !navCollapsed && <span data-soon-badge="">Soon</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div data-measure-form="">
          {drafts.length > 0 && (
            <div data-encounter-draft="">
              <strong>Pending in this encounter:</strong>
              {drafts.map(item => <span key={item.measure}>{item.measure}</span>)}
            </div>
          )}
          {activeMeasure === '10MWT'   && <Form10MWT   patient={patient} onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'TUG'     && <FormTUG     onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'BBS'     && <FormBBS     onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === '6MWT'    && <Form6MWT    patient={patient} onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'FAC'     && <FormFAC     onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'FSS'     && <FormFSS     onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'HADS'    && <FormHADS    onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'Barthel' && <FormBarthel onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'Step'    && <FormStepTest onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'PASS'    && <FormPASS     onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'FGA'     && <FormFGA      onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'SARA'    && <FormSARA     onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'PDQ8'    && <FormPDQ8     onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'ABC'     && <FormABC      onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'TIS'    && <FormTIS     onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'MAS'    && <FormMAS     onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'COVS'   && <FormCOVS    onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'BOOMER' && <FormBOOMER  onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'HiMAT'  && <FormHiMAT   onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'AMP'    && <FormAMP     onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'SCIM'   && <FormSCIM    onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'RPQ'     && <FormRPQ      onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'BIVI'    && <FormBIVI     onSubmit={handleSubmit} loading={loading} />}
          {activeMeasure === 'ISNCSCI' && <FormISNCSCI  patient={patient} onSubmit={handleSubmit} loading={loading} />}
          {error && <p className="error">{error}</p>}
        </div>

      </div>

      <div data-measure-footer="">
        <button type="button" data-secondary="" onClick={handleDone}>Done</button>
        <button type="button" data-save-encounter="" disabled={!drafts.length || loading} onClick={saveEncounter}>
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

import { useState } from 'react'
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

export default function MeasureEntry({ patient, userId, onSaved, onDone }) {
  const [activeMeasure, setActiveMeasure] = useState('10MWT')
  const [activeCategory, setActiveCategory] = useState('performance')
  const [completed, setCompleted] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [navCollapsed, setNavCollapsed] = useState(true)

  async function handleSubmit(inputs, results) {
    setLoading(true)
    setError('')

    const { data, error: insertError } = await supabase
      .from('assessments')
      .insert({
        user_id: userId,
        patient_id: patient.id,
        measure: activeMeasure,
        inputs,
        results,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setCompleted(prev => new Set([...prev, activeMeasure]))
    setLoading(false)
    onSaved(data)
  }

  return (
    <div data-measure-panel="">
      <div className="measure-header">
        <div>
          <div className="measure-title">New Assessment</div>
          <div className="measure-subtitle">{patient.initials}</div>
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
        <button type="button" data-secondary="" onClick={onDone}>Done</button>
      </div>
    </div>
  )
}

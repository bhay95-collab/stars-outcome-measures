import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { MEASURES } from '../lib/clinical'
import Form10MWT from './Form10MWT'

const IMPLEMENTED = new Set(['10MWT'])
const CATEGORY_ORDER = ['performance', 'independence', 'questionnaire']
const CATEGORY_LABELS = {
  performance: 'Performance',
  independence: 'Independence',
  questionnaire: 'Questionnaire',
}

function measuresInCat(cat) {
  return Object.values(MEASURES).filter(m => m.category === cat)
}

export default function MeasureEntry({ patient, userId, onSaved, onClose }) {
  const [activeMeasure, setActiveMeasure] = useState('10MWT')
  const [completed, setCompleted] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(inputs, results) {
    if (!userId) {
      setError('Session error — please sign out and sign back in.')
      return
    }
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
    <div className="modal" onClick={onClose}>
      <div className="modal-content" data-wide="" onClick={e => e.stopPropagation()}>

        <div className="measure-header">
          <div>
            <div className="measure-title">New Assessment</div>
            <div className="measure-subtitle">{patient.initials}</div>
          </div>
          <button aria-label="Close" onClick={onClose}>×</button>
        </div>

        <div data-measure-layout="">

          <nav data-measure-nav="">
            {CATEGORY_ORDER.map(cat => (
              <div key={cat} data-measure-group="">
                <span className="section-label">{CATEGORY_LABELS[cat]}</span>
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
                    <span data-measure-abbr="">{m.id}</span>
                    <span data-measure-name="">{m.name}</span>
                    {completed.has(m.id) && <span data-done-badge="">✓</span>}
                    {!IMPLEMENTED.has(m.id) && <span data-soon-badge="">Soon</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div data-measure-form="">
            {activeMeasure === '10MWT' && (
              <Form10MWT patient={patient} onSubmit={handleSubmit} loading={loading} />
            )}
            {error && <p className="error">{error}</p>}
          </div>

        </div>

        <div data-measure-footer="">
          <button type="button" onClick={onClose}>Done</button>
        </div>

      </div>
    </div>
  )
}

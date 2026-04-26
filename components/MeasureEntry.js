import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Form10MWT from './Form10MWT'

export default function MeasureEntry({ patient, userId, onSaved, onClose }) {
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
        measure: '10MWT',
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

    onSaved(data)
  }

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" data-wide onClick={e => e.stopPropagation()}>
        <div className="measure-header">
          <div>
            <div className="measure-title">10 Metre Walk Test</div>
            <div className="measure-subtitle">Time the middle 10 m of a 20 m walkway. Speed and % predicted auto-calculate.</div>
          </div>
          <button aria-label="Close" onClick={onClose}>×</button>
        </div>
        <Form10MWT patient={patient} onSubmit={handleSubmit} loading={loading} />
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}

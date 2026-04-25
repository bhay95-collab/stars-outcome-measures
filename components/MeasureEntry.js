import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Form10MWT from './Form10MWT'

export default function MeasureEntry({ patient, onSaved, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(inputs, results) {
    setLoading(true)
    setError('')

    const { data, error: insertError } = await supabase
      .from('assessments')
      .insert({
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
    <>
      <style jsx>{styles}</style>
      <div className="overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Record measure</h2>
            <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
          </div>
          <Form10MWT patient={patient} onSubmit={handleSubmit} loading={loading} />
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </>
  )
}

const styles = `
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(31, 41, 51, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 24px;
  }

  .modal {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    width: 100%;
    max-width: 480px;
    padding: 32px;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .modal-title {
    font-family: 'Source Serif 4', serif;
    font-size: 20px;
    font-weight: 600;
    color: var(--color-ink);
  }

  .close-btn {
    font-size: 20px;
    color: var(--color-subtle);
    background: none;
    border: none;
    cursor: pointer;
    line-height: 1;
    padding: 4px;
    transition: color 0.15s;
  }

  .close-btn:hover { color: var(--color-ink); }

  .error {
    font-size: 13px;
    color: #b91c1c;
    margin-top: 12px;
    line-height: 1.4;
  }
`

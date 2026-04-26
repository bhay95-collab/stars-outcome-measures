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
    <>
      <style jsx>{styles}</style>
      <div className="overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2 className="measure-title">10 Metre Walk Test</h2>
              <p className="measure-subtitle">Time the middle 10 m of a 20 m walkway. Speed and % predicted auto-calculate.</p>
            </div>
            <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
          </div>
          <div className="modal-body">
            <Form10MWT patient={patient} onSubmit={handleSubmit} loading={loading} />
            {error && <p className="error">{error}</p>}
          </div>
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
    align-items: flex-start;
    justify-content: center;
    z-index: 100;
    padding: 32px 24px;
    overflow-y: auto;
  }

  .modal {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    width: 100%;
    max-width: 900px;
    margin: auto;
    flex-shrink: 0;
  }

  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 24px 24px 0;
    margin-bottom: 20px;
  }

  .measure-title {
    font-family: 'Source Serif 4', serif;
    font-size: 22px;
    font-weight: 600;
    color: var(--color-ink);
    letter-spacing: -0.3px;
  }

  .measure-subtitle {
    font-size: 12px;
    color: var(--color-subtle);
    margin-top: 2px;
  }

  .close-btn {
    font-size: 22px;
    color: var(--color-subtle);
    background: none;
    border: none;
    cursor: pointer;
    line-height: 1;
    padding: 4px 8px;
    flex-shrink: 0;
    transition: color 0.15s;
  }

  .close-btn:hover { color: var(--color-ink); }

  .modal-body { padding: 0 24px 24px; }

  .error {
    font-size: 13px;
    color: #b5451b;
    margin-top: 12px;
    padding: 8px 12px;
    background: #fdf0ec;
    border: 1px solid #f0b8a2;
    border-radius: var(--radius-sm);
    line-height: 1.4;
  }
`

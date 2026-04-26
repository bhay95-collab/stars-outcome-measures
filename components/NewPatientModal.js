import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CONDITION_OPTIONS } from '../lib/clinical'

export default function NewPatientModal({ userId, onCreated, onClose }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    diagnosis: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.first_name.trim() || !form.last_name.trim() || !form.date_of_birth) {
      setError('First name, last name, and date of birth are required.')
      return
    }

    setLoading(true)
    setError('')

    const { data, error: insertError } = await supabase
      .from('patients')
      .insert({
        user_id: userId,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        date_of_birth: form.date_of_birth,
        gender: form.gender || null,
        diagnosis: form.diagnosis || null,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    onCreated(data)
  }

  return (
    <>
      <style jsx>{styles}</style>
      <div className="overlay" onClick={onClose}>
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="np-modal-title"
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2 id="np-modal-title" className="modal-title">New patient</h2>
            <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="field">
                <label htmlFor="np-first">First name *</label>
                <input
                  id="np-first"
                  value={form.first_name}
                  onChange={e => set('first_name', e.target.value)}
                  placeholder="Jane"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="np-last">Last name *</label>
                <input
                  id="np-last"
                  value={form.last_name}
                  onChange={e => set('last_name', e.target.value)}
                  placeholder="Smith"
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label htmlFor="np-dob">Date of birth *</label>
                <input
                  id="np-dob"
                  type="date"
                  value={form.date_of_birth}
                  onChange={e => set('date_of_birth', e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="np-gender">Gender</label>
                <select
                  id="np-gender"
                  value={form.gender}
                  onChange={e => set('gender', e.target.value)}
                >
                  <option value="">— Select —</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="np-condition">Condition</label>
              <select
                id="np-condition"
                value={form.diagnosis}
                onChange={e => set('diagnosis', e.target.value)}
              >
                <option value="">— Select —</option>
                {CONDITION_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {error && <p className="error">{error}</p>}

            <div className="actions">
              <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Creating…' : 'Create patient'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

const styles = `
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 32, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 24px;
    backdrop-filter: blur(2px);
  }

  .modal {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: 0 20px 48px rgba(31,41,51,0.14);
    width: 100%;
    max-width: 520px;
    padding: 0;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 28px 20px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface-soft);
  }

  .modal-title {
    font-family: 'Source Serif 4', serif;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-ink);
    letter-spacing: -0.2px;
  }

  .close-btn {
    font-size: 18px;
    line-height: 1;
    color: var(--color-subtle);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    transition: color 0.15s, background 0.15s;
  }

  .close-btn:hover {
    color: var(--color-ink);
    background: var(--color-border);
  }

  .modal form {
    padding: 24px 28px 28px;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  label {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: var(--color-muted);
  }

  input, select {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: var(--color-ink);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    height: 40px;
    padding: 0 12px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    width: 100%;
    box-sizing: border-box;
  }

  input:focus, select:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(35,100,153,0.1);
  }

  input::placeholder { color: var(--color-subtle); font-size: 13px; }

  .error {
    font-size: 12px;
    color: #b91c1c;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    margin-bottom: 16px;
    line-height: 1.4;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
  }

  .cancel-btn {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-muted);
    background: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 8px 20px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }

  .cancel-btn:hover {
    color: var(--color-ink);
    border-color: var(--color-muted);
  }

  .submit-btn {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    background: var(--color-primary);
    border: none;
    border-radius: var(--radius-sm);
    padding: 8px 20px;
    cursor: pointer;
    transition: opacity 0.15s;
    letter-spacing: 0.1px;
  }

  .submit-btn:hover { opacity: 0.88; }
  .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
`

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CONDITION_OPTIONS } from '../lib/clinical'

export default function NewPatientModal({ userId, onCreated, onClose }) {
  const [form, setForm] = useState({
    initials: '',
    dob_year: '',
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
    if (!form.initials.trim()) {
      setError('Initials are required.')
      return
    }

    setLoading(true)
    setError('')

    const { data, error: insertError } = await supabase
      .from('patients')
      .insert({
        user_id: userId,
        initials: form.initials.trim(),
        dob_year: form.dob_year ? parseInt(form.dob_year, 10) : null,
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
    <div className="modal" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-patient-title"
        onClick={e => e.stopPropagation()}
      >
        <header>
          <span id="new-patient-title" className="section-label">New Patient</span>
          <button aria-label="Close" onClick={onClose}>×</button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="patient-grid">
            <div className="field-group">
              <label htmlFor="np-initials" className="field-label">Initials *</label>
              <input
                id="np-initials"
                className="field-input"
                value={form.initials}
                onChange={e => set('initials', e.target.value.toUpperCase())}
                placeholder="e.g. BH"
                maxLength={6}
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="np-dob-year" className="field-label">Birth year</label>
              <input
                id="np-dob-year"
                className="field-input"
                type="number"
                value={form.dob_year}
                onChange={e => set('dob_year', e.target.value)}
                placeholder="e.g. 1985"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div className="field-group">
              <label htmlFor="np-gender" className="field-label">Gender</label>
              <select
                id="np-gender"
                className="field-input"
                value={form.gender}
                onChange={e => set('gender', e.target.value)}
              >
                <option value="">— Select —</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="np-diagnosis" className="field-label">Diagnosis</label>
              <select
                id="np-diagnosis"
                className="field-input"
                value={form.diagnosis}
                onChange={e => set('diagnosis', e.target.value)}
              >
                <option value="">— Select —</option>
                {CONDITION_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <div>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

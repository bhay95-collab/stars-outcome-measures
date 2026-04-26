import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CONDITION_OPTIONS } from '../lib/clinical'

export default function NewPatientModal({ userId, onCreated, onClose }) {
  const [form, setForm] = useState({
    firstName: '',
    lastInitial: '',
    dob: '',
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
    if (!form.firstName.trim()) {
      setError('First name is required.')
      return
    }

    const initials = [
      form.firstName.trim(),
      form.lastInitial.trim() ? form.lastInitial.trim().charAt(0).toUpperCase() + '.' : '',
    ].filter(Boolean).join(' ')

    const dobYear = form.dob ? new Date(form.dob).getFullYear() : null

    setLoading(true)
    setError('')

    const { data, error: insertError } = await supabase
      .from('patients')
      .insert({
        user_id: userId,
        initials,
        dob_year: dobYear,
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
              <label htmlFor="np-firstname" className="field-label">First name *</label>
              <input
                id="np-firstname"
                className="field-input"
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
                placeholder="e.g. Benjamin"
                maxLength={40}
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="np-lastinitial" className="field-label">Last initial</label>
              <input
                id="np-lastinitial"
                className="field-input"
                value={form.lastInitial}
                onChange={e => set('lastInitial', e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase())}
                placeholder="e.g. H"
                maxLength={1}
              />
            </div>
            <div className="field-group">
              <label htmlFor="np-dob" className="field-label">Date of birth</label>
              <input
                id="np-dob"
                className="field-input"
                type="date"
                value={form.dob}
                onChange={e => set('dob', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
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

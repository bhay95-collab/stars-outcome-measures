import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CONDITION_OPTIONS } from '../lib/clinical'
import {
  dateInputValue,
  dobYearFromDateInput,
  normalizePatientLabel,
  PATIENT_GENDER_OPTIONS,
  validateOptionalPatientEmail,
} from '../lib/patientDetails'
import ThreeBarMotif from './ThreeBarMotif'

export default function EditPatientModal({ userId, patient, onUpdated, onClose }) {
  const [form, setForm] = useState({
    initials: patient?.initials ?? '',
    email: patient?.email ?? '',
    dob: dateInputValue(patient?.dob),
    gender: patient?.gender ?? '',
    diagnosis: patient?.diagnosis ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const initials = normalizePatientLabel(form.initials)
    if (!initials) {
      setError('Patient label / initials is required.')
      return
    }

    const patientEmail = validateOptionalPatientEmail(form.email)
    if (patientEmail.error) {
      setError(patientEmail.error)
      return
    }

    if (!patient?.id || !userId) {
      setError('Patient record could not be updated. Please refresh and try again.')
      return
    }

    const payload = {
      initials,
      email: patientEmail.email,
      dob: form.dob || null,
      dob_year: dobYearFromDateInput(form.dob),
      gender: form.gender || null,
      diagnosis: form.diagnosis || null,
    }

    setLoading(true)
    setError('')

    const { data, error: updateError } = await supabase
      .from('patients')
      .update(payload)
      .eq('id', patient.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    if (!data) {
      setError('Patient record could not be updated. Please try again.')
      setLoading(false)
      return
    }

    onUpdated(data)
  }

  return (
    <div className="modal" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-patient-title"
        aria-describedby="edit-patient-helper"
        onClick={e => e.stopPropagation()}
      >
        <header>
          <span id="edit-patient-title" className="section-label">Edit patient details</span>
          <button type="button" aria-label="Close" onClick={onClose}>×</button>
        </header>
        <p id="edit-patient-helper" className="modal-helper">
          Update demographics and pathway context used by reports, predicted values, and recommended measures.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="patient-grid">
            <div className="field-group">
              <label htmlFor="ep-initials" className="field-label">Patient label / initials *</label>
              <input
                id="ep-initials"
                className="field-input"
                value={form.initials}
                onChange={e => set('initials', e.target.value)}
                placeholder="e.g. Benjamin H. or BH"
                maxLength={80}
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="ep-dob" className="field-label">Date of birth</label>
              <input
                id="ep-dob"
                className="field-input"
                type="date"
                value={form.dob}
                onChange={e => set('dob', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="field-group">
              <label htmlFor="ep-email" className="field-label">Patient email</label>
              <input
                id="ep-email"
                className="field-input"
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="patient@example.com"
                maxLength={254}
                autoComplete="email"
              />
              <p className="field-note">Optional. Used only to send secure questionnaire links.</p>
            </div>
            <div className="field-group">
              <label htmlFor="ep-gender" className="field-label">Gender</label>
              <select
                id="ep-gender"
                className="field-input"
                value={form.gender}
                onChange={e => set('gender', e.target.value)}
              >
                <option value="">— Select —</option>
                {PATIENT_GENDER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="field-group" data-field="diagnosis">
              <label htmlFor="ep-diagnosis" className="field-label">Diagnosis</label>
              <select
                id="ep-diagnosis"
                className="field-input"
                value={form.diagnosis}
                onChange={e => set('diagnosis', e.target.value)}
              >
                <option value="">— Select —</option>
                {CONDITION_OPTIONS.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
              <p className="field-note">
                Diagnosis drives pathway recommendations and MCID context where available.
              </p>
            </div>
          </div>

          {error && <p className="error" role="alert">{error}</p>}

          <div>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading}>
              {loading ? (
                <span className="button-loading">
                  <ThreeBarMotif size="xs" tone="light" loading label="Saving patient details" />
                  Saving…
                </span>
              ) : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

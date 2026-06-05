export const PATIENT_GENDER_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'Other', label: 'Other' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizePatientLabel(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

export function normalizePatientEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function validateOptionalPatientEmail(value) {
  const email = normalizePatientEmail(value)
  if (!email) return { email: null }
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return { error: 'Enter a valid patient email address.' }
  }
  return { email }
}

export function dateInputValue(value) {
  return value ? String(value).slice(0, 10) : ''
}

export function dobYearFromDateInput(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date.getFullYear()
}

export function sortPatientsByLabel(a, b) {
  return (a.initials ?? '').localeCompare(b.initials ?? '')
}

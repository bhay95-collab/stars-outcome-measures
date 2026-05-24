export const PATIENT_GENDER_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'Other', label: 'Other' },
]

export function normalizePatientLabel(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
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

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../pages/app'
import { supabase } from '../lib/supabase'

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
  isReady: true,
  query: {},
}

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}))

jest.mock('../components/NewPatientModal', () => function NewPatientModalMock() {
  return <div>New patient modal</div>
})
jest.mock('../components/EditPatientModal', () => function EditPatientModalMock() {
  return <div>Edit patient modal</div>
})
jest.mock('../components/ProfileModal', () => function ProfileModalMock() {
  return <div>Profile modal</div>
})
jest.mock('../components/PatientHeader', () => function PatientHeaderMock() {
  return <div>Patient header</div>
})
jest.mock('../components/SummaryTab', () => function SummaryTabMock({ mode }) {
  return <div>Summary tab {mode}</div>
})
jest.mock('../components/MeasureEntry', () => function MeasureEntryMock({ patient, activeMeasureId, onDirtyChange }) {
  return (
    <div>
      <div>Measure entry {patient.initials} {activeMeasureId || 'auto'}</div>
      <button type="button" onClick={() => onDirtyChange(true)}>Mark dirty</button>
    </div>
  )
})
jest.mock('../components/SubscriptionWall', () => function SubscriptionWallMock() {
  return <div>Subscription required</div>
})
jest.mock('../components/WheelchairPrescriptionTool', () => function WheelchairPrescriptionToolMock({ patient }) {
  return <div>Wheelchair tool {patient.initials}</div>
})
jest.mock('../lib/clinical/patientReportPdf', () => ({
  exportPatientSummaryPdf: jest.fn(),
}))

const patientOne = { id: 'patient-1', initials: 'AB', diagnosis: 'Stroke', dob_year: 1970 }
const patientTwo = { id: 'patient-2', initials: 'CD', diagnosis: 'SCI', dob_year: 1980 }

function queryForTable(table, { patients = [], assessmentsByPatient = {} }) {
  const filters = {}
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn((field, value) => {
      filters[field] = value
      return query
    }),
    maybeSingle: jest.fn(() => {
      if (table === 'profiles') {
        return Promise.resolve({
          data: {
            trial_end_date: '2999-01-01T00:00:00.000Z',
            first_name: 'Ada',
            last_name: 'Clinician',
            avatar_url: null,
          },
          error: null,
        })
      }
      if (table === 'subscriptions') return Promise.resolve({ data: null, error: null })
      return Promise.resolve({ data: null, error: null })
    }),
    order: jest.fn(() => {
      if (table === 'patients') return Promise.resolve({ data: patients, error: null })
      if (table === 'assessments') {
        return Promise.resolve({ data: assessmentsByPatient[filters.patient_id] ?? [], error: null })
      }
      return Promise.resolve({ data: [], error: null })
    }),
  }
  return query
}

function mockAuthenticatedApp({ patients = [], assessmentsByPatient = {} } = {}) {
  supabase.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: 'user-1', email: 'clinician@example.com' } } },
  })
  supabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  })
  supabase.from.mockImplementation(table => queryForTable(table, { patients, assessmentsByPatient }))
}

describe('patient-first app navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouter.isReady = true
    mockRouter.query = {}
  })

  it('restores patient, section, and active measure from query params', async () => {
    mockRouter.query = { patient: 'patient-2', section: 'measures', measure: 'TUG' }
    mockAuthenticatedApp({ patients: [patientOne, patientTwo] })

    render(<App />)

    expect(await screen.findByText('Measure entry CD TUG')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /outcome measures/i })).toBeInTheDocument()
  })

  it('opens Outcome Measures with the clicked pathway measure active', async () => {
    const user = userEvent.setup()
    mockRouter.query = { patient: 'patient-1', section: 'pathway' }
    mockAuthenticatedApp({ patients: [patientOne] })

    render(<App />)

    const tugButton = await screen.findByRole('button', { name: /TUG\s+Timed Up and Go/i })
    await user.click(tugButton)

    expect(await screen.findByText('Measure entry AB TUG')).toBeInTheDocument()
    expect(mockRouter.push).toHaveBeenCalledWith(
      { pathname: '/app', query: { section: 'measures', patient: 'patient-1', measure: 'TUG' } },
      undefined,
      { shallow: true },
    )
  })

  it('keeps patient-specific sections disabled when no patient exists', async () => {
    mockAuthenticatedApp({ patients: [] })

    render(<App />)

    expect(await screen.findByRole('heading', { name: /create your first patient/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Overview/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Smart Pathway/i })).toBeDisabled()
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        { pathname: '/app', query: { section: 'directory' } },
        undefined,
        { shallow: true },
      )
    })
  })

  it('prompts before leaving Outcome Measures with unsaved encounter drafts', async () => {
    const user = userEvent.setup()
    mockRouter.query = { patient: 'patient-1', section: 'measures', measure: 'TUG' }
    mockAuthenticatedApp({ patients: [patientOne] })

    render(<App />)

    await screen.findByText('Measure entry AB TUG')
    await user.click(screen.getByRole('button', { name: /mark dirty/i }))
    await user.click(screen.getByRole('button', { name: /Patient Directory/i }))

    expect(screen.getByText(/unsaved assessments in this encounter/i)).toBeInTheDocument()
  })
})

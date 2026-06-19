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
const abcAssessment = {
  id: 'abc-assessment-1',
  patient_id: 'patient-1',
  measure: 'ABC',
  inputs: { items: Array(16).fill(80) },
  results: { primaryValue: 80, primaryUnit: '%', interpretation: 'Moderate functioning', meta: { classColor: 'amber' } },
  created_at: '2999-05-28T00:00:00.000Z',
}

const defaultProfile = {
  trial_end_date: '2999-01-01T00:00:00.000Z',
  first_name: 'Ada',
  last_name: 'Clinician',
  avatar_url: null,
}

function queryForTable(table, { patients = [], assessmentsByPatient = {}, profile = defaultProfile }) {
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
          data: profile,
          error: null,
        })
      }
      if (table === 'subscriptions') return Promise.resolve({ data: null, error: null })
      if (table === 'app_store_subscriptions') return Promise.resolve({ data: null, error: null })
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

function mockAuthenticatedApp({ patients = [], assessmentsByPatient = {}, profile = defaultProfile, userEmail = 'clinician@example.com' } = {}) {
  supabase.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: 'user-1', email: userEmail } } },
  })
  supabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  })
  supabase.from.mockImplementation(table => queryForTable(table, { patients, assessmentsByPatient, profile }))
}

describe('patient-first app navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouter.isReady = true
    mockRouter.query = {}
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ followups: [] }),
    })
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
    expect(screen.getByRole('button', { name: /Follow-Up/i })).toBeDisabled()
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        { pathname: '/app', query: { section: 'directory' } },
        undefined,
        { shallow: true },
      )
    })
  })

  it('keeps long account emails contained in the sidebar footer', async () => {
    mockAuthenticatedApp({
      patients: [],
      profile: {
        trial_end_date: '2999-01-01T00:00:00.000Z',
        first_name: null,
        last_name: null,
        avatar_url: null,
      },
      userEmail: 'benjamin.hay@health.qld.gov.au',
    })

    render(<App />)

    expect(await screen.findByRole('button', { name: /Account benjamin\.hay@health\.qld\.gov\.au/i })).toBeInTheDocument()
    expect(screen.getByText('Account')).toBeInTheDocument()
    expect(screen.getByText('benjamin.hay@health.qld.gov.au')).toBeInTheDocument()
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

  it('restores the Follow-Up workspace from query params', async () => {
    mockRouter.query = { patient: 'patient-1', section: 'followup' }
    mockAuthenticatedApp({ patients: [patientOne] })

    render(<App />)

    expect(await screen.findByText(/Send questionnaires to patients before or after sessions/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /follow-up/i })).toBeInTheDocument()
  })

  it('creates a secure follow-up link from the patient workspace', async () => {
    const user = userEvent.setup()
    mockRouter.query = { patient: 'patient-1', section: 'followup' }
    global.fetch = jest.fn((url, options = {}) => {
      if (url === '/api/followups' && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            publicUrl: 'http://localhost:3000/followup/raw-token',
            followup: {
              id: 'followup-1',
              patient_id: 'patient-1',
              status: 'pending',
              displayStatus: 'pending',
              overdue: false,
              due_at: '2999-06-05T00:00:00.000Z',
              expires_at: '2999-06-12T00:00:00.000Z',
              created_at: '2999-05-29T00:00:00.000Z',
              completed_at: null,
              cancelled_at: null,
              measure_id: 'ABC',
              source_assessment_id: 'abc-assessment-1',
              completed_assessment_id: null,
              recipient_email: null,
              sent_at: null,
              email_status: 'manual',
              email_provider_message_id: null,
              email_error: null,
              last_email_attempt_at: null,
              response: null,
              assessment: null,
            },
            email: null,
          }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ followups: [] }),
      })
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn() },
    })
    mockAuthenticatedApp({ patients: [patientOne], assessmentsByPatient: { 'patient-1': [abcAssessment] } })

    render(<App />)

    await screen.findByText(/Send questionnaires to patients before or after sessions/i)
    await user.click(screen.getByRole('button', { name: /create secure link/i }))

    expect(await screen.findByDisplayValue('http://localhost:3000/followup/raw-token')).toBeInTheDocument()
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000/followup/raw-token')
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/followups',
      expect.objectContaining({
        method: 'POST',
      }),
    )
    const createCall = global.fetch.mock.calls.find(([url, options]) => url === '/api/followups' && options?.method === 'POST')
    expect(JSON.parse(createCall[1].body)).toEqual(expect.objectContaining({
      patientId: 'patient-1',
      measureId: 'ABC',
      sourceAssessmentId: 'abc-assessment-1',
      deliveryMode: 'manual',
    }))
  })

  it('creates and sends a follow-up email when the patient has a stored email', async () => {
    const user = userEvent.setup()
    mockRouter.query = { patient: 'patient-1', section: 'followup' }
    global.fetch = jest.fn((url, options = {}) => {
      if (url === '/api/followups' && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            publicUrl: 'http://localhost:3000/followup/email-token',
            email: {
              status: 'sent',
              error: null,
              providerMessageId: 'resend-message-1',
            },
            followup: {
              id: 'followup-1',
              patient_id: 'patient-1',
              status: 'pending',
              displayStatus: 'pending',
              overdue: false,
              due_at: '2999-06-05T00:00:00.000Z',
              expires_at: '2999-06-12T00:00:00.000Z',
              created_at: '2999-05-29T00:00:00.000Z',
              completed_at: null,
              cancelled_at: null,
              measure_id: 'ABC',
              source_assessment_id: 'abc-assessment-1',
              completed_assessment_id: null,
              recipient_email: 'patient@example.com',
              sent_at: '2999-05-29T00:00:00.000Z',
              email_status: 'sent',
              email_provider_message_id: 'resend-message-1',
              email_error: null,
              last_email_attempt_at: '2999-05-29T00:00:00.000Z',
              response: null,
              assessment: null,
            },
          }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ followups: [] }),
      })
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn() },
    })
    mockAuthenticatedApp({
      patients: [{ ...patientOne, email: 'patient@example.com' }],
      assessmentsByPatient: { 'patient-1': [abcAssessment] },
    })

    render(<App />)

    await screen.findByText(/Send questionnaires to patients before or after sessions/i)
    await user.click(screen.getByRole('button', { name: /create and send email/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Email sent to patient@example.com.')
    expect(screen.getAllByText(/Email sent/i).length).toBeGreaterThan(0)
    const createCall = global.fetch.mock.calls.find(([url, options]) => url === '/api/followups' && options?.method === 'POST')
    expect(JSON.parse(createCall[1].body)).toEqual(expect.objectContaining({
      patientId: 'patient-1',
      measureId: 'ABC',
      sourceAssessmentId: 'abc-assessment-1',
      deliveryMode: 'email',
    }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000/followup/email-token')
  })

  it('resends a pending follow-up email from the timeline', async () => {
    const user = userEvent.setup()
    mockRouter.query = { patient: 'patient-1', section: 'followup' }
    const pendingFollowup = {
      id: 'followup-1',
      patient_id: 'patient-1',
      status: 'pending',
      displayStatus: 'pending',
      overdue: false,
      due_at: '2999-06-05T00:00:00.000Z',
      expires_at: '2999-06-12T00:00:00.000Z',
      created_at: '2999-05-29T00:00:00.000Z',
      completed_at: null,
      cancelled_at: null,
      measure_id: 'ABC',
      source_assessment_id: 'abc-assessment-1',
      completed_assessment_id: null,
      recipient_email: 'patient@example.com',
      sent_at: null,
      email_status: 'failed',
      email_provider_message_id: null,
      email_error: 'Previous send failed',
      last_email_attempt_at: '2999-05-29T00:00:00.000Z',
      response: null,
      assessment: null,
    }
    global.fetch = jest.fn((url, options = {}) => {
      if (url === '/api/followups?patientId=patient-1') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ followups: [pendingFollowup] }),
        })
      }
      if (url === '/api/followups/followup-1/send' && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            publicUrl: 'http://localhost:3000/followup/resend-token',
            email: {
              status: 'sent',
              error: null,
              providerMessageId: 'resend-message-2',
            },
            followup: {
              ...pendingFollowup,
              sent_at: '2999-05-30T00:00:00.000Z',
              email_status: 'sent',
              email_provider_message_id: 'resend-message-2',
              email_error: null,
              last_email_attempt_at: '2999-05-30T00:00:00.000Z',
            },
          }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ followups: [] }),
      })
    })
    mockAuthenticatedApp({
      patients: [{ ...patientOne, email: 'patient@example.com' }],
      assessmentsByPatient: { 'patient-1': [abcAssessment] },
    })

    render(<App />)

    expect(await screen.findByText(/previous send failed/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /resend email/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Follow-up email sent.')
    expect(global.fetch).toHaveBeenCalledWith('/api/followups/followup-1/send', { method: 'POST' })
  })

  it('surfaces completed follow-up responses in Overview and Reports', async () => {
    const completedFollowup = {
      id: 'followup-1',
      patient_id: 'patient-1',
      status: 'completed',
      displayStatus: 'completed',
      overdue: false,
      due_at: '2999-06-05T00:00:00.000Z',
      expires_at: '2999-06-12T00:00:00.000Z',
      created_at: '2999-05-29T00:00:00.000Z',
      completed_at: '2999-05-30T00:00:00.000Z',
      cancelled_at: null,
      response: {
        id: 'response-1',
        request_id: 'followup-1',
        patient_id: 'patient-1',
        falls_count: 1,
        confidence_score: 6,
        fatigue_score: 5,
        symptoms_change: 'same',
        adherence_level: 'most',
        global_status: 'same',
        concern_text: 'Had a fall outside.',
        attention_level: 'red',
        created_at: '2999-05-30T00:00:00.000Z',
      },
    }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ followups: [completedFollowup] }),
    })
    mockRouter.query = { patient: 'patient-1', section: 'overview' }
    mockAuthenticatedApp({ patients: [patientOne] })

    const { rerender } = render(<App />)

    expect(await screen.findByText(/review patient-reported concern/i)).toBeInTheDocument()
    expect(screen.getByText(/1 fall, confidence 6\/10/i)).toBeInTheDocument()

    mockRouter.query = { patient: 'patient-1', section: 'reports' }
    rerender(<App />)

    expect(await screen.findByText(/Patient-Reported Follow-Up/i)).toBeInTheDocument()
    expect(screen.getByText(/Had a fall outside/i)).toBeInTheDocument()
  })
})

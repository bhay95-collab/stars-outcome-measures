import React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
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

jest.mock('../components/PatientList', () => function PatientListMock() {
  return <div>Patient list loaded</div>
})
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
jest.mock('../components/SummaryTab', () => function SummaryTabMock() {
  return <div>Summary tab</div>
})
jest.mock('../components/MeasureEntry', () => function MeasureEntryMock() {
  return <div>Measure entry</div>
})
jest.mock('../components/SubscriptionWall', () => function SubscriptionWallMock() {
  return <div>Subscription required</div>
})
jest.mock('../components/WheelchairPrescriptionTool', () => function WheelchairPrescriptionToolMock() {
  return <div>Wheelchair tool</div>
})
jest.mock('../lib/clinical/patientReportPdf', () => ({
  exportPatientSummaryPdf: jest.fn(),
}))

function deferred() {
  let resolve
  const promise = new Promise(res => {
    resolve = res
  })
  return { promise, resolve }
}

function queryFor(result, mode = 'maybeSingle') {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
    order: jest.fn(() => Promise.resolve(result)),
  }

  if (mode === 'pendingMaybeSingle') {
    query.maybeSingle = jest.fn(() => result)
  }

  return query
}

function mockAccessQueries({ profile, subscription = null, appStoreSubscription = null, patients = [] }) {
  supabase.from.mockImplementation(table => {
    if (table === 'profiles') return queryFor({ data: profile, error: null })
    if (table === 'subscriptions') return queryFor({ data: subscription, error: null })
    if (table === 'app_store_subscriptions') return queryFor({ data: appStoreSubscription, error: null })
    if (table === 'patients') return queryFor({ data: patients, error: null }, 'order')
    return queryFor({ data: null, error: null })
  })
}

describe('App boot states', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouter.isReady = true
    mockRouter.query = {}
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })
  })

  it('redirects unauthenticated visitors to login after the session check', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } })

    render(<App />)

    expect(screen.getByRole('heading', { name: /opening rehabmetrics iq/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/login')
    })
  })

  it('shows the workspace skeleton while user data loads', async () => {
    const profileLoad = deferred()
    const subscriptionLoad = deferred()
    const appStoreLoad = deferred()
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1', email: 'clinician@example.com' } } },
    })
    supabase.from.mockImplementation(table => {
      if (table === 'profiles') return queryFor(profileLoad.promise, 'pendingMaybeSingle')
      if (table === 'subscriptions') return queryFor(subscriptionLoad.promise, 'pendingMaybeSingle')
      if (table === 'app_store_subscriptions') return queryFor(appStoreLoad.promise, 'pendingMaybeSingle')
      return queryFor({ data: [], error: null })
    })

    render(<App />)

    expect(await screen.findByLabelText(/loading workspace/i)).toBeInTheDocument()

    await act(async () => {
      profileLoad.resolve({
        data: { trial_end_date: '2999-01-01T00:00:00.000Z', first_name: 'Ada', last_name: 'Clinician', avatar_url: null },
        error: null,
      })
      subscriptionLoad.resolve({ data: null, error: null })
      appStoreLoad.resolve({ data: null, error: null })
    })
  })

  it('renders the app after an active trial loads', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1', email: 'clinician@example.com' } } },
    })
    mockAccessQueries({
      profile: {
        trial_end_date: '2999-01-01T00:00:00.000Z',
        first_name: 'Ada',
        last_name: 'Clinician',
        avatar_url: null,
      },
      patients: [{ id: 'patient-1', initials: 'AB' }],
    })

    render(<App />)

    expect(await screen.findByText('Patient list loaded')).toBeInTheDocument()
  })

  it('renders the subscription wall when access is inactive', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1', email: 'clinician@example.com' } } },
    })
    mockAccessQueries({
      profile: {
        trial_end_date: '2000-01-01T00:00:00.000Z',
        first_name: 'Ada',
        last_name: 'Clinician',
        avatar_url: null,
      },
    })

    render(<App />)

    expect(await screen.findByText('Subscription required')).toBeInTheDocument()
  })

  it('renders the app for an active App Store subscription', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1', email: 'clinician@example.com' } } },
    })
    mockAccessQueries({
      profile: {
        trial_end_date: '2000-01-01T00:00:00.000Z',
        first_name: 'Ada',
        last_name: 'Clinician',
        avatar_url: null,
      },
      appStoreSubscription: {
        is_active: true,
        expiration_at: '2999-01-01T00:00:00.000Z',
      },
      patients: [{ id: 'patient-1', initials: 'AB' }],
    })

    render(<App />)

    expect(await screen.findByText('Patient list loaded')).toBeInTheDocument()
  })
})

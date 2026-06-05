import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewPatientModal from '../components/NewPatientModal'
import { supabase } from '../lib/supabase'

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

function createQueryMock() {
  const query = {
    insert: jest.fn(() => query),
    select: jest.fn(() => query),
    single: jest.fn(),
  }
  return query
}

function renderModal(props = {}) {
  const onCreated = jest.fn()
  const onClose = jest.fn()
  const view = render(
    <NewPatientModal
      userId="user-1"
      onCreated={onCreated}
      onClose={onClose}
      {...props}
    />,
  )
  return { ...view, onCreated, onClose }
}

describe('NewPatientModal', () => {
  let query

  beforeEach(() => {
    query = createQueryMock()
    supabase.from.mockReturnValue(query)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('creates a patient with optional email normalized', async () => {
    const user = userEvent.setup()
    const savedPatient = {
      id: 'patient-1',
      user_id: 'user-1',
      initials: 'Sophie H.',
      email: 'sophie@example.com',
      dob: '1987-06-12',
      dob_year: 1987,
      gender: 'F',
      diagnosis: 'Stroke',
    }
    query.single.mockResolvedValue({ data: savedPatient, error: null })
    const { onCreated } = renderModal()

    await user.type(screen.getByLabelText(/first name/i), 'Sophie')
    await user.type(screen.getByLabelText(/last initial/i), 'h')
    fireEvent.change(screen.getByLabelText(/patient email/i), { target: { value: '  SOPHIE@EXAMPLE.COM  ' } })
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1987-06-12' } })
    fireEvent.change(screen.getByLabelText(/gender/i), { target: { value: 'F' } })
    fireEvent.change(screen.getByLabelText(/diagnosis/i), { target: { value: 'Stroke' } })
    await user.click(screen.getByRole('button', { name: /create patient/i }))

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(savedPatient)
    })
    expect(supabase.from).toHaveBeenCalledWith('patients')
    expect(query.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      initials: 'Sophie H.',
      email: 'sophie@example.com',
      dob: '1987-06-12',
      dob_year: 1987,
      gender: 'F',
      diagnosis: 'Stroke',
    })
  })

  it('blocks creation when patient email is invalid', () => {
    renderModal()

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Sophie' } })
    fireEvent.change(screen.getByLabelText(/patient email/i), { target: { value: 'not-an-email' } })
    fireEvent.submit(screen.getByRole('button', { name: /create patient/i }).closest('form'))

    expect(screen.getByText('Enter a valid patient email address.')).toBeInTheDocument()
    expect(query.insert).not.toHaveBeenCalled()
  })
})

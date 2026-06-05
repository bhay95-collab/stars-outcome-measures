import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditPatientModal from '../components/EditPatientModal'
import { supabase } from '../lib/supabase'

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

const patient = {
  id: 'patient-1',
  user_id: 'user-1',
  initials: 'Sophie H.',
  email: 'sophie@example.com',
  dob: '1987-06-12',
  dob_year: 1987,
  gender: 'F',
  diagnosis: 'Stroke',
}

function createQueryMock() {
  const query = {
    update: jest.fn(() => query),
    eq: jest.fn(() => query),
    select: jest.fn(() => query),
    single: jest.fn(),
  }
  return query
}

function renderModal(props = {}) {
  const onUpdated = jest.fn()
  const onClose = jest.fn()
  const view = render(
    <EditPatientModal
      userId="user-1"
      patient={patient}
      onUpdated={onUpdated}
      onClose={onClose}
      {...props}
    />
  )
  return { ...view, onUpdated, onClose }
}

describe('EditPatientModal', () => {
  let query

  beforeEach(() => {
    query = createQueryMock()
    supabase.from.mockReturnValue(query)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('prefills patient label, DOB, gender, and diagnosis', () => {
    renderModal()

    expect(screen.getByLabelText(/patient label/i)).toHaveValue('Sophie H.')
    expect(screen.getByLabelText(/patient email/i)).toHaveValue('sophie@example.com')
    expect(screen.getByLabelText(/date of birth/i)).toHaveValue('1987-06-12')
    expect(screen.getByLabelText(/gender/i)).toHaveValue('F')
    expect(screen.getByLabelText(/diagnosis/i)).toHaveValue('Stroke')
    expect(screen.getByText(/diagnosis drives pathway recommendations/i)).toBeInTheDocument()
  })

  it('blocks save when patient label is blank', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.clear(screen.getByLabelText(/patient label/i))
    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form'))

    expect(screen.getByRole('alert')).toHaveTextContent('Patient label / initials is required.')
    expect(query.update).not.toHaveBeenCalled()
  })

  it('sends the scoped Supabase update payload with recomputed DOB year', async () => {
    const user = userEvent.setup()
    const savedPatient = {
      ...patient,
      initials: 'Sophie Hay',
      email: 'sophie.hay@example.com',
      dob: '1980-03-04',
      dob_year: 1980,
      gender: 'M',
      diagnosis: 'SCI',
    }
    query.single.mockResolvedValue({ data: savedPatient, error: null })
    const { onUpdated } = renderModal()

    await user.clear(screen.getByLabelText(/patient label/i))
    await user.type(screen.getByLabelText(/patient label/i), '  Sophie   Hay  ')
    fireEvent.change(screen.getByLabelText(/patient email/i), { target: { value: '  SOPHIE.HAY@EXAMPLE.COM  ' } })
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1980-03-04' } })
    fireEvent.change(screen.getByLabelText(/gender/i), { target: { value: 'M' } })
    fireEvent.change(screen.getByLabelText(/diagnosis/i), { target: { value: 'SCI' } })
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledWith(savedPatient)
    })
    expect(supabase.from).toHaveBeenCalledWith('patients')
    expect(query.update).toHaveBeenCalledWith({
      initials: 'Sophie Hay',
      email: 'sophie.hay@example.com',
      dob: '1980-03-04',
      dob_year: 1980,
      gender: 'M',
      diagnosis: 'SCI',
    })
    expect(query.eq).toHaveBeenNthCalledWith(1, 'id', 'patient-1')
    expect(query.eq).toHaveBeenNthCalledWith(2, 'user_id', 'user-1')
    expect(query.select).toHaveBeenCalledTimes(1)
    expect(query.single).toHaveBeenCalledTimes(1)
  })

  it('blocks save when patient email is invalid', async () => {
    renderModal()

    fireEvent.change(screen.getByLabelText(/patient email/i), { target: { value: 'not-an-email' } })
    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form'))

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid patient email address.')
    expect(query.update).not.toHaveBeenCalled()
  })

  it('shows inline errors on Supabase failure and keeps the modal open', async () => {
    const user = userEvent.setup()
    query.single.mockResolvedValue({ data: null, error: { message: 'Update failed' } })
    const { onUpdated } = renderModal()

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Update failed')
    expect(onUpdated).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: /edit patient details/i })).toBeInTheDocument()
  })

  it('calls onUpdated with the persisted row on success', async () => {
    const user = userEvent.setup()
    const savedPatient = { ...patient, diagnosis: 'TBI' }
    query.single.mockResolvedValue({ data: savedPatient, error: null })
    const { onUpdated } = renderModal()

    fireEvent.change(screen.getByLabelText(/diagnosis/i), { target: { value: 'TBI' } })
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledWith(savedPatient)
    })
  })
})

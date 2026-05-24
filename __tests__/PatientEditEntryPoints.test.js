import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PatientHeader from '../components/PatientHeader'
import { PatientsWorkspace } from '../pages/app'

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}))

const patient = {
  id: 'patient-1',
  initials: 'Sophie H.',
  dob: '1987-06-12',
  dob_year: 1987,
  gender: 'F',
  diagnosis: '',
}

describe('patient detail edit entry points', () => {
  it('renders Edit details in the patient overview header', async () => {
    const user = userEvent.setup()
    const onEditPatient = jest.fn()

    render(
      <PatientHeader
        patient={{ ...patient, diagnosis: 'Stroke' }}
        assessments={[]}
        onViewReport={jest.fn()}
        reportLoading={false}
        onEditPatient={onEditPatient}
      />
    )

    await user.click(screen.getByRole('button', { name: /edit details/i }))

    expect(onEditPatient).toHaveBeenCalledTimes(1)
  })

  it('renders Edit details in the selected patient workspace', async () => {
    const user = userEvent.setup()
    const onEditPatient = jest.fn()

    render(
      <PatientsWorkspace
        patients={[patient]}
        selectedPatient={patient}
        selectedAssessments={[]}
        onSelect={jest.fn()}
        onNew={jest.fn()}
        onNewAssessment={jest.fn()}
        onDashboard={jest.fn()}
        onEditPatient={onEditPatient}
      />
    )

    await user.click(screen.getByRole('button', { name: /^edit details$/i }))

    expect(onEditPatient).toHaveBeenCalledTimes(1)
  })

  it('turns the missing-diagnosis pathway action into Add diagnosis', async () => {
    const user = userEvent.setup()
    const onEditPatient = jest.fn()

    render(
      <PatientsWorkspace
        patients={[patient]}
        selectedPatient={patient}
        selectedAssessments={[]}
        onSelect={jest.fn()}
        onNew={jest.fn()}
        onNewAssessment={jest.fn()}
        onDashboard={jest.fn()}
        onEditPatient={onEditPatient}
      />
    )

    expect(screen.getByText(/diagnosis needed/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /add diagnosis/i }))

    expect(onEditPatient).toHaveBeenCalledTimes(1)
  })
})

import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WheelchairPrescriptionTool from '../components/WheelchairPrescriptionTool'

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

const patient = {
  id: 'patient-1',
  initials: 'SP',
  diagnosis: 'T12 SCI',
  dob: '1988-04-12',
}

function renderTool(props = {}) {
  return render(
    <WheelchairPrescriptionTool
      patient={patient}
      patients={[patient]}
      userId="user-1"
      assessments={[]}
      onPatientSelect={jest.fn()}
      onSaved={jest.fn()}
      {...props}
    />
  )
}

describe('WheelchairPrescriptionTool', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    jest.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('uses step navigation and updates required-domain readiness', async () => {
    const user = userEvent.setup()
    const { container } = renderTool()

    expect(screen.getByRole('heading', { name: /client goals and risk screen/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getAllByText(/domains ready/i).length).toBeGreaterThan(0)
    })

    await user.click(screen.getByRole('button', { name: /current equipment and environment/i }))
    expect(screen.getByRole('heading', { name: /current equipment and environment/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /goals and risks/i }))
    fireEvent.change(screen.getByLabelText(/reason for referral/i), { target: { value: 'Replacement chair' } })
    fireEvent.change(screen.getByLabelText(/mobility and seating related goals/i), { target: { value: 'Independent home and community mobility' } })

    await waitFor(() => {
      const goalsItem = Array.from(container.querySelectorAll('#readinessChecklist li'))
        .find(item => item.textContent.includes('Goals and referral reason'))
      expect(goalsItem).toHaveAttribute('data-complete', 'true')
    })
  })

  it('renders long option labels inside wrapping choice copy elements', () => {
    const { container } = renderTool()
    const longLabel = screen.getByText(/Further specialist assessment before product direction/i)

    expect(longLabel).toHaveClass('choice-copy')
    expect(container.querySelector('.check-grid.four')).toBeInTheDocument()
  })

  it('renders selectable equipment cards with contained image frames', async () => {
    const user = userEvent.setup()
    const { container } = renderTool()

    await user.click(screen.getByRole('button', { name: /current equipment and environment/i }))
    await user.click(screen.getByLabelText(/select rigid manual/i))

    expect(screen.getByLabelText(/select rigid manual/i)).toBeChecked()
    expect(container.querySelector('.selection-card__image img[alt="Rigid manual wheelchair example"]')).toBeInTheDocument()
  })

  it('shows conditional manual and power panels based on the proposed pathway', async () => {
    const user = userEvent.setup()
    const { container } = renderTool()

    await user.click(screen.getByRole('button', { name: /mobility base and seating direction/i }))

    const manualPanel = container.querySelector('[data-pathway-panel="manual"]')
    const powerPanel = container.querySelector('[data-pathway-panel="power"]')
    expect(manualPanel).toHaveAttribute('hidden')
    expect(powerPanel).toHaveAttribute('hidden')

    await user.click(screen.getByLabelText(/^Power wheelchair$/i))

    await waitFor(() => {
      expect(powerPanel).not.toHaveAttribute('hidden')
    })
    expect(manualPanel).toHaveAttribute('hidden')

    await user.click(screen.getByLabelText(/Manual chair plus power assist/i))

    await waitFor(() => {
      expect(manualPanel).not.toHaveAttribute('hidden')
    })
  })

  it('keeps the supplier brief sections available after the redesign', async () => {
    renderTool()

    await waitFor(() => {
      expect(window.getWheelchairSupplierBrief).toBeInstanceOf(Function)
    })

    const brief = window.getWheelchairSupplierBrief()
    expect(brief).toContain('1. CLIENT / REFERRAL')
    expect(brief).toContain('3. MEASUREMENTS IN PROPOSED POSITION')
    expect(brief).toContain('7. PROPOSED PRODUCT PARAMETERS')
    expect(brief).toContain('8. TRIAL / QUOTE / HANDOVER')
    expect(brief).toContain('Requested supplier response')
  })

  it('loads past saved wheelchair prescription records into the compatible form state', async () => {
    const savedAt = '2026-05-20T10:15:00.000Z'
    renderTool({
      assessments: [
        {
          id: 'assessment-1',
          patient_id: patient.id,
          created_at: savedAt,
          measure: 'Wheelchair Prescription',
          inputs: {
            formState: {
              fields: {
                clientName: 'Saved client',
                mobilityGoals: 'Return to work and safe home access',
              },
              radios: {
                proposedPathway: 'Highly adjustable manual',
              },
              checkboxGroups: {
                trialLocations: ['Home'],
              },
              meta: {
                updatedAt: savedAt,
                savedAt,
                sourceVersionId: 'assessment-1',
              },
            },
          },
          results: {
            meta: {
              tool: 'wheelchair-prescription',
              savedAt,
              statusLabel: 'Supplier-ready draft',
              completionPercent: 82,
            },
          },
        },
      ],
    })

    await waitFor(() => {
      expect(screen.getByLabelText(/client name/i)).toHaveValue('SP')
    })
    expect(screen.getByLabelText(/mobility and seating related goals/i)).toHaveValue('Return to work and safe home access')
    expect(screen.getByText(/supplier-ready draft - 82%/i)).toBeInTheDocument()
  })
})

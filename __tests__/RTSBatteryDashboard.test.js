import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import RTSBatteryDashboard from '../components/RTSBatteryDashboard'
import { evaluateRTSBattery } from '../lib/clinical/aclRts'

const PASSING = {
  monthsSinceSurgery: 10, quadLSI: 92, hopMinLSI: 91, effusionTraceToZero: true, less: 3,
}

const RECORD_TARGETS = { quad: 'QuadLSI', hops: 'HopBattery', landing: 'LESS' }

describe('RTSBatteryDashboard', () => {
  it('hides licence-pending criteria (IKDC, ACL-RSI) from the table', () => {
    render(<RTSBatteryDashboard battery={evaluateRTSBattery(PASSING)} />)
    expect(screen.queryByText(/pending licence/i)).toBeNull()
    expect(screen.queryByText(/IKDC/)).toBeNull()
    expect(screen.queryByText(/ACL-RSI/)).toBeNull()
    // Objective criteria still render.
    expect(screen.getByText('Quadriceps strength LSI')).toBeInTheDocument()
    expect(screen.getByText('Effusion (modified stroke test)')).toBeInTheDocument()
  })

  it('offers a Record action for unassessed objective criteria', () => {
    const onRecord = jest.fn()
    render(
      <RTSBatteryDashboard
        battery={evaluateRTSBattery({ monthsSinceSurgery: 10 })}
        onRecord={onRecord}
        recordTargets={RECORD_TARGETS}
      />
    )
    const recordButtons = screen.getAllByRole('button', { name: 'Record' })
    // Quad, hops and LESS link to their entry forms; effusion and time do not
    // (effusion is ticked in the clinical-signs card, time comes from the date).
    expect(recordButtons).toHaveLength(3)
    fireEvent.click(recordButtons[0])
    expect(onRecord).toHaveBeenCalledWith('QuadLSI')
  })

  it('offers no Record action for met criteria and none without a handler', () => {
    const { rerender } = render(
      <RTSBatteryDashboard battery={evaluateRTSBattery(PASSING)} onRecord={jest.fn()} recordTargets={RECORD_TARGETS} />
    )
    // All hard criteria met and LESS good — nothing actionable remains.
    expect(screen.queryByRole('button', { name: /record|update/i })).toBeNull()

    rerender(<RTSBatteryDashboard battery={evaluateRTSBattery({ monthsSinceSurgery: 10 })} />)
    expect(screen.queryByRole('button', { name: /record|update/i })).toBeNull()
  })

  it('labels the action Update when a value exists but the criterion is not met', () => {
    const onRecord = jest.fn()
    render(
      <RTSBatteryDashboard
        battery={evaluateRTSBattery({ ...PASSING, quadLSI: 82 })}
        onRecord={onRecord}
        recordTargets={RECORD_TARGETS}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Update' }))
    expect(onRecord).toHaveBeenCalledWith('QuadLSI')
  })
})

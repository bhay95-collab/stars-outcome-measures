import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SubscriptionWall from '../components/SubscriptionWall'

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}))

const user = {
  email: 'clinician.with.a.very.long.email@exampleclinic.com',
}

function renderWall(props = {}) {
  return render(
    <SubscriptionWall
      user={user}
      subscription={null}
      onSignOut={jest.fn()}
      {...props}
    />
  )
}

describe('SubscriptionWall', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('shows trial-ended subscription choices with annual selected by default', () => {
    const { container } = renderWall()

    expect(screen.getByRole('heading', { name: /your free trial has ended/i })).toBeInTheDocument()
    expect(screen.getByText(/signed in as/i)).toBeInTheDocument()
    expect(screen.getByText(user.email)).toBeInTheDocument()
    expect(container.querySelector('style')?.textContent).toContain('.subscription-shell')

    const annualOption = screen.getByRole('button', { name: /^Annual/i })
    const monthlyOption = screen.getByRole('button', { name: /^Monthly/i })

    expect(annualOption).toHaveAttribute('aria-pressed', 'true')
    expect(monthlyOption).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /continue with annual plan/i })).toBeInTheDocument()
  })

  it('prioritizes billing portal access for past-due billing customers', async () => {
    const currentUser = userEvent.setup()
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Billing portal unavailable' }),
    })

    renderWall({
      subscription: {
        status: 'past_due',
        stripe_customer_id: 'cus_123',
      },
    })

    expect(screen.getByRole('heading', { name: /update your billing to restore access/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update billing details/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Annual/i })).not.toBeInTheDocument()

    await currentUser.click(screen.getByRole('button', { name: /update billing details/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/customer-portal', { method: 'POST' })
    })
  })

  it('sends the selected monthly plan to checkout', async () => {
    const currentUser = userEvent.setup()
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Checkout unavailable' }),
    })

    renderWall()

    await currentUser.click(screen.getByRole('button', { name: /^Monthly/i }))
    expect(screen.getByRole('button', { name: /^Monthly/i })).toHaveAttribute('aria-pressed', 'true')

    await currentUser.click(screen.getByRole('button', { name: /continue with monthly plan/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/checkout',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: 'monthly' }),
        })
      )
    })
  })

  it('renders checkout failures as inline accessible errors', async () => {
    const currentUser = userEvent.setup()
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Checkout unavailable' }),
    })

    renderWall()

    await currentUser.click(screen.getByRole('button', { name: /continue with annual plan/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Checkout unavailable')
  })

  it('keeps sign out and delete-account entry points available', async () => {
    const currentUser = userEvent.setup()
    const onSignOut = jest.fn()

    renderWall({ onSignOut })

    await currentUser.click(screen.getByRole('button', { name: /sign out/i }))
    expect(onSignOut).toHaveBeenCalledTimes(1)

    await currentUser.click(screen.getByRole('button', { name: /delete my account/i }))
    const dialog = screen.getByRole('dialog', { name: /delete account/i })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /delete my account/i })).toBeInTheDocument()
  })
})

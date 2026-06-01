import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PublicFollowUpPage from '../pages/followup/[token]'

const mockRouter = {
  isReady: true,
  query: { token: 'raw-public-token-with-length' },
}

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

describe('public follow-up page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouter.isReady = true
    mockRouter.query = { token: 'raw-public-token-with-length' }
  })

  it('renders a valid secure weekly check-in and submits it', async () => {
    const user = userEvent.setup()
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          state: 'ready',
          expiresAt: '2999-06-12T00:00:00.000Z',
          questions: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ state: 'submitted' }),
      })

    render(<PublicFollowUpPage />)

    expect(await screen.findByRole('heading', { name: /weekly follow-up/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /submit check-in/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith(
        '/api/followups/public/raw-public-token-with-length',
        expect.objectContaining({ method: 'POST' }),
      )
    })
    expect(await screen.findByRole('heading', { name: /check-in submitted/i })).toBeInTheDocument()
  })

  it('shows a calm unavailable state for expired links', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ state: 'unavailable', reason: 'expired' }),
    })

    render(<PublicFollowUpPage />)

    expect(await screen.findByRole('heading', { name: /check-in unavailable/i })).toBeInTheDocument()
    expect(screen.getByText(/link has expired/i)).toBeInTheDocument()
  })
})

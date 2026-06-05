import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PublicFollowUpPage from '../pages/followup/[token]'
import { getFollowUpQuestionnaire } from '../lib/followupQuestionnaires'

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

  it('renders a valid secure ABC questionnaire and submits it', async () => {
    const user = userEvent.setup()
    const questionnaire = getFollowUpQuestionnaire('ABC')
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          state: 'ready',
          expiresAt: '2999-06-12T00:00:00.000Z',
          questionnaire,
          questions: questionnaire.questions,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ state: 'submitted' }),
      })

    render(<PublicFollowUpPage />)

    expect(await screen.findByRole('heading', { name: /activities-specific balance confidence/i })).toBeInTheDocument()
    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs).toHaveLength(16)
    for (const input of inputs) {
      await user.clear(input)
      await user.type(input, '80')
    }
    expect(screen.getByText('80%')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /submit questionnaire/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith(
        '/api/followups/public/raw-public-token-with-length',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ answers: { items: Array(16).fill('80') } }),
        }),
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

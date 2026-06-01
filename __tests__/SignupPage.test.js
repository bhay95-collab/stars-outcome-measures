import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Signup from '../pages/signup'
import { supabase } from '../lib/supabase'

const mockRouter = {
  replace: jest.fn(),
}

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

jest.mock('../lib/supabase', () => ({
  getAppRedirectUrl: jest.fn(() => 'http://localhost:3000/app'),
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithOAuth: jest.fn(),
      signInWithPassword: jest.fn(),
    },
  },
}))

describe('Signup page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    global.fetch = jest.fn()
  })

  it('creates the account through the server API and signs in', async () => {
    const user = userEvent.setup()
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null })

    render(<Signup />)

    await user.type(screen.getByLabelText(/email/i), 'new.user@example.com')
    await user.type(screen.getByLabelText(/password/i), 'TestPassword123!')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/signup', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'new.user@example.com',
          password: 'TestPassword123!',
        }),
      }))
    })
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'new.user@example.com',
      password: 'TestPassword123!',
    })
    expect(mockRouter.replace).toHaveBeenCalledWith('/app')
  })

  it('renders server signup errors as useful text', async () => {
    const user = userEvent.setup()
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'An account with this email already exists. Try logging in instead.' }),
    })

    render(<Signup />)

    await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
    await user.type(screen.getByLabelText(/password/i), 'TestPassword123!')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument()
    expect(screen.queryByText('{}')).not.toBeInTheDocument()
  })
})

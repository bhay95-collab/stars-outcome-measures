import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import Landing from '../pages/index'
import { supabase } from '../lib/supabase'

const mockRouter = {
  replace: jest.fn(),
}

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}))

describe('Landing auth gateway', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.history.replaceState({}, '', '/')
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    window.matchMedia = jest.fn().mockReturnValue({ matches: true })
    window.IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
  })

  it('shows the auth gateway and hides the landing frame during auth callbacks', async () => {
    window.history.replaceState({}, '', '/?code=abc123')
    const { container } = render(<Landing />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /opening rehabmetrics iq/i })).toBeInTheDocument()
      expect(container.querySelector('.landing-frame')).toHaveAttribute('data-auth-hidden', 'true')
    })
  })

  it('redirects authenticated landing visitors into the app', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })

    render(<Landing />)

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/app')
    })
  })

  it('leaves normal anonymous visitors on the landing page', () => {
    const { container } = render(<Landing />)

    expect(screen.getByRole('heading', { name: /you scored the test/i })).toBeInTheDocument()
    expect(container.querySelector('.landing-frame')).not.toHaveAttribute('data-auth-hidden')
  })

  it('renders lazy below-fold photography with intrinsic dimensions', () => {
    render(<Landing />)

    const clinicalImage = screen.getByAltText(/amputee patient/i)
    expect(clinicalImage).toHaveAttribute('loading', 'lazy')
    expect(clinicalImage).toHaveAttribute('decoding', 'async')
    expect(clinicalImage).toHaveAttribute('width', '1400')
    expect(clinicalImage).toHaveAttribute('height', '933')
  })
})

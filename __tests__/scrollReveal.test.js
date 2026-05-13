/**
 * Tests for the scroll-reveal IntersectionObserver logic used in pages/index.js.
 *
 * The logic under test (inlined here to keep tests independent):
 *   - Skips setup when prefers-reduced-motion: reduce is active
 *   - Observes all .reveal elements on mount
 *   - Adds .is-visible when an element intersects
 *   - Unobserves the element after adding .is-visible (fires only once per element)
 *   - Disconnects the observer on unmount
 */

import React, { useEffect } from 'react'
import { render } from '@testing-library/react'

// The hook extracted from Landing's useEffect — tested in isolation
function useScrollReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

// Minimal component that uses the hook and renders .reveal elements
function TestPage({ count = 1 }) {
  useScrollReveal()
  return (
    <div>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="reveal" data-testid={`reveal-${i}`} />
      ))}
    </div>
  )
}

// ─── IntersectionObserver mock ────────────────────────────────────────────────

let observerCallback
let mockObserve
let mockUnobserve
let mockDisconnect

function setupObserverMock() {
  mockObserve = jest.fn()
  mockUnobserve = jest.fn()
  mockDisconnect = jest.fn()

  global.IntersectionObserver = jest.fn((callback) => {
    observerCallback = callback
    return {
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
    }
  })
}

function triggerIntersection(elements, isIntersecting = true) {
  const targets = Array.isArray(elements) ? elements : [elements]
  observerCallback(targets.map(target => ({ target, isIntersecting })))
}

// ─── matchMedia mock ──────────────────────────────────────────────────────────

function mockMatchMedia(reducedMotion = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn(query => ({
      matches: reducedMotion,
      media: query,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  setupObserverMock()
  mockMatchMedia(false)
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('scroll reveal — observer setup', () => {
  it('creates an IntersectionObserver on mount', () => {
    render(<TestPage />)
    expect(global.IntersectionObserver).toHaveBeenCalledTimes(1)
  })

  it('observes all .reveal elements', () => {
    const { getAllByTestId } = render(<TestPage count={3} />)
    const elements = getAllByTestId(/reveal-/)
    expect(mockObserve).toHaveBeenCalledTimes(3)
    elements.forEach(el => expect(mockObserve).toHaveBeenCalledWith(el))
  })

  it('skips setup when prefers-reduced-motion is reduce', () => {
    mockMatchMedia(true)
    render(<TestPage />)
    expect(global.IntersectionObserver).not.toHaveBeenCalled()
    expect(mockObserve).not.toHaveBeenCalled()
  })

  it('disconnects observer on unmount', () => {
    const { unmount } = render(<TestPage />)
    unmount()
    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })
})

describe('scroll reveal — intersection response', () => {
  it('adds is-visible when element intersects', () => {
    const { getByTestId } = render(<TestPage />)
    const el = getByTestId('reveal-0')
    triggerIntersection(el, true)
    expect(el).toHaveClass('is-visible')
  })

  it('unobserves element after adding is-visible', () => {
    const { getByTestId } = render(<TestPage />)
    const el = getByTestId('reveal-0')
    triggerIntersection(el, true)
    expect(mockUnobserve).toHaveBeenCalledWith(el)
  })

  it('does not add is-visible when not intersecting', () => {
    const { getByTestId } = render(<TestPage />)
    const el = getByTestId('reveal-0')
    triggerIntersection(el, false)
    expect(el).not.toHaveClass('is-visible')
  })

  it('does not unobserve when not intersecting', () => {
    const { getByTestId } = render(<TestPage />)
    const el = getByTestId('reveal-0')
    triggerIntersection(el, false)
    expect(mockUnobserve).not.toHaveBeenCalled()
  })

  it('handles multiple elements intersecting at once', () => {
    const { getAllByTestId } = render(<TestPage count={3} />)
    const elements = getAllByTestId(/reveal-/)
    triggerIntersection(elements, true)
    elements.forEach(el => {
      expect(el).toHaveClass('is-visible')
      expect(mockUnobserve).toHaveBeenCalledWith(el)
    })
  })
})

import React from 'react'
import { act, render } from '@testing-library/react'
import AdaptiveVideo, { shouldLoadVideo } from '../components/AdaptiveVideo'

let observerCallback

function mockConnection(connection) {
  Object.defineProperty(window.navigator, 'connection', {
    configurable: true,
    value: connection,
  })
}

beforeEach(() => {
  window.matchMedia = jest.fn().mockReturnValue({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })
  window.IntersectionObserver = jest.fn(callback => {
    observerCallback = callback
    return {
      observe: jest.fn(),
      disconnect: jest.fn(),
    }
  })
  mockConnection({
    effectiveType: '4g',
    saveData: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })
  jest.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
  jest.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue()
})

afterEach(() => {
  jest.restoreAllMocks()
})

it.each(['slow-2g', '2g', '3g'])('rejects %s connections', effectiveType => {
  expect(shouldLoadVideo({
    connection: { effectiveType, saveData: false },
    reducedMotion: false,
  })).toBe(false)
})

it('rejects data saver and reduced-motion preferences', () => {
  expect(shouldLoadVideo({
    connection: { effectiveType: '4g', saveData: true },
    reducedMotion: false,
  })).toBe(false)
  expect(shouldLoadVideo({
    connection: { effectiveType: '4g', saveData: false },
    reducedMotion: true,
  })).toBe(false)
})

it('allows capable and unknown connections', () => {
  expect(shouldLoadVideo({
    connection: { effectiveType: '4g', saveData: false },
    reducedMotion: false,
  })).toBe(true)
  expect(shouldLoadVideo({ connection: null, reducedMotion: false })).toBe(true)
})

it('does not attach an MP4 source on constrained connections', () => {
  mockConnection({
    effectiveType: '3g',
    saveData: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })

  const { container } = render(
    <AdaptiveVideo
      src="/video.mp4"
      poster="/poster.jpg"
      loadStrategy="visible"
      width={1280}
      height={720}
    />
  )

  expect(container.querySelector('video source')).not.toBeInTheDocument()
})

it('attaches visible-strategy video only when it approaches the viewport', () => {
  const { container } = render(
    <AdaptiveVideo
      src="/video.mp4"
      poster="/poster.jpg"
      loadStrategy="visible"
      width={1280}
      height={720}
    />
  )

  expect(container.querySelector('video source')).not.toBeInTheDocument()

  act(() => {
    observerCallback([{ isIntersecting: true }])
  })

  expect(container.querySelector('video source')).toHaveAttribute('src', '/video.mp4')
})

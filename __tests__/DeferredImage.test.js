import React from 'react'
import { act, render } from '@testing-library/react'
import DeferredImage from '../components/DeferredImage'

let observerCallback

beforeEach(() => {
  window.IntersectionObserver = jest.fn(callback => {
    observerCallback = callback
    return {
      observe: jest.fn(),
      disconnect: jest.fn(),
    }
  })
})

it('does not attach the image source before it approaches the viewport', () => {
  const { getByAltText } = render(
    <DeferredImage
      src="https://example.com/clinical.jpg"
      alt="Clinical example"
      width={1400}
      height={933}
    />
  )

  expect(getByAltText('Clinical example')).not.toHaveAttribute('src')
})

it('attaches the image source when it approaches the viewport', () => {
  const { getByAltText } = render(
    <DeferredImage
      src="https://example.com/clinical.jpg"
      alt="Clinical example"
      width={1400}
      height={933}
    />
  )

  act(() => {
    observerCallback([{ isIntersecting: true }])
  })

  expect(getByAltText('Clinical example')).toHaveAttribute('src', 'https://example.com/clinical.jpg')
  expect(getByAltText('Clinical example')).toHaveAttribute('loading', 'lazy')
})

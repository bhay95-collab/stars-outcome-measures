import React from 'react'
import { render } from '@testing-library/react'
import DeferredImage from '../components/DeferredImage'

it('renders the image source immediately so it survives a slow or failed JS load', () => {
  const { getByAltText } = render(
    <DeferredImage
      src="https://example.com/clinical.jpg"
      alt="Clinical example"
      width={1400}
      height={933}
    />
  )

  expect(getByAltText('Clinical example')).toHaveAttribute('src', 'https://example.com/clinical.jpg')
})

it('defers the download to the browser rather than to JavaScript', () => {
  const { getByAltText } = render(
    <DeferredImage
      src="https://example.com/clinical.jpg"
      alt="Clinical example"
      width={1400}
      height={933}
    />
  )

  const image = getByAltText('Clinical example')
  expect(image).toHaveAttribute('loading', 'lazy')
  expect(image).toHaveAttribute('decoding', 'async')
})

it('does not depend on IntersectionObserver being available', () => {
  const originalObserver = window.IntersectionObserver
  delete window.IntersectionObserver

  try {
    const { getByAltText } = render(
      <DeferredImage src="https://example.com/faq.jpg" alt="FAQ example" width={900} height={600} />
    )
    expect(getByAltText('FAQ example')).toHaveAttribute('src', 'https://example.com/faq.jpg')
  } finally {
    window.IntersectionObserver = originalObserver
  }
})

it('allows an above-the-fold image to opt out of lazy loading', () => {
  const { getByAltText } = render(
    <DeferredImage
      src="https://example.com/hero.jpg"
      alt="Hero example"
      loading="eager"
      fetchPriority="high"
      width={1400}
      height={933}
    />
  )

  expect(getByAltText('Hero example')).toHaveAttribute('loading', 'eager')
})

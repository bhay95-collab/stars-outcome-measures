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

it('offers the WebP variants through <picture> while keeping the JPEG fallback on the img', () => {
  const { container, getByAltText } = render(
    <DeferredImage
      src="/assets/landing/v2/clinical-band-800.jpg"
      srcSet="/assets/landing/v2/clinical-band-400.jpg 400w, /assets/landing/v2/clinical-band-800.jpg 800w"
      sources={[{ type: 'image/webp', srcSet: '/assets/landing/v2/clinical-band-400.webp 400w' }]}
      sizes="(max-width: 960px) 95vw, 574px"
      alt="Clinical example"
      width={1400}
      height={933}
    />
  )

  const source = container.querySelector('picture source')
  expect(source).toHaveAttribute('type', 'image/webp')
  expect(source).toHaveAttribute('srcset', '/assets/landing/v2/clinical-band-400.webp 400w')
  expect(source).toHaveAttribute('sizes', '(max-width: 960px) 95vw, 574px')

  const image = getByAltText('Clinical example')
  expect(image).toHaveAttribute('src', '/assets/landing/v2/clinical-band-800.jpg')
  expect(image).toHaveAttribute('srcset', '/assets/landing/v2/clinical-band-400.jpg 400w, /assets/landing/v2/clinical-band-800.jpg 800w')
  expect(image).toHaveAttribute('loading', 'lazy')
})

it('renders a bare img when no alternate formats are supplied', () => {
  const { container } = render(
    <DeferredImage src="/founder-ben-560.jpg" alt="Founder" width={1122} height={1402} />
  )

  expect(container.querySelector('picture')).not.toBeInTheDocument()
  expect(container.querySelector('img')).toHaveAttribute('src', '/founder-ben-560.jpg')
})

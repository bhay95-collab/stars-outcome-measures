import { useEffect, useRef, useState } from 'react'

export default function DeferredImage({
  alt,
  className,
  decoding = 'async',
  height,
  loading = 'lazy',
  rootMargin = '500px 0px',
  src,
  width,
}) {
  const imageRef = useRef(null)
  const [sourceAttached, setSourceAttached] = useState(false)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setSourceAttached(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSourceAttached(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold: 0.01 }
    )

    if (imageRef.current) observer.observe(imageRef.current)
    return () => observer.disconnect()
  }, [rootMargin])

  return (
    <img
      ref={imageRef}
      alt={alt}
      className={className}
      decoding={decoding}
      height={height}
      loading={loading}
      src={sourceAttached ? src : undefined}
      width={width}
    />
  )
}

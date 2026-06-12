import { useEffect, useRef, useState } from 'react'

const CONSTRAINED_CONNECTIONS = new Set(['slow-2g', '2g', '3g'])

function getConnection() {
  if (typeof navigator === 'undefined') return null
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null
}

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function shouldLoadVideo({
  connection = getConnection(),
  reducedMotion = prefersReducedMotion(),
} = {}) {
  if (reducedMotion) return false
  if (connection?.saveData) return false
  return !CONSTRAINED_CONNECTIONS.has(connection?.effectiveType)
}

function scheduleAfterPageLoad(callback) {
  let idleId
  let timeoutId
  let cancelled = false

  const runWhenIdle = () => {
    if (cancelled) return

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(callback, { timeout: 2000 })
      return
    }

    timeoutId = window.setTimeout(callback, 0)
  }

  if (document.readyState === 'complete') {
    runWhenIdle()
  } else {
    window.addEventListener('load', runWhenIdle, { once: true })
  }

  return () => {
    cancelled = true
    window.removeEventListener('load', runWhenIdle)
    if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(idleId)
    }
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
  }
}

export default function AdaptiveVideo({
  className = '',
  fetchPriority,
  height,
  loadStrategy = 'idle',
  poster,
  deferPoster = false,
  posterLoading = 'lazy',
  posterSources = [],
  rootMargin = '320px 0px',
  src,
  width,
}) {
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const [eligible, setEligible] = useState(false)
  const [nearViewport, setNearViewport] = useState(loadStrategy === 'idle')
  const [posterAttached, setPosterAttached] = useState(!deferPoster)
  const [sourceAttached, setSourceAttached] = useState(false)
  const [visible, setVisible] = useState(loadStrategy === 'idle')
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const motionQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null
    const connection = getConnection()
    const updateEligibility = () => {
      setEligible(shouldLoadVideo({
        connection,
        reducedMotion: motionQuery?.matches ?? false,
      }))
    }

    updateEligibility()
    motionQuery?.addEventListener?.('change', updateEligibility)
    connection?.addEventListener?.('change', updateEligibility)

    return () => {
      motionQuery?.removeEventListener?.('change', updateEligibility)
      connection?.removeEventListener?.('change', updateEligibility)
    }
  }, [])

  useEffect(() => {
    if (loadStrategy === 'idle') return undefined

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      setNearViewport(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting)
        if (entry.isIntersecting) setNearViewport(true)
      },
      { rootMargin, threshold: 0.01 }
    )

    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [loadStrategy, rootMargin])

  useEffect(() => {
    if (!deferPoster || nearViewport) setPosterAttached(true)
  }, [deferPoster, nearViewport])

  useEffect(() => {
    if (!eligible) {
      setSourceAttached(false)
      setPlaying(false)
      return undefined
    }

    if (loadStrategy === 'idle') {
      return scheduleAfterPageLoad(() => setSourceAttached(true))
    }

    if (nearViewport) setSourceAttached(true)
    return undefined
  }, [eligible, loadStrategy, nearViewport])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!sourceAttached) {
      video.pause()
      if (video.currentSrc || video.querySelector('source')) video.load()
      return
    }

    video.load()
    if (loadStrategy === 'idle' || visible) {
      video.play().catch(() => setPlaying(false))
    } else {
      video.pause()
    }
  }, [loadStrategy, sourceAttached, visible])

  return (
    <div
      ref={containerRef}
      className={['adaptive-video', className].filter(Boolean).join(' ')}
      data-playing={playing ? 'true' : undefined}
      data-source-attached={sourceAttached ? 'true' : undefined}
      aria-hidden="true"
    >
      <picture className="adaptive-video__poster">
        {posterAttached && posterSources.map(source => (
          <source
            key={`${source.srcSet}-${source.media || 'all'}`}
            media={source.media}
            sizes={source.sizes}
            srcSet={source.srcSet}
            type={source.type}
          />
        ))}
        <img
          alt=""
          decoding="async"
          fetchPriority={fetchPriority}
          height={height}
          loading={posterLoading}
          src={posterAttached ? poster : undefined}
          width={width}
        />
      </picture>
      <video
        ref={videoRef}
        className="adaptive-video__element"
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        tabIndex={-1}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setPlaying(false)}
      >
        {sourceAttached && <source src={src} type="video/mp4" />}
      </video>
    </div>
  )
}

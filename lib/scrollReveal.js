const REVEAL_READY_CLASS = 'reveal-ready'

export function initializeScrollReveal({
  documentObject = typeof document === 'undefined' ? null : document,
  windowObject = typeof window === 'undefined' ? null : window,
} = {}) {
  if (!documentObject || !windowObject) return () => {}
  if (windowObject.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return () => {}
  if (typeof windowObject.IntersectionObserver !== 'function') return () => {}

  const elements = documentObject.querySelectorAll('.reveal')
  const observer = new windowObject.IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }),
    { threshold: 0.1 }
  )

  documentObject.documentElement.classList.add(REVEAL_READY_CLASS)
  elements.forEach(element => observer.observe(element))

  return () => {
    observer.disconnect()
    documentObject.documentElement.classList.remove(REVEAL_READY_CLASS)
  }
}

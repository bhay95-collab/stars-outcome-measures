import { initializeScrollReveal } from '../lib/scrollReveal'

let observerCallback
let mockObserve
let mockUnobserve
let mockDisconnect

function setupObserverMock() {
  mockObserve = jest.fn()
  mockUnobserve = jest.fn()
  mockDisconnect = jest.fn()

  window.IntersectionObserver = jest.fn(callback => {
    observerCallback = callback
    return {
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
    }
  })
}

function addRevealElements(count = 1) {
  document.body.innerHTML = Array.from(
    { length: count },
    (_, index) => `<div class="reveal" data-testid="reveal-${index}"></div>`
  ).join('')
  return [...document.querySelectorAll('.reveal')]
}

beforeEach(() => {
  document.documentElement.classList.remove('reveal-ready')
  document.body.innerHTML = ''
  setupObserverMock()
  window.matchMedia = jest.fn().mockReturnValue({ matches: false })
})

afterEach(() => {
  jest.clearAllMocks()
})

it('only enables hidden reveal styling after IntersectionObserver is ready', () => {
  const elements = addRevealElements(3)

  initializeScrollReveal()

  expect(document.documentElement).toHaveClass('reveal-ready')
  elements.forEach(element => expect(mockObserve).toHaveBeenCalledWith(element))
})

it('keeps content visible when IntersectionObserver is unavailable', () => {
  addRevealElements()
  window.IntersectionObserver = undefined

  initializeScrollReveal()

  expect(document.documentElement).not.toHaveClass('reveal-ready')
})

it('keeps content visible when reduced motion is enabled', () => {
  addRevealElements()
  window.matchMedia = jest.fn().mockReturnValue({ matches: true })

  initializeScrollReveal()

  expect(window.IntersectionObserver).not.toHaveBeenCalled()
  expect(document.documentElement).not.toHaveClass('reveal-ready')
})

it('reveals and unobserves an intersecting element', () => {
  const [element] = addRevealElements()
  initializeScrollReveal()

  observerCallback([{ target: element, isIntersecting: true }])

  expect(element).toHaveClass('is-visible')
  expect(mockUnobserve).toHaveBeenCalledWith(element)
})

it('disconnects the observer and removes enhancement state during cleanup', () => {
  addRevealElements()
  const cleanup = initializeScrollReveal()

  cleanup()

  expect(mockDisconnect).toHaveBeenCalledTimes(1)
  expect(document.documentElement).not.toHaveClass('reveal-ready')
})

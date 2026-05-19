import * as Sentry from '@sentry/nextjs'

function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}

export default Sentry.withErrorBoundary(App, {
  fallback: null,
})

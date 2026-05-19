import * as Sentry from '@sentry/react-native'

export function initSentry(): void {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    debug: __DEV__,
    beforeSend(event) {
      // Strip breadcrumb data from navigation and http entries — both can contain patient UUIDs
      if (Array.isArray(event.breadcrumbs)) {
        event = {
          ...event,
          breadcrumbs: event.breadcrumbs.map(crumb => {
            if (crumb.type === 'navigation' || crumb.type === 'http') {
              const { data, ...safeCrumb } = crumb
              return safeCrumb
            }
            return crumb
          }),
        }
      }
      // Strip user email — keep only id
      if (event.user) {
        const { email, ...safeUser } = event.user
        event = { ...event, user: safeUser }
      }
      return event
    },
  })
}

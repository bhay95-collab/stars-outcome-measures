// Single source of truth for the public site origin and the Apple deletion
// callback URL. The callback URL MUST match exactly between the authorize request
// and the value registered as a Return URL on the Apple Services ID
// (com.rehabmetricsiq.web): https://www.rehabmetricsiq.com/api/apple/deletion-callback

const DEFAULT_SITE_URL = 'https://www.rehabmetricsiq.com'

export function getSiteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '')
}

export function getDeletionCallbackUrl() {
  return `${getSiteOrigin()}/api/apple/deletion-callback`
}

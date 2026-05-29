const AUTH_SEARCH_PARAMS = ['code', 'error', 'error_code', 'error_description']
const AUTH_HASH_PARAMS = [
  'access_token',
  'refresh_token',
  'error',
  'error_code',
  'error_description',
]

function getUrl(input) {
  try {
    return new URL(input, 'https://rehabmetricsiq.local')
  } catch {
    return null
  }
}

function getHashParams(hash) {
  return new URLSearchParams((hash || '').replace(/^#/, ''))
}

export function isSupabaseAuthCallbackUrl(input) {
  const url = getUrl(input)
  if (!url) return false

  const hasSearchCallback = AUTH_SEARCH_PARAMS.some(param => url.searchParams.has(param))
  if (hasSearchCallback) return true

  const hashParams = getHashParams(url.hash)
  return AUTH_HASH_PARAMS.some(param => hashParams.has(param))
}

export function hasSupabaseAuthErrorUrl(input) {
  const url = getUrl(input)
  if (!url) return false

  const hashParams = getHashParams(url.hash)
  return (
    url.searchParams.has('error') ||
    url.searchParams.has('error_code') ||
    url.searchParams.has('error_description') ||
    hashParams.has('error') ||
    hashParams.has('error_code') ||
    hashParams.has('error_description')
  )
}

export function isCurrentSupabaseAuthCallback() {
  if (typeof window === 'undefined') return false
  return isSupabaseAuthCallbackUrl(window.location.href)
}

// Pure, dependency-free helper so both server routes and client components can
// detect whether an account signed in with Apple. Keep this file free of `crypto`
// or any server-only imports — it is bundled into client code via SubscriptionWall.

export function userUsesAppleLogin(user) {
  const providers = Array.isArray(user?.app_metadata?.providers)
    ? user.app_metadata.providers
    : []
  return providers.includes('apple')
    || Boolean(user?.identities?.some(identity => identity.provider === 'apple'))
}

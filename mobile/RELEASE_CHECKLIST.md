# RehabMetrics IQ Mobile Release Checklist

Follow [RESUBMISSION_HANDOFF.md](./RESUBMISSION_HANDOFF.md) for the complete dashboard setup, TestFlight QA, evidence, and resubmission sequence.

## Release Status

- Device QA is required before release.
- Device QA is currently unresolved.
- Do not tag, submit, or publish a production release until device QA passes.

## Required Environment

Configure these values for local builds and EAS build profiles. Use the Supabase anon key only.

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=https://www.rehabmetricsiq.com
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
```

Never configure or commit a Supabase service role key in the mobile app.

## OAuth Redirect

Supabase and Google OAuth configuration must allow the mobile redirect URL:

```text
rehabmetricsiq://auth/callback
```

Google and Apple sign-in must be verified on a real device before release.

Supabase must enable Apple as an authentication provider for bundle ID:

```text
com.rehabmetricsiq.app
```

The web deployment also requires:

```text
REVENUECAT_SECRET_API_KEY=
REVENUECAT_WEBHOOK_AUTHORIZATION=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_CLIENT_ID=com.rehabmetricsiq.app
APPLE_PRIVATE_KEY=
```

## Local Validation

Run before creating any release candidate build:

```sh
npm run typecheck
npm run test:app
npm run test:clinical
npm run expo:config
npx expo-doctor
git diff --check
```

## Expo Doctor

`npx expo-doctor` currently passes all 18 checks. Treat any new warning as a release blocker until it is investigated.

## Preview Builds

Preview builds may be created after local validation passes:

```sh
npx eas build --profile preview --platform ios
npx eas build --profile preview --platform android
```

Do not run production submit/deploy commands while device QA is unresolved.

## Required Device QA

- Email login and invalid-login safe error.
- Google login, cancel, and failure safe error.
- Apple login, Hide My Email, cancel, and failure-safe error.
- Native account creation and email verification.
- Sign out returns to sign-in.
- Expired trial opens the App Store subscription screen.
- Monthly and annual sandbox purchases unlock the workspace.
- Restore purchases unlocks the correct Supabase account.
- Account deletion works for email, Google, and Apple users.
- Apple deletion reauthentication revokes the Apple authorization.
- Account deletion warns that App Store billing must be cancelled separately.
- Patient create, DOB conversion, and patient list refresh.
- User A/User B RLS isolation.
- Direct bad patient route safety.
- One assessment save smoke test with history refresh.
- No raw JSON, Supabase, provider, schema, auth token, or deep-link errors shown.

## App Store Connect and RevenueCat

- Create subscription group `RehabMetrics IQ Pro`.
- Create `com.rehabmetricsiq.app.subscription.pro.monthly`.
- Create `com.rehabmetricsiq.app.subscription.pro.annual`.
- Use the nearest Australian price points to A$29 monthly and A$250 annual.
- Do not configure an App Store introductory trial.
- In RevenueCat, create entitlement `pro` and offering `default`.
- Attach the monthly and annual products to their matching RevenueCat packages.
- Configure RevenueCat restore behavior to transfer purchases between identified app users.
- Configure the RevenueCat webhook URL as `/api/webhooks/revenuecat` with the exact authorization header stored in `REVENUECAT_WEBHOOK_AUTHORIZATION`.
- [x] Applied `supabase/migrations/20260610090000_add_app_store_subscriptions.sql`.

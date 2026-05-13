# RehabMetrics IQ Mobile Release Checklist

## Release Status

- Device QA is required before release.
- Device QA is currently unresolved.
- Do not tag, submit, or publish a production release until device QA passes.

## Required Environment

Configure these values for local builds and EAS build profiles. Use the Supabase anon key only.

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Never configure or commit a Supabase service role key in the mobile app.

## OAuth Redirect

Supabase and Google OAuth configuration must allow the mobile redirect URL:

```text
rehabmetricsiq://auth/callback
```

Google sign-in must be verified on a real device before release.

## Local Validation

Run before creating any release candidate build:

```sh
npm run typecheck
npm run test:clinical
npm run expo:config
npx expo-doctor
git diff --check
```

## Known expo-doctor Warnings

These warnings are expected and do not block development or preview builds.

**Duplicate React** — The monorepo has React in both `node_modules/` (Next.js web) and `mobile/node_modules/` (React Native). expo-doctor flags this as a duplicate. It is a structural artifact of the monorepo and cannot be resolved without changes to the root workspace. Not a runtime defect on mobile.

**Package version mismatches** — expo-doctor reports mismatches for: `babel-preset-expo` (55 installed, 54 expected), `jest` (30 installed, 29 expected), `jest-expo` (55 installed, 54 expected), `react-native-worklets` (0.8.3 installed, 0.5.1 expected). The worklets version is correct — Reanimated 4.x requires 0.8.3; the expo-doctor expected value is stale. The others are deliberate upgrades that pass all tests. None cause runtime failures.

Resolve these before submitting to the App Store if Expo updates their guidance.

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
- Create account opens secure web signup only.
- Sign out returns to sign-in.
- Patient create, DOB conversion, and patient list refresh.
- User A/User B RLS isolation.
- Direct bad patient route safety.
- One assessment save smoke test with history refresh.
- No raw JSON, Supabase, provider, schema, auth token, or deep-link errors shown.

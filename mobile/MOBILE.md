# Mobile — RehabMetrics IQ iOS/Android App

Last verified against the codebase: 2026-06-26

Expo SDK 54 / React Native 0.81 / expo-router 6 / TypeScript app sharing the web product's Supabase backend and clinical engine. Read [../ARCHITECTURE.md](../ARCHITECTURE.md) first for the shared architecture; this file covers what is mobile-specific.

## Structure

```
app/                      expo-router file-based routes
  _layout.tsx             Root layout (Sentry init, providers)
  index.tsx               Entry redirect
  sign-in.tsx             Email + Google + native Sign in with Apple (iOS)
  sign-up.tsx             Email/password account creation
  forgot-password.tsx     Email entry → Supabase sends reset link; redirects to web /reset-password
  subscribe.tsx           Native App Store subscription screen (RevenueCat)
  (app)/_layout.tsx       Access gate — redirects to /subscribe without trial/subscription
  (app)/patients/         Patient directory → patient workspace → measure select → assess
src/
  api/client.ts           Calls to the web deployment (EXPO_PUBLIC_API_URL)
  auth/                   AuthProvider, useSession, googleAuth, appleAuth, oauthProvisioning
  billing/revenuecat.ts   StoreKit/RevenueCat wrapper (entitlement 'pro')
  clinical/               adapter.ts (typed re-exports from @clinical), comparisons.ts,
                          measureInstructions.ts — thin layer only; scoring lives in ../lib/clinical
  components/             account/ (AccountSettingsSheet…), forms/ (26 measure forms +
                          shared fields/), ui/
  hooks/                  useMountedRef — shared ref that goes false on unmount; used by all form
                          components to guard setState calls after save completes
  supabase/               Supabase client + LargeSecureStore adapter (iOS Keychain, chunked JWTs,
                          replaces AsyncStorage); anon key only
  theme/tokens.ts         Colour/typography tokens mirroring the web system (see ../DESIGN.md)
  types/ utils/           Shared domain types (PatientGender…), routing/dob/uuid helpers
__tests__/                See ../TESTING.md
patches/                  patch-package (@supabase/supabase-js patch, applied on postinstall)
stubs/                    Metro stubs (opentelemetry-api)
```

## Shared clinical engine

Scoring, registry, and MCID logic are **not duplicated** — they are imported from `../lib/clinical` via the `@clinical` alias, wired in three places that must stay in sync: `tsconfig.json` (paths), `babel.config.js` (module-resolver), `metro.config.js` (watchFolders). `src/clinical/adapter.ts` provides typed re-exports; `npm run test:clinical` smoke-loads every measure through the alias.

## Deviations from web

| Area | Mobile behaviour |
|---|---|
| ISNCSCI | Not on mobile (dropped from mobile scope; web only) |
| Patient-reported follow-ups | Web only (patient links open fine in mobile browsers) |
| Forms | 26 native forms vs 42 web measures — Wave 1 MSK parity (plus the ACL return-to-sport field tests) is a queued phase (`../docs/outcome-measures-handoff.md`) |
| Billing | RevenueCat + Apple IAP instead of Stripe; never link to external payment from the subscription screen (guideline 3.1.1) |
| Auth | Adds native Sign in with Apple (hashed-nonce `signInWithIdToken`); OAuth redirect `rehabmetricsiq://auth/callback` |
| Account deletion | Three-stage `AccountSettingsSheet`; Apple-login users re-authenticate so the server can revoke the Apple authorization |
| Theme | `src/theme/tokens.ts` mirrors web tokens; `primarySoft` is `#E9F3FF` (stronger than web — selected rows often have no border) |
| Theme — surface field (2026-06, **pending mobile parity**) | Web cooled its working surface from warm bone to a clinical near-white; mobile `tokens.ts` still holds the **old warm values**. To bring mobile in line in one pass, update: `bg` `#F8F8F2`→`#F4F6F4`, `surfaceSoft` `#F6F6F0`→`#EEF2EF`, `surfaceMuted` `#EFEFE6`→`#E8ECE9`, `panel` `#FBFBF7`→`#FBFCFB`. Do **not** touch `surface` (`#FFFFFF`) or `primarySoft`. After updating, device-QA the screens (contrast against white cards) before release. |

## Established mobile patterns (do not regress)

- **SaveState pattern:** every measure form follows the `SaveState` flow — `TUGForm.tsx` is the reference implementation. New forms copy the pattern, not an existing form's layout.
- **Save timeout:** `setTimeout` fires UI feedback after `ACTION_TIMEOUT_MS`, but the original `await saveAssessment()` keeps the Save button disabled until the promise settles. Never wrap the save in `withTimeout` — this prevents duplicate writes.
- **Mounted guard:** all form `setState` calls after an async save are guarded with `useMountedRef` (`src/hooks/useMountedRef.ts`). The hook exposes a ref that is `true` on mount and `false` on unmount. Check `mountedRef.current` before every post-save `setState` to prevent OOM kills from setState on unmounted components.
- **Session handling:** a `getSession()` network failure sets `isSessionCheckFailed` (with a retry path) — it must **not** clear the session. Session becomes `null` only when the server confirms no session exists.
- **Defence in depth:** all Supabase reads/writes are scoped `.eq('user_id', session.user.id)` in addition to RLS; route params are UUID-validated before use.
- **Questionnaire forms** share `ScoreChipRow`, `ScaleKey`, `QuestionnaireItem`, `QuestionnaireProgress` from `src/components/forms/fields/`.
- StyleSheet access uses explicit variant maps, never template-literal/computed keys.
- **Subscription pricing:** `subscribe.tsx` fetches prices live from StoreKit via RevenueCat; no hardcoded prices. The price field is `null` until StoreKit responds — plan cards suppress the price line when `null`.

## Environment

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=https://www.rehabmetricsiq.com
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_SENTRY_DSN=
```

Anon key only — never a service role key, never a secret in `EXPO_PUBLIC_*`.

## Build and release

iOS is the active platform; an Android/Google Play release is planned for the future (the Expo codebase already targets both). Identifiers (full table in [RESUBMISSION_HANDOFF.md](RESUBMISSION_HANDOFF.md)): bundle ID `com.rehabmetricsiq.app`, EAS slug `rehabmetrics-iq` (owner `benhay95`), App Store Connect app ID `6774467740`, version `1.0.0`.

```bash
# Local validation first — see ../TESTING.md and RELEASE_CHECKLIST.md
eas build --platform ios --profile production   # autoIncrement bumps ios.buildNumber in app.json
eas submit --platform ios --profile production  # submit config lives in eas.json
```

`eas.json` uses `appVersionSource: "local"` with `autoIncrement: true` on the production profile — the build number bump lands in `app.json` and should be committed after each build.

`.npmrc` in `mobile/` sets `legacy-peer-deps=true`. This prevents npm from auto-installing peer dependencies into nested `node_modules` directories, which was causing `react-native@0.86.0` to be nested under `react-native@0.81.5/node_modules/` and breaking EAS Metro bundling. Do not run `npm audit fix` without verifying it does not regenerate the duplicate.

Release governance:

- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) — env, OAuth/Apple config, validation commands, mandatory device QA, App Store Connect/RevenueCat setup.
- [RESUBMISSION_HANDOFF.md](RESUBMISSION_HANDOFF.md) — the active App Store resubmission runbook (identifiers, keys, dashboard config).
- [APP_STORE_RESUBMISSION.md](APP_STORE_RESUBMISSION.md) — App Review reply text and submission evidence for the June 2026 rejection (guidelines 4.8, 3.1.1, 5.1.1(v)).

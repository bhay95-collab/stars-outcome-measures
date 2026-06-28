# Testing — RehabMetrics IQ

Last verified against the codebase: 2026-06-13

## Web (repo root)

Jest via `next/jest` with a jsdom environment and Testing Library (`jest.config.js`, `jest.setup.js` imports `@testing-library/jest-dom`). The mobile directory is excluded from the web run.

```bash
npm test            # runs the full web suite in __tests__/
```

`__tests__/` currently contains 38 suites covering:

- **Clinical engine:** `mskMeasures`, `wave2Measures`, `wave3Measures`, `aclRts`, `conditionAwareMcid`, `clinicalDomains`, `pathways`, `outcomesIntelligence`, `referenceCard`, `followupQuestionnaires`.
- **API routes:** `SignupApi`, `DeleteAccountApi`, `FollowUpApi`, `RevenueCatApi`, `pilotApi`, `SupabaseAdminAuth`, `AppleServer`, `AppleDeletionStart/Callback/State`, `AccountProvisioning`.
- **Components/pages:** `SubscriptionWall`, `NewPatientModal`, `EditPatientModal`, `PatientEditEntryPoints`, `PatientFirstNavigation`, `PublicFollowUpPage`, `SignupPage`, `LandingAuthGateway`, `WheelchairPrescriptionTool`, `AppBootState`, `auth-routing`, and utility suites.

## Mobile (`mobile/`)

Three checks, all expected green before any release candidate (see `mobile/RELEASE_CHECKLIST.md`):

```bash
cd mobile
npm run typecheck       # tsc --noEmit
npm run test:app        # access, apple-auth, revenuecat suites (expo jest preset)
npm run test:clinical   # jest.clinical.config.js — clinical-import smoke tests that load
                        # every measure from ../lib/clinical through the @clinical alias
                        # using plain babel-jest (no Expo preset)
```

`mobile/__tests__/` also contains `comparisons.test.ts` and `patient-edit.test.ts` (run under the default app config).

## Approach and expectations

- Tests follow Arrange–Act–Assert with descriptive behaviour-style names (`'returns null when time is out of range'`).
- **Clinical logic must be tested.** Every new measure ships with unit tests for its calculation, interpretation bands, and MCID/threshold logic, validated against the primary source values (see [PRODUCT.md](PRODUCT.md) clinical integrity rules). Fix the implementation, not the test — unless the test itself contradicts the published clinical reference.
- New API routes and auth/billing/deletion logic get route-level tests (see the existing API suites for the mocking pattern).
- Colour/visual changes must not touch clinical logic — run both mobile suites after any theme work.
- There is **no enforced coverage gate** in either Jest config. The working standard for new code is the 80% target from the repo coding rules; treat it as the bar for new clinical and server logic rather than a CI-enforced number.
- Visual changes are verified manually with Playwright/simulators rather than snapshot tests — see the verification checklists in [CONTRIBUTING.md](CONTRIBUTING.md).

## Pre-release validation (mobile)

```bash
npm run typecheck && npm run test:app && npm run test:clinical && npm run expo:config && npx expo-doctor
```

`npx expo-doctor` passes all checks today; treat any new warning as a release blocker. Device QA requirements live in `mobile/RELEASE_CHECKLIST.md`.

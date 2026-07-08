# Architecture — RehabMetrics IQ

Last verified against the codebase: 2026-06-26

RehabMetrics IQ is a monorepo containing two apps that share one Supabase backend and one clinical scoring engine:

| App | Location | Stack | Deployment |
|---|---|---|---|
| Web | repo root | Next.js 16 (pages router), React 19 | Vercel — https://www.rehabmetricsiq.com |
| Mobile (iOS/Android) | `mobile/` | Expo SDK 54, expo-router 6, React Native 0.81, TypeScript | EAS Build / App Store Connect |

The repo is hosted on GitHub at `bhay95-collab/stars-outcome-measures`. The web app is **not** statically hosted — it requires server-side API routes (Stripe, Supabase admin, Apple, RevenueCat) and runs on Vercel. The `index.html` at the repo root is a legacy static prototype and is not part of the deployed product.

For mobile-specific architecture, see [mobile/MOBILE.md](mobile/MOBILE.md).

---

## Web app structure

```
pages/
  index.js          Public landing page (marketing, demo modal, pricing). Own CSS in `const styles`.
  app.js            The ENTIRE authenticated clinical app — app shell, sidebar, patient
                    workspace, assessment workflow, summary dashboard, modals, and the
                    global CSS (`const globalStyles`, design tokens in `:root`).
  login.js / signup.js / pilot.js
  forgot-password.js    Public — enter email to receive a Supabase password reset link (noindex).
  reset-password.js     Public — captures the PASSWORD_RECOVERY session event, sets new password (noindex).
  privacy.js / terms.js / clinical-use.js / data-deletion.js / reference-card.js
  followup/[token].js   Public (unauthenticated) patient questionnaire page, token-gated.
  api/              Server-side routes (see table below).
components/         Presentational/workflow React components. One Form<MEASURE>.js per
                    outcome measure, plus workspace components (SummaryTab, PatientList,
                    OutcomesIntelligenceWorkspace, WheelchairPrescriptionTool, ...).
                    Chart components (both dynamically imported with `ssr: false`):
                      MeasureTrendChart.js — per-measure LineChart with threshold + MCID lines
                      PathwayCoverageDonut.js — Smart Pathway coverage ring chart, clickable measures
lib/                Server + shared helpers (Supabase clients, Stripe, Apple, RevenueCat,
                    follow-ups, rate limiting, Sentry scrubbing).
lib/clinical/       The clinical engine — pure JavaScript only (see below).
supabase/migrations/  SQL migrations. Apply before deploying code that selects new columns.
__tests__/          Web Jest suite (see TESTING.md).
mobile/             The Expo app (see mobile/MOBILE.md).
```

### API routes

All sensitive routes authenticate the caller via `getUserFromRequest(req)` (reads the `stars-auth` cookie, validates the token against Supabase admin) before touching data.

| Route | Purpose | Auth |
|---|---|---|
| `/api/checkout` | Stripe checkout session | Cookie |
| `/api/customer-portal` | Stripe billing portal | Cookie |
| `/api/delete-account` | Full account deletion (Stripe cancel → Apple revoke → data wipe → auth user delete) | Cookie (+ Apple authorization code for Apple-login users) |
| `/api/check-deleted` | Pre-signup deleted-account check | None (by design), rate-limited |
| `/api/signup` | Account creation | Rate-limited |
| `/api/pilot` | Pilot lead capture | Rate-limited |
| `/api/reference-card` | Reference card requests | Rate-limited |
| `/api/followups/*` | Clinician follow-up CRUD | Cookie |
| `/api/followups/public/[token]` | Patient questionnaire submit | Token, rate-limited |
| `/api/oauth/provision` | Profile provisioning after OAuth | Token |
| `/api/subscriptions/revenuecat-sync` | Mobile entitlement sync | Bearer token |
| `/api/apple/deletion-start`, `/api/apple/deletion-callback` | Web-initiated Apple authorization revocation | Cookie / Apple state |
| `/api/webhooks/stripe` | Stripe events | Stripe signature |
| `/api/webhooks/revenuecat` | RevenueCat events | Authorization header |

---

## The clinical engine (`lib/clinical/`)

The single most important architectural rule in this repo: **clinical logic is separated from UI and shared between web and mobile.**

- Pure JavaScript only — no React, no DOM, no Supabase calls, no styling, no component state.
- One file per measure (e.g. `10mwt.js`, `koos.js`, `cait.js`), plus shared engines: `mcid.js` (MCID/MDC logic, condition-aware via `byCondition` overrides), `measures.js` (the registry), `pathways.js`, `patientSummary.js`, `outcomesIntelligence.js`, follow-up questionnaire support, and PDF generators (`patientReportPdf.js`, `serviceReportPdf.js`, `isncsciPdfExport.js`).
- `lib/clinical/measures.js` is the **measure registry** — the source of truth for measure name, abbreviation, category, units, directionality, chart config, thresholds, MCID keys, and availability. Components must not hardcode registry-owned values.
- The mobile app consumes the same files through the `@clinical` alias (wired in `mobile/babel.config.js`, `mobile/metro.config.js`, and `mobile/tsconfig.json` → `../lib/clinical`). A registry or scoring change lands on both platforms.

### Clinical data contract

Every calculation function returns:

```js
{
  primaryValue: number,    // feeds charts, comparison, MCID logic
  primaryUnit: string,
  interpretation: string,  // must be clinically accurate
  meta: object             // measure-specific outputs
}
```

There are currently **43 measures in the registry** (neuro/rehab, patient-reported questionnaires, the Wave 1–3 MSK set, and the ACL return-to-sport field tests + clinical signs; ISNCSCI is web-only). See [PRODUCT.md](PRODUCT.md) for the clinical scope and [DESIGN.md](DESIGN.md) for chart/colour rules.

---

## Data flow

```
Web client (pages/app.js)
  ├─ Reads/writes patients & assessments DIRECTLY against Supabase (anon key + RLS)
  │    └─ Defense in depth: every destructive mutation also filters .eq('user_id', user.id)
  └─ Calls Next.js API routes for privileged operations (Stripe, deletion, follow-up email)
       └─ API routes use the service-role admin client (lib/supabase-admin.js, server only)

Mobile client
  ├─ Reads/writes Supabase directly (EXPO_PUBLIC anon key + RLS, also user-scoped reads)
  └─ Calls the web deployment's API routes via EXPO_PUBLIC_API_URL
       (signup, RevenueCat sync, account deletion)
```

### Data model (Supabase)

| Table | Notes |
|---|---|
| `patients` | Source of truth for patient identity. Use `date_of_birth` and compute age at runtime. RLS: `auth.uid() = user_id`. |
| `assessments` | One row per saved assessment. `inputs` and `results` are JSONB. **Always sort `created_at DESC`** — latest = first, previous = second. INSERT policy also validates patient ownership. |
| `profiles` | Clinician profile, avatar, `clinical_focus` (`rehab` / `msk` / `both`). |
| `subscriptions` | Stripe subscription state. |
| `app_store_subscriptions` | RevenueCat/App Store entitlement state. Either source can grant access. |
| `followup_requests` / `followup_responses` | Tokenised patient-reported questionnaire links and responses. |
| `acl_pathways` | Per-patient ACL rehab Phase Tracker state (the only stateful per-patient table — outcome data otherwise lives in `assessments`). One row per patient: `pathway_type`, `index_date`, `current_phase` (1–6), `phase_history` JSONB, `updated_at` (maintained by a `BEFORE UPDATE` trigger). Gate tests are read from `assessments`, not duplicated. RLS like `followup_requests`; INSERT/UPDATE validate patient ownership. |
| `leads` | Landing/pilot lead capture. |
| `deleted_accounts` | Hashed-email tombstones; admin-client only. |

Before changing patient or assessment fields: map the Supabase schema to UI fields, confirm exact column names against `supabase/migrations/`, and list every affected file (both platforms). Never rely on localStorage for clinical data.

**Migration ordering matters:** apply new migrations before deploying web code that selects new columns — a failing `profiles` select is treated as "no access" by the app shell.

---

## Auth, billing, and access

- **Auth:** Supabase Auth. Web: email/password + Google OAuth, session mirrored into the `stars-auth` cookie for API-route auth. Mobile: email/password, Google OAuth (`rehabmetricsiq://auth/callback`), and native Sign in with Apple.
- **Access gate:** trial OR active Stripe subscription OR active App Store entitlement. Web gates inside `pages/app.js` (SubscriptionWall); mobile gates in `mobile/app/(app)/_layout.tsx` (redirects to `/subscribe`).
- **Billing:** Stripe on web; RevenueCat + StoreKit auto-renewable subscriptions on iOS (entitlement `pro`). The iOS app must not link to external payment from its subscription screen (App Store guideline 3.1.1).
- **Account deletion:** in-app on both platforms. Server flow in `lib/account-deletion.js`: cancel Stripe → revoke Apple authorization (hard gate for Apple users) → delete all owned rows + avatar files → tombstone → delete auth user.

---

## Cross-cutting concerns

- **Styling:** plain CSS inside page-level template strings. No Tailwind, no CSS modules, no styling libraries. See [DESIGN.md](DESIGN.md).
- **Charts:** `recharts` (v3.9.0) with peer dependency `react-is`. Chart components that use recharts must be dynamically imported with `ssr: false` — `ResponsiveContainer` requires the DOM and will break SSR. Both `MeasureTrendChart` and `PathwayCoverageDonut` follow this pattern.
- **Error monitoring:** Sentry on both platforms, errors only (no tracing/replay), with centralised PHI scrubbing (`lib/sentry-scrub.js`, `mobile/sentry.ts`). See [SECURITY.md](SECURITY.md).
- **Email:** Resend, server-side only, for follow-up questionnaire links (`lib/followupEmail.js`). Email content is limited to the link, questionnaire name, expiry, and a non-emergency disclaimer.
- **PDF export:** `pdf-lib` on web (patient reports, service reports, ISNCSCI export).
- **Rate limiting:** shared in-memory limiter (`lib/rateLimit.js`) on public routes. Per-instance only on Vercel — defense against bursts, not a global quota.
- **Testing:** Jest on both platforms — see [TESTING.md](TESTING.md).

## Known architectural debts

- `pages/app.js` is a single very large file containing the whole authenticated app and its CSS. This is a known, accepted deviation from the small-files rule; do not split it casually — it is the established pattern.
- `MeasureEntry.js` dispatches ~37 forms via an if-chain; a registry-driven component map is queued (see `docs/outcome-measures-handoff.md`).
- The root `index.html` is a dead static prototype using a pre-redesign palette.
- Rate limiting is in-memory per instance (Upstash/Redis planned before high-traffic rollout).

# Security Overview — RehabMetrics IQ

Last reviewed: 2026-06-13

---

## Data Handling Model

- **Supabase is the single source of truth for clinical data**, protected by Row Level Security and per-user scoping. Clinical data is never persisted in localStorage, on-device stores, or static hosting — the product is a server-backed app on Vercel (web) and Supabase-connected native clients (mobile), not a static/offline tool.
- **Data minimisation by design:** patients are recorded by an initials/label field (no full-name field exists), `date_of_birth` with age computed at runtime, and a diagnosis. Outcome measure inputs/results are clinical JSONB.
- **Patient-facing follow-up links** are tokenised, expiring, and contain no clinical data in the email body (link, questionnaire name, expiry, and a non-emergency disclaimer only).
- **PHI never reaches third parties beyond processors:** Stripe (payments), Supabase (storage/auth), Resend (follow-up link emails), Sentry (errors only, PHI-scrubbed — see below), RevenueCat/Apple (purchase state only).
- **Mobile** uses the anon key only (`EXPO_PUBLIC_*`); a service role key must never be configured in or shipped with the mobile app.

---

## Validated Protections

### Row Level Security (RLS)

RLS is enabled on all tables containing clinical or user data.

| Table | RLS Enabled | Policy |
|---|---|---|
| `patients` | Yes | `auth.uid() = user_id` |
| `assessments` | Yes | `auth.uid() = user_id` (SELECT/INSERT/UPDATE/DELETE) |
| `profiles` | Yes | `auth.uid() = id` |
| `subscriptions` | Yes | `auth.uid() = user_id` |
| `deleted_accounts` | Yes | No client SELECT — admin client only |
| `followup_requests` / `followup_responses` | Yes | Enabled in `20260529030000_add_patient_reported_followups.sql`; public submission goes through the token-gated API route, not direct client access |
| `app_store_subscriptions` / `revenuecat_webhook_events` | Yes | Enabled in `20260610090000_add_app_store_subscriptions.sql`; written server-side |
| `leads` | Yes | Enabled in `20260602011134_add_leads_table.sql`; written via rate-limited API routes |

The `assessments` INSERT policy also validates patient ownership using `EXISTS(SELECT 1 FROM patients WHERE id = patient_id AND user_id = auth.uid())`, which prevents a user from inserting an assessment against another user's patient even if they know the patient UUID.

### Cross-User Isolation Testing

Direct REST API cross-user attack testing was performed using valid JWTs from two separate accounts.

| Test | Method | Result |
|---|---|---|
| Read Account B patients with Account A JWT | `GET /rest/v1/patients` | `[]` — blocked |
| Read Account B patients by UUID with Account A JWT | `GET /rest/v1/patients?id=eq.<UUID>` | `[]` — blocked |

### Supabase Client Security

| Property | Status |
|---|---|
| Service role key | Server-side only (`lib/supabase-admin.js`, never in browser) |
| Anon key | Correctly public (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| Mobile key | Correctly public (`EXPO_PUBLIC_SUPABASE_ANON_KEY`) |
| Admin client usage | API routes only — never in component or page code |

### API Route Auth

All sensitive API routes validate the caller's identity via `getUserFromRequest(req)` before accessing data. This function reads the `stars-auth` cookie, extracts the access token, and validates it against Supabase admin before proceeding.

| Route | Auth Required |
|---|---|
| `/api/checkout` | Yes — 401 if unauthenticated |
| `/api/customer-portal` | Yes — 401 if unauthenticated |
| `/api/delete-account` | Yes — 401 if unauthenticated |
| `/api/check-deleted` | No (by design — pre-signup check, rate-limited) |
| `/api/signup` | No (account creation, rate-limited) |
| `/api/pilot`, `/api/reference-card` | No (public lead capture, rate-limited) |
| `/api/followups/*` | Yes — cookie auth |
| `/api/followups/public/[token]` | Follow-up token validation, rate-limited |
| `/api/subscriptions/revenuecat-sync` | Yes — bearer access token |
| `/api/apple/deletion-start` / `deletion-callback` | Cookie auth / Apple state validation |
| `/api/webhooks/stripe` | Stripe signature verification |
| `/api/webhooks/revenuecat` | Constant-time comparison against `REVENUECAT_WEBHOOK_AUTHORIZATION` |

### HTTP Security Headers

Configured in `next.config.js` via the `headers()` function.

| Header | Value | Protection |
|---|---|---|
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()` | Browser feature abuse |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HTTPS downgrade attacks |
| `Cache-Control: no-store` | API routes only | API response caching |

### Rate Limiting

Public-facing routes are rate-limited per IP via the shared in-memory limiter in `lib/rateLimit.js` (`createRateLimiter({ windowMs, max })`): `/api/check-deleted`, `/api/signup`, `/api/pilot`, `/api/reference-card`, and `/api/followups/public/[token]`. Routes return 429 with `{ error: 'Too many requests' }` when exceeded.

IP is sourced from `x-real-ip` (Vercel edge header, not spoofable by clients), falling back to `req.socket.remoteAddress`. Stale entries are pruned on each request to prevent unbounded memory growth.

**Known limitation:** In-memory state does not persist across serverless cold starts or multiple function instances. For high-volume deployments, replace with Upstash Redis (see deferred items).

### Storage Bucket: `avatars`

Verified 2026-05-19 via Supabase Dashboard → Storage → Buckets → avatars.

| Property | Value |
|---|---|
| Visibility | Public |
| Purpose | Non-clinical profile avatars only |

**Storage RLS policies confirmed:**

| Operation | Policy |
|---|---|
| INSERT | `bucket_id = 'avatars'` AND `auth.uid()::text = (storage.foldername(name))[1]` |
| UPDATE | `bucket_id = 'avatars'` AND `auth.uid()::text = (storage.foldername(name))[1]` |
| SELECT | Restricted to own folder via `auth.uid()::text = (storage.foldername(name))[1]` |
| DELETE | No policy (absent) |

A public bucket is acceptable here because avatars are non-clinical profile assets with no patient or assessment data. The INSERT and UPDATE policies prevent any user from writing to another user's folder path. A DELETE policy is not required until avatar removal is implemented as a feature.

**Constraints:**
- Never store clinical, patient, or assessment data in the `avatars` bucket.
- A DELETE policy must be added before implementing any avatar removal feature.

No SQL changes required. Safe for beta.

### Sentry Error Monitoring

Sentry is installed on both platforms. Scope: **error monitoring only** — no tracing, no profiling, no Session Replay, no user feedback widget.

| Platform | Package | Init file |
|---|---|---|
| Next.js web | `@sentry/nextjs` v10 | `instrumentation-client.js` (browser), `instrumentation.js` (server/edge hook) |
| Expo mobile | `@sentry/react-native` v7 | `mobile/sentry.ts`, called from `mobile/app/_layout.tsx` |

PHI scrubbing logic is centralised in `lib/sentry-scrub.js` (web) and `mobile/sentry.ts` (mobile). All three web init files (`instrumentation-client.js`, `sentry.server.config.js`, `sentry.edge.config.js`) import the shared `scrubEvent` function — no scrub logic is duplicated.

**PHI scrubbing — `beforeSend` applied on all init calls:**

| Data | Action |
|---|---|
| `cookie`, `set-cookie`, `authorization`, `x-supabase-auth` headers | Stripped case-insensitively from all request headers |
| Request body / `event.request.data` | Replaced with `'[redacted]'` on all server events |
| `user.email` | Stripped; only `user.id` retained |
| Navigation breadcrumb `data` (mobile) | Stripped from all navigation and http breadcrumb entries — prevents patient UUID leakage via route params and Supabase endpoint URLs |

**Config controls:**

| Setting | Value |
|---|---|
| `sendDefaultPii` | `false` on all init calls — IP addresses and user emails not auto-captured |
| `tracesSampleRate` | `0` — tracing disabled |
| Source maps | Opt-in via `SENTRY_AUTH_TOKEN` CI secret; build succeeds without it |

**Required env vars (not committed):**

| Variable | Where |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Web `.env.local` — get from Sentry Dashboard → Project → Settings → Client Keys |
| `EXPO_PUBLIC_SENTRY_DSN` | `mobile/.env.local` — same location |
| `SENTRY_AUTH_TOKEN` | Vercel / EAS Build secret only — for source map upload |
| `SENTRY_ORG` | Vercel / EAS Build secret only |
| `SENTRY_PROJECT` | Vercel / EAS Build secret only |

---

### Defense-in-Depth: Client-Side Ownership Filters

Destructive Supabase mutations in `pages/app.js` include an explicit `.eq('user_id', user.id)` filter in addition to RLS. This ensures that even if a future RLS policy regression occurs, the client cannot issue an unscoped DELETE.

Affected operations:
- `assessments` DELETE by `id`
- `assessments` DELETE cascade by `patient_id` (on patient deletion)
- `patients` DELETE by `id`

---

## Known Deferred Items

These have been assessed and accepted for post-beta remediation.

| Item | Severity | Reason Deferred |
|---|---|---|
| `stars-auth` cookie is not `HttpOnly` | MEDIUM | Cookie is set client-side for API route auth. Fixing requires migrating to `@supabase/ssr`, which is a non-trivial change affecting auth middleware, session handling, and cookie management. Planned post-beta. |
| No Content Security Policy | MEDIUM | CSP requires careful allowlisting of Supabase, Stripe, Google OAuth, and font domains. Incorrect policy silently breaks login. Planned post-beta with thorough testing. |
| Rate limiting is in-memory only | LOW | In-memory rate limiting resets on server restart and does not scale across multiple instances. Replace with Upstash Redis + `@upstash/ratelimit` before high-traffic rollout. |
| No Next.js edge middleware | LOW | No edge-level auth guard. All auth is handled at the page level. Acceptable for current scale. |
| No audit logging for clinical data | INFO | Supabase has a built-in audit log. Enable on `patients` and `assessments` tables for production compliance. |
| No autosave / assessment draft recovery | INFO | Unsaved assessment warning exists but does not recover data after accidental navigation. Add localStorage draft rescue pattern. |
| `avatars` DELETE policy absent | INFO | No DELETE policy exists on the `avatars` bucket. Required only if avatar removal is added as a feature. Not needed for beta. |

---

## Reporting

To report a security issue, contact the project owner directly. Do not open a public GitHub issue for security vulnerabilities.

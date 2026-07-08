# CLAUDE.md — RehabMetrics IQ

RehabMetrics IQ is a clinical SaaS product (Next.js web app + Expo mobile app sharing one Supabase backend and one clinical scoring engine) that helps physiotherapists capture, score, interpret, track, and report rehabilitation outcome measures.

## Your role

You are contributing to a clinical tool used by rehabilitation physiotherapists. **Accuracy, accessibility, and data security and reliability are non-negotiable.** Clinical rules outrank visual convenience; never invent thresholds, MCID values, or interpretations, and never present calculated insight as diagnosis.

Ben (the product owner) is not a developer — explain work in plain English: which file changed, what section, and why.

## Session bootstrap

At the start of each session, read CLAUDE.md. If the task touches a domain covered by another .md file, read that file too before writing any code.

## Documentation map

Core documents (repo root unless noted):

| File | Covers | Read it when |
|---|---|---|
| [README.md](README.md) | Project overview, setup, env vars, deployment | Setting up, deploying, or orienting a newcomer |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Tech stack, monorepo structure, API routes, clinical engine, data model, data flow, web-vs-mobile | Any structural work, new routes, Supabase/schema changes, anything in `lib/` |
| [DESIGN.md](DESIGN.md) | Visual language, design tokens (both platforms), brand, typography, class naming, forms, charts, accessibility | Any UI/visual change, new components, theming |
| [PRODUCT.md](PRODUCT.md) | What the tool is, users, the 42 measures, clinical integrity rules, measure licensing constraints, commercial model, roadmap pointers | New features, new measures, copy/positioning work |
| [SECURITY.md](SECURITY.md) | Data handling model, RLS, API auth, rate limiting, Sentry PHI scrubbing, deferred items, reporting | Auth, billing, deletion, RLS, PHI, or any sensitive-data change — read **before** coding |
| [LEGAL.md](LEGAL.md) | Legal posture, Terms/Privacy update triggers, disclaimer rules, known legal gaps | Any new feature, patient-facing content, sub-processor, measure, or copy change — check the trigger table **before** shipping |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Workflow, branching, commit format, coding standards, verification checklists, failure conditions | Before committing; when verifying changes |
| [TESTING.md](TESTING.md) | Test commands, suite layout, expectations on both platforms | Writing or running tests; before any release |
| [mobile/MOBILE.md](mobile/MOBILE.md) | Mobile architecture, `@clinical` sharing, platform deviations, established mobile patterns, EAS build/release | Any work under `mobile/` |

Working documents (kept current as work lands):

| File | Covers |
|---|---|
| `docs/product-roadmap.md` | Active build, delivered phases, defaults to revisit |
| `docs/outcome-measures-handoff.md` | Next 20 measures with licensing status; carried-forward work |
| `docs/msk-expansion-plan.md` | Wave 1 MSK build record; deferred licensed-measure clinical profiles |
| `mobile/RELEASE_CHECKLIST.md` | Mobile release gates, env, device QA |
| `mobile/RESUBMISSION_HANDOFF.md` | Active App Store resubmission runbook + permanent identifiers |
| `mobile/APP_STORE_RESUBMISSION.md` | App Review reply text and submission evidence |

(`.claude/rules/` holds generic coding/workflow standards applied across projects; `.agents/skills/` holds plugin skill assets — neither is project documentation.)

## The update rule

**When your work changes something documented in one of these files, update that file in the same session before closing.** Stale documentation is treated as a bug.

## Non-negotiable working rules

- **Clinical logic lives in `lib/clinical/` only** — pure JS, no React/DOM/Supabase/styling. Components consume clinical functions; the registry (`lib/clinical/measures.js`) owns measure metadata, thresholds, and chart config. Calculation functions return `{ primaryValue, primaryUnit, interpretation, meta }`.
- **One measure at a time**, validated against primary sources. Licensed measures (ODI, NDI, QuickDASH, OSS, PCS, MSK-HQ) must not be built without signed licences. ISNCSCI is web-only, complex — modify separately, never batched with unrelated work.
- **Styling:** existing page-level style blocks only (`const styles` in `pages/index.js`, `const globalStyles` in `pages/app.js`, `mobile/src/theme/tokens.ts`). No Tailwind, no CSS modules, no new styling systems. Use existing tokens (DESIGN.md) before adding any value.
- **Data:** Supabase is the source of truth; never localStorage for clinical data; assessments sort `created_at DESC`; confirm exact column names against `supabase/migrations/` before changing fields; destructive mutations carry an explicit `.eq('user_id', …)` in addition to RLS.
- **Secrets:** never hardcoded, never in `EXPO_PUBLIC_*`/`NEXT_PUBLIC_*`, service-role key server-side only.
- **Sensitive changes** (auth, Stripe, RevenueCat, subscription gates, RLS, deletion): read SECURITY.md first, preserve existing flows, run a security review.
- **Preserve existing functionality and patterns** — the preservation lists in DESIGN.md and the failure conditions in CONTRIBUTING.md define what must not break.

## Known build patterns and gotchas (audited 2026-06-26)

1. `pages/app.js` is the **entire authenticated web app** in one large file — UI, state, and the design-token `:root` block (~line 3086). This is the accepted pattern; don't split it casually.
2. **Migration order:** apply Supabase migrations before deploying web code that selects new columns — a failed `profiles` select is treated as "no access" and locks users out.
3. The **`@clinical` alias** (mobile → `../lib/clinical`) is wired in three files that must stay in sync: `mobile/tsconfig.json`, `mobile/babel.config.js`, `mobile/metro.config.js`. `npm run test:clinical` smoke-tests it.
4. **EAS `autoIncrement`** writes the iOS build number into `mobile/app.json` at build time — commit the bump after each production build.
5. Web Jest excludes `mobile/`; mobile clinical tests deliberately use plain babel-jest (no Expo preset) to avoid `import.meta` injection into shared clinical files.
6. `mobile/patches/` (patch-package, runs on postinstall) patches `@supabase/supabase-js`; `mobile/stubs/` stubs `opentelemetry-api` for Metro.
7. The root `index.html` is a **dead static prototype** (pre-redesign palette) — not deployed, not a pattern reference. The product runs on Vercel, not GitHub Pages.
8. Landing fonts are self-hosted via `next/font/local` (`assets/fonts/`) for slow connections — don't reintroduce Google Fonts `<link>`s on the landing page.
9. Email HTML (`lib/followupEmail.js`) and PDF generators use **raw hex mirrors** of the design tokens (CSS vars don't work there) — update them when tokens change.
10. Mobile save flow: UI feedback via `setTimeout` only; the original `await` keeps Save disabled (never `withTimeout` around `saveAssessment()`). Mobile session: `getSession()` failure sets `isSessionCheckFailed`, never clears the session.
11. Web API routes authenticate via the `stars-auth` cookie (`getUserFromRequest`) — it is not HttpOnly yet (known deferred item in SECURITY.md).
12. Apple account deletion is a **hard gate**: server-side Apple token revocation must succeed before data deletion proceeds for Apple-login users.
13. **recharts needs `react-is` as a peer dep** — `recharts` v3.x does not bundle it. If you see `Module not found: Can't resolve 'react-is'`, run `npm install react-is --legacy-peer-deps`.
14. **recharts components must be dynamically imported with `ssr: false`** — `ResponsiveContainer` uses `ResizeObserver` and will crash the Next.js SSR pass. Use `next/dynamic` with `{ ssr: false }` for any component that renders recharts. `MeasureTrendChart` and `PathwayCoverageDonut` already follow this pattern.
15. **Dark sidebar CSS specificity** — sidebar colour overrides live at a lower position in the stylesheet than the base button/nav styles. They win by using `.app-sidebar` as a parent prefix (specificity 0-2-1 vs 0-1-1), not by order. Always scope dark-sidebar overrides with `.app-sidebar .target-class`, not bare selectors.
16. **`acl_pathways` is the first stateful per-patient table** — every other clinical record is a stateless `assessments` row. The ACL Phase Tracker stores one pathway row per patient (`current_phase`, `phase_history`); gate tests are read live from `assessments`, never duplicated — including the clinical signs (full extension + effusion grade), which since 2026-07-09 are persisted as `ACLSigns` assessments (`lib/clinical/aclSigns.js`), not session-only checkboxes. Apply migration `20260628000000_add_acl_pathways.sql` before deploying web. The clinician advances the phase — the tool never auto-progresses and never issues an RTS clearance (clinical-safety rule). ACL-RSI/IKDC stay `pending` in the RTS battery engine until licensed (no substitute cut-off is invented) and their rows are **hidden in the UI** (`RTSBatteryDashboard` filters `pending`) — un-hide by removing that filter once licences are signed.

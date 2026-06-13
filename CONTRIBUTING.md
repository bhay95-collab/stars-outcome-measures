# Contributing — RehabMetrics IQ

Last verified against the codebase: 2026-06-13

This is a solo-maintained product (Ben, product owner — not a developer) built primarily with Claude Code. The bar for every change: clinically accurate, visually consistent with the established system, and nothing existing breaks.

## Before writing code

1. Read [CLAUDE.md](CLAUDE.md) and the domain doc for the area you're touching (see the map in CLAUDE.md).
2. Inspect the current file and understand the existing pattern before editing. Make the smallest safe change that preserves the current visual and functional system.
3. For multi-step changes, plan first and get approval before major edits.
4. Research before building new functionality: check for existing implementations and battle-tested libraries before hand-rolling.

## Branching and commits

- Default branch: `main`. Feature work goes on feature branches (`feature/<topic>`; Claude Code cloud sessions use `claude/<generated-name>` branches).
- Conventional commit format: `<type>: <description>` with types `feat, fix, refactor, docs, test, chore, perf, ci`. Commit attribution is disabled.
- Never commit secrets, `.p8` keys, or `google-play-key.json`. Run the security checklist in [SECURITY.md](SECURITY.md) before any commit that touches auth, billing, or data handling.

## PR process

1. Analyze the full commit history of the branch (`git diff main...HEAD`), not just the latest commit.
2. Draft a comprehensive summary with a test plan.
3. Push with `-u` for new branches.
4. Ensure CI/tests pass, conflicts are resolved, and the branch is current with `main` before requesting review.

## Coding standards

- **Immutability** — return new objects, never mutate in place.
- **KISS / DRY / YAGNI** — simplest working solution; extract real repetition; no speculative abstraction.
- Small focused functions (<50 lines) and files (200–400 lines typical; `pages/app.js` is the accepted legacy exception — see [ARCHITECTURE.md](ARCHITECTURE.md)).
- Explicit error handling at every level; user-friendly messages in UI, detailed context in server logs; never silently swallow errors.
- Validate all input at system boundaries; never trust external data.
- Naming: `camelCase` functions/variables, `PascalCase` components/types, `UPPER_SNAKE_CASE` constants, `is/has/should/can` boolean prefixes, `use` hook prefix.
- No `console.log` in production code. No new styling systems (see [DESIGN.md](DESIGN.md)). Clinical logic stays in `lib/clinical/` — never in components (see [ARCHITECTURE.md](ARCHITECTURE.md)).
- TypeScript (mobile): explicit types on exported APIs and props; avoid `any` (narrow `unknown` instead).

## Review and verification

Every code change gets a code review pass; auth, payment, subscription, Supabase/RLS, or sensitive-data changes additionally get a security review. New clinical functionality follows test-first development ([TESTING.md](TESTING.md)).

### Web verification checklist

Run `npm run dev`, then verify (Playwright for visual changes):

- Landing: loads, hero and preview render, pricing toggle works, demo modal opens/closes, mobile layout intact, no browser-default controls.
- App: login/session works, subscription wall intact, sidebar navigation, patient create/select, new assessment opens and saves, summary updates, previous/current comparison, PDF export, sign out, mobile layout usable.
- Data changes: Supabase column names match exactly, no console errors, no failed queries, no broken RLS assumptions.
- Clinical changes: calculation output, interpretation, MCID/threshold logic, chart scale, report output.

### Mobile verification

See [TESTING.md](TESTING.md) and `mobile/RELEASE_CHECKLIST.md` (device QA is mandatory before release).

## Reject the work if

The app looks like plain HTML; inputs look browser-default; the landing page becomes generic SaaS; auth/subscription flow breaks; patient data stops saving; assessments stop sorting newest-first; clinical calculations end up hardcoded in UI components; chart scales are arbitrary; colours are added without purpose; mobile layout breaks; secrets are introduced; or existing functionality is removed without approval.

## Documentation upkeep

When your change alters anything documented in CLAUDE.md, README.md, ARCHITECTURE.md, DESIGN.md, PRODUCT.md, SECURITY.md, TESTING.md, or mobile/MOBILE.md — update that file in the same session. Stale documentation is treated as a bug.

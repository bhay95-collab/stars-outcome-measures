# RehabMetrics IQ

Clinical SaaS for physiotherapists and rehabilitation teams: capture, score, interpret, track, and report rehabilitation outcome measures. **Data-driven outcomes. Better patient care.**

- **Production:** https://www.rehabmetricsiq.com (web, Vercel) + iOS app (App Store, bundle `com.rehabmetricsiq.app`)
- **Repo:** https://github.com/bhay95-collab/stars-outcome-measures

New here (human or Claude)? Start with **[CLAUDE.md](CLAUDE.md)** — it maps every document in this repo. Architecture details are in [ARCHITECTURE.md](ARCHITECTURE.md); product scope in [PRODUCT.md](PRODUCT.md).

## Monorepo layout

| Path | What | Docs |
|---|---|---|
| repo root | Next.js 16 web app (pages router) | [ARCHITECTURE.md](ARCHITECTURE.md) |
| `mobile/` | Expo SDK 54 iOS/Android app | [mobile/MOBILE.md](mobile/MOBILE.md) |
| `lib/clinical/` | Shared clinical scoring engine (pure JS, used by both apps) | [ARCHITECTURE.md](ARCHITECTURE.md) |
| `supabase/migrations/` | Database migrations | [SECURITY.md](SECURITY.md) |

## Local development

```bash
# Web
npm install
npm run dev          # http://localhost:3000
npm test

# Mobile
cd mobile
npm install          # postinstall applies patch-package patches
npx expo start       # or: npm run ios / npm run android
```

### Web environment variables

Supabase and Stripe client/server keys plus the values below. Never commit secrets; service-role keys are server-only ([SECURITY.md](SECURITY.md)).

Patient questionnaire follow-up emails use Resend from server-side API routes:

```bash
RESEND_API_KEY=
FOLLOWUP_EMAIL_FROM="RehabMetrics IQ <followups@your-domain.com>"
NEXT_PUBLIC_APP_URL=https://www.rehabmetricsiq.com
```

`NEXT_PUBLIC_APP_URL` is reused to build secure follow-up links. Email content is intentionally limited to the questionnaire link, questionnaire name, expiry date, and non-emergency disclaimer.

App Store billing verification and Apple account-deletion revocation:

```bash
REVENUECAT_SECRET_API_KEY=
REVENUECAT_WEBHOOK_AUTHORIZATION=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_CLIENT_ID=com.rehabmetricsiq.app
APPLE_PRIVATE_KEY=
```

Sentry (error monitoring only): `NEXT_PUBLIC_SENTRY_DSN`, plus `SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT` as CI secrets for source maps.

Mobile env vars are listed in [mobile/MOBILE.md](mobile/MOBILE.md).

## Deployment

- **Web:** Vercel, auto-deploys `main`. Domain `rehabmetricsiq.com` 301-redirects to `www.` (configured in `next.config.js`). Apply any new `supabase/migrations/` **before** deploying code that selects new columns.
- **Mobile:** EAS Build + EAS Submit (`mobile/eas.json`). Release process and device-QA gates: [mobile/RELEASE_CHECKLIST.md](mobile/RELEASE_CHECKLIST.md).

> Note: the `index.html` at the repo root is a legacy static prototype and is not deployed. The product is not hosted on GitHub Pages — it requires server-side API routes.

## Testing

Jest on both platforms — commands, suite layout, and expectations in [TESTING.md](TESTING.md).

## Contributing

Workflow, branching, coding standards, and verification checklists in [CONTRIBUTING.md](CONTRIBUTING.md). Security reporting: contact the project owner directly — do not open a public issue ([SECURITY.md](SECURITY.md)).

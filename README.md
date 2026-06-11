# stars-outcome-measures

## Web Environment

Patient questionnaire follow-up emails use Resend from server-side API routes. Add these values in the web deployment environment:

```bash
RESEND_API_KEY=
FOLLOWUP_EMAIL_FROM="RehabMetrics IQ <followups@your-domain.com>"
NEXT_PUBLIC_APP_URL=https://www.rehabmetricsiq.com
```

`NEXT_PUBLIC_APP_URL` is reused to build secure follow-up links. Email content is intentionally limited to the questionnaire link, questionnaire name, expiry date, and non-emergency disclaimer.

## App Store Billing and Apple Account Deletion

The web deployment verifies RevenueCat entitlements and revokes Sign in with Apple authorization during account deletion. Configure:

```bash
REVENUECAT_SECRET_API_KEY=
REVENUECAT_WEBHOOK_AUTHORIZATION=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_CLIENT_ID=com.rehabmetricsiq.app
APPLE_PRIVATE_KEY=
```

Apply `supabase/migrations/20260610090000_add_app_store_subscriptions.sql` before releasing mobile build 11.

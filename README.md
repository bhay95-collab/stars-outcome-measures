# stars-outcome-measures

## Web Environment

Patient questionnaire follow-up emails use Resend from server-side API routes. Add these values in the web deployment environment:

```bash
RESEND_API_KEY=
FOLLOWUP_EMAIL_FROM="RehabMetrics IQ <followups@your-domain.com>"
NEXT_PUBLIC_APP_URL=https://www.rehabmetricsiq.com
```

`NEXT_PUBLIC_APP_URL` is reused to build secure follow-up links. Email content is intentionally limited to the questionnaire link, questionnaire name, expiry date, and non-emergency disclaimer.

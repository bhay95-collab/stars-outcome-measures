# App Store Resubmission

## Build

- Version: `1.0`
- Minimum resubmission build: `11`
- Latest rejection: submission `a2cda48f-32c3-4135-b255-b087f9e63617`, reviewed June 16, 2026
- Guideline: 3.1.2(c) — Terms of Use (EULA) link missing from App Store metadata

## June 16, 2026 Rejection — What to Fix

**No code changes are required.** This is a metadata-only fix in App Store Connect.

### Step 1 — Add the Terms of Use link to the App Description

In App Store Connect, open **My Apps → RehabMetrics IQ → iOS App → 1.0 → App Information** (or the version's Description field).

Scroll to the bottom of the existing App Description and paste the following block. Do not replace the existing description — append this section to the end:

```
───────────────────────────────
SUBSCRIPTION INFORMATION

RehabMetrics IQ Pro is available as a monthly or annual auto-renewable subscription.

• RehabMetrics IQ Pro Monthly — AUD $29.00 per month
• RehabMetrics IQ Pro Annual — AUD $250.00 per year

Payment is charged to your Apple Account at confirmation of purchase. Your subscription automatically renews unless cancelled at least 24 hours before the end of the current period. You can manage or cancel your subscription at any time in your Apple Account Settings (Settings → [your name] → Subscriptions).

Privacy Policy: https://www.rehabmetricsiq.com/privacy
Terms of Use: https://www.rehabmetricsiq.com/terms
───────────────────────────────
```

Save the description change.

### Step 2 — Optionally add the EULA URL to the dedicated field

In App Store Connect, on the same version page, look for the **EULA** field (sometimes listed under App Review Information or Localizable Information). If the field is present, enter:

```
https://www.rehabmetricsiq.com/terms
```

This is optional if the Terms of Use URL is already in the App Description, but filling it in both places removes all ambiguity for the reviewer.

### Step 3 — Reply to the review message

Reply to the June 16 rejection message in App Store Connect using the reply text below. Fill in the three placeholders before sending.

## App Review Reply

> Thank you for reviewing our submission.
>
> Guideline 3.1.2(c): We have updated the App Store description to include a functional link to our Terms of Use at https://www.rehabmetricsiq.com/terms. A subscription information section has been added to the bottom of the App Description. It states the subscription title, duration, price, renewal terms, and includes functional links to both the Privacy Policy (https://www.rehabmetricsiq.com/privacy) and Terms of Use (https://www.rehabmetricsiq.com/terms). The Terms of Use URL has also been added to the EULA field in App Store Connect.
>
> The issues addressed in our previous reply remain resolved:
>
> Guideline 4.8: Sign in with Apple is available on the login screen alongside Google and email login. It supports Hide My Email and creates the same RehabMetrics IQ account and 14-day trial as the other registration methods.
>
> Guideline 3.1.1: When a signed-in user has no active trial or subscription, the app opens a native subscription screen offering monthly and annual auto-renewable subscriptions through Apple In-App Purchase. The same screen includes Restore Purchases. Existing customers with an active web subscription continue to receive access.
>
> Guideline 5.1.1(v): Account deletion is available from Account on both the Patient Directory and subscription screen. The flow includes two confirmations, removes the user account and clinical data, and reauthenticates Sign in with Apple users so the Apple authorization can be revoked.
>
> Review paths:
> - Sign in with Apple: Login screen, Continue with Apple
> - In-App Purchase: Sign in with the expired-trial review account, then choose Monthly or Annual
> - Restore Purchases: Subscription screen, Restore Purchases
> - Account deletion: Account, Delete account, Continue, Delete account permanently
> - Deletion recording: [ADD REVIEWER-ACCESSIBLE URL]
>
> Active demo account: [ADD EMAIL AND PASSWORD]
> Expired-trial demo account: [ADD EMAIL AND PASSWORD]

## Submission Evidence

- Record the complete deletion flow on a physical iPhone or iPad.
- Upload the recording to a reviewer-accessible HTTPS URL without a login requirement.
- Add the recording URL and both demo accounts to App Review Information.
- Capture revised screenshots with fictional clinical data at current accepted 6.9-inch iPhone and 13-inch iPad dimensions.
- Include Patient Directory, patient workspace, measure selection, and subscription screens. Keep login to at most one screenshot.
- Update App Privacy to disclose purchase history and user identifiers used by Apple and RevenueCat. Do not declare advertising tracking.

## Acceptance Gate

- Both subscriptions are `Ready to Submit` and attached to the app version.
- Apple sign-in works with shared email and Hide My Email.
- Sandbox purchase, renewal state, cancellation state, and restore all synchronize to Supabase.
- Existing Stripe subscribers retain access on iOS and web.
- Deletion succeeds for email, Google, and Apple accounts.
- A physical-device pass is complete on iPhone and iPad Air 11-inch.

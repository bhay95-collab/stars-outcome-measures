# App Store Resubmission

## Build

- Version: `1.0`
- Minimum resubmission build: `11`
- Rejection being addressed: submission `a2cda48f-32c3-4135-b255-b087f9e63617`, reviewed June 10, 2026

## App Review Reply

Use this as the starting reply after all sandbox and device checks pass:

> We addressed all issues identified in the previous review.
>
> Guideline 4.8: Sign in with Apple is now available on the login screen alongside Google and email login. It supports Hide My Email and creates the same RehabMetrics IQ account and 14-day trial as the other registration methods.
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

# App Store Resubmission

## Build

- Version: `1.0`
- Minimum resubmission build: `22`
- Status: build 22 submitted for App Review on July 18, 2026, using the reply text below.
- Rejection being addressed: submission `a2cda48f-32c3-4135-b255-b087f9e63617`, reviewed June 23, 2026
- Build 17 triggered a WatchdogTermination (OOM kill, Sentry issue 7571375518) on the reviewer's iPad (iOS 26.5) at the sign-in screen. Root cause: app was built with `jsEngine: jsc`; build 18 switches to Hermes, which reduces JS heap by ~30–50%. Also adds `checkAutomatically: ON_LOAD` explicitly to the updates config to avoid ambiguity in future SDK upgrades.
- Build 21 adds citations to every mobile-supported measure (Guideline 1.4.1) and closes the matching gap on the `/clinical-use` web page.
- Build 22 confirms the Apple Developer Program account is now enrolled as an organisation (Guideline 5.1.1(ix)) — the build credentials output shows Apple Team "Benjamin Robert Hay (Company/Organization)".

## App Review Reply

Use this as the starting reply after all sandbox and device checks pass:

> We addressed all issues identified in the most recent review. Thank you for reviewing our submission.
>
> Guideline 1.4.1 — Citations: Every outcome measure in the app now includes a References section accessible via the Guide button in the header of each assessment screen. The Guide button is visible on all 40 supported measure forms. The References section lists the original peer-reviewed validation papers for each measure with author, journal, year, and a tappable link to the source on PubMed or the publisher's DOI where available. For example, the Berg Balance Scale references Berg et al. (Arch Phys Med Rehabil, 1992, pubmed.ncbi.nlm.nih.gov/1444775) and the Timed Up and Go references Podsiadlo & Richardson (J Am Geriatr Soc, 1991, pubmed.ncbi.nlm.nih.gov/1991946). To review: open any patient record, select a measure, and tap Guide in the top-right header.
>
> Guideline 5.1.1(ix) — Organisation account: Our Apple Developer Program account is now enrolled as an organisation account, not an individual account. This build was created and submitted under that organisation account.
>
> Guideline 3.1.2(c): We have updated the App Store description to include a functional link to our Terms of Use at https://www.rehabmetricsiq.com/terms. The description now includes a subscription information section stating the subscription title, duration, price, and renewal terms, with functional links to both the Privacy Policy (https://www.rehabmetricsiq.com/privacy) and Terms of Use (https://www.rehabmetricsiq.com/terms). A screen recording of the in-app subscription screen is attached below, showing both the Privacy and Terms links opening the correct pages: https://drive.google.com/file/d/1uESxidJTprJ6jWtN-I9l8s39zJ-GiL_o
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
> - Citations: Open any patient, select any measure (e.g. Berg Balance Scale), tap Guide in the top-right header, scroll to References
> - Sign in with Apple: Login screen → Continue with Apple
> - In-App Purchase: Sign in with the expired-trial review account, then choose Monthly or Annual
> - Restore Purchases: Subscription screen → Restore Purchases
> - Account deletion: Account → Delete account → Continue → Delete account permanently
> - Deletion recording: Attached to submission
>
> Expired-trial demo account: Userrehabmetricsiq@gmail.com. Password: see App Review Information in App Store Connect (not stored in source control).
>
> Thank you for reviewing our submission.

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
- Every measure form shows a Guide button; Guide modal includes a References section with citations and tappable PubMed/DOI links.
- App launches without crash on iOS 26 beta (test on Xcode 26 simulator or a device running iOS 26).
- [x] Organisation account conversion confirmed — Apple Team shows "Benjamin Robert Hay (Company/Organization)" as of build 22.

# App Store Resubmission

## Build

- Version: `1.0`
- Minimum resubmission build: `17`
- Rejection being addressed: submission `a2cda48f-32c3-4135-b255-b087f9e63617`, reviewed June 23, 2026

## App Review Reply

Use this as the starting reply after all sandbox and device checks pass:

> We addressed all issues identified in the most recent review.
>
> Guideline 1.4.1 — Citations: Every outcome measure in the app now includes a References section accessible via the Guide button in the header of each assessment screen. The Guide button is visible on all 23 measure forms. The References section lists the original peer-reviewed validation papers for each measure with author, journal, year, and a tappable link to the source on PubMed or the publisher's DOI. For example, the Berg Balance Scale references Berg et al. (Arch Phys Med Rehabil, 1992, pubmed.ncbi.nlm.nih.gov/1444775) and the Timed Up and Go references Podsiadlo & Richardson (J Am Geriatr Soc, 1991, pubmed.ncbi.nlm.nih.gov/1991946). To review: open any patient record, select a measure, and tap Guide in the top-right header.
>
> Guideline 5.1.1(ix) — Organisation account: We have submitted an application to Apple Developer Support to convert the individual developer account to an organisation account. We will resubmit under the organisation account once Apple confirms the conversion.
>
> The issues from the previous review cycle (4.8, 3.1.1, 5.1.1(v)) remain resolved in this build.
>
> Review paths:
> - Citations: Open any patient, select any measure (e.g. Berg Balance Scale), tap Guide in the top-right header, scroll to References
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
- Every measure form shows a Guide button; Guide modal includes a References section with citations and tappable PubMed/DOI links.
- Organisation account conversion is confirmed by Apple before final submission.

# App Store Resubmission

## Build

- Version: `1.0`
- Minimum resubmission build: `11`
- Latest rejection: submission `a2cda48f-32c3-4135-b255-b087f9e63617`, reviewed June 16, 2026
- Guideline: 3.1.2(c) — Terms of Use (EULA) link missing from App Store metadata

## June 16, 2026 Rejection — What to Fix

**No code changes are required.** This is a metadata-only fix in App Store Connect.

### Step 1 — Replace the App Description

In App Store Connect, open **My Apps → RehabMetrics IQ → iOS App → 1.0 → App Information** (or the version's Description field).

Replace the entire existing description with the text below. The SUBSCRIPTION section has been rewritten (the old version incorrectly stated "No in-app purchases are required" and directed users to the website only), and Terms of Use has been added alongside the Privacy Policy link at the bottom.

```
RehabMetrics IQ is a clinical outcome measure documentation tool for physiotherapists and rehabilitation clinicians working in neurological, stroke, amputee, and complex rehabilitation settings.

Capture, score, and interpret validated outcome measures in less time, with built-in clinical context at every step.

OUTCOME MEASURES INCLUDED

Mobility & Gait
  • Timed Up and Go (TUG)
  • 10 Metre Walk Test (10MWT)
  • 6 Minute Walk Test (6MWT)
  • Functional Ambulation Classification (FAC)
  • Functional Gait Assessment (FGA)
  • High-Level Mobility Assessment Tool (HiMAT)
  • Step Test

Balance
  • Berg Balance Scale (BBS)
  • Postural Assessment Scale for Stroke (PASS)
  • Balance Outcome Measure for Elder Rehabilitation (BOOMER)
  • Activities-Specific Balance Confidence Scale (ABC)

Neurological & Stroke
  • Motor Assessment Scale (MAS)
  • Trunk Impairment Scale (TIS)
  • Clinical Outcome Variation Scale (COVS)
  • Barthel Index
  • Spinal Cord Independence Measure III (SCIM III)
  • ISNCSCI — International Standards for Neurological Classification of SCI
  • Scale for the Assessment and Rating of Ataxia (SARA)

Condition-Specific
  • Parkinson's Disease Questionnaire — 8 (PDQ-8)
  • Fatigue Severity Scale (FSS)
  • Rivermead Post Concussion Questionnaire (RPQ)
  • Hospital Anxiety and Depression Scale (HADS)
  • Brain Injury Vision Inventory (BIVI)

CLINICAL INTELLIGENCE
Each assessment is automatically scored and interpreted. When a patient has a previous assessment, RehabMetrics IQ shows whether the change is clinically meaningful — not just whether the number moved.

MINIMAL DOCUMENTATION TIME
Structured forms guide data entry. Results are calculated instantly. Nothing needs to be looked up or computed manually.

PATIENT MANAGEMENT
Maintain a directory of your patients, track their assessment history over time, and review trends across multiple measures in one place.

DESIGNED FOR CLINICIANS
RehabMetrics IQ is intended for licensed physiotherapists and rehabilitation professionals. It is not a consumer health app and is not a medical device. It does not provide diagnoses or replace clinical judgement.

SUBSCRIPTION
RehabMetrics IQ Pro requires an active subscription to access the full clinical workspace.

  • RehabMetrics IQ Pro Monthly — AUD $29.00 per month
  • RehabMetrics IQ Pro Annual — AUD $250.00 per year

Payment is charged to your Apple Account at confirmation of purchase. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. You can manage or cancel your subscription at any time in Settings → [your name] → Subscriptions.

Clinicians with an existing web subscription at rehabmetricsiq.com retain full access on iOS without purchasing again.

Privacy Policy: https://www.rehabmetricsiq.com/privacy
Terms of Use: https://www.rehabmetricsiq.com/terms
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

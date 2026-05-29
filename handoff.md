# RehabMetrics IQ — Handoff

**Date:** 2026-05-29
**Branch:** `main`
**Last commit:** `f6d7531 docs: update privacy and data deletion pages for App Store submission`

---

## Current status

Apple Developer account is now approved and App Store Connect is accessible. The app has been created in App Store Connect (**RehabMetrics IQ**, bundle ID `com.rehabmetricsiq.app`).

**Three pre-build blockers remain before running the production EAS build:**

1. **App icon** — `mobile/assets/icon.png` is still the default Expo placeholder. Must be replaced with the branded RehabMetrics IQ icon (resize `SquareLogo.png` to 1024×1024 and overwrite `icon.png`).
2. **Screenshots** — existing screenshots were taken on a real device. App Store requires exact dimensions: iPhone 6.7" = 1290×2796 px, iPad 12.9" = 2048×2732 px. Also need to retake with a clean demo account (no personal profile photo visible).
3. **`eas.json` submit block** — needs real `appleId`, `ascAppId`, and `appleTeamId` values filled in (see section 4B).

No code changes have been made since the last handoff. The working tree is clean.

---

## What has been completed (since last handoff on 2026-05-24)

### Phase 1 — Edit patient on mobile (commit `b99edd0`)

Added the ability to edit a patient's details from the mobile patient screen.

- `PatientEditSheet.tsx` — bottom-sheet modal with initials, DOB, gender, and diagnosis fields
- `updatePatient()` in `patients.ts` — scoped by both `user_id` and `id` for security
- 21 unit tests in `__tests__/patient-edit.test.ts`

### Phase 2 — MCID and trend context on history cards (commit `5306438`)

Each assessment history card now shows whether the change vs the previous assessment was clinically meaningful.

- `comparisons.ts` — `getAssessmentComparison()` and `buildPreviousAssessmentMap()`
- `adapter.ts` — typed re-exports of `calcChange` and `getMCIDStatus` from `@clinical/mcid`
- Pill colours: green/mint (MCID met), blue-soft (improved, no MCID), coral-soft (declined)
- 20 unit tests in `__tests__/comparisons.test.ts`

### Phase 3 — Full hardening before submission (commit `557a39b`)

Full code review and security review of the entire mobile codebase. 11 files changed.

Key fixes applied:

| Issue | Fix |
|---|---|
| `withTimeout` leaked timer on fast resolve | Capture `timerId`, clear it in `.finally()` |
| `listPatients`, `getPatient`, `getAssessmentsForPatient` not scoped by user | Added `.eq('user_id', session.user.id)` to all three reads |
| `patientId` passed raw string to DB | UUID-validates via `isValidUUID()` in `assess/[measureId].tsx` |
| `refreshPatients` showed no loading state and swallowed errors | Added `setIsLoading(true)` + `try/finally` |
| Avatar fetch had no error handling or unmount guard | Added `.maybeSingle()`, `.catch(() => null)`, `isActive` guard |
| `PatientGender` type defined in 3 files | Extracted to `src/types/domain.ts` |
| UUID helpers duplicated in 2 files | Extracted to `src/utils/routing.ts` |
| DOB helpers duplicated in 2 files | Extracted to `src/utils/dob.ts` |

All 64 tests pass.

### Web — Edit patient from patient header (commit `c2cb0c4`)

The previously in-progress web feature was completed in the same session:
- `EditPatientModal.js` — modal component
- `components/PatientHeader.js` — "Edit details" button wired in
- `pages/app.js` — state, `handlePatientUpdated` callback, and notification

### Privacy and data deletion pages (commit `f6d7531`)

Both pages updated for App Store / Google Play compliance:

- Named Stripe as payment sub-processor
- Added "intended users: licensed clinicians, 17+" statement
- Split web (cookie) vs mobile (auth token) session description
- Clarified patient deletion is via the web app; mobile shares the same data
- Updated "last updated" date to May 2026 on both pages

Both URLs are live:
- **Privacy policy:** https://www.rehabmetricsiq.com/privacy
- **Data deletion:** https://www.rehabmetricsiq.com/data-deletion

---

## Phase 4 — App Store and Google Play submission (PENDING)

Everything below is the remaining work.

### What has been done in App Store Connect

- App created: **RehabMetrics IQ**, bundle ID `com.rehabmetricsiq.app`, SKU `rehabmetricsiq-1`
- Primary language: English (Australia)
- Digital Services Act trader information: completed
- Bundle ID registered at developer.apple.com

### What still needs to be done before building

### Subscription model — important

The subscription is entirely web-based via Stripe. Users sign up and pay at rehabmetricsiq.com. The mobile app checks for an active web subscription and shows a wall if none exists. **There is no in-app purchase flow.** No StoreKit or Play Billing is needed.

Apple and Google allow this model provided the app does not show a "subscribe" button inside the app itself — the subscription wall must only direct the user to the website. Do not add any in-app purchase UI.

---

### 4A — App Store Connect setup (iOS)

In App Store Connect at appstoreconnect.apple.com:

1. **Create a new app**
   - Platform: iOS
   - Bundle ID: `com.rehabmetricsiq.app`
   - App name: RehabMetrics IQ
   - Primary language: English (Australia)
   - SKU: any unique string, e.g. `rehabmetricsiq-1`

2. **App information**
   - Primary category: **Medical**
   - Age rating questionnaire: complete it — result should be **17+**
   - Privacy policy URL: `https://www.rehabmetricsiq.com/privacy`

3. **App Store listing text** — you need to write:
   - Description (up to 4,000 characters)
   - Promotional text (up to 170 characters — can be updated without a new build)
   - Keywords (up to 100 characters, comma-separated)
   - Support URL: `https://www.rehabmetricsiq.com`

4. **Screenshots — two sizes are required**
   - **iPhone 6.7"** (iPhone 15 Pro Max) — required dimensions: **1290 × 2796 px**
   - **iPad 12.9"** (3rd gen or later) — required dimensions: **2048 × 2732 px** — required because `supportsTablet: true` is set in `app.json`
   - Capture from Xcode Simulator at those exact device sizes (not from a real device)
   - Use a clean demo account with no personal profile photo visible
   - Suggested screens: Login, Patient Directory, Patient Workspace, Select Measure

5. **App Review information**
   - Provide a demo account email and password with an active subscription — reviewers must be able to log in and use the app
   - Notes for reviewer: *"RehabMetrics IQ is a clinical outcome measure documentation tool for licensed physiotherapists. It is not a consumer health app and not a medical device. Please sign in with the provided demo credentials to access the app."*

---

### 4B — Add the `eas.json` submit block

Before building or submitting, open `mobile/eas.json` and add a `submit` section. The values come from App Store Connect and Google Play Console (steps 4A and 4C).

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "YOUR_APPLE_ID_EMAIL",
      "ascAppId": "YOUR_APP_STORE_CONNECT_NUMERIC_APP_ID",
      "appleTeamId": "YOUR_10_CHAR_TEAM_ID"
    },
    "android": {
      "serviceAccountKeyPath": "./google-play-key.json",
      "track": "internal"
    }
  }
}
```

Where to find each value:
- `appleId` — the email you log in to App Store Connect with
- `ascAppId` — the numeric Apple ID shown in App Store Connect → App Information → Apple ID field
- `appleTeamId` — your 10-character Team ID at developer.apple.com → Membership

---

### 4C — Google Play setup (Android)

1. **Create the app in Google Play Console** at play.google.com/console
   - Package name: `com.rehabmetricsiq.app`
   - Category: Health & Fitness (Medical is not a Play category)

2. **Get the Google SHA-1 fingerprint — do this BEFORE running the production build**

   ```bash
   cd mobile
   eas credentials
   ```
   Select Android → production profile → view the SHA-1 fingerprint. Copy it.

   Then in **Google Cloud Console** → the project linked to your Supabase Google OAuth client → Credentials → OAuth 2.0 Client IDs → Android client → add the SHA-1 fingerprint. Without this, Google Sign-In will silently fail in the production app.

3. **Service account key for automated EAS submission**
   - In Play Console → Setup → API access → link to a Google Cloud project
   - Create a service account with the Release Manager role
   - Download the JSON key and save it as `mobile/google-play-key.json`
   - Add `google-play-key.json` to `mobile/.gitignore` — it is a secret, do not commit it

4. **Data safety form** in Play Console → your app → Data safety
   - Data collected: email address, clinical data (health-related, user-generated), basic usage data
   - Data shared with third parties: Stripe (payments), Supabase (storage)
   - Encrypted in transit: yes
   - Users can request deletion: yes — link to `https://www.rehabmetricsiq.com/data-deletion`

---

### 4D — Build and submit

Once `eas.json` has the submit block, Apple credentials are filled in, and the Google service account key is in place:

```bash
cd mobile

# Build production binaries for both platforms
eas build --platform all --profile production

# After builds complete, submit each platform
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

EAS uploads the iOS `.ipa` directly to App Store Connect and the Android `.aab` to the Play Console internal track.

After uploading:
- **iOS:** In App Store Connect, attach the build to the version, complete all metadata, and submit for review
- **Android:** Test on a real device from the internal track first, then promote to production

---

## Architecture reminders

**Monorepo structure:** Web (`pages/`, `components/`, `lib/`) and mobile (`mobile/`) share the same Supabase backend. Schema or RLS changes affect both products.

**Clinical logic:** Lives in `lib/clinical/` (web) and `mobile/src/clinical/` (mobile). Must stay pure — no React, no Supabase calls inside calculation files.

**Mobile forms:** 26 form files in `mobile/src/components/forms/`. New forms must follow the `SaveState` pattern — see `TUGForm.tsx` as the reference.

**Save timeout pattern:** `setTimeout` fires UI feedback after `SAVE_TIMEOUT_MS`; the original `await` holds the Save button disabled until the promise settles. Never wrap `saveAssessment()` in `withTimeout` — this is intentional to prevent duplicate writes.

**Session handling:** A `getSession()` network failure sets `isSessionCheckFailed = true` — it does NOT clear the session. Session is only set to `null` when the server explicitly confirms no session exists.

**Defence in depth:** All Supabase reads are scoped by `.eq('user_id', session.user.id)` at the application layer in addition to RLS.

---

## Key references

| Purpose | Value |
|---|---|
| Privacy policy | https://www.rehabmetricsiq.com/privacy |
| Data deletion | https://www.rehabmetricsiq.com/data-deletion |
| EAS project | slug `rehabmetrics-iq`, owner `benhay95`, projectId `7012551f-e4e4-4c63-8657-c3e51880c233` |
| Bundle ID (both platforms) | `com.rehabmetricsiq.app` |
| App version | `1.0.0` |
| App Store Connect | https://appstoreconnect.apple.com |
| Google Play Console | https://play.google.com/console |
| EAS dashboard | https://expo.dev/accounts/benhay95/projects/rehabmetrics-iq |

---

## Checklist before submission

- [x] Apple Developer account approved, App Store Connect accessible
- [x] App created in App Store Connect with bundle ID `com.rehabmetricsiq.app`
- [x] Digital Services Act trader information completed
- [x] `eas.json` submit block added with real `appleId`, `ascAppId`, `appleTeamId`
- [ ] Google SHA-1 fingerprint retrieved via `eas credentials` and added to Google Cloud Console OAuth client **before** production build
- [ ] `google-play-key.json` downloaded and placed at `mobile/google-play-key.json`
- [ ] `google-play-key.json` added to `.gitignore`
- [ ] App icon replaced — resize `SquareLogo.png` to 1024×1024 and save as `mobile/assets/icon.png`
- [ ] Screenshots captured at exact dimensions: iPhone 6.7" (1290×2796) and iPad 12.9" (2048×2732), using Simulator, with clean demo account
- [ ] App Store listing text written (description, keywords, support URL)
- [ ] Demo credentials (active subscription account) ready for App Review Notes
- [ ] `eas build --platform all --profile production` completes without errors
- [ ] iOS build attached to version in App Store Connect, all metadata complete, submitted for review
- [ ] Android build tested on a real device from internal track, then promoted to production
- [ ] Data safety form completed in Google Play Console

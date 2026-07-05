# LEGAL.md — RehabMetrics IQ Legal Posture & Agent Guide

This file records the legal position of RehabMetrics IQ, maps every surface where legal
content lives, and tells future AI agents exactly when a feature change **requires** a legal
update. Stale legal text is treated as a bug, the same as stale documentation (see the
update rule in CLAUDE.md).

> **Standing caveat:** This posture was drafted with AI assistance, not by a qualified
> lawyer. It is designed to be robust, but the Terms, Privacy Policy, and this analysis
> should be reviewed by an Australian solicitor (health/technology practice) before major
> commercial milestones — first paid enterprise customer, first insurer/employer
> procurement review, or expansion outside Australia. Do not present this file to anyone
> as legal advice.

---

## 1. The core legal position (do not weaken)

RehabMetrics IQ's entire liability model rests on four pillars. Every feature, every page,
and every line of marketing copy must stay consistent with them:

1. **Supportive tool, never a decision-maker.** The product scores, tracks, and
   contextualises outcome measures against published literature. It never diagnoses,
   never recommends treatment, never clears a patient for anything (including return to
   sport), and never auto-progresses a rehabilitation pathway. The treating clinician
   makes — and is solely responsible for — every clinical decision.
2. **Clinician-only product.** The intended user is a registered/licensed clinician
   (AHPRA or international equivalent). Patients touch the product only through
   tokenised questionnaire links the clinician sends. If patients ever get direct
   accounts, the entire legal model must be rebuilt first.
3. **Not a medical device.** The position is that the product is clinical decision
   support software used by qualified professionals who can independently review the
   basis of its outputs (all values are cited to published literature), which keeps it
   outside TGA regulation as a medical device. This position **depends on** the product
   never producing outputs a clinician cannot independently verify — see §4 triggers.
4. **Clinician is the data custodian.** Patient data entered into the product belongs,
   in responsibility terms, to the clinician. The Terms make the clinician responsible
   for consent, lawful basis, minimum-necessary data, and their own primary record.

## 2. Where legal content lives

| Surface | File | Notes |
|---|---|---|
| Terms of Service | `pages/terms.js` | The master contract. 19 sections as of July 2026. |
| Privacy Policy | `pages/privacy.js` | APP-based (Privacy Act 1988 Cth). Documents sub-processors: Supabase/AWS (Tokyo), Stripe, Apple, RevenueCat, Resend. Promises 30 days' notice before data-location change. |
| Clinical Use & Limitations | `pages/clinical-use.js` | Plain-language scope + literature references. Incorporated into the Terms by §1. |
| Data Deletion | `pages/data-deletion.js` | App Store requirement; deletion instructions. |
| Web signup clickwrap | `pages/signup.js` | "By creating an account you agree…" + professional confirmation. **Must never be removed.** |
| Mobile signup clickwrap | `mobile/app/sign-up.tsx` | Same consent, hardcoded URLs to `rehabmetricsiq.com/terms` and `/privacy`. Route renames on web break these links. |
| Mobile subscribe legal links | `mobile/app/subscribe.tsx` | Apple requires functional Terms (EULA) + Privacy links near purchase. |
| Patient follow-up disclaimers | `lib/followupEmail.js`, `pages/followup/[token].js` | "Not for urgent symptoms/emergencies" wording. Required — patients are non-users receiving product output. |
| Pilot page | `pages/pilot.js` | Collects emails with Privacy Policy consent. |
| Security posture | `SECURITY.md` | Deferred items there (e.g. non-HttpOnly `stars-auth` cookie) are legal exposure too. |

## 3. Key protections currently in the Terms (`pages/terms.js`)

- §3 professional-user eligibility incl. **professional indemnity insurance requirement**
- §4 clinical disclaimer: no diagnosis / no treatment / **no RTS clearance or discharge
  determination**; literature values vary and may not fit the individual; software may
  contain errors; never sole basis for a decision
- §5 not for emergency or time-critical use
- §6 clinician is health-information custodian (consent, privacy law, minimum data,
  primary record stays with the clinician)
- §7 export/backup responsibility before cancellation or deletion
- §12 "as is" warranty disclaimer **with Australian Consumer Law carve-out** (blanket
  exclusions are void in Australia without this)
- §13 indemnity from the clinician for claims arising from their clinical conduct or
  data-handling breaches (carved back for our own negligence)
- §14 liability limited to resupply of services (ACL s 64A) then capped at 3 months' fees
- §15 suspension/termination + survival clause (**keep the survival list's section
  numbers in sync if sections are renumbered**)
- §16 14-day email notice of material Terms changes (**operational promise — honour it**)

## 4. Update triggers — when a feature change REQUIRES a legal update

When you build any of the following, update the named legal surface **in the same
session**, bump the "Last updated" date, and remind Ben that material Terms changes
require 14 days' email notice to users before taking effect:

| You are building / changing… | You must update… |
|---|---|
| A new outcome measure | `pages/clinical-use.js` reference list (citation from the measure's `lib/clinical/*.js` source). |
| A **licensed** measure (ODI, NDI, QuickDASH, OSS, PCS, MSK-HQ, ACL-RSI, IKDC…) | Confirm a signed licence exists first (CLAUDE.md rule), then Terms §10 (third-party IP) if licence terms impose user-facing conditions. |
| Any AI/LLM-generated interpretation, prediction, or free-text clinical output | **STOP — highest-risk change.** The not-a-medical-device position (§1.3) may collapse because clinicians cannot independently verify model output. Requires: Terms §4 rewrite, clinical-use rewrite, TGA CDSS-exemption reassessment, and real legal advice before launch. |
| Any feature that scores/flags patient risk of harm (falls risk, red flags, deterioration alerts) | Terms §4 wording review + in-UI disclaimer at the point of display. |
| Direct patient accounts or a patient-facing app | **STOP.** Entire legal model is clinician-only. New terms, new privacy policy, likely medical-device reassessment. |
| A new sub-processor (email, analytics, AI API, hosting, error tracking) | `pages/privacy.js` §3 sub-processor list. |
| Moving or replicating the database out of AWS Tokyo | `pages/privacy.js` §3 — and the policy promises **30 days' advance notice on that page**. |
| New data fields about patients (names, identifiers, photos, contact details) | `pages/privacy.js` §1 + Terms §6 minimum-data guidance. Never collect government identifiers. |
| Data export features | `pages/privacy.js` §6 + Terms §7. |
| Pricing, trial, or billing-provider changes | Terms §8 + App Store metadata. |
| Marketing to, or onboarding users in, a new country (esp. EU/UK/US) | Governing-law review, GDPR/HIPAA assessment, privacy policy jurisdiction sections. Current posture is Australia-only (Victoria law, APPs). |
| Renaming/moving `/terms` or `/privacy` routes | Update hardcoded URLs in `mobile/app/sign-up.tsx`, `mobile/app/subscribe.tsx`, and App Store Connect metadata — broken legal links are an App Review rejection and an enforceability gap. |
| Patient-facing report/summary/email content | Every patient-facing artefact must carry: prepared-by-your-clinician framing, not-medical-advice wording, and not-for-emergencies wording. |
| Team/multi-seat accounts | Terms §3 and §9 (one clinician per account is the current rule). |

## 5. Known gaps / flagged items (carry forward until closed)

1. **Patient summary output has no disclaimer** — `lib/clinical/patientSummary.js` and the
   UI that renders it produce patient-facing content with no "prepared by your clinician /
   not medical advice / not for emergencies" footer. Add one the next time that feature is
   touched. (PDF/print output, if added, must include it too.)
2. **`pages/clinical-use.js` reference list is stale** — it lists the original ~24 neuro
   measures only. The MSK Wave 1 measures (KOOS, HOOS, HAGOS, FAAM, CAIT, ATRS, OMAS,
   LEFS, LESS, Quad-LSI, hop battery, 30STS, CMS, NPRS, PSFS, FABQ, BPFS…) and the ACL
   pathway/RTS battery are absent. Refresh from the citations already documented in each
   `lib/clinical/*.js` file — never invent citations.
3. **No first-login professional attestation in-app** — signup clickwrap now exists on
   both platforms, but an in-app "I confirm I am a registered clinician" attestation on
   first login (stored with timestamp) would strengthen the eligibility defence.
   Nice-to-have, not urgent.
4. **`stars-auth` cookie is not HttpOnly** — deferred item in SECURITY.md. A session-theft
   incident involving patient data would be a Notifiable Data Breach; closing this reduces
   legal exposure, not just technical risk.
5. **Privacy policy has no data-breach-response statement** — consider adding a short
   commitment to assess and notify eligible data breaches per the NDB scheme
   (Privacy Act 1988 Part IIIC). Low effort, good faith signal.
6. **No solicitor review yet** — see the standing caveat at the top. Flag this to Ben at
   the next commercial milestone.

## 6. Rules for future agents (non-negotiable)

- **Never weaken a disclaimer** to make UI copy friendlier. Clinical-safety and legal
  wording outrank tone. If marketing copy conflicts with Terms §4, the copy changes.
- **Never add language that promises outcomes, accuracy guarantees, "clearance",
  "cleared", "safe to return", "diagnosis", or "recommendation"** anywhere in the product,
  emails, reports, or marketing. The RTS battery renders status context only — it must
  never render a "cleared" stamp (`components/RTSBatteryDashboard.js` documents this).
- **Never remove the signup clickwrap** on either platform.
- Any edit to `pages/terms.js` or `pages/privacy.js`: bump the "Last updated" line, keep
  §15's survival-clause numbers in sync, and tell Ben (plain English) what changed, why,
  and that users need 14 days' email notice for material Terms changes.
- Legal pages are static content — keep them dependency-free (no data fetching, no auth).
- When in doubt whether a change is "material": it is. Flag it.

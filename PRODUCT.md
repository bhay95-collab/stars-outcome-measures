# Product — RehabMetrics IQ

Last verified against the codebase: 2026-06-26

## What it is

RehabMetrics IQ is a clinical SaaS tool that helps physiotherapists and rehabilitation teams capture, score, interpret, track, and report rehabilitation outcome measures with less manual work and clearer clinical insight.

Positioning: **Data-driven outcomes. Better patient care.**

It is a clinical *interpretation and documentation* tool — not a medical device, and not a replacement for clinical judgement. Never present calculated insight as diagnosis.

## Who uses it

Licensed rehabilitation clinicians (physiotherapists first) during patient assessment, documentation, progress review, and follow-up — on web and mobile, sharing one account and one dataset. Intended users are licensed clinicians, 17+. Patients interact only through tokenised follow-up questionnaire links; they have no accounts.

A `clinical_focus` profile setting (`rehab` / `msk` / `both`, default `both`) filters the measure picker, summary domains, and sidebar tools to the clinician's caseload. Nothing is locked — everything is one toggle away.

## Clinical scope

The measure registry (`lib/clinical/measures.js`) currently holds **43 measures**:

- **Performance / neuro-rehab:** 10MWT, TUG, FAC, 6MWT, BBS, PASS, TIS, MAS, COVS, FGA, HiMAT, SARA, Step Test, AMP, BOOMER, Barthel, SCIM, 30s Sit-to-Stand, FTSTS, Constant–Murley (CMS), ISNCSCI (web only — complex; modify carefully and separately, never batched with unrelated work).
- **Patient-reported questionnaires:** FSS, RPQ, PDQ-8, ABC, BIVI-IQ, HADS.
- **MSK (Wave 1, 2026-06-11):** NPRS, PSFS, LEFS, BPFS, KOOS, FAAM, HOOS.
- **MSK (Wave 2):** CAIT, ATRS, FABQ.
- **MSK (Wave 3):** HAGOS, OMAS.
- **ACL return-to-sport field tests (2026-06-28):** Quadriceps Strength LSI, Single-Leg Hop Battery, LESS — clinician-measured, feeding the **ACL Pathway & RTS** workspace (criterion-based rehab phases + a return-to-sport readiness battery). **ACL Clinical Signs (2026-07-09):** full active knee extension + effusion graded on the modified stroke test (Sturgill 2009), persisted as normal assessments so the phase gates and battery read the latest recorded signs; every outstanding gate/battery criterion links to its entry form. The battery reports criteria met against published cut-offs and never issues a clearance; ACL-RSI and IKDC remain pending in the engine but are hidden from the UI until licensed. See `docs/outcome-measures-handoff.md` (ACL Rehab & Return-to-Sport tool).

MCID/MDC logic is **condition-aware**: thresholds move with patient diagnosis via `byCondition` overrides, with a `thresholdType: 'mdc'` honesty label where the published value is an MDC, not an MCID.

**Licensing is a hard constraint.** ODI, NDI, QuickDASH, OSS, PCS, and MSK-HQ require paid/explicit licences and must not be built until licences are signed — embedding them is a copyright breach with commercial exposure. The licence-checked build queue is `docs/outcome-measures-handoff.md`; full deferred clinical profiles are in `docs/msk-expansion-plan.md`.

## Features (shipped)

- **Patient workspace** — patient directory, patient overview, creation/editing, runtime age from `date_of_birth`.
- **Assessment workflow** — measure forms, scoring with clinically accurate interpretation, previous-vs-current comparison, MCID/trend context, unsaved-changes warning, newest-first history.
- **Summary dashboard** — domain cards, trend charts with threshold/MCID context.
- **Patient overview clinical visualisations (2026-06)** — two-column overview layout: left column shows summary cards and next-action panel; right column shows a Smart Pathway Coverage donut (% complete, recorded/due/missing breakdown, tap any measure to open it) and per-measure trend charts with clinical reference ranges, threshold lines, and condition-aware MCID goal lines. Charts render when ≥2 assessments exist for a measure.
- **Smart Rehab Pathways** — diagnosis-driven recommended measures, baselines still required, reassessments due (28-day default interval — a known default to revisit), next best action.
- **Patient-reported follow-up** (web only) — validated questionnaires via secure tokenised email links (Resend) or manual share; responses scored by the same engine, badged as patient-reported, with red/amber attention signals and a caseload Follow-Up Attention board.
- **Outcomes Intelligence** — caseload-wide improvement rates, MCID achievement, diagnosis cohort summaries, and an aggregate-only proof-of-value PDF service report (no patient identifiers).
- **Wheelchair Prescription tool** (web; hidden when `clinical_focus = 'msk'`).
- **PDF patient report export**; **reference card**.
- **Mobile app** — patient directory/workspace, 26 native measure forms, MCID trend context on history cards, native Sign in with Apple, App Store subscriptions, in-app account deletion. Follow-ups and ISNCSCI are web-only.

## Commercial model

14-day free trial. Web: Stripe subscription (managed via checkout + customer portal). iOS: monthly and annual auto-renewable subscriptions through Apple In-App Purchase / RevenueCat (entitlement `pro`; products `com.rehabmetricsiq.app.subscription.pro.monthly` / `.annual`, near A$29 monthly and A$250 annual). Either billing source grants access on both platforms; Stripe customers never purchase twice. An Android/Google Play release is planned for the future — iOS is the active mobile platform.

## Clinical integrity rules (non-negotiable)

- Implement **one measure at a time**, validating calculation outputs against primary sources.
- Never invent thresholds or MCID values; keep reference values traceable in code comments.
- Never generalise one measure's logic across all measures, hide uncertainty, remove clinically relevant context, or simplify clinical rules to make UI easier.
- Distinguish score, interpretation, and clinical implication. Make MCID status obvious but not exaggerated.
- Charts must use clinically appropriate scales (see [DESIGN.md](DESIGN.md)).

### New measure workflow

1. Define clinical inputs → 2. calculation logic → 3. interpretation outputs → 4. MCID/threshold logic → 5. chart config → 6. UI → 7. Supabase save → 8. summary display → 9. previous/current comparison test → 10. report export check. Do not batch multiple new measures unless explicitly requested.

## Roadmap

Live roadmap documents (kept current as builds land):

- `docs/product-roadmap.md` — active build (Outcomes Intelligence), delivered phases, defaults to revisit.
- `docs/outcome-measures-handoff.md` — the next 20 measures with licensing status, plus carried-forward work (mobile Wave 1 parity, PSFS/FAAM public follow-up gaps, landing repositioning, MeasureEntry dispatch refactor).
- `docs/msk-expansion-plan.md` — Wave 1 MSK build record and deferred licensed-measure profiles.
- `mobile/RESUBMISSION_HANDOFF.md` + `mobile/APP_STORE_RESUBMISSION.md` — the active App Store resubmission effort.

## Brand and tone

See [DESIGN.md](DESIGN.md) for brand rules. Copy is clinical, calm, direct, and professional — no consumer wellness styling, no hype, no claims beyond the current product.

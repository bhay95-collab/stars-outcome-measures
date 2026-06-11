# RehabMetrics IQ Product Roadmap

## Active Build: Outcomes Intelligence

Service-level reporting for clinics, delivered as a derived layer (no Supabase schema, RLS, auth, Stripe, or assessment-result changes). A caseload-wide Outcomes Intelligence workspace in the app sidebar surfaces:

- improvement rates (baseline-to-latest change per patient-measure pair, following each measure's published directionality);
- MCID achievement, calculated only for measures with a published MCID threshold;
- diagnosis cohort summaries (patients, assessments, repeat-data coverage, improvement and MCID rates, most-used measures);
- an exportable proof-of-value PDF service report containing aggregate data only — no patient identifiers.

Deferred from this phase:
- Referrer/payer summaries — the patients table has no referrer or funding fields yet; this needs new patient fields (schema change) before it can be reported.
- Date-range and discharge-episode filtering (v1 reports across all recorded data).
- Multi-clinician clinic rollups (v1 reports per signed-in clinician account, matching the data-access model).

## Delivered: Smart Rehab Pathways MVP

A no-schema-change pathway layer that uses the patient's recorded diagnosis, existing recommended-measure mappings, and saved assessments to surface baseline measures still required, reassessments due after the default review interval, pathway coverage, and the next best assessment action. Surfaced in the patient overview, the Smart Pathway workspace, the patient directory, and the sidebar badge.

## Delivered: Patient-Reported Follow-Up

Patients complete validated questionnaires (ABC, FSS, HADS, PDQ-8, RPQ, BIVI-IQ) through secure tokenised links sent by email (Resend) or shared manually. Responses are scored with the same clinical engine, saved as patient-reported assessments in the timeline (badged as patient-reported in history, reports, and the PDF export), compared against the clinic-recorded source assessment with MCID context, and surfaced through per-patient attention signals plus a caseload-wide Follow-Up Attention board on the patient directory (red/amber responses and overdue links).

Deferred from this phase:
- Automated reminder emails before due/expiry (needs scheduled infrastructure, e.g. a Vercel cron route) and clinician email alerts on red signals.
- Follow-up visibility in the mobile app (web only for now; the patient-facing link already works in mobile browsers).
- The original generic weekly check-in (falls/confidence/fatigue) was retired in favour of validated questionnaires; historical responses still display.

## Defaults To Revisit

- Smart Rehab Pathways currently uses a 28-day reassessment interval.
- Custom pathway templates, clinician dismissals, and per-patient schedule preferences are deferred.
- Wheelchair prescription is intentionally outside the pathway engine for the first release.
- Outcomes Intelligence measures change as earliest-to-latest per measure; per-episode baselines (e.g. after readmission) are a future refinement.

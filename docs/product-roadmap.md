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

## Delivered: ACL Rehab & Return-to-Sport tool (2026-06-28)

A composite ACL pathway tool (surgical pathway, generic sport — v1). Two linked modules on one patient timeline:

- **RTS readiness battery** — grades published return-to-sport cut-offs (≥9 months, quadriceps LSI ≥90%, hop battery each LSI ≥90%, effusion trace-to-zero, LESS <5) and renders a continuum dashboard with the predictive-validity caveat. It never issues a clearance. ACL-RSI and IKDC/KOS-ADLS are stubbed as licence-pending (not graded; no substitute cut-off invented).
- **Phase Tracker** — 6 criterion-gated rehab phases (pre-op → secondary prevention); the tool shows gate readiness, the clinician advances the phase. First stateful per-patient table (`acl_pathways`, RLS like `followup_requests`).
- **3 new licence-clear field-test measures:** Quadriceps Strength LSI, Single-Leg Hop Battery, LESS — with trend charts, entry forms, and ACL pathway recommendations. Surfaced as the "ACL Pathway & RTS" workspace section (hidden for rehab-focus clinicians).

Reviewed (security/healthcare/code) before merge. Build record + carried-forward v2 items (conservative arm, sport tiering, mobile parity, ACL-RSI/IKDC once licensed) in `docs/outcome-measures-handoff.md`.

Deferred from this phase:
- Conservative (non-operative) pathway — coper screening (Delaware/Fitzgerald) + Cross Bracing Protocol, evidence-graded.
- Sport-aware battery tiering (pivoting vs linear sports).
- Per-phase notes; mobile parity. (Effusion/full-extension signs were persisted on 2026-07-09 as the ACLSigns measure — two checkbox judgements saved as normal assessments; licence-pending RTS rows now hidden in the UI.)

## Delivered: Overview Redesign & Clinical Visualisations (2026-06-26)

A web-only visual overhaul of the authenticated app shell and patient overview:

- **Dark sidebar:** left sidebar background set to `--color-primary-dark` (#063764); all child elements (nav, patient switcher, sign-out, labels) switched to white/light via scoped CSS overrides.
- **Background palette:** all surface and border tokens updated from the former warm-bone palette to a clinical blue-grey near-white (`--color-bg #f6f9fc`, updated `surface-soft`, `surface-muted`, `border`, `line` tokens).
- **Two-column patient overview:** summary cards on the left (420 px fixed); interactive right panel (fills remaining space) with:
  - **Smart Pathway Coverage donut** at the top — shows % complete with recorded (blue), due (amber), and missing (grey) segments; each measure in the list is tappable and opens the assessment form directly.
  - **Per-measure trend charts** below — `LineChart` per outcome measure with clinical threshold reference lines, condition-aware MCID goal line, custom tooltip, and directional legend. Only renders for measures with chart config and ≥2 assessments.
- recharts (v3.9.0) added as a web dependency (with react-is peer dep).

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

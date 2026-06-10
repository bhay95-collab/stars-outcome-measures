# RehabMetrics IQ Product Roadmap

## Active Build: Smart Rehab Pathways MVP

RehabMetrics IQ is moving beyond outcome-measure capture into derived clinical workflow support. The first implementation is a no-schema-change pathway layer that uses the patient's recorded diagnosis, existing recommended-measure mappings, and saved assessments to surface:

- baseline measures still required;
- reassessments due after the default review interval;
- pathway coverage;
- the next best assessment action.

Decision for v1: this is a derived MVP. No Supabase schema, RLS, auth, Stripe, or assessment-result changes are required.

## Delivered: Patient-Reported Follow-Up

Patients complete validated questionnaires (ABC, FSS, HADS, PDQ-8, RPQ, BIVI-IQ) through secure tokenised links sent by email (Resend) or shared manually. Responses are scored with the same clinical engine, saved as patient-reported assessments in the timeline (badged as patient-reported in history, reports, and the PDF export), compared against the clinic-recorded source assessment with MCID context, and surfaced through per-patient attention signals plus a caseload-wide Follow-Up Attention board on the patient directory (red/amber responses and overdue links).

Deferred from this phase:
- Automated reminder emails before due/expiry (needs scheduled infrastructure, e.g. a Vercel cron route) and clinician email alerts on red signals.
- Follow-up visibility in the mobile app (web only for now; the patient-facing link already works in mobile browsers).
- The original generic weekly check-in (falls/confidence/fatigue) was retired in favour of validated questionnaires; historical responses still display.

## Future Phase: Outcomes Intelligence

Create service-level reporting for clinics: improvement rates, Minimally Clinically Important Difference achievement, diagnosis cohorts, referrer/payer summaries, and exportable proof-of-value reports.

## Defaults To Revisit

- Smart Rehab Pathways currently uses a 28-day reassessment interval.
- Custom pathway templates, clinician dismissals, and per-patient schedule preferences are deferred.
- Wheelchair prescription is intentionally outside the pathway engine for the first release.

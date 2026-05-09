# RehabMetrics IQ Product Roadmap

## Active Build: Smart Rehab Pathways MVP

RehabMetrics IQ is moving beyond outcome-measure capture into derived clinical workflow support. The first implementation is a no-schema-change pathway layer that uses the patient's recorded diagnosis, existing recommended-measure mappings, and saved assessments to surface:

- baseline measures still required;
- reassessments due after the default review interval;
- pathway coverage;
- the next best assessment action.

Decision for v1: this is a derived MVP. No Supabase schema, RLS, auth, Stripe, or assessment-result changes are required.

## Future Phase: Patient-Reported Follow-Up

Add lightweight patient-facing check-ins for symptoms, falls, confidence, fatigue, home-program adherence, and patient-reported outcome measures. Responses should flow into the patient timeline and highlight deterioration or missed follow-up.

## Future Phase: Outcomes Intelligence

Create service-level reporting for clinics: improvement rates, Minimally Clinically Important Difference achievement, diagnosis cohorts, referrer/payer summaries, and exportable proof-of-value reports.

## Defaults To Revisit

- Smart Rehab Pathways currently uses a 28-day reassessment interval.
- Custom pathway templates, clinician dismissals, and per-patient schedule preferences are deferred.
- Wheelchair prescription is intentionally outside the pathway engine for the first release.

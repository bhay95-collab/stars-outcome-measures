# Outcome Measures Handoff — Future Builds

**Date:** 2026-06-11
**Context:** Created alongside `docs/msk-expansion-plan.md` (Wave 1 MSK expansion). This file is the queue of the next 20 outcome measures, with licensing status checked up front so future builds don't stall on copyright. Build one measure at a time per the Outcome Measure Workflow in CLAUDE.md.

Licensing key: ✅ free to embed · 🟡 verify/courtesy permission · ⚠️ licence required before any build work

---

## Tier 1 — Licence-gated measures already fully researched (build first once licences are signed)

Full clinical profiles (structure, scoring, missing-item rules, bands, MCID/MDC by condition) are in `docs/msk-expansion-plan.md` §4 "Deferred profiles". These are plug-in builds.

| # | Measure | Region | Licence action required |
|---|---|---|---|
| 1 | Oswestry Disability Index (ODI v2.1a) | Low back | ⚠️ Mapi Research Trust (eprovide.mapi-trust.org) — commercial/IT licence, fees apply; v2.1a mandated; screen rendering needs Mapi approval |
| 2 | Neck Disability Index (NDI) | Neck | ⚠️ Mapi Research Trust — same regime as ODI |
| 3 | QuickDASH | Upper limb | ⚠️ Institute for Work & Health (dash@iwh.on.ca) — limited-use licence with fee for commercial software |
| 4 | Oxford Shoulder Score (OSS) | Shoulder | ⚠️ Oxford University Innovation (process.innovation.ox.ac.uk/clinical) — paid commercial licence; same applies to all Oxford scores |

## Tier 2 — Free/low-risk MSK measures (next builds, no licence blocker expected)

| # | Measure | Region / purpose | Notes |
|---|---|---|---|
| 5 | IKDC Subjective Knee Form | Knee (sport) | 🟡 Free via AOSSM with registration; verify commercial terms. Complements KOOS post-ACLR |
| 6 | Copenhagen Hip and Groin Outcome Score (HAGOS) | Hip/groin | ✅ Roos instrument family (koos.nu terms) |
| 7 | International Hip Outcome Tool (iHOT-12) | Hip (young/active) | 🟡 verify terms |
| 8 | Harris Hip Score | Hip (clinician) | ✅ long-published, no licensing regime |
| 9 | Cumberland Ankle Instability Tool (CAIT) | Ankle instability | ✅ published in full, widely reproduced |
| 10 | Achilles Tendon Total Rupture Score (ATRS) | Achilles | ✅ |
| 11 | Foot Function Index (FFI) | Foot | 🟡 verify |
| 12 | Mayo Elbow Performance Index | Elbow (clinician) | ✅ |
| 13 | Olerud–Molander Ankle Score | Ankle fracture | ✅ (takes the slot of the Back Pain Functional Scale, which moved into Wave 1) |
| 14 | Knee Outcome Survey | Knee ADL | 🟡 verify |

## Tier 3 — Pain/psychosocial (yellow-flag) measures — high MSK clinical value

| # | Measure | Purpose | Notes |
|---|---|---|---|
| 15 | Fear Avoidance Beliefs Questionnaire (FABQ) | Yellow flags, LBP | ✅ widely reproduced free |
| 16 | Pain Catastrophizing Scale (PCS) | Yellow flags | ⚠️ now administered via Mapi — check before build |
| 17 | Pain Self-Efficacy Questionnaire (PSEQ) | Self-efficacy | 🟡 contact author (M. Nicholas) for commercial permission |
| 18 | Tampa Scale of Kinesiophobia (TSK) | Movement fear | 🟡 verify (no central administrator) |
| 19 | Central Sensitisation Inventory (CSI) | Pain phenotyping | ✅ stated free for clinical use; verify commercial |
| 20 | Musculoskeletal Health Questionnaire (MSK-HQ) | Generic MSK health | ⚠️ Oxford/Versus Arthritis — free for clinical use with registration, commercial licence likely required |

Substitution guidance: if a 🟡/⚠️ measure stalls, prefer the next free measure in the same region rather than waiting — keeping region coverage matters more than the specific instrument.

---

## Carried-forward work (not measures)

0. **Wave 1 follow-up gaps:** add public follow-up support for **PSFS** (needs
   per-patient dynamic questions seeded from the previous PSFS activities) and
   **FAAM** (needs N/A response support in `parseItemScore` / question schema).
   Also proof-read KOOS/HOOS/FAAM item wording against official PDFs (koos.nu,
   Martin 2005) before public release.

1. **Mobile parity phase:** native forms for all Wave 1 measures (`mobile/src/components/forms/`, follow `TUGForm.tsx` SaveState pattern). Registry/scoring already shared via `@clinical`. PSFS needs activity pre-load; KOOS/HOOS need subscale result screens.
2. **Licence admin:** Mapi (ODI, NDI, PCS), IWH (QuickDASH), OUI (OSS, MSK-HQ shares Oxford channel). Courtesy permissions: APTA (LEFS), RobRoy Martin (FAAM).
3. **Landing page repositioning:** marketing copy still targets "rehabilitation teams"; broaden to whole-of-physio once Wave 1 ships.
4. **Per-pathway reassessment intervals:** MSK episodes often review at 2–4 weeks; pathway engine currently fixed at 28 days.
5. **MeasureEntry form dispatch refactor:** at ~34 forms, replace the if-chain with a registry-driven component map (`/simplify` candidate).
6. **MDC vs MCID three-state labels** roll-out to existing rehab measures (engine support lands in Wave 1).
7. **Verify-flagged thresholds:** BPFS, 30s-STS, FTSTS, Constant–Murley values in the plan are from secondary knowledge and must be confirmed against primary sources at build time.

## Research sources

Wave 1 + Tier 1 profiles were verified against: koos.nu (KOOS/HOOS guides), dash.iwh.on.ca (licences/FAQ), Oxford University Innovation outcome-measures portal, Mapi ePROVIDE (ODI, NDI), SRALab Rehabilitation Measures Database, Physiopedia, and primary literature (Farrar 2001; Childs 2005; Young 2018; Stratford 1995/2000; Binkley 1999; Mehta 2016; Roos & Lohmander 2003; Ingelsrud 2018; Paulsen 2014; Martin 2005; Carcia 2008; Gribble 2014; Franchignoni 2014; Mintken 2009; Fairbank & Pynsent 2000; Ostelo 2008; Copay 2008; MacDermid 2009; Cleland 2006; Vernon & Mior 1991; van Kampen 2013; Kukkonen 2013). Citation details inline in `docs/msk-expansion-plan.md`.

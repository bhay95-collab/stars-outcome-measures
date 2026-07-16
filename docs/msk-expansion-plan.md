# RehabMetrics IQ — MSK Expansion Build Plan

**Date:** 2026-06-11
**Status:** ✅ Wave 1 BUILT (same day — see "Build outcome" below). Decisions confirmed by Ben.
**Companion file:** `docs/outcome-measures-handoff.md` (next 20 measures for future builds)

## Build outcome (delta from plan)

All 10 Wave 1 measures, foundations, pathways, summary domains, follow-ups, and
reference card shipped on branch `claude/festive-gauss-ky6hgp`. Deviations from plan:

- **Follow-up questionnaires:** NPRS, LEFS, BPFS, KOOS, HOOS shipped. **PSFS and
  FAAM deferred** — PSFS needs per-patient dynamic questions and FAAM needs N/A
  response support in the public follow-up engine (both noted in handoff).
- **Deploy order:** apply both new migrations **before** deploying the web build —
  `pages/app.js` and `ProfileModal` select `profiles.clinical_focus`; the select
  fails (and the app treats it as no access) if the column does not exist yet.
- **Verification still owed:** KOOS/HOOS/FAAM item wording proof-read against the
  official koos.nu / Martin 2005 PDFs, and an authenticated visual pass of the new
  forms (this environment has no app credentials). Unit suite (173 tests) and
  production build are green; security review found no issues.

---

## 1. Goal

Broaden RehabMetrics IQ from a neuro-rehab outcome-measures tool to a **whole-of-physiotherapy** platform by:

1. Adding 10 musculoskeletal (MSK) outcome measures (Wave 1, all licence-clear).
2. Introducing a **clinical focus** concept (Neuro/Rehab vs MSK vs Both) so each clinician sees a workspace relevant to their caseload.
3. Extending the Smart Pathway engine with MSK conditions and recommended-measure templates.
4. Making the architecture scale cleanly for the next 20 measures (see handoff file) — including formal subscale support and condition-aware MCIDs.

This is structural broadening, not just "more measures".

---

## 2. Decisions confirmed (Ben, 2026-06-11)

| Decision | Choice |
|---|---|
| Licensed measures (ODI, NDI, QuickDASH, Oxford Shoulder Score) | **Free-first.** Build only licence-clear measures now. The four licensed measures are deferred to the handoff queue and slot in once licences are executed (Mapi Research Trust ×2, Institute for Work & Health, Oxford University Innovation). Do **not** embed them without signed licences — it is a copyright breach with commercial exposure. |
| Neuro/MSK delineation | **Profile workspace focus.** New profile setting `clinical_focus` = `rehab` / `msk` / `both` (default `both`). Filters the measure picker, summary domains, and sidebar tools. Everything stays one toggle away — nothing is locked. Patient-level pathway recommendations remain diagnosis-driven as today. |
| Wheelchair Prescription tab | Hidden from the sidebar when `clinical_focus = 'msk'`; restored instantly by switching focus in the profile. No functional changes to the tool itself. |
| Mobile | **Web first.** Mobile gets the new registry/scoring automatically via `@clinical`, but native entry forms are a dedicated follow-up phase (recorded in handoff file). |

---

## 3. The 10 identified MSK measures

The ten most commonly used MSK measures from the candidate list (excluding the 24 already built):

| Measure | Region | Licence status |
|---|---|---|
| Numeric Pain Rating Scale (NPRS) | Pain (generic) | ✅ Public domain |
| Patient Specific Functional Scale (PSFS) | Function (generic) | ✅ Free — cite Stratford 1995 |
| Oswestry Disability Index (ODI v2.1a) | Low back | ⚠️ Mapi licence required → **deferred** |
| Neck Disability Index (NDI) | Neck | ⚠️ Mapi licence required → **deferred** |
| Lower Extremity Functional Scale (LEFS) | Lower limb | ✅ Low risk — courtesy permission to APTA recommended |
| Knee Injury and Osteoarthritis Outcome Score (KOOS) | Knee | ✅ Explicitly free (koos.nu) |
| Hip Disability and Osteoarthritis Outcome Score (HOOS) | Hip | ✅ Explicitly free (koos.nu) |
| QuickDASH | Upper limb | ⚠️ IWH licence + fee required → **deferred** |
| Oxford Shoulder Score (OSS) | Shoulder | ⚠️ OUI paid licence required → **deferred** |
| Foot and Ankle Ability Measure (FAAM) | Foot/ankle | ✅ Free — courtesy email to Prof. RobRoy Martin recommended |

### Wave 1 build roster (all licence-clear)

The four deferred measures are replaced by four free, commonly used measures pulled forward from the candidate list, keeping spine, shoulder, and sit-to-stand performance coverage:

1. **NPRS** — pain intensity
2. **PSFS** — patient-specific function
3. **Back Pain Functional Scale (BPFS)** — low back (free; Stratford 2000) *(covers the ODI gap)*
4. **LEFS** — lower limb
5. **KOOS** — knee (5 subscales)
6. **HOOS** — hip (5 subscales)
7. **FAAM** — foot/ankle (2 subscales)
8. **30-Second Sit to Stand (30s-STS)** — functional lower-limb strength
9. **Five Times Sit to Stand (FTSTS)** — functional lower-limb strength / falls
10. **Constant–Murley Score (CMS)** — shoulder, clinician-administered (free) *(covers the OSS/QuickDASH gap until licensed)*

Neck coverage interim: NPRS + PSFS (PSFS has cervical-specific MCID data) until the NDI licence is obtained.

---

## 4. Clinical profiles — Wave 1 measures

> Clinical integrity rule: these values feed `mcid.js`, `measures.js` chart thresholds, and interpretation text. Keep citations in code comments. Items marked **[verify]** were pulled forward late and their thresholds must be re-verified against primary sources during the build step for that measure.

### 4.1 NPRS — Numeric Pain Rating Scale
- **Structure:** single item, 0 ("no pain") to 10 ("worst pain imaginable"). Patient-reported, <1 min.
- **Scoring:** raw 0–10. No transformation.
- **Direction:** higher = worse.
- **Interpretation bands (conventional):** 0 none · 1–3 mild · 4–6 moderate · 7–10 severe.
- **MCID/MDC:** chronic pain 1.74 pts or ~30% (Farrar 2001 — most cited; round to 2); subacute LBP 2 (Childs 2005); mechanical neck pain MCID 1.5, MDC 2.6 (Young 2018); shoulder 2 (Michener). General MCID range 1.5–2.5; MDC 2.6–4.1.
- **Default MCID for registry:** 2.0 pts; condition overrides per above.

### 4.2 PSFS — Patient Specific Functional Scale
- **Structure:** patient nominates 3–5 activities, each rated 0 (unable) – 10 (pre-injury level). Stratford 1995.
- **Scoring:** mean of nominated activity scores (0–10). **Activities must persist across reassessments** — re-rate the original activities; do not swap mid-episode.
- **Direction:** higher = better.
- **Interpretation:** no severity bands by design — change-based only.
- **MCID/MDC:** general ~2 pts; cervical radiculopathy 2.2 (Cleland 2006); upper extremity 1.2 (Hefford 2012); knee ~2.0–2.3 (Chatman 1997); chronic LBP graded 0.8/3.2/4.3 small/medium/large (Maughan & Lewis 2010); MDC 0.99–2.5 (Westaway 1998).
- **Implementation note:** nominated activities live in `inputs` JSONB; the form pre-loads activities from the patient's most recent PSFS assessment. No schema change.

### 4.3 BPFS — Back Pain Functional Scale **[verify]**
- **Structure:** 12 items, each 0 (unable) – 5 (no difficulty). Patient-reported. Stratford 2000, Phys Ther.
- **Scoring:** sum 0–60; higher = better.
- **MCID/MDC:** MDC90 ≈ 6.5 pts; MCID not firmly established (~5–7). **Verify at build time and label threshold honestly in UI (MDC vs MCID).**

### 4.4 LEFS — Lower Extremity Functional Scale
- **Structure:** 20 items, each 0 (extreme difficulty/unable) – 4 (no difficulty). Patient-reported, ~2 min. Binkley 1999.
- **Scoring:** sum 0–80. Optional display: % of maximal function = score/80 × 100. No developer-endorsed missing-item rule — require all 20 items in v1 (simplest defensible position).
- **Direction:** higher = better.
- **MCID/MDC:** MCID 9 pts; MDC90 9 (Binkley 1999); pooled MDC90 6 (Mehta 2016). Graded change: 9 small, 12 moderate, 16 large (SRALab).
- **Licensing:** reproduce instrument; send courtesy permission request to APTA (publisher) before launch — low risk, unresolved formally.

### 4.5 KOOS — Knee Injury and Osteoarthritis Outcome Score
- **Structure:** 42 items, past-week recall, 5 subscales: **Pain (9), Symptoms (7), ADL (17), Sport/Rec (5), QOL (4)**. Each item 0 (none) – 4 (extreme). Patient-reported.
- **Scoring per subscale:** `100 − (mean of answered items × 100 / 4)` → 0–100. Missing rule: ≤2 missing per subscale (mean substitution = mean of answered); more missing → subscale = null. **Never aggregate to a total score** (explicitly prohibited by the User's Guide).
- **Direction:** higher = better (100 = no problems).
- **Interpretation:** no universal bands. PASS post-ACLR (Muller 2016): Pain 88.9, Symptoms 57.1, ADL 100, Sport/Rec 75, QOL 62.5.
- **MCID:** generic knee OA 8–10 pts/subscale (Roos & Lohmander 2003); post-ACLR MIC: Sport/Rec 12.1, QOL 18.3 (Ingelsrud 2018); post-TKA: Pain 7.9 (2024). MDC varies 5–20 by subscale — show MCID as primary context.
- **Licensing:** free, no permission needed (koos.nu). Reproduce wording verbatim; credit source.

### 4.6 HOOS — Hip Disability and Osteoarthritis Outcome Score
- **Structure:** 40 items, 5 subscales: **Pain (10), Symptoms (5), ADL (17), Sport/Rec (4), QOL (4)**. Parallel to KOOS.
- **Scoring:** identical engine to KOOS — **build one shared scoring function** with different item maps.
- **Direction:** higher = better.
- **Interpretation:** PASS post-THA at 1 yr (Paulsen 2014, n=1,335): Pain ≥91, HOOS-PS ≥88, QOL ≥83.
- **MCID:** post-THA MCII Pain 24, PS 23, QOL 17 (Paulsen 2014); non-surgical hip OA: generic 8–10 (flag as generic in UI).
- **Licensing:** free (koos.nu).

### 4.7 FAAM — Foot and Ankle Ability Measure
- **Structure:** **ADL (21 items) + Sports (8 items)**, separately scored. Each item 4 (no difficulty) – 0 (unable); **N/A permitted** when limited by something other than the foot/ankle. Martin 2005.
- **Scoring per subscale:** `(sum of answered scores) / (4 × answered items) × 100` → 0–100%. N/A excluded from numerator and denominator. Validity floor ≈90% answered: require ≥19/21 ADL and ≥7/8 Sports answered, else null.
- **Direction:** higher = better.
- **Interpretation:** chronic ankle instability indicated by ADL <90% and Sport <80% (IAC position statement, Gribble 2014; Carcia 2008).
- **MCID/MDC:** ADL MCID 8, MDC95 5.7; Sports MCID 9, **MDC95 12.3 — exceeds MCID**; UI must distinguish "exceeds MCID" from "exceeds measurement error" for Sports.
- **Licensing:** free; courtesy email to Prof. RobRoy Martin recommended pre-launch.

### 4.8 30-Second Sit to Stand **[verify]**
- **Structure:** count of full stands in 30 s, arms crossed. Clinician-recorded performance test.
- **Scoring:** raw count; higher = better. Age/sex norms: Rikli & Jones 1999 (60–94 yr).
- **MCID/MDC:** ≈2–3 stands in knee OA/TKA populations. **Verify exact values and norm tables at build.**

### 4.9 Five Times Sit to Stand **[verify]**
- **Structure:** time (s) to complete 5 stands. Clinician-recorded.
- **Scoring:** seconds; **lower = better** (note directionality).
- **Interpretation:** >12 s associated with fall risk in community-dwelling adults (some sources >15 s); age norms Bohannon 2006 meta-analysis. **Verify at build.**
- **MDC:** ≈2.5 s. **Verify.**

### 4.10 Constant–Murley Score **[verify]**
- **Structure:** 100 pts: Pain 15 + ADL 20 + ROM 40 + Strength 25. Mixed clinician-assessed and patient-reported. Constant & Murley 1987.
- **Direction:** higher = better.
- **MCID:** ≈10.4 pts post rotator-cuff repair (Kukkonen 2013). **Verify components, strength-measurement protocol, and threshold at build.**
- **Licensing:** free (published 1987, no licensing regime).

### Deferred (licence-gated) profiles — for when licences are signed

Already fully researched; retained here so the future build is plug-in:

- **ODI v2.1a:** 10 sections × 0–5 → % = total/(5 × sections answered) × 100 (section-skip rule, cap ≤1–2 skipped). Higher = worse. Bands: 0–20 minimal / 21–40 moderate / 41–60 severe / 61–80 crippling / 81–100 bed-bound (Fairbank & Pynsent 2000). MCID 10 pts or 30% relative (Ostelo 2008 consensus); surgical 12.8 (Copay 2008); MDC90 ~10 (Davidson & Keating 2002). v2.1a is the version Mapi mandates; screen rendering requires Mapi approval.
- **NDI:** 10 items × 0–5, /50 (or ×2 for %). Higher = worse. Bands (raw /50): 0–4 none / 5–14 mild / 15–24 moderate / 25–34 severe / ≥35 complete (Vernon & Mior 1991). MCID 5.5 neck pain, 7.5 mechanical/chronic (MacDermid 2009), 7.0 radiculopathy with MDC 10.2–13.4 (Cleland 2006 — **MDC exceeds MCID; use MDC as threshold in radiculopathy**). Missing: 1 item → score /45; ≥3 invalid.
- **QuickDASH:** 11 items 1–5; `((sum/n) − 1) × 25` → 0–100; ≥10 of 11 answered. **Higher = worse.** MCID 15.91 (Franchignoni 2014) vs 8 (Mintken 2009, shoulder) — display 15.91 primary, cite both. Implement QuickDASH not full DASH (equivalent validity, lower burden; identical licensing).
- **OSS:** 12 items × 0–4, **sum 0–48, higher = better** (post-2009 scoring only — never the legacy 12–60). Bands: 0–19 severe / 20–29 mod-severe / 30–39 mild-mod / 40–48 satisfactory. MCID ~4.5–6 post-surgery (range 2.7–7.0 by procedure); MIC 6.0 (van Kampen 2013). Missing: ≤2 → mean substitution.

---

## 5. Architecture changes

### 5.1 Registry: `domain` field (`lib/clinical/measures.js`)

Every measure gains `domains: ['rehab']`, `['msk']`, or `['rehab','msk']`.

- Shared (both): `10MWT`, `TUG`, `6MWT`, `Step`, `BOOMER`, `BBS`, `ABC`, `FSS`, `HADS`, `Barthel`, plus new `NPRS`, `PSFS`, `30STS`, `FTSTS`.
- Rehab-only: remaining existing measures (`FAC`, `PASS`, `TIS`, `MAS`, `COVS`, `FGA`, `HiMAT`, `SARA`, `AMP`, `SCIM`, `RPQ`, `PDQ8`, `BIVI`, `ISNCSCI`).
- MSK-only: `BPFS`, `LEFS`, `KOOS`, `HOOS`, `FAAM`, `CMS`.

A missing `domains` field defaults to `['rehab', 'msk']` so nothing breaks if a consumer lags.

### 5.2 Registry: formal `subscales` support

KOOS (5), HOOS (5), FAAM (2) cannot use the HADS pattern (primaryValue = one subscale, rest in `meta`, special-cased at `patientSummary.js:589`). Add to the registry entry:

```js
subscales: [
  { key: 'pain', label: 'Pain', mcidKey: 'koos-pain', chart: {...} },
  ...
]
```

- Calc functions return `meta.subscaleScores: { pain: 86.1, ... }` plus a clinically justified `primaryValue` (KOOS/HOOS: Pain subscale — the most consistently responsive and the PASS anchor; FAAM: ADL).
- `patientSummary.js`, `ProgressChart`, `SummaryTab`, and the PDF iterate `measure.subscales` generically instead of special-casing.
- HADS migrates to the same structure (its stored data shape is unchanged — only the rendering path generalises). The HADS special case at `patientSummary.js:589` is removed once parity is verified.

### 5.3 Condition-aware MCID (`lib/clinical/mcid.js`)

`MCID_VALS` entries gain optional per-condition overrides and an MDC value:

```js
'nprs': {
  thresh: 2.0, unit: 'pts', hib: false, mdc: 2.6,
  byCondition: { 'Neck Pain / Whiplash': { thresh: 1.5 } },
},
```

- `getMCIDStatus(mcidKey, current, previous, condition)` — new optional 4th arg; falls back to default when no override. Existing call sites keep working (backwards-compatible signature).
- Where published MDC > MCID (FAAM Sports, NDI radiculopathy later), status labels distinguish **"MCID met"** / **"improved beyond measurement error"** / **"improved within measurement error"**.
- `MCID_DATA` gains context lines for each new MSK condition (same pipe-separated format).

### 5.4 Profile clinical focus (Supabase migration — run `/security-review`)

- Migration: `ALTER TABLE profiles ADD COLUMN clinical_focus text NOT NULL DEFAULT 'both' CHECK (clinical_focus IN ('rehab','msk','both'));`
- RLS untouched (profiles policies already scope by user).
- ProfileModal gains a "Clinical focus" selector (Neuro/Rehab · MSK · Both) with plain-English helper text.
- Consumed by: sidebar (hides Wheelchair Prescription when `msk`), MeasureEntry default domain filter, SummaryTab domain ordering. **Never** used to hide patient data — a patient with recorded SARA scores still shows them regardless of focus.

### 5.5 Measure picker (`components/MeasureEntry.js`)

- New domain filter above the existing category tabs: **Rehab · MSK · All** — defaulting from `clinical_focus` (`both` → All).
- Existing category tabs (Performance / Independence / Questionnaire) unchanged; new measures categorised: NPRS, PSFS, BPFS, LEFS, KOOS, HOOS, FAAM → `questionnaire`; 30s-STS, FTSTS, CMS → `performance`.
- `IMPLEMENTED` set and form-dispatch switch extended one measure at a time as forms are built.

### 5.6 Smart Pathway (`lib/clinical/constants.js`)

New `CONDITION_OPTIONS` (appended — existing keys preserved verbatim; they exist as text on real patient rows; no silent renames):

| New condition | DIAG_RECS template (Wave 1) | When licensed, add |
|---|---|---|
| Low Back Pain | BPFS, NPRS, PSFS, FTSTS | ODI |
| Neck Pain / Whiplash | NPRS, PSFS | NDI |
| Knee — ACL Reconstruction | KOOS, NPRS, PSFS, QuadLSI, HopBattery, LESS | IKDC, ACL-RSI (handoff — licence-pending) |
| Knee — OA / Replacement | KOOS, NPRS, 30STS, FTSTS, TUG, 10MWT, 6MWT | — |
| Hip — OA / Replacement | HOOS, NPRS, 30STS, TUG, 10MWT, 6MWT | — |
| Shoulder Pain / Rotator Cuff | CMS, NPRS, PSFS | OSS or QuickDASH |
| Ankle Sprain / Instability | FAAM, NPRS, PSFS | CAIT (handoff) |
| Achilles Tendinopathy | FAAM, NPRS, PSFS | ATRS (handoff) |
| MSK — Other | NPRS, PSFS | — |

Redundancy resolution: legacy `Replacement` and `Multi-trauma Orthopaedic` keep working and their templates gain the relevant new measures (`Replacement` += KOOS, HOOS, 30STS, NPRS). New patients should prefer the specific new conditions; the legacy entries remain for existing data.

The 28-day default reassessment interval stays for v1; per-pathway intervals are noted in the handoff as a future enhancement.

### 5.7 Summary dashboard domains (`lib/clinical/patientSummary.js`)

Add to `SUMMARY_DOMAINS` (computed at render time — no schema impact):

- **pain**: NPRS, BPFS
- **lower limb**: LEFS, KOOS, HOOS, FAAM, 30STS, FTSTS
- **upper limb**: CMS
- **patient-specific function**: PSFS

Domain cards already render only when data exists, so neuro patients see no change.

### 5.8 Patient-reported follow-ups

- Extend `FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS` (`lib/followupQuestionnaires.js:18`) with the patient-reported MSK measures: NPRS, PSFS, BPFS, LEFS, KOOS, HOOS, FAAM.
- New migration extending the `measure_id` CHECK constraint (the two lists must stay in sync — both edits in the same commit).
- PSFS follow-up sends the patient their previously nominated activities.
- Clinician-performed tests (30STS, FTSTS, CMS) are **not** follow-up eligible.

### 5.9 Reference card + PDF

- `referenceCard.js`: new measures appear via registry iteration; add `EXTRA_NOTES` lines for condition-specific MCID nuance; title becomes domain-aware ("Rehab" / "MSK" sections).
- `patientReportPdf.js`: generic, consumes summary — subscale rendering comes via 5.2.

---

## 6. Files to edit

| File | Change |
|---|---|
| `lib/clinical/measures.js` | +10 registry entries, `domains` field on all, `subscales` field |
| `lib/clinical/constants.js` | +9 conditions, +9 DIAG_RECS templates, legacy template updates |
| `lib/clinical/mcid.js` | +new MCID keys, condition overrides, `mdc` field, extended `getMCIDStatus`, MCID_DATA context lines |
| `lib/clinical/nprs.js` … `cms.js` | 10 new pure calc modules (one per measure; KOOS/HOOS share an engine module) |
| `lib/clinical/index.js` | export new calcs/items |
| `lib/clinical/patientSummary.js` | new domains; generic subscale handling; remove HADS special case |
| `lib/clinical/referenceCard.js` | domain sections + notes |
| `components/FormNPRS.js` … `FormCMS.js` | 10 new form components (existing `.field-*` / `[data-measure-*]` patterns) |
| `components/MeasureEntry.js` | domain filter, IMPLEMENTED set, dispatch entries |
| `components/SummaryTab.js`, `components/ProgressChart.js` | subscale-aware rendering |
| `components/ProfileModal.js` | clinical focus selector |
| `pages/app.js` | sidebar wheelchair gating, profile focus state, styles for domain filter |
| `lib/followupQuestionnaires.js` | extend eligible IDs |
| `supabase/migrations/…` | profiles.clinical_focus; followups CHECK constraint |
| `__tests__/…` | unit tests per calc module (scoring, missing-item rules, MCID), pathway tests, follow-up eligibility tests |

## 7. Constraints & what is preserved

- All current UI patterns preserved: `.app-shell`, `.app-sidebar`, `[data-measure-*]`, `.summary-card`, `.domain-card`, locked colour tokens, etc.
- Auth/session, subscription wall, Stripe, patient selection, assessment sorting (`created_at DESC`), unsaved-warning, PDF export, sign-out: untouched behaviourally.
- Clinical logic stays pure JS in `lib/clinical/` — no React/DOM/Supabase in calc files; components own no clinical rules.
- Clinical data contract kept: `{ primaryValue, primaryUnit, interpretation, meta }` (subscales live in `meta.subscaleScores` + registry `subscales`).
- No localStorage clinical data. No new styling systems.

## 8. What will NOT be touched

- **ISNCSCI** (explicitly out of scope per project rules — never batch with other work).
- WheelchairPrescriptionTool internals (only its sidebar visibility).
- Stripe/payment code. Landing page (`pages/index.js`) — repositioning marketing copy for the broader scope was a separate, later task (done 2026-07-17, see `docs/outcome-measures-handoff.md` item 3).
- Mobile forms (`mobile/`) — next phase per decision.
- Existing measure calc modules (except the HADS rendering-path generalisation, which does not alter stored data or scores).

## 9. Build order (one measure at a time, per project workflow)

1. **Foundations:** registry `domains` + `subscales` scaffolding, condition-aware MCID engine, migration for `clinical_focus`, ProfileModal selector, sidebar gating, MeasureEntry domain filter. `/security-review` for the migration + profile change. Tests.
2. **NPRS** (simplest — proves the pipeline end-to-end), then **PSFS** (activity persistence), then **LEFS**, **BPFS**.
3. **KOOS** (subscale engine), then **HOOS** (reuses engine), then **FAAM** (N/A handling).
4. **30s-STS**, **FTSTS** (performance tests + norms), **CMS** (multi-component clinician form). Re-verify [verify]-flagged thresholds against primary sources before coding each.
5. **Pathways + conditions**, summary domains, reference card, follow-up eligibility (+ migration).
6. `/code-review` after each measure; Playwright visual checks; `/simplify` if MeasureEntry dispatch grows unwieldy.

Each measure follows the 10-step Outcome Measure Workflow in CLAUDE.md (inputs → calc → interpretation → MCID → chart → UI → save → summary → comparison → report).

## 10. Verification steps

- `npm run dev` + Playwright: measure picker shows domain filter; each new form renders styled (no browser-default inputs); save → summary updates → previous/current comparison and MCID labels correct; PDF includes subscale measures; wheelchair hidden only for `msk` focus; pathway badges for a "Low Back Pain" test patient.
- Unit tests: every scoring rule above (incl. KOOS ≤2-missing, FAAM N/A exclusion + validity floor, PSFS averaging, ODI-ready section logic), directionality, condition-aware MCID fallback.
- Data: Supabase column names confirmed against migrations; follow-up CHECK constraint and JS list in sync; no console errors; assessments still sort newest-first.
- Regression: HADS renders identically after subscale generalisation; existing patients with legacy `Replacement` diagnosis still get a pathway.

## 11. Risks & redundancies considered

| Risk | Mitigation |
|---|---|
| Licensed instruments embedded accidentally | The four deferred measures are not added to the registry at all in Wave 1 — nothing to leak. Handoff file documents licence contacts. |
| KOOS total-score misuse | No total computed anywhere; UI shows 5 subscale values. |
| MDC > MCID misinterpretation (FAAM Sports) | Three-state change labels (5.3). |
| Legacy condition keys vs new MSK conditions | Legacy keys preserved; templates extended; no renames. |
| HADS regression from subscale refactor | Parity test before removing special case. |
| `clinical_focus` hiding patient data | Focus filters *pickers and tools only*; recorded data always renders. |
| MeasureEntry dispatch bloat (34 forms) | Acceptable for Wave 1; refactor to a registry-driven form map noted for `/simplify`. |
| Reassessment interval wrong for MSK | 28-day default retained; per-pathway intervals in handoff. |
| Marketing/landing still says "rehabilitation teams" | Deliberate deferral; separate task in handoff. Resolved 2026-07-17. |

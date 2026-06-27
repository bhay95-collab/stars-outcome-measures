// MCID thresholds and change calculations — verbatim from index.html
// MCID_VALS keys match measure mcidKey values in measures.js
//
// Entry shape: { thresh, unit, hib, mdc?, thresholdType?, byCondition? }
//   mdc          — minimal detectable change; when published MDC differs from
//                  MCID the status label distinguishes "beyond measurement
//                  error" from "MCID met".
//   thresholdType — 'mcid' (default) or 'mdc'. When 'mdc', the threshold is a
//                  minimal *detectable* change (measurement-error floor) for a
//                  population with no anchored MCID published; labels then read
//                  "beyond/within measurement error" rather than "MCID met".
//   byCondition  — optional per-condition overrides keyed by CONDITION_OPTIONS
//                  values, e.g. { 'Neck Pain / Whiplash': { thresh: 1.5 } }.
//                  Overrides merge onto the default entry (case-insensitive key
//                  match); unlisted conditions fall back to the default values.
//                  Neuro overrides below are condition-specific so the same
//                  measure moves its bar with the patient's diagnosis.

export const MCID_VALS = {
  // ─── Neuro measures — defaults preserve prior behaviour; byCondition moves
  //     the bar to each diagnosis's published value. Citations inline. ────────
  // 10MWT default 0.06 m/s = small meaningful change in stroke/older adults
  // (Perera 2006; 0.16 substantial, Tilson 2010). PD/SCI/TBI raise the bar to
  // their larger measurement error / population MCID.
  '10mwt-comfort': {
    thresh: 0.06, unit: 'm/s', hib: true,
    byCondition: {
      'PD':  { thresh: 0.10, mdc: 0.18 }, // Steffen & Seney 2008 (MDC 0.18; MCID 0.02–0.15)
      'TBI': { thresh: 0.10 },            // van Loo & Moseley 2004
      'SCI': { thresh: 0.13, mdc: 0.25 }, // Lam 2008 SRD 0.13; Burns 2011 MDC 0.254
    },
  },
  '10mwt-fast': {
    thresh: 0.06, unit: 'm/s', hib: true,
    byCondition: {
      'PD':  { thresh: 0.10, mdc: 0.25 }, // Steffen 2008 fastest-gait MDC 0.25
      'SCI': { thresh: 0.13, mdc: 0.25 },
    },
  },
  // TUG default 2.0 s retained for generic/MSK; neuro overrides use the
  // population MDC as the meaningful-change floor (no anchored MCID exists).
  'tug': {
    thresh: 2.0, unit: 'sec', hib: false,
    byCondition: {
      'Stroke': { thresh: 2.9,  thresholdType: 'mdc' }, // Flansbjer 2005 MDC 2.9
      'PD':     { thresh: 3.5,  thresholdType: 'mdc' }, // Huang 2011 MDC 3.5
      'SCI':    { thresh: 10.8, thresholdType: 'mdc' }, // Lam 2007 SRD 10.8
    },
  },
  // 6MWT default 25 m retained (lower bound; non-neuro/MSK). Neuro/cardioresp
  // overrides per population literature.
  '6mwt': {
    thresh: 25, unit: 'm', hib: true,
    byCondition: {
      'Stroke':    { thresh: 50 },                       // Perera 2006 chronic (34 m Tang 2012)
      'PD':        { thresh: 82, thresholdType: 'mdc' }, // Steffen & Seney 2008 MDC 82
      'MS':        { thresh: 20 },                       // Oosterveer 2022 MIC (improvement)
      'SCI':       { thresh: 45.8, thresholdType: 'mdc' }, // Lam 2008 MDC 45.8
      'Pulmonary': { thresh: 54 },                       // Rasekaba 2009
    },
  },
  // BBS default 4 pts. Stroke/PD use population MDC (acute stroke is higher
  // still — up to ~6.9, Stevenson 2001).
  'bbs': {
    thresh: 4, unit: 'pts', hib: true,
    byCondition: {
      'Stroke': { thresh: 5, thresholdType: 'mdc' }, // Hiengkaew 2012 chronic MDC 4.66
      'PD':     { thresh: 5, thresholdType: 'mdc' }, // Steffen & Seney 2008 MDC 5
    },
  },
  'pass':          { thresh: 3,    unit: 'pts', hib: true  },
  'tis':           { thresh: 3,    unit: 'pts', hib: true  },
  'boomer':        { thresh: 2,    unit: 'pts', hib: true  },
  'himat':         { thresh: 2,    unit: 'pts', hib: true  },
  // FGA default 4 = older-adult MCID (Beninato 2014) and stroke/PD MDC ~4
  // (Lin 2010; Petersen 2016) — already population-consistent.
  'fga':           { thresh: 4,    unit: 'pts', hib: true  },
  'mas':           { thresh: 2,    unit: 'pts', hib: true  },
  'covs':          { thresh: 6,    unit: 'pts', hib: true  },
  'sara':          { thresh: 2.3,  unit: 'pts', hib: false },
  'barthel':       { thresh: 8,    unit: 'pts', hib: true  },
  // SCIM total: 4 = small / 10 = substantial change (Scivoletto 2013);
  // MDC 8.2 → 5–8 pt gains flag the measurement-error caveat.
  'scim':          { thresh: 5,    unit: 'pts', hib: true, mdc: 8.2 },
  'fss':           { thresh: 17.0, unit: 'pts', hib: false },
  'pdq8':          { thresh: 6.5,  unit: 'pts', hib: false },
  // ABC default 18.1% = vestibular MCID (Wellons 2022); MS lowers to 10.5
  // (Monjezi 2021).
  'abc':           { thresh: 18.1, unit: '%',   hib: true, byCondition: { 'MS': { thresh: 10.5 } } },
  'hads-a':        { thresh: 1.5,  unit: 'pts', hib: false },
  'hads-d':        { thresh: 1.5,  unit: 'pts', hib: false },

  // ─── MSK measures (Wave 1) — citations in docs/msk-expansion-plan.md §4 ───
  // NPRS: MCID 2 pts / ~30% (Farrar 2001; Childs 2005); neck pain 1.5, MDC 2.6 (Young 2018)
  'nprs':          { thresh: 2.0,  unit: 'pts', hib: false },
  // PSFS: MCID ≈2 pts average (Cleland 2006 cervical 2.2; Hefford 2012 UL 1.2; Chatman 1997 knee ~2)
  'psfs':          { thresh: 2.0,  unit: 'pts', hib: true  },
  // LEFS: MCID 9 pts, MDC90 9 (Binkley 1999); pooled MDC90 6 (Mehta 2016)
  'lefs':          { thresh: 9,    unit: 'pts', hib: true  },
  // BPFS: MDC90 6.5 used as change threshold — formal MCID not established (Stratford 2000)
  'bpfs':          { thresh: 6.5,  unit: 'pts', hib: true, mdc: 6.5 },
  // KOOS: 8–10 pts/subscale generic knee OA (Roos & Lohmander 2003) — 8 used;
  // post-ACLR MIC overrides: Sport/Rec 12.1, QOL 18.3 (Ingelsrud 2018)
  'koos-pain':     { thresh: 8,    unit: 'pts', hib: true  },
  'koos-symptoms': { thresh: 8,    unit: 'pts', hib: true  },
  'koos-adl':      { thresh: 8,    unit: 'pts', hib: true  },
  'koos-sport':    { thresh: 8,    unit: 'pts', hib: true, byCondition: { 'Knee — ACL Reconstruction': { thresh: 12.1 } } },
  'koos-qol':      { thresh: 8,    unit: 'pts', hib: true, byCondition: { 'Knee — ACL Reconstruction': { thresh: 18.3 } } },
  // HOOS: 8–10 pts/subscale generic hip OA (by analogy with KOOS, Roos group);
  // post-THA MCII is far larger (Pain 24, QOL 17 — Paulsen 2014, see MCID_DATA)
  'hoos-pain':     { thresh: 8,    unit: 'pts', hib: true  },
  'hoos-symptoms': { thresh: 8,    unit: 'pts', hib: true  },
  'hoos-adl':      { thresh: 8,    unit: 'pts', hib: true  },
  'hoos-sport':    { thresh: 8,    unit: 'pts', hib: true  },
  'hoos-qol':      { thresh: 8,    unit: 'pts', hib: true  },
  // FAAM: MCID ADL 8 / Sports 9; MDC95 ADL 5.7 / Sports 12.3 (Martin 2005) —
  // Sports MDC exceeds MCID, so its labels carry the measurement-error caveat
  'faam-adl':      { thresh: 8,    unit: 'pts', hib: true, mdc: 5.7  },
  'faam-sport':    { thresh: 9,    unit: 'pts', hib: true, mdc: 12.3 },
  // 30s-STS: MDC individual ≈2.5 stands (early knee OA 2022) used as change
  // threshold; MCID estimates ~2–3 stands in knee OA/TKA
  '30sts':         { thresh: 2.5,  unit: 'stands', hib: true, mdc: 2.5 },
  // FTSTS: MCID 2.3 s; MDC estimates range 1.5–4.2 s across populations
  'ftsts':         { thresh: 2.3,  unit: 'sec', hib: false },
  // CMS: MCID 10.4 post rotator cuff repair (Kukkonen 2013); MIC 17 subacromial pain
  'cms':           { thresh: 10.4, unit: 'pts', hib: true  },

  // ─── MSK measures (Wave 2) — citations in lib/clinical/<measure>.js headers ──
  // CAIT: MDC ≈3 pts (reliability studies); no firm MCID. CAI cut-offs ≤27
  // (Hiller 2006) / ≤25 (Wright 2014). Higher = more stable.
  'cait':          { thresh: 3,    unit: 'pts', hib: true  },
  // ATRS: MDC 6.8–18.5 across translations; no single MCID — 10-pt change used
  // as a measurement-error-based meaningful-change floor (Nilsson-Helander 2007).
  'atrs':          { thresh: 10,   unit: 'pts', hib: true, thresholdType: 'mdc' },
  // FABQ (higher = worse fear-avoidance). Interpret primarily via cut-offs
  // (PA >15, Work >34); change thresholds use published MDC — no anchored MCID.
  'fabq-pa':       { thresh: 6,    unit: 'pts', hib: false, thresholdType: 'mdc' }, // Grotle 2012 MDC ≈6.1
  'fabq-w':        { thresh: 13,   unit: 'pts', hib: false, thresholdType: 'mdc' }, // Inrig 2012 MDC 13; George 2006 13-pt
  // HAGOS (higher = better, 6 subscales, never totalled). No anchored MCID
  // exists, so each subscale uses its published individual-level MDC as the
  // measurement-error change floor (Groen 2017, HAGOS-NL; original Thorborg
  // 2011 SDC-individual range 17.7–33.8). Labels read "beyond/within
  // measurement error" rather than "MCID met".
  'hagos-symptoms': { thresh: 18.9, unit: 'pts', hib: true, thresholdType: 'mdc' },
  'hagos-pain':     { thresh: 25.2, unit: 'pts', hib: true, thresholdType: 'mdc' },
  'hagos-adl':      { thresh: 19.7, unit: 'pts', hib: true, thresholdType: 'mdc' },
  'hagos-sport':    { thresh: 26.8, unit: 'pts', hib: true, thresholdType: 'mdc' },
  'hagos-pa':       { thresh: 34.1, unit: 'pts', hib: true, thresholdType: 'mdc' },
  'hagos-qol':      { thresh: 18.3, unit: 'pts', hib: true, thresholdType: 'mdc' },
}

// Condition-specific MCID context text — verbatim from index.html
export const MCID_DATA = {
  'Stroke':                   '10MWT MCID 0.06 m/s (0.16 substantial, Tilson 2010) | 6MWT MCID 50 m (Perera 2006; 34 m Tang 2012) | BBS meaningful change ≥4.7 pts chronic, ~6.5 acute (MDC, Stevenson 2001/Hiengkaew 2012) | TUG meaningful change ≥2.9 sec (MDC, Flansbjer 2005) | PASS MCID 3.5–4.5 pts | TIS MCID 8.5 pts | Fall risk: BBS<36, TUG>13.5 sec | FSS useful for fatigue screening | ABC Scale <81.1% suggests multiple fall history',
  'TBI':                      '10MWT MCID 0.10 m/s (van Loo 2004) | 6MWT MCID 25 m | TUG fall risk >13.5 sec | FAC useful for ambulation classification | HiMAT appropriate at high functional levels | RPQ for post-concussion symptom monitoring | FSS for fatigue',
  'ABI':                      '10MWT MCID 0.10 m/s | 6MWT MCID 25 m | TUG fall risk >13.5 sec | FAC useful | BIVI-IQ for visual impairment impact | MAS for motor function | RPQ if TBI component present',
  'SCI':                      '10MWT meaningful change ≥0.13 m/s (MDC 0.25; Lam 2008/Burns 2011) | 6MWT MDC 45.8 m (Lam 2008) | TUG meaningful change ≥10.8 sec (Lam 2007) | Step Test community threshold ≥10 steps | COVS useful for tracking independence | SCIM MDC 8.2 (4 small / 10 substantial, Scivoletto 2013) | FSS MDC 1.55 | ABC Scale MDC ≈15%',
  'MS':                       '6MWT MIC ≈20 m improvement (Oosterveer 2022) | BBS MDC 5 pts | TUG fall risk >13.5 sec | ABC MCID 10.5 (Monjezi 2021) | FSS — significant fatigue ≥36 total | Dual-task TUG sensitive to cognitive-motor interference in MS',
  'PD':                       'TUG meaningful change ≥3.5 sec (MDC, Huang 2011), fall risk >13.5 sec | BBS meaningful change ≥5 pts (MDC, Steffen 2008) | 10MWT ≥0.10 m/s (MDC 0.18) | 6MWT MDC 82 m | Dual-task TUG particularly sensitive | PDQ-8 primary QOL measure (MCID ≈5.9 pts) | ABC Scale <69% elevated fall risk in PD | FSS validated in PD',
  'Ataxia':                   'SARA primary measure | MDC <3.5 pts | Score >10 moderate, >20 severe | Track item scores over time',
  'SCA':                      'SARA primary measure | MDC <3.5 pts | Score >10 moderate, >20 severe | Track item scores over time',
  'Cerebellar':               'SARA primary measure | MDC <3.5 pts | Score >10 moderate, >20 severe | Track item scores over time',
  'GBS':                      'Track functional recovery with COVS, FAC, TUG | 6MWT useful when ambulating community distances | FSS for fatigue monitoring',
  'Neuropathy':               '10MWT and TUG for gait | BBS for balance | FAC for ambulatory classification | ABC Scale for balance confidence',
  'Trauma':                   '10MWT and Step Test useful | HiMAT appropriate at high functional levels | TUG community cut-off >13.5 sec | AMP for amputation',
  'Amputation':               'AMP recommended by VA/DoD guidelines | 10MWT and TUG primary gait outcomes | BBS for balance | HiMAT when high-level prosthetic rehab | ABC Scale <80% elevated fall risk in amputees',
  'Cardiac':                  '6MWT primary outcome | MDC ≈60 m | MCID ≈25 m | Record HR and RPE alongside distance | FSS validated for cardiac populations',
  'Pulmonary':                '6MWT primary outcome | MDC ≈54 m | MCID ≈54 m | Monitor SpO2 during test | FSS validated in COPD',
  'Replacement':              '10MWT and TUG for gait | 6MWT for functional capacity | Step Test for dynamic balance | BOOMER for elder populations',
  'Multi-trauma Orthopaedic': '10MWT and Step Test useful | HiMAT at high levels | TUG >13.5 sec = fall risk | BOOMER if older adult',
  'Normally Developing Child':'HiMAT normative data varies by age 5–12yr | Refer to Williams 2009 age-specific tables',
  'Reconditioning':           '6MWT for functional capacity | TUG and 10MWT for mobility | COVS for functional independence | BOOMER for elder populations | FSS for fatigue',
  'Low Back Pain':                'NPRS MCID 2 pts or 30% (Childs 2005) | BPFS change ≥6.5 pts exceeds MDC90 (no established MCID) | PSFS MCID 0.8–4.3 graded (Maughan & Lewis 2010) | FTSTS for functional strength | ODI joins this pathway once licensed (MCID 10 pts / 30%)',
  'Neck Pain / Whiplash':         'NPRS MCID 1.5 pts, MDC 2.6 in mechanical neck pain (Young 2018) | PSFS MCID 2.2 in cervical radiculopathy (Cleland 2006) | NDI joins this pathway once licensed (MCID 5.5–7.5/50; radiculopathy use MDC ~10)',
  'Knee — ACL Reconstruction':    'KOOS MCID 8–10 pts/subscale; post-ACLR Sport/Rec MIC 12.1, QOL 18.3 (Ingelsrud 2018) — Sport and QOL are the primary subscales post-ACLR | PASS anchors: Pain 88.9, Sport 75.0, QOL 62.5 (Muller 2016) | NPRS and PSFS for pain/function',
  'Knee — OA / Replacement':      'KOOS MCID 8–10 pts/subscale (TKA Pain ≈7.9) | 30s-STS <12 stands = reduced function in knee OA; MDC 2.5 stands | FTSTS MCID 2.3 s | TUG/10MWT/6MWT for mobility | NPRS MCID 2 pts',
  'Hip — OA / Replacement':       'HOOS MCID 8–10 pts/subscale conservative care; post-THA MCII far larger (Pain 24, QOL 17 — Paulsen 2014; PASS at 1 yr: Pain ≥91, QOL ≥83) | 30s-STS MDC 2.5 stands | NPRS MCID 2 pts',
  'Shoulder Pain / Rotator Cuff': 'Constant–Murley MCID 10.4 post rotator cuff repair (Kukkonen 2013); ≈17 in long-standing subacromial pain | NPRS MCID 2 pts (shoulder) | PSFS MCID 1.2 upper limb (Hefford 2012) | OSS/QuickDASH join once licensed',
  'Ankle Sprain / Instability':   'FAAM MCID ADL 8 / Sport 9; MDC95 ADL 5.7 / Sport 12.3 — Sport changes <12.3 within error | CAI criteria: ADL <90%, Sport <80% (IAC 2014) | NPRS MCID 2 pts | PSFS for patient-specific goals',
  'Achilles Tendinopathy':        'FAAM for regional function (MCID ADL 8 / Sport 9) | NPRS MCID 2 pts | PSFS for patient-specific loading goals | ATRS planned for rupture cohorts (see handoff)',
  'Hip / Groin Pain':             'HAGOS: 6 subscales, never totalled; no anchored MCID — interpret change against per-subscale MDC (individual, Groen 2017): Symptoms 18.9, Pain 25.2, ADL 19.7, Sport 26.8, Phys. activity 34.1, QOL 18.3 | NPRS MCID 2 pts | PSFS for patient-specific goals',
  'MSK — Other':                  'NPRS MCID ≈2 pts or 30% | PSFS MCID ≈2 pts average (region-dependent 0.8–4.3) | Add region-specific measures from the MSK library as indicated',
  'Other':                    'Refer to Norms Reference for population-specific MDC and MCID values.',
}

/**
 * Compute the raw change between two assessments.
 * Returns null if either value is missing or not a finite number.
 *
 * @param {number} current
 * @param {number} previous
 * @param {boolean} higherIsBetter
 * @returns {{ delta: number, improved: boolean, rawStr: string, pctStr: string } | null}
 */
export function calcChange(current, previous, higherIsBetter) {
  if (
    current == null || previous == null ||
    !isFinite(current) || !isFinite(previous)
  ) return null

  const delta = current - previous
  const pct = previous !== 0 ? (delta / previous) * 100 : null
  const improved = higherIsBetter ? delta > 0 : delta < 0
  const sign = delta >= 0 ? '+' : ''

  const rawStr = Number.isInteger(current) && Number.isInteger(previous)
    ? `${sign}${delta}`
    : `${sign}${delta.toFixed(2)}`

  const pctStr = pct != null ? `${sign}${pct.toFixed(1)}%` : ''

  return { delta, improved, rawStr, pctStr }
}

/**
 * Resolve the effective MCID entry for a measure, applying any
 * condition-specific override on top of the default values.
 *
 * @param {string} mcidKey - Key into MCID_VALS (e.g. '10mwt-comfort')
 * @param {string} [condition] - Patient condition (CONDITION_OPTIONS value)
 * @returns {{ thresh: number, unit: string, hib: boolean, mdc?: number } | null}
 */
export function resolveMCIDEntry(mcidKey, condition) {
  const entry = MCID_VALS[mcidKey]
  if (!entry) return null
  if (!condition || !entry.byCondition) return entry
  const override = entry.byCondition[condition] ?? matchConditionOverride(entry.byCondition, condition)
  if (!override) return entry
  return { ...entry, ...override }
}

/**
 * Case-insensitive, whitespace-tolerant lookup of a condition override.
 * Patient diagnosis comes from a controlled list, but tolerate minor variance.
 *
 * @param {Object<string, object>} byCondition
 * @param {string} condition
 * @returns {object | null}
 */
function matchConditionOverride(byCondition, condition) {
  const target = String(condition).trim().toLowerCase()
  if (!target) return null
  const key = Object.keys(byCondition).find(candidate => candidate.toLowerCase() === target)
  return key ? byCondition[key] : null
}

/**
 * Determine whether a change meets the MCID threshold.
 * When the entry defines an MDC, improvements below MCID are further split
 * into "beyond measurement error" vs "within measurement error".
 *
 * @param {string} mcidKey - Key into MCID_VALS (e.g. '10mwt-comfort')
 * @param {number} current
 * @param {number} previous
 * @param {string} [condition] - Optional patient condition for condition-specific thresholds
 * @returns {{ improved: boolean, meetsThreshold: boolean, exceedsMDC: boolean | null, label: string } | null}
 */
export function getMCIDStatus(mcidKey, current, previous, condition) {
  const entry = resolveMCIDEntry(mcidKey, condition)
  if (!entry) return null

  const change = calcChange(current, previous, entry.hib)
  if (!change) return null

  const absDelta = Math.abs(change.delta)
  const meetsThreshold = change.improved && absDelta >= entry.thresh
  const hasMDC = isFinite(entry.mdc)
  const exceedsMDC = hasMDC ? absDelta >= entry.mdc : null
  const isMdcThreshold = entry.thresholdType === 'mdc'

  let label
  if (!change.improved) {
    label = `Declined ${change.rawStr} ${entry.unit}`
  } else if (isMdcThreshold) {
    // Threshold is a minimal *detectable* change for this population — there is
    // no anchored MCID, so report measurement error honestly, not "MCID met".
    label = meetsThreshold
      ? `Improved ${change.rawStr} ${entry.unit} — beyond measurement error (≥${entry.thresh})`
      : `Improved ${change.rawStr} ${entry.unit} — within measurement error (<${entry.thresh})`
  } else if (meetsThreshold && (!hasMDC || exceedsMDC)) {
    label = `MCID met — improved ${change.rawStr} ${entry.unit} (threshold ≥${entry.thresh})`
  } else if (meetsThreshold) {
    // MDC exceeds MCID for this measure (e.g. FAAM Sports) — flag the
    // measurement-error caveat rather than claiming a clean MCID.
    label = `Improved ${change.rawStr} ${entry.unit} — meets MCID (≥${entry.thresh}) but within measurement error (MDC ≥${entry.mdc})`
  } else if (hasMDC && exceedsMDC) {
    label = `Improved ${change.rawStr} ${entry.unit} — beyond measurement error (MDC ≥${entry.mdc}) but below MCID (≥${entry.thresh})`
  } else if (hasMDC) {
    label = `Improved ${change.rawStr} ${entry.unit} — within measurement error (MDC ≥${entry.mdc})`
  } else {
    label = `Improved ${change.rawStr} ${entry.unit} — below MCID (≥${entry.thresh})`
  }

  return { improved: change.improved, meetsThreshold, exceedsMDC, label }
}

/**
 * Return condition-specific MCID context text for display.
 *
 * @param {string} condition - Must match a key in MCID_DATA
 * @returns {string}
 */
export function getMCIDContext(condition) {
  return MCID_DATA[condition] ?? MCID_DATA['Other']
}

// Return-to-sport (RTS) readiness battery after ACL injury/reconstruction.
// Pure JS — no React/DOM/Supabase. Aggregates clinician-measured field tests
// and PROMs against PUBLISHED pass thresholds; it never invents a cut-off and
// never issues a clearance. It reports which criteria are met and carries the
// honesty caveat that criteria batteries have weak predictive validity for a
// second injury (Losciale 2019, AJSM 47:3439; Webster & Hewett 2019, Sports Med).
//
// Published thresholds (only these drive a pass/fail):
//   - Time since surgery >= 9 months. Returning < 9 months multiplied reinjury
//     risk ~7x in young athletes; each month's delay to 9 months roughly halved
//     it (Grindem 2016, BJSM 50:804; Beischer 2020, JOSPT 50:83).
//   - Quadriceps strength LSI >= 90% (Grindem 2016; Kyritsis 2016, BJSM 50:946).
//   - Hop battery (single, triple, crossover, 6-m timed) each LSI >= 90%
//     (Reid 2007, Phys Ther 87:337; Grindem 2016) — limiting hop must clear 90%.
//   - Effusion trace-to-zero on the modified stroke test (clinician-judged).
//   - Landing mechanics LESS < 5 (Padua 2009 development; prospective cut-off
//     Padua 2015, AJSM 43:2603) — supportive criterion (graded only when entered).
//
// LICENCE-PENDING criteria (present but NOT graded until the instrument is
// licensed — no substitute cut-off is invented):
//   - Patient-reported knee function (IKDC / KOS-ADLS) >= 90%.
//   - Psychological readiness ACL-RSI >= 56 (low) / >= 75 (confident)
//     (Webster 2008; Müller 2021).
//
// Input (all optional; absent → that criterion is "not assessed"):
//   { monthsSinceSurgery, quadLSI, hopMinLSI, effusionTraceToZero, less,
//     ikdcOrKosPercent, aclRsi }
// Returns: { criteria[], hardCriteriaMet, metCount, gradableCount, summary, caveat }

export const RTS_THRESHOLDS = {
  timeMonths: 9,     // months post-op (Grindem 2016; Beischer 2020)
  quadLSI: 90,       // % (Grindem 2016)
  hopLSI: 90,        // % each hop (Reid 2007; Grindem 2016)
  lessErrors: 5,     // < 5 errors (Padua 2009; Padua 2015)
  aclRsiLow: 56,     // ACL-RSI low cut-off (from predictive work; re-source on licensing) — licence-pending
  aclRsiHigh: 75,    // ACL-RSI confident threshold (Müller 2021) — licence-pending
  functionPercent: 90, // IKDC / KOS-ADLS — licence-pending
}

export const RTS_CAVEAT =
  'Meeting these criteria reduces but does not eliminate reinjury risk; test ' +
  'batteries have a limited ability to predict a second ACL injury (Losciale ' +
  '2019; Webster & Hewett 2019). This supports — it does not replace — the ' +
  'clinician and athlete shared return-to-sport decision.'

// Return-to-sport continuum (Ardern 2016 Bern consensus) — descriptive context.
export const RTS_CONTINUUM = [
  { key: 'participation', label: 'Return to participation', note: 'training/play below desired level' },
  { key: 'sport', label: 'Return to sport', note: 'returned, not yet at target performance' },
  { key: 'performance', label: 'Return to performance', note: 'at or above pre-injury level' },
]

function gradedCriterion({ key, label, value, met, threshold, unit, source }) {
  return { key, label, value: value ?? null, met, threshold, unit, source, pending: false, assessed: value !== null && value !== undefined }
}

function pendingCriterion({ key, label, threshold, source }) {
  return { key, label, value: null, met: null, threshold, unit: null, source, pending: true, assessed: false }
}

export function evaluateRTSBattery(input = {}) {
  const {
    monthsSinceSurgery = null,
    quadLSI = null,
    hopMinLSI = null,
    effusionTraceToZero = null,
    less = null,
    ikdcOrKosPercent = null,
    aclRsi = null,
  } = input

  const T = RTS_THRESHOLDS

  const time = gradedCriterion({
    key: 'time', label: 'Time since surgery', value: monthsSinceSurgery,
    met: monthsSinceSurgery !== null ? monthsSinceSurgery >= T.timeMonths : null,
    threshold: `≥ ${T.timeMonths} months`, unit: 'months', source: 'Grindem 2016; Beischer 2020',
  })
  const quad = gradedCriterion({
    key: 'quad', label: 'Quadriceps strength LSI', value: quadLSI,
    met: quadLSI !== null ? quadLSI >= T.quadLSI : null,
    threshold: `≥ ${T.quadLSI}%`, unit: '%', source: 'Grindem 2016; Kyritsis 2016',
  })
  const hops = gradedCriterion({
    key: 'hops', label: 'Hop battery (limiting LSI)', value: hopMinLSI,
    met: hopMinLSI !== null ? hopMinLSI >= T.hopLSI : null,
    threshold: `≥ ${T.hopLSI}% each hop`, unit: '%', source: 'Reid 2007; Grindem 2016',
  })
  const effusion = gradedCriterion({
    key: 'effusion', label: 'Effusion (modified stroke test)',
    value: effusionTraceToZero === null ? null : (effusionTraceToZero ? 'Trace–zero' : 'Present'),
    met: effusionTraceToZero === null ? null : effusionTraceToZero === true,
    threshold: 'Trace to zero', unit: null, source: 'Sturgill 2009',
  })
  const landing = gradedCriterion({
    key: 'landing', label: 'Landing mechanics (LESS)', value: less,
    met: less !== null ? less < T.lessErrors : null,
    threshold: `< ${T.lessErrors} errors`, unit: '/17', source: 'Padua 2009; Padua 2015',
  })

  // Licence-pending — graded only if a value is supplied (i.e. once licensed and
  // the questionnaire is built); otherwise reported as pending.
  const fn = ikdcOrKosPercent !== null
    ? gradedCriterion({ key: 'function', label: 'Knee function (IKDC / KOS-ADLS)', value: ikdcOrKosPercent, met: ikdcOrKosPercent >= T.functionPercent, threshold: `≥ ${T.functionPercent}%`, unit: '%', source: 'Grindem 2016 (licence-pending)' })
    : pendingCriterion({ key: 'function', label: 'Knee function (IKDC / KOS-ADLS)', threshold: `≥ ${T.functionPercent}%`, source: 'licence-pending' })
  const psych = aclRsi !== null
    ? gradedCriterion({ key: 'psych', label: 'Psychological readiness (ACL-RSI)', value: aclRsi, met: aclRsi >= T.aclRsiLow, threshold: `≥ ${T.aclRsiLow} (≥ ${T.aclRsiHigh} confident)`, unit: null, source: 'ACL-RSI (Müller 2021; cut-off re-sourced on licensing)' })
    : pendingCriterion({ key: 'psych', label: 'Psychological readiness (ACL-RSI)', threshold: `≥ ${T.aclRsiLow}`, source: 'licence-pending' })

  const criteria = [time, quad, hops, effusion, landing, fn, psych]

  // Hard battery = the licence-clear objective core. LESS is supportive, not a
  // gate; pending criteria never block (they are simply not yet assessable).
  const hardCore = [time, quad, hops, effusion]
  const hardCriteriaMet = hardCore.every(c => c.met === true)

  const graded = criteria.filter(c => c.assessed)
  const metCount = graded.filter(c => c.met === true).length

  let summary
  if (!hardCore.every(c => c.assessed)) {
    summary = 'Battery incomplete — record the outstanding objective tests.'
  } else if (hardCriteriaMet) {
    summary = 'Objective core criteria met (9-month gate, quad LSI, hop battery, effusion). Confirm function (IKDC) and psychological readiness (ACL-RSI) once licensed.'
  } else {
    summary = 'One or more objective RTS criteria not yet met.'
  }

  return {
    criteria,
    hardCriteriaMet,
    metCount,
    gradableCount: graded.length,
    summary,
    caveat: RTS_CAVEAT,
  }
}

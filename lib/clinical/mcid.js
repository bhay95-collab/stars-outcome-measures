// MCID thresholds and change calculations — verbatim from index.html
// MCID_VALS keys match measure mcidKey values in measures.js

export const MCID_VALS = {
  '10mwt-comfort': { thresh: 0.06, unit: 'm/s', hib: true  },
  '10mwt-fast':    { thresh: 0.06, unit: 'm/s', hib: true  },
  'tug':           { thresh: 2.0,  unit: 'sec', hib: false },
  '6mwt':          { thresh: 25,   unit: 'm',   hib: true  },
  'bbs':           { thresh: 4,    unit: 'pts', hib: true  },
  'pass':          { thresh: 3,    unit: 'pts', hib: true  },
  'tis':           { thresh: 3,    unit: 'pts', hib: true  },
  'boomer':        { thresh: 2,    unit: 'pts', hib: true  },
  'himat':         { thresh: 2,    unit: 'pts', hib: true  },
  'fga':           { thresh: 4,    unit: 'pts', hib: true  },
  'mas':           { thresh: 2,    unit: 'pts', hib: true  },
  'covs':          { thresh: 6,    unit: 'pts', hib: true  },
  'sara':          { thresh: 2.3,  unit: 'pts', hib: false },
  'barthel':       { thresh: 8,    unit: 'pts', hib: true  },
  'scim':          { thresh: 5,    unit: 'pts', hib: true  },
  'fss':           { thresh: 17.0, unit: 'pts', hib: false },
  'pdq8':          { thresh: 6.5,  unit: 'pts', hib: false },
  'abc':           { thresh: 18.1, unit: '%',   hib: true  },
  'hads-a':        { thresh: 1.5,  unit: 'pts', hib: false },
  'hads-d':        { thresh: 1.5,  unit: 'pts', hib: false },
}

// Condition-specific MCID context text — verbatim from index.html
export const MCID_DATA = {
  'Stroke':                   '10MWT MCID 0.06 m/s | 6MWT MCID 25 m | BBS MCID 4–6 pts | TUG MCID 2.0 sec, MDC 1.1 sec | PASS MCID 3.5–4.5 pts | TIS MCID 8.5 pts | Fall risk: BBS<36, TUG>13.5 sec | FSS useful for fatigue screening | ABC Scale <81.1% suggests multiple fall history',
  'TBI':                      '10MWT MCID 0.1 m/s | 6MWT MCID 25 m | TUG fall risk >13.5 sec | FAC useful for ambulation classification | HiMAT appropriate at high functional levels | RPQ for post-concussion symptom monitoring | FSS for fatigue',
  'ABI':                      '10MWT MCID 0.1 m/s | 6MWT MCID 25 m | TUG fall risk >13.5 sec | FAC useful | BIVI-IQ for visual impairment impact | MAS for motor function | RPQ if TBI component present',
  'SCI':                      'TUG MCID 11 sec | Step Test community threshold ≥10 steps | COVS useful for tracking independence | FSS MDC 1.55 | ABC Scale MDC ≈15%',
  'MS':                       '6MWT MDC 54 m | BBS MDC 5 pts | TUG MCID ≈2.0 sec | FSS — significant fatigue ≥36 total | Dual-task TUG sensitive to cognitive-motor interference in MS',
  'PD':                       'TUG MCID 3.5 sec, fall risk >13.5 sec | BBS MCID 4 pts, MDC 5 pts | Dual-task TUG particularly sensitive | PDQ-8 primary QOL measure (MCID ≈5.9 pts) | ABC Scale <69% elevated fall risk in PD | FSS validated in PD',
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
 * Determine whether a change meets the MCID threshold.
 *
 * @param {string} mcidKey - Key into MCID_VALS (e.g. '10mwt-comfort')
 * @param {number} current
 * @param {number} previous
 * @returns {{ improved: boolean, meetsThreshold: boolean, label: string } | null}
 */
export function getMCIDStatus(mcidKey, current, previous) {
  const entry = MCID_VALS[mcidKey]
  if (!entry) return null

  const change = calcChange(current, previous, entry.hib)
  if (!change) return null

  const absDelta = Math.abs(change.delta)
  const meetsThreshold = change.improved && absDelta >= entry.thresh

  let label
  if (!change.improved) {
    label = `Declined ${change.rawStr} ${entry.unit}`
  } else if (meetsThreshold) {
    label = `MCID met — improved ${change.rawStr} ${entry.unit} (threshold ≥${entry.thresh})`
  } else {
    label = `Improved ${change.rawStr} ${entry.unit} — below MCID (≥${entry.thresh})`
  }

  return { improved: change.improved, meetsThreshold, label }
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

// ACL return-to-sport tool — field-test calcs, RTS battery, and phase gates.
// Values cite the engine headers (quadLSI.js, hopBattery.js, less.js,
// aclRts.js, aclPhases.js): Grindem 2016, Reid 2007, Padua 2009, van Melick 2016.

const { calcQuadLSI, QUAD_LSI_RTS_PASS } = require('../lib/clinical/quadLSI')
const { calcHopBattery } = require('../lib/clinical/hopBattery')
const { calcLESS } = require('../lib/clinical/less')
const { evaluateRTSBattery, RTS_THRESHOLDS } = require('../lib/clinical/aclRts')
const { ACL_PHASES, evaluatePhaseGate, getACLPhase } = require('../lib/clinical/aclPhases')
const { MEASURES } = require('../lib/clinical/measures')
const { DIAG_RECS } = require('../lib/clinical/constants')

describe('calcQuadLSI', () => {
  it('computes involved/uninvolved × 100 and flags the 90% RTS pass', () => {
    const r = calcQuadLSI({ involved: 180, uninvolved: 200 })
    expect(r.primaryValue).toBe(90)
    expect(r.primaryUnit).toBe('%')
    expect(r.meta.meetsRTS).toBe(true)
    expect(r.meta.classColor).toBe('green')
  })

  it('bands a mild deficit (80–89%) amber and a deficit (<80%) red', () => {
    expect(calcQuadLSI({ involved: 170, uninvolved: 200 }).meta.classColor).toBe('amber') // 85%
    expect(calcQuadLSI({ involved: 140, uninvolved: 200 }).meta.classColor).toBe('red')   // 70%
    expect(calcQuadLSI({ involved: 170, uninvolved: 200 }).meta.meetsRTS).toBe(false)
  })

  it('rejects non-positive or non-numeric strength', () => {
    expect(calcQuadLSI({ involved: 100, uninvolved: 0 })).toBeNull()
    expect(calcQuadLSI({ involved: 'x', uninvolved: 200 })).toBeNull()
  })

  it('exposes the published 90% RTS pass constant', () => {
    expect(QUAD_LSI_RTS_PASS).toBe(90)
  })
})

describe('calcHopBattery', () => {
  const SYMMETRICAL = {
    singleInv: 150, singleUninv: 155, tripleInv: 450, tripleUninv: 470,
    crossInv: 420, crossUninv: 440, timedInv: 2.0, timedUninv: 1.9,
  }

  it('takes the limiting hop as the score and inverts the timed hop', () => {
    const r = calcHopBattery(SYMMETRICAL)
    // timed LSI = uninvolved/involved = 1.9/2.0 = 95%; all others ~95–97%
    expect(r.meta.timed).toBe(95)
    expect(r.primaryValue).toBe(Math.min(r.meta.single, r.meta.triple, r.meta.crossover, r.meta.timed))
    expect(r.meta.meetsRTS).toBe(true)
  })

  it('fails the battery when any single hop is below 90%', () => {
    const r = calcHopBattery({ ...SYMMETRICAL, singleInv: 120 }) // single ~77%
    expect(r.meta.meetsRTS).toBe(false)
    expect(r.primaryValue).toBeLessThan(90)
    expect(r.meta.classColor).toBe('red')
  })

  it('rejects missing or non-positive measurements', () => {
    expect(calcHopBattery({ ...SYMMETRICAL, timedInv: 0 })).toBeNull()
    expect(calcHopBattery({})).toBeNull()
  })
})

describe('calcLESS', () => {
  it('scores errors /19, lower is better, <5 = good mechanics', () => {
    expect(calcLESS({ errors: 3 }).meta.meetsRTS).toBe(true)
    expect(calcLESS({ errors: 3 }).meta.classColor).toBe('green')
    expect(calcLESS({ errors: 5 }).meta.meetsRTS).toBe(false)
    expect(calcLESS({ errors: 5 }).meta.classColor).toBe('amber')
    expect(calcLESS({ errors: 9 }).meta.classColor).toBe('red')
    expect(calcLESS({ errors: 3 }).primaryUnit).toBe('/19')
  })

  it('accepts the full published 0–19 range (items 16–17 score up to 2 each)', () => {
    expect(calcLESS({ errors: 19 }).primaryValue).toBe(19)
    expect(calcLESS({ errors: 18 }).meta.classColor).toBe('red')
  })

  it('rejects out-of-range or non-integer error counts', () => {
    expect(calcLESS({ errors: 20 })).toBeNull()
    expect(calcLESS({ errors: -1 })).toBeNull()
    expect(calcLESS({ errors: 2.5 })).toBeNull()
  })
})

describe('evaluateRTSBattery', () => {
  const PASSING = {
    monthsSinceSurgery: 10, quadLSI: 92, hopMinLSI: 91, effusionTraceToZero: true, less: 3,
  }

  it('passes the licence-clear hard core when time + quad + hops + effusion are met', () => {
    const r = evaluateRTSBattery(PASSING)
    expect(r.hardCriteriaMet).toBe(true)
    expect(r.summary).toMatch(/objective core criteria met/i)
    // Licence-pending instruments (IKDC, ACL-RSI) are hidden from the UI until
    // licensed — the summary must not tell users to confirm them.
    expect(r.summary).not.toMatch(/licen|IKDC|ACL-RSI/i)
  })

  it('keeps ACL-RSI and function as pending (not graded) until licensed', () => {
    const r = evaluateRTSBattery(PASSING)
    const psych = r.criteria.find(c => c.key === 'psych')
    const fn = r.criteria.find(c => c.key === 'function')
    expect(psych.pending).toBe(true)
    expect(psych.met).toBeNull()
    expect(fn.pending).toBe(true)
  })

  it('fails the hard core when the 9-month time-gate is not reached', () => {
    const r = evaluateRTSBattery({ ...PASSING, monthsSinceSurgery: 7 })
    expect(r.hardCriteriaMet).toBe(false)
    const time = r.criteria.find(c => c.key === 'time')
    expect(time.met).toBe(false)
  })

  it('fails the hard core when quadriceps strength is below 90%', () => {
    const r = evaluateRTSBattery({ ...PASSING, quadLSI: 85 })
    expect(r.hardCriteriaMet).toBe(false)
  })

  it('reports incomplete when an objective criterion has not been recorded', () => {
    const r = evaluateRTSBattery({ monthsSinceSurgery: 10, quadLSI: 92 })
    expect(r.hardCriteriaMet).toBe(false)
    expect(r.summary).toMatch(/incomplete/i)
  })

  it('always carries the predictive-validity caveat', () => {
    expect(evaluateRTSBattery(PASSING).caveat).toMatch(/does not (eliminate|replace)/i)
  })

  it('exposes published thresholds (9 months, 90% LSI, ACL-RSI 56)', () => {
    expect(RTS_THRESHOLDS.timeMonths).toBe(9)
    expect(RTS_THRESHOLDS.quadLSI).toBe(90)
    expect(RTS_THRESHOLDS.hopLSI).toBe(90)
    expect(RTS_THRESHOLDS.aclRsiLow).toBe(56)
  })

  it('labels the time criterion by pathway type (surgery vs injury)', () => {
    const surgical = evaluateRTSBattery(PASSING)
    expect(surgical.criteria.find(c => c.key === 'time').label).toBe('Time since surgery')
    const conservative = evaluateRTSBattery({ ...PASSING, pathwayType: 'conservative' })
    expect(conservative.criteria.find(c => c.key === 'time').label).toBe('Time since injury')
  })
})

describe('ACL phase ladder', () => {
  it('defines six phases ending in a terminal secondary-prevention phase', () => {
    expect(ACL_PHASES).toHaveLength(6)
    expect(getACLPhase(6).gate).toBeNull()
    expect(evaluatePhaseGate(6, {}).terminal).toBe(true)
  })

  it('gates phase 3 → 4 on quadriceps LSI ≥ 80% (van Melick milestone)', () => {
    expect(evaluatePhaseGate(3, { quadLSI: 82 }).allMet).toBe(true)
    expect(evaluatePhaseGate(3, { quadLSI: 78 }).allMet).toBe(false)
  })

  it('gates the RTS phase on the full battery AND the 9-month time-gate', () => {
    expect(evaluatePhaseGate(5, { rtsHardMet: true, monthsSinceIndex: 10 }).allMet).toBe(true)
    expect(evaluatePhaseGate(5, { rtsHardMet: true, monthsSinceIndex: 7 }).allMet).toBe(false)
    expect(evaluatePhaseGate(5, { rtsHardMet: false, monthsSinceIndex: 12 }).allMet).toBe(false)
  })

  it('does not satisfy a gate from unknown (null) checks', () => {
    expect(evaluatePhaseGate(2, {}).allMet).toBe(false)
  })
})

describe('ACL registry + pathway wiring', () => {
  it('registers the three field tests as MSK performance measures', () => {
    for (const id of ['QuadLSI', 'HopBattery', 'LESS']) {
      expect(MEASURES[id].domains).toEqual(['msk'])
      expect(MEASURES[id].category).toBe('performance')
    }
    expect(MEASURES.QuadLSI.higherIsBetter).toBe(true)
    expect(MEASURES.LESS.higherIsBetter).toBe(false)
  })

  it('adds the field tests to the ACL reconstruction pathway', () => {
    expect(DIAG_RECS['Knee — ACL Reconstruction']).toEqual(
      expect.arrayContaining(['QuadLSI', 'HopBattery', 'LESS'])
    )
  })
})

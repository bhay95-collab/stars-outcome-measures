// ACL clinical signs (gate criteria) — full active knee extension and effusion
// trace–zero on the modified stroke test (Sturgill 2009). Two clinician-judged
// booleans, persisted as assessments so the phase gates and RTS battery read
// the latest recorded signs.

const { calcACLSigns, signsFromResults } = require('../lib/clinical/aclSigns')
const { MEASURES } = require('../lib/clinical/measures')
const { DIAG_RECS } = require('../lib/clinical/constants')

describe('calcACLSigns', () => {
  it('meets the gate when both signs are settled', () => {
    const r = calcACLSigns({ fullExtension: true, effusionTraceToZero: true })
    expect(r.meta.gateMet).toBe(true)
    expect(r.meta.classColor).toBe('green')
    expect(r.primaryValue).toBe(2)
  })

  it('does not meet the gate when either sign is outstanding', () => {
    const noExtension = calcACLSigns({ fullExtension: false, effusionTraceToZero: true })
    expect(noExtension.meta.gateMet).toBe(false)
    expect(noExtension.meta.classColor).toBe('amber')
    expect(noExtension.primaryValue).toBe(1)

    const effused = calcACLSigns({ fullExtension: true, effusionTraceToZero: false })
    expect(effused.meta.gateMet).toBe(false)
    expect(effused.primaryValue).toBe(1)

    const neither = calcACLSigns({ fullExtension: false, effusionTraceToZero: false })
    expect(neither.meta.classColor).toBe('red')
    expect(neither.primaryValue).toBe(0)
  })

  it('rejects non-boolean inputs', () => {
    expect(calcACLSigns({ fullExtension: null, effusionTraceToZero: true })).toBeNull()
    expect(calcACLSigns({ fullExtension: true })).toBeNull()
    expect(calcACLSigns({})).toBeNull()
  })

  it('describes both signs in the interpretation', () => {
    const r = calcACLSigns({ fullExtension: true, effusionTraceToZero: false })
    expect(r.interpretation).toMatch(/extension/i)
    expect(r.interpretation).toMatch(/effusion/i)
  })
})

describe('signsFromResults', () => {
  it('derives gate inputs from a stored assessment results object', () => {
    const stored = calcACLSigns({ fullExtension: true, effusionTraceToZero: true })
    expect(signsFromResults(stored)).toEqual({ fullExtension: true, effusionTraceToZero: true })
  })

  it('still reads rows saved by the earlier graded-effusion version', () => {
    const legacy = {
      primaryValue: 1,
      meta: { fullExtension: true, effusionGrade: 'trace', effusionTraceToZero: true, gateMet: true },
    }
    expect(signsFromResults(legacy)).toEqual({ fullExtension: true, effusionTraceToZero: true })
  })

  it('returns unknown (nulls) when nothing is recorded', () => {
    expect(signsFromResults(null)).toEqual({ fullExtension: null, effusionTraceToZero: null })
    expect(signsFromResults({})).toEqual({ fullExtension: null, effusionTraceToZero: null })
  })
})

describe('ACLSigns registry + pathway wiring', () => {
  it('registers ACLSigns as an MSK measure charting signs met out of 2', () => {
    const m = MEASURES.ACLSigns
    expect(m).toBeDefined()
    expect(m.domains).toEqual(['msk'])
    expect(m.higherIsBetter).toBe(true)
    expect(m.chart.yMax).toBe(2)
  })

  it('adds ACLSigns to the ACL reconstruction pathway recommendations', () => {
    expect(DIAG_RECS['Knee — ACL Reconstruction']).toEqual(
      expect.arrayContaining(['ACLSigns'])
    )
  })
})

// ACL clinical signs (gate criteria) — full active knee extension and effusion
// graded on the modified stroke test (Sturgill 2009). These are the persisted
// source for the phase-1/2 gate checks and the RTS battery effusion criterion.

const { calcACLSigns, signsFromResults, EFFUSION_GRADES } = require('../lib/clinical/aclSigns')
const { MEASURES } = require('../lib/clinical/measures')
const { DIAG_RECS } = require('../lib/clinical/constants')

describe('calcACLSigns', () => {
  it('passes the effusion gate at zero and trace grades (modified stroke test)', () => {
    for (const grade of ['zero', 'trace']) {
      const r = calcACLSigns({ fullExtension: true, effusionGrade: grade })
      expect(r.meta.effusionTraceToZero).toBe(true)
      expect(r.meta.gateMet).toBe(true)
      expect(r.meta.classColor).toBe('green')
    }
  })

  it('fails the effusion gate at 1+, 2+ and 3+', () => {
    for (const grade of ['1+', '2+', '3+']) {
      const r = calcACLSigns({ fullExtension: true, effusionGrade: grade })
      expect(r.meta.effusionTraceToZero).toBe(false)
      expect(r.meta.gateMet).toBe(false)
    }
  })

  it('requires full active extension for the combined gate', () => {
    const r = calcACLSigns({ fullExtension: false, effusionGrade: 'zero' })
    expect(r.meta.gateMet).toBe(false)
    expect(r.meta.fullExtension).toBe(false)
  })

  it('scores the effusion grade ordinally (zero=0 … 3+=4, lower is better)', () => {
    expect(calcACLSigns({ fullExtension: true, effusionGrade: 'zero' }).primaryValue).toBe(0)
    expect(calcACLSigns({ fullExtension: true, effusionGrade: 'trace' }).primaryValue).toBe(1)
    expect(calcACLSigns({ fullExtension: true, effusionGrade: '3+' }).primaryValue).toBe(4)
  })

  it('rejects missing or unknown inputs', () => {
    expect(calcACLSigns({ fullExtension: true, effusionGrade: 'huge' })).toBeNull()
    expect(calcACLSigns({ fullExtension: null, effusionGrade: 'zero' })).toBeNull()
    expect(calcACLSigns({})).toBeNull()
  })

  it('describes both signs in the interpretation', () => {
    const r = calcACLSigns({ fullExtension: true, effusionGrade: 'trace' })
    expect(r.interpretation).toMatch(/extension/i)
    expect(r.interpretation).toMatch(/effusion/i)
  })

  it('exposes the five published modified stroke test grades', () => {
    expect(EFFUSION_GRADES.map(g => g.value)).toEqual(['zero', 'trace', '1+', '2+', '3+'])
  })
})

describe('signsFromResults', () => {
  it('derives gate inputs from a stored assessment results object', () => {
    const stored = calcACLSigns({ fullExtension: true, effusionGrade: 'trace' })
    expect(signsFromResults(stored)).toEqual({ fullExtension: true, effusionTraceToZero: true })
  })

  it('returns unknown (nulls) when nothing is recorded', () => {
    expect(signsFromResults(null)).toEqual({ fullExtension: null, effusionTraceToZero: null })
    expect(signsFromResults({})).toEqual({ fullExtension: null, effusionTraceToZero: null })
  })
})

describe('ACLSigns registry + pathway wiring', () => {
  it('registers ACLSigns as an MSK measure with a 0–4 effusion chart', () => {
    const m = MEASURES.ACLSigns
    expect(m).toBeDefined()
    expect(m.domains).toEqual(['msk'])
    expect(m.higherIsBetter).toBe(false)
    expect(m.chart.yMax).toBe(4)
  })

  it('adds ACLSigns to the ACL reconstruction pathway recommendations', () => {
    expect(DIAG_RECS['Knee — ACL Reconstruction']).toEqual(
      expect.arrayContaining(['ACLSigns'])
    )
  })
})

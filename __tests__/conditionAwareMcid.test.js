// Condition-aware MCID engine — verifies neuro thresholds move with the
// patient's diagnosis and stay accurate to the published literature cited in
// lib/clinical/mcid.js. Defaults must remain unchanged for backward compat.

const { getMCIDStatus, resolveMCIDEntry } = require('../lib/clinical/mcid')
const { buildPatientSummary } = require('../lib/clinical/patientSummary')

function tugAssessment(time, createdAt) {
  return {
    id: `tug-${createdAt}`,
    measure: 'TUG',
    created_at: createdAt,
    results: { primaryValue: time, primaryUnit: 'sec', meta: {} },
  }
}

describe('resolveMCIDEntry condition overrides', () => {
  it('returns the default entry when no condition is supplied', () => {
    const entry = resolveMCIDEntry('tug')
    expect(entry.thresh).toBe(2.0)
    expect(entry.thresholdType).toBeUndefined()
  })

  it('merges the per-condition override onto the default', () => {
    const entry = resolveMCIDEntry('tug', 'PD')
    expect(entry.thresh).toBe(3.5)
    expect(entry.thresholdType).toBe('mdc')
    expect(entry.unit).toBe('sec') // inherited from the default
  })

  it('matches condition keys case-insensitively', () => {
    expect(resolveMCIDEntry('tug', 'stroke').thresh).toBe(2.9)
    expect(resolveMCIDEntry('tug', '  STROKE ').thresh).toBe(2.9)
  })

  it('falls back to the default for an unlisted condition', () => {
    expect(resolveMCIDEntry('tug', 'Achilles Tendinopathy').thresh).toBe(2.0)
  })
})

describe('TUG — measurement-error floor by condition (Flansbjer 2005 / Huang 2011 / Lam 2007)', () => {
  it('counts a 2 s gain as meaningful with the generic default', () => {
    const status = getMCIDStatus('tug', 10, 12) // 2 s faster
    expect(status.meetsThreshold).toBe(true)
  })

  it('treats the same 2 s gain as within measurement error in stroke', () => {
    const status = getMCIDStatus('tug', 10, 12, 'Stroke') // < 2.9 s MDC
    expect(status.meetsThreshold).toBe(false)
    expect(status.label).toContain('within measurement error')
  })

  it('flags a 4 s stroke gain as beyond measurement error, not "MCID met"', () => {
    const status = getMCIDStatus('tug', 8, 12, 'Stroke') // 4 s ≥ 2.9 MDC
    expect(status.meetsThreshold).toBe(true)
    expect(status.label).toContain('beyond measurement error')
    expect(status.label).not.toContain('MCID met')
  })

  it('uses the larger 3.5 s floor for Parkinson’s', () => {
    expect(getMCIDStatus('tug', 9, 12, 'PD').meetsThreshold).toBe(false) // 3 s < 3.5
    expect(getMCIDStatus('tug', 8, 12, 'PD').meetsThreshold).toBe(true)  // 4 s ≥ 3.5
  })
})

describe('10MWT — condition-specific MCID and MDC (Perera/Tilson/Steffen/Lam)', () => {
  it('keeps the 0.06 m/s stroke/default small-change threshold', () => {
    expect(getMCIDStatus('10mwt-comfort', 0.90, 0.82).meetsThreshold).toBe(true) // +0.08 ≥ 0.06
  })

  it('requires a larger change in Parkinson’s and reports the MDC caveat', () => {
    const small = getMCIDStatus('10mwt-comfort', 0.90, 0.82, 'PD') // +0.08 < 0.10 thresh, < 0.18 MDC
    expect(small.meetsThreshold).toBe(false)
    expect(small.label).toContain('within measurement error')

    const large = getMCIDStatus('10mwt-comfort', 1.00, 0.82, 'PD') // +0.18 ≥ 0.10 and ≥ 0.18 MDC
    expect(large.meetsThreshold).toBe(true)
    expect(large.label).toContain('MCID met')
  })
})

describe('6MWT — stroke 50 m vs generic 25 m (Perera 2006)', () => {
  it('meets the generic 25 m default but not the stroke 50 m threshold for a 40 m gain', () => {
    expect(getMCIDStatus('6mwt', 240, 200).meetsThreshold).toBe(true)            // +40 ≥ 25
    expect(getMCIDStatus('6mwt', 240, 200, 'Stroke').meetsThreshold).toBe(false) // +40 < 50
  })
})

describe('ABC — MS lowers the bar to 10.5 (Monjezi 2021)', () => {
  it('meets the MS threshold but not the vestibular default for a 12-point gain', () => {
    expect(getMCIDStatus('abc', 80, 68, 'MS').meetsThreshold).toBe(true)  // +12 ≥ 10.5
    expect(getMCIDStatus('abc', 80, 68).meetsThreshold).toBe(false)       // +12 < 18.1
  })
})

describe('buildPatientSummary threads the patient condition into MCID', () => {
  const assessments = [tugAssessment(12, '2026-01-01T10:00:00Z'), tugAssessment(10, '2026-02-01T10:00:00Z')]

  it('does not over-call a 2 s TUG gain as MCID for a stroke patient', () => {
    const summary = buildPatientSummary({ id: 'p1', diagnosis: 'Stroke' }, assessments)
    const tug = summary.entries.find(entry => entry.measureId === 'TUG')
    expect(tug.mcid.meetsThreshold).toBe(false)
  })

  it('counts the same gain as meaningful for a patient without a neuro override', () => {
    const summary = buildPatientSummary({ id: 'p2', diagnosis: 'MSK — Other' }, assessments)
    const tug = summary.entries.find(entry => entry.measureId === 'TUG')
    expect(tug.mcid.meetsThreshold).toBe(true)
  })
})

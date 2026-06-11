import { MEASURES, MEASURE_IDS, MEASURE_DOMAINS, measureHasDomain } from '../lib/clinical/measures'
import { getMCIDStatus, resolveMCIDEntry, MCID_VALS } from '../lib/clinical/mcid'

describe('measure registry domains', () => {
  it('tags every measure with at least one valid domain', () => {
    for (const id of MEASURE_IDS) {
      const domains = MEASURES[id].domains
      expect(Array.isArray(domains)).toBe(true)
      expect(domains.length).toBeGreaterThan(0)
      for (const domain of domains) {
        expect(MEASURE_DOMAINS).toContain(domain)
      }
    }
  })

  it('keeps shared functional measures visible in both workspaces', () => {
    for (const id of ['10MWT', 'TUG', '6MWT', 'BBS', 'Barthel']) {
      expect(measureHasDomain(MEASURES[id], 'rehab')).toBe(true)
      expect(measureHasDomain(MEASURES[id], 'msk')).toBe(true)
    }
  })

  it('keeps neuro-specific measures out of the MSK domain', () => {
    for (const id of ['SARA', 'SCIM', 'ISNCSCI', 'PDQ8']) {
      expect(measureHasDomain(MEASURES[id], 'rehab')).toBe(true)
      expect(measureHasDomain(MEASURES[id], 'msk')).toBe(false)
    }
  })

  it('treats a missing domains field as visible everywhere', () => {
    const untagged = { id: 'X', name: 'Untagged' }
    expect(measureHasDomain(untagged, 'rehab')).toBe(true)
    expect(measureHasDomain(untagged, 'msk')).toBe(true)
  })

  it('never filters when domain is "all" or absent', () => {
    expect(measureHasDomain(MEASURES['SARA'], 'all')).toBe(true)
    expect(measureHasDomain(MEASURES['SARA'], undefined)).toBe(true)
  })
})

describe('registry-driven trend series (subscale migration parity)', () => {
  const { buildMeasureTrendSeries } = require('../lib/clinical/patientSummary')

  function record(measure, primaryValue, meta = {}, created_at = '2026-06-01') {
    return { measure, created_at, results: { primaryValue, meta } }
  }

  it('keeps the HADS anxiety + depression series identical to the old special case', () => {
    const groups = { HADS: [record('HADS', 9, { depressionScore: 6 })] }
    const series = buildMeasureTrendSeries(groups, 'HADS')
    expect(series.map(s => [s.key, s.label, s.unit, s.mcidKey])).toEqual([
      ['primary', 'Anxiety', '/21', null],
      ['depressionScore', 'Depression', '/21', 'hads-d'],
    ])
    expect(series[1].values[0].value).toBe(6)
  })

  it('keeps the SCIM subscale series', () => {
    const groups = { SCIM: [record('SCIM', 64, { sc: 12, rs: 28, mob: 24 })] }
    const labels = buildMeasureTrendSeries(groups, 'SCIM').map(s => s.label)
    expect(labels).toEqual(['Total score', 'Self-care', 'Respiration/sphincters', 'Mobility'])
  })

  it('keeps the TUG fast/dual-task series and drops empty ones', () => {
    const groups = { TUG: [record('TUG', 12.5, { fastTime: 10.1 })] }
    const series = buildMeasureTrendSeries(groups, 'TUG')
    expect(series.map(s => s.key)).toEqual(['primary', 'fastTime'])
    expect(series[0].label).toBe('Comfortable time')
  })

  it('keeps the 10MWT fast speed series with its MCID key', () => {
    const groups = { '10MWT': [record('10MWT', 0.82, { fastSpeed: 1.1 })] }
    const series = buildMeasureTrendSeries(groups, '10MWT')
    expect(series[1]).toMatchObject({ key: 'fastSpeed', label: 'Fast speed', mcidKey: '10mwt-fast' })
  })
})

describe('condition-aware MCID engine', () => {
  it('keeps the original three-argument call working unchanged', () => {
    // TUG: thresh 2.0 sec, lower is better
    const status = getMCIDStatus('tug', 10, 13)
    expect(status.improved).toBe(true)
    expect(status.meetsThreshold).toBe(true)
    expect(status.label).toContain('MCID met')
  })

  it('falls back to default values for unknown conditions', () => {
    const entry = resolveMCIDEntry('tug', 'No Such Condition')
    expect(entry.thresh).toBe(MCID_VALS['tug'].thresh)
  })

  it('applies condition-specific overrides when present', () => {
    const original = MCID_VALS['tug']
    MCID_VALS['tug'] = { ...original, byCondition: { 'PD': { thresh: 3.5 } } }
    try {
      // 3-second improvement: meets the 2.0 default but not the 3.5 PD override
      expect(getMCIDStatus('tug', 10, 13).meetsThreshold).toBe(true)
      expect(getMCIDStatus('tug', 10, 13, 'PD').meetsThreshold).toBe(false)
      expect(getMCIDStatus('tug', 9, 13, 'PD').meetsThreshold).toBe(true)
    } finally {
      MCID_VALS['tug'] = original
    }
  })

  it('distinguishes MDC from MCID when both are defined', () => {
    const original = MCID_VALS['tug']
    // Hypothetical entry where MCID (4) exceeds MDC (2)
    MCID_VALS['tug'] = { thresh: 4, unit: 'sec', hib: false, mdc: 2 }
    try {
      const beyondError = getMCIDStatus('tug', 10, 13) // 3 sec: > MDC, < MCID
      expect(beyondError.meetsThreshold).toBe(false)
      expect(beyondError.exceedsMDC).toBe(true)
      expect(beyondError.label).toContain('beyond measurement error')

      const withinError = getMCIDStatus('tug', 12, 13) // 1 sec: < MDC
      expect(withinError.exceedsMDC).toBe(false)
      expect(withinError.label).toContain('within measurement error')

      const mcidMet = getMCIDStatus('tug', 8, 13) // 5 sec: > MCID
      expect(mcidMet.meetsThreshold).toBe(true)
      expect(mcidMet.label).toContain('MCID met')
    } finally {
      MCID_VALS['tug'] = original
    }
  })

  it('reports null exceedsMDC when no MDC is published', () => {
    const status = getMCIDStatus('tug', 12, 13)
    expect(status.exceedsMDC).toBeNull()
    expect(status.label).toContain('below MCID')
  })
})

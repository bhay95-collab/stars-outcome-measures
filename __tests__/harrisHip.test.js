// Harris Hip Score (Harris 1969) — clinician-administered composite, 0–100.
// Pain /44 + function /47 (gait 33 + activities 14) + absence of deformity /4
// (all-or-nothing) + ROM /5 (simplified total-arc bands). Bands: <70 poor,
// 70–79 fair, 80–89 good, 90–100 excellent. MCID post-THA ≈16 (Singh 2016).

const {
  calcHHS,
  HHS_PAIN_OPTIONS,
  HHS_DEFORMITY_CRITERIA,
  HHS_ROM_FIELDS,
} = require('../lib/clinical/harrisHip')
const { MEASURES } = require('../lib/clinical/measures')
const { DIAG_RECS } = require('../lib/clinical/constants')
const { MCID_VALS } = require('../lib/clinical/mcid')

const PERFECT = {
  pain: 44,
  limp: 11,
  support: 11,
  distance: 11,
  stairs: 4,
  shoesSocks: 4,
  sitting: 5,
  transport: 1,
  deformity: { flexionContracture: true, adduction: true, internalRotation: true, legLength: true },
  rom: { flexion: 140, abduction: 40, adduction: 40, externalRotation: 40, internalRotation: 40 },
}

describe('calcHHS', () => {
  it('scores a perfect assessment 100/100 (excellent)', () => {
    const r = calcHHS(PERFECT)
    expect(r.primaryValue).toBe(100)
    expect(r.primaryUnit).toBe('/100')
    expect(r.interpretation).toMatch(/excellent/i)
    expect(r.meta.classColor).toBe('green')
  })

  it('sums a mixed vignette correctly', () => {
    // Pain moderate 20, slight limp 8, cane long walks 7, six blocks 8,
    // stairs with railing 2, shoes with difficulty 2, sitting 1hr 5,
    // transport able 1 = 53; deformity all clear +4; ROM 190° total +4 → 61.
    const r = calcHHS({
      ...PERFECT,
      pain: 20, limp: 8, support: 7, distance: 8,
      stairs: 2, shoesSocks: 2, sitting: 5, transport: 1,
      rom: { flexion: 110, abduction: 30, adduction: 20, externalRotation: 15, internalRotation: 15 },
    })
    expect(r.primaryValue).toBe(61)
    expect(r.interpretation).toMatch(/poor/i)
  })

  it('awards the 4 deformity points only when ALL four criteria are met (Harris 1969)', () => {
    const allClear = calcHHS(PERFECT)
    const oneFailed = calcHHS({
      ...PERFECT,
      deformity: { ...PERFECT.deformity, adduction: false },
    })
    expect(allClear.primaryValue - oneFailed.primaryValue).toBe(4)
    expect(oneFailed.meta.deformityPoints).toBe(0)
  })

  it('scores ROM by total-arc bands (211–300°=5 … 0–30°=0)', () => {
    const withRomTotal = (flexion) => calcHHS({
      ...PERFECT,
      rom: { flexion, abduction: 0, adduction: 0, externalRotation: 0, internalRotation: 0 },
    }).meta.romPoints
    expect(withRomTotal(30)).toBe(0)
    expect(withRomTotal(31)).toBe(1)
    expect(withRomTotal(61)).toBe(2)
    expect(withRomTotal(101)).toBe(3)
    expect(withRomTotal(140)).toBe(3) // 140° total sits in the 101–160 band
    const total210 = calcHHS({ ...PERFECT, rom: { flexion: 140, abduction: 40, adduction: 30, externalRotation: 0, internalRotation: 0 } })
    expect(total210.meta.romPoints).toBe(4)
    const total211 = calcHHS({ ...PERFECT, rom: { flexion: 140, abduction: 40, adduction: 31, externalRotation: 0, internalRotation: 0 } })
    expect(total211.meta.romPoints).toBe(5)
  })

  it('classifies the published bands: <70 poor, 70–79 fair, 80–89 good, 90–100 excellent', () => {
    const withPain = (pain) => calcHHS({ ...PERFECT, pain })
    expect(withPain(44).interpretation).toMatch(/excellent/i) // 100
    expect(withPain(30).interpretation).toMatch(/good/i)      // 86
    expect(withPain(20).interpretation).toMatch(/fair/i)      // 76
    expect(withPain(10).interpretation).toMatch(/poor/i)      // 66
  })

  it('rejects values that are not published option scores or valid ROM degrees', () => {
    expect(calcHHS({ ...PERFECT, pain: 43 })).toBeNull()
    expect(calcHHS({ ...PERFECT, limp: 9 })).toBeNull()
    expect(calcHHS({ ...PERFECT, rom: { ...PERFECT.rom, flexion: 200 } })).toBeNull()
    expect(calcHHS({ ...PERFECT, rom: { ...PERFECT.rom, flexion: -5 } })).toBeNull()
    expect(calcHHS({ ...PERFECT, deformity: { ...PERFECT.deformity, legLength: null } })).toBeNull()
    expect(calcHHS({})).toBeNull()
  })

  it('exposes the published option sets and criteria', () => {
    expect(HHS_PAIN_OPTIONS.map(o => o.value)).toEqual([44, 40, 30, 20, 10, 0])
    expect(HHS_DEFORMITY_CRITERIA).toHaveLength(4)
    expect(HHS_ROM_FIELDS.map(f => f.key)).toEqual(['flexion', 'abduction', 'adduction', 'externalRotation', 'internalRotation'])
  })

  it('reports the domain breakdown in meta', () => {
    const r = calcHHS(PERFECT)
    expect(r.meta.painPoints).toBe(44)
    expect(r.meta.gaitPoints).toBe(33)
    expect(r.meta.activityPoints).toBe(14)
    expect(r.meta.deformityPoints).toBe(4)
    expect(r.meta.romPoints).toBe(5)
  })
})

describe('HHS registry + pathway + MCID wiring', () => {
  it('registers HHS as an MSK /100 measure with four band zones', () => {
    const m = MEASURES.HHS
    expect(m).toBeDefined()
    expect(m.domains).toEqual(['msk'])
    expect(m.higherIsBetter).toBe(true)
    expect(m.primaryUnit).toBe('/100')
    expect(m.mcidKey).toBe('hhs')
    expect(m.chart.thresholds).toHaveLength(4)
  })

  it('adds HHS to the Hip — OA / Replacement pathway', () => {
    expect(DIAG_RECS['Hip — OA / Replacement']).toEqual(expect.arrayContaining(['HHS']))
  })

  it('uses the Singh 2016 post-THA MCID (~16 points)', () => {
    expect(MCID_VALS.hhs).toEqual({ thresh: 16, unit: 'pts', hib: true })
  })
})

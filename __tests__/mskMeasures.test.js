import { calcNPRS } from '../lib/clinical/nprs'
import { calcPSFS, getPreviousPSFSActivities } from '../lib/clinical/psfs'
import { calcLEFS } from '../lib/clinical/lefs'
import { calcBPFS } from '../lib/clinical/bpfs'

describe('calcNPRS', () => {
  it('scores and bands pain ratings', () => {
    expect(calcNPRS({ score: 0 })).toMatchObject({ primaryValue: 0, primaryUnit: '/10', interpretation: 'No pain' })
    expect(calcNPRS({ score: 2 }).meta.classColor).toBe('green')
    expect(calcNPRS({ score: 5 }).interpretation).toBe('Moderate pain (4–6)')
    expect(calcNPRS({ score: 5 }).meta.classColor).toBe('amber')
    expect(calcNPRS({ score: 8 }).interpretation).toBe('Severe pain (7–10)')
    expect(calcNPRS({ score: 8 }).meta.classColor).toBe('red')
  })

  it('records the rating context', () => {
    expect(calcNPRS({ score: 4, context: 'worst24h' }).meta.contextLabel).toBe('Worst over last 24 hours')
    expect(calcNPRS({ score: 4 }).meta.context).toBe('current')
  })

  it('rejects out-of-range or non-integer scores', () => {
    expect(calcNPRS({ score: -1 })).toBeNull()
    expect(calcNPRS({ score: 11 })).toBeNull()
    expect(calcNPRS({ score: 4.5 })).toBeNull()
    expect(calcNPRS({ score: 'bad' })).toBeNull()
  })
})

describe('calcPSFS', () => {
  const activities = [
    { name: 'Lifting my child', score: 3 },
    { name: 'Walking the dog', score: 5 },
    { name: 'Sitting through a movie', score: 4 },
  ]

  it('averages nominated activity scores', () => {
    const result = calcPSFS({ activities })
    expect(result.primaryValue).toBe(4)
    expect(result.primaryUnit).toBe('/10')
    expect(result.meta.activities).toHaveLength(3)
  })

  it('rounds the mean to one decimal place', () => {
    const result = calcPSFS({ activities: [{ name: 'A', score: 3 }, { name: 'B', score: 4 }, { name: 'C', score: 4 }] })
    expect(result.primaryValue).toBe(3.7)
  })

  it('uses a neutral colour — no invented severity bands', () => {
    expect(calcPSFS({ activities }).meta.classColor).toBe('grey')
  })

  it('rejects invalid input', () => {
    expect(calcPSFS({ activities: [] })).toBeNull()
    expect(calcPSFS({ activities: Array(6).fill({ name: 'A', score: 5 }) })).toBeNull()
    expect(calcPSFS({ activities: [{ name: '  ', score: 5 }] })).toBeNull()
    expect(calcPSFS({ activities: [{ name: 'A', score: 11 }] })).toBeNull()
    expect(calcPSFS({ activities: [{ name: 'A', score: 2.5 }] })).toBeNull()
  })

  it('trims activity names in the saved meta', () => {
    const result = calcPSFS({ activities: [{ name: '  Gardening  ', score: 6 }] })
    expect(result.meta.activities[0].name).toBe('Gardening')
  })
})

describe('calcLEFS', () => {
  it('sums 20 items to /80 with percent of maximal function', () => {
    const result = calcLEFS({ items: Array(20).fill(3) })
    expect(result.primaryValue).toBe(60)
    expect(result.primaryUnit).toBe('/80')
    expect(result.meta.percentMax).toBe(75)
    expect(result.interpretation).toBe('75% of maximal function')
  })

  it('handles floor and ceiling', () => {
    expect(calcLEFS({ items: Array(20).fill(0) }).primaryValue).toBe(0)
    expect(calcLEFS({ items: Array(20).fill(4) }).primaryValue).toBe(80)
  })

  it('requires all 20 items with integer scores 0–4', () => {
    expect(calcLEFS({ items: Array(19).fill(2) })).toBeNull()
    expect(calcLEFS({ items: [...Array(19).fill(2), 5] })).toBeNull()
    expect(calcLEFS({ items: [...Array(19).fill(2), 2.5] })).toBeNull()
    expect(calcLEFS({ items: [...Array(19).fill(2), NaN] })).toBeNull()
  })
})

describe('calcBPFS', () => {
  it('sums 12 items to /60 with percent of maximal function', () => {
    const result = calcBPFS({ items: Array(12).fill(3) })
    expect(result.primaryValue).toBe(36)
    expect(result.primaryUnit).toBe('/60')
    expect(result.meta.percentMax).toBe(60)
  })

  it('handles floor and ceiling', () => {
    expect(calcBPFS({ items: Array(12).fill(0) }).primaryValue).toBe(0)
    expect(calcBPFS({ items: Array(12).fill(5) }).primaryValue).toBe(60)
  })

  it('requires all 12 items with integer scores 0–5', () => {
    expect(calcBPFS({ items: Array(11).fill(3) })).toBeNull()
    expect(calcBPFS({ items: [...Array(11).fill(3), 6] })).toBeNull()
    expect(calcBPFS({ items: [...Array(11).fill(3), -1] })).toBeNull()
  })
})

describe('KOOS/HOOS scoring engine', () => {
  const { scoreKoosSubscale } = require('../lib/clinical/koosFamily')
  const { calcKOOS, KOOS_SECTIONS } = require('../lib/clinical/koos')
  const { calcHOOS, HOOS_SECTIONS } = require('../lib/clinical/hoos')

  function fullItems(sections, value) {
    const items = {}
    for (const section of sections) items[section.key] = Array(section.items.length).fill(value)
    return items
  }

  it('transforms item means to the inverted 0–100 scale', () => {
    // all 0 (best) → 100; all 4 (worst) → 0; all 2 → 50
    expect(scoreKoosSubscale(Array(9).fill(0), 9).score).toBe(100)
    expect(scoreKoosSubscale(Array(9).fill(4), 9).score).toBe(0)
    expect(scoreKoosSubscale(Array(9).fill(2), 9).score).toBe(50)
  })

  it('tolerates up to 2 missing items via mean of answered items', () => {
    // 7 answered at 2, 2 missing → mean 2 → score 50 (mean substitution equivalent)
    const values = [2, 2, 2, 2, 2, 2, 2, null, null]
    expect(scoreKoosSubscale(values, 9)).toEqual({ score: 50, missing: 2 })
  })

  it('refuses to score a subscale with more than 2 missing items', () => {
    const values = [2, 2, 2, 2, 2, 2, null, null, null]
    expect(scoreKoosSubscale(values, 9)).toEqual({ score: null, missing: 3 })
  })

  it('rejects structurally invalid values', () => {
    expect(scoreKoosSubscale([5, 2, 2], 3)).toBeNull()
    expect(scoreKoosSubscale([2, 2], 3)).toBeNull()
  })

  it('scores all five KOOS subscales independently with no total', () => {
    const result = calcKOOS({ items: fullItems(KOOS_SECTIONS, 1) })
    expect(result.primaryValue).toBe(75) // Pain
    expect(result.meta.symptoms).toBe(75)
    expect(result.meta.adl).toBe(75)
    expect(result.meta.sport).toBe(75)
    expect(result.meta.qol).toBe(75)
    expect(result.interpretation).toContain('100 = no problems')
    expect(result.meta.total).toBeUndefined()
  })

  it('returns null when the Pain subscale cannot be scored', () => {
    const items = fullItems(KOOS_SECTIONS, 1)
    items.pain = Array(9).fill(null)
    expect(calcKOOS({ items })).toBeNull()
  })

  it('leaves an individual non-pain subscale null when too many items are missing', () => {
    const items = fullItems(KOOS_SECTIONS, 1)
    items.sport = [1, 1, null, null, null]
    const result = calcKOOS({ items })
    expect(result.primaryValue).toBe(75)
    expect(result.meta.sport).toBeNull()
    expect(result.interpretation).toContain('Sport/Rec —')
  })

  it('scores HOOS with its own section lengths (10 pain items)', () => {
    expect(HOOS_SECTIONS.find(s => s.key === 'pain').items).toHaveLength(10)
    expect(HOOS_SECTIONS.reduce((n, s) => n + s.items.length, 0)).toBe(40)
    expect(KOOS_SECTIONS.reduce((n, s) => n + s.items.length, 0)).toBe(42)
    const result = calcHOOS({ items: fullItems(HOOS_SECTIONS, 3) })
    expect(result.primaryValue).toBe(25)
  })
})

describe('calcFAAM', () => {
  const { calcFAAM } = require('../lib/clinical/faam')

  it('scores both subscales as percentages', () => {
    const result = calcFAAM({ adl: Array(21).fill(4), sport: Array(8).fill(2) })
    expect(result.primaryValue).toBe(100)
    expect(result.meta.sport).toBe(50)
    expect(result.primaryUnit).toBe('%')
  })

  it('excludes N/A responses from numerator and denominator', () => {
    // 19 numeric at 2 + 2 N/A → 19×2 / (4×19) = 50%
    const adl = [...Array(19).fill(2), 'na', 'na']
    expect(calcFAAM({ adl, sport: Array(8).fill(null) }).primaryValue).toBe(50)
  })

  it('refuses ADL with fewer than 19 responses', () => {
    const adl = [...Array(18).fill(3), null, null, null]
    expect(calcFAAM({ adl, sport: Array(8).fill(null) })).toBeNull()
  })

  it('treats a fully skipped Sports subscale as not administered', () => {
    const result = calcFAAM({ adl: Array(21).fill(4), sport: Array(8).fill(null) })
    expect(result.meta.sport).toBeNull()
    expect(result.meta.classColor).toBe('green')
  })

  it('leaves Sports unscored below its validity floor without blocking ADL', () => {
    const sport = [3, 3, null, null, null, null, null, null]
    const result = calcFAAM({ adl: Array(21).fill(4), sport })
    expect(result.primaryValue).toBe(100)
    expect(result.meta.sport).toBeNull()
  })

  it('flags the CAI functional deficit range', () => {
    const result = calcFAAM({ adl: Array(21).fill(3), sport: Array(8).fill(3) })
    // ADL 75% (<90), Sport 75% (<80)
    expect(result.meta.classColor).toBe('amber')
    expect(result.interpretation).toContain('functional deficit')
  })

  it('labels FAAM Sports changes between MCID and MDC with the measurement-error caveat', () => {
    const { getMCIDStatus } = require('../lib/clinical/mcid')
    const status = getMCIDStatus('faam-sport', 70, 60) // +10: ≥ MCID 9, < MDC 12.3
    expect(status.meetsThreshold).toBe(true)
    expect(status.exceedsMDC).toBe(false)
    expect(status.label).toContain('within measurement error')
  })
})

describe('getPreviousPSFSActivities', () => {
  it('returns activities from the most recent PSFS assessment (list is newest first)', () => {
    const assessments = [
      { measure: 'TUG', created_at: '2026-06-10', inputs: { time: 12 } },
      { measure: 'PSFS', created_at: '2026-06-01', inputs: { activities: [{ name: 'Running', score: 4 }] } },
      { measure: 'PSFS', created_at: '2026-05-01', inputs: { activities: [{ name: 'Old activity', score: 2 }] } },
    ]
    const previous = getPreviousPSFSActivities(assessments)
    expect(previous).toEqual([{ name: 'Running', score: 4 }])
  })

  it('returns null when the patient has no PSFS history', () => {
    expect(getPreviousPSFSActivities([{ measure: 'TUG', inputs: {} }])).toBeNull()
    expect(getPreviousPSFSActivities([])).toBeNull()
    expect(getPreviousPSFSActivities()).toBeNull()
  })
})

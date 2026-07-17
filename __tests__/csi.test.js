// Central Sensitization Inventory (CSI) — Mayer 2012; severity bands Neblett 2013.
// 25 items, each 0–4, summed 0–100. Higher = worse. Part B (10 items) is
// informational diagnosis history and must never affect the score.

const { calcCSI, CSI_ITEMS, CSI_PART_B_ITEMS } = require('../lib/clinical/csi')
const { MEASURES } = require('../lib/clinical/measures')

const ALL_ZERO = Array(25).fill(0)
const ALL_MAX = Array(25).fill(4)

describe('calcCSI', () => {
  it('scores all-zero responses as 0/100, subclinical', () => {
    const r = calcCSI({ items: ALL_ZERO })
    expect(r.primaryValue).toBe(0)
    expect(r.primaryUnit).toBe('/100')
    expect(r.interpretation).toMatch(/subclinical/i)
    expect(r.meta.meetsCutoff).toBe(false)
    expect(r.meta.classColor).toBe('green')
  })

  it('scores all-max responses as 100/100, extreme', () => {
    const r = calcCSI({ items: ALL_MAX })
    expect(r.primaryValue).toBe(100)
    expect(r.interpretation).toMatch(/extreme/i)
    expect(r.meta.meetsCutoff).toBe(true)
    expect(r.meta.classColor).toBe('red')
  })

  it('classifies each severity band boundary correctly (Neblett 2013)', () => {
    const scoreOf = total => {
      const items = Array(25).fill(0)
      let remaining = total
      for (let i = 0; i < items.length && remaining > 0; i++) {
        const add = Math.min(4, remaining)
        items[i] = add
        remaining -= add
      }
      return items
    }

    expect(calcCSI({ items: scoreOf(29) }).interpretation).toMatch(/subclinical/i)
    expect(calcCSI({ items: scoreOf(30) }).interpretation).toMatch(/mild/i)
    expect(calcCSI({ items: scoreOf(39) }).interpretation).toMatch(/mild/i)
    expect(calcCSI({ items: scoreOf(40) }).interpretation).toMatch(/moderate/i)
    expect(calcCSI({ items: scoreOf(49) }).interpretation).toMatch(/moderate/i)
    expect(calcCSI({ items: scoreOf(50) }).interpretation).toMatch(/severe/i)
    expect(calcCSI({ items: scoreOf(59) }).interpretation).toMatch(/severe/i)
    expect(calcCSI({ items: scoreOf(60) }).interpretation).toMatch(/extreme/i)
  })

  it('flags the >=40 clinical cutoff independently of the band label', () => {
    const scoreOf = total => {
      const items = Array(25).fill(0)
      let remaining = total
      for (let i = 0; i < items.length && remaining > 0; i++) {
        const add = Math.min(4, remaining)
        items[i] = add
        remaining -= add
      }
      return items
    }
    expect(calcCSI({ items: scoreOf(39) }).meta.meetsCutoff).toBe(false)
    expect(calcCSI({ items: scoreOf(40) }).meta.meetsCutoff).toBe(true)
  })

  it('carries Part B through unscored — identical Part A totals regardless of Part B answers', () => {
    const withNoHistory = calcCSI({ items: ALL_ZERO, partB: Array(10).fill(false) })
    const withAllHistory = calcCSI({ items: ALL_ZERO, partB: Array(10).fill(true) })
    expect(withNoHistory.primaryValue).toBe(withAllHistory.primaryValue)
    expect(withAllHistory.meta.partB).toEqual(Array(10).fill(true))
  })

  it('defaults Part B to an empty array when omitted', () => {
    const r = calcCSI({ items: ALL_ZERO })
    expect(r.meta.partB).toEqual([])
  })

  it('rejects a wrong-length items array', () => {
    expect(calcCSI({ items: Array(24).fill(0) })).toBeNull()
    expect(calcCSI({ items: Array(26).fill(0) })).toBeNull()
  })

  it('rejects out-of-range or non-integer item values', () => {
    expect(calcCSI({ items: [...ALL_ZERO.slice(0, 24), 5] })).toBeNull()
    expect(calcCSI({ items: [...ALL_ZERO.slice(0, 24), -1] })).toBeNull()
    expect(calcCSI({ items: [...ALL_ZERO.slice(0, 24), 2.5] })).toBeNull()
  })

  it('has 25 Part A items and 10 Part B items, matching the published instrument', () => {
    expect(CSI_ITEMS).toHaveLength(25)
    expect(CSI_PART_B_ITEMS).toHaveLength(10)
  })
})

describe('CSI registry entry', () => {
  it('has no MCID/MDC key — none is published for this instrument', () => {
    expect(MEASURES.CSI.mcidKey).toBeNull()
  })

  it('is registered as a higher-is-worse, /100 questionnaire', () => {
    expect(MEASURES.CSI.primaryUnit).toBe('/100')
    expect(MEASURES.CSI.higherIsBetter).toBe(false)
    expect(MEASURES.CSI.category).toBe('questionnaire')
  })
})

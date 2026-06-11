// Wave 2 MSK measures — scoring, validation, directionality, MCID wiring, and
// follow-up eligibility. Values cite lib/clinical/cait.js and atrs.js headers.

const { calcCAIT, CAIT_ITEMS } = require('../lib/clinical/cait')
const { calcATRS, ATRS_ITEMS } = require('../lib/clinical/atrs')
const { calcFABQ, FABQ_ITEMS } = require('../lib/clinical/fabq')
const { getMCIDStatus } = require('../lib/clinical/mcid')
const { MEASURES } = require('../lib/clinical/measures')
const {
  FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS,
  getFollowUpQuestionnaire,
  validateFollowUpQuestionnaireAnswers,
} = require('../lib/followupQuestionnaires')

describe('calcCAIT', () => {
  // Max-per-item: [5,4,3,3,2,3,4,3,3] = 30
  const MAX_ITEMS = [5, 4, 3, 3, 2, 3, 4, 3, 3]

  it('sums to the 30-point ceiling for a fully stable ankle', () => {
    const result = calcCAIT({ items: MAX_ITEMS })
    expect(result.primaryValue).toBe(30)
    expect(result.meta.classColor).toBe('green')
    expect(result.interpretation).toContain('No functional instability')
  })

  it('bands the Hiller possible-instability range (25–27) as amber', () => {
    const result = calcCAIT({ items: [4, 4, 3, 3, 2, 3, 4, 3, 0] }) // 26
    expect(result.primaryValue).toBe(26)
    expect(result.meta.classColor).toBe('amber')
  })

  it('flags functional ankle instability (≤24) as red', () => {
    const result = calcCAIT({ items: [2, 2, 2, 2, 1, 2, 2, 2, 2] }) // 17
    expect(result.primaryValue).toBe(17)
    expect(result.meta.classColor).toBe('red')
    expect(result.interpretation).toContain('Functional ankle instability')
  })

  it('rejects out-of-range and wrong-length input', () => {
    expect(calcCAIT({ items: [6, 4, 3, 3, 2, 3, 4, 3, 3] })).toBeNull() // item 1 max is 5
    expect(calcCAIT({ items: [5, 4, 3] })).toBeNull()
    expect(calcCAIT({ items: Array(9).fill('x') })).toBeNull()
  })

  it('exposes 9 items', () => {
    expect(CAIT_ITEMS).toHaveLength(9)
  })
})

describe('calcATRS', () => {
  it('sums 10 items to a 0–100 score, higher = better', () => {
    expect(calcATRS({ items: Array(10).fill(10) }).primaryValue).toBe(100)
    expect(calcATRS({ items: Array(10).fill(0) }).primaryValue).toBe(0)
    expect(calcATRS({ items: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] }).primaryValue).toBe(55)
  })

  it('rejects out-of-range and wrong-length input', () => {
    expect(calcATRS({ items: Array(10).fill(11) })).toBeNull()
    expect(calcATRS({ items: Array(9).fill(5) })).toBeNull()
    expect(calcATRS({ items: [5.5, ...Array(9).fill(5)] })).toBeNull()
  })

  it('exposes 10 items', () => {
    expect(ATRS_ITEMS).toHaveLength(10)
  })
})

describe('calcFABQ', () => {
  const zeros = () => Array(16).fill(0)

  it('scores FABQ-PA from items 2–5 and FABQ-W from items 6,7,9,10,11,12,15', () => {
    const items = zeros()
    ;[1, 2, 3, 4].forEach(i => { items[i] = 6 })        // PA items 2–5 → 24
    const result = calcFABQ({ items })
    expect(result.primaryValue).toBe(24)                // FABQ-PA
    expect(result.meta.work).toBe(0)
    expect(result.meta.classColor).toBe('red')          // PA > 15
  })

  it('ignores the 5 distractor items (1, 8, 13, 14, 16)', () => {
    const items = zeros()
    ;[0, 7, 12, 13, 15].forEach(i => { items[i] = 6 })  // distractors only
    const result = calcFABQ({ items })
    expect(result.primaryValue).toBe(0)
    expect(result.meta.work).toBe(0)
    expect(result.meta.classColor).toBe('green')
  })

  it('flags a high FABQ-Work score (>34) as red', () => {
    const items = zeros()
    ;[5, 6, 8, 9, 10, 11, 14].forEach(i => { items[i] = 5 }) // W items → 35
    const result = calcFABQ({ items })
    expect(result.meta.work).toBe(35)
    expect(result.meta.classColor).toBe('red')
  })

  it('rejects out-of-range and wrong-length input', () => {
    expect(calcFABQ({ items: Array(16).fill(7) })).toBeNull()
    expect(calcFABQ({ items: Array(15).fill(0) })).toBeNull()
  })

  it('exposes 16 items', () => {
    expect(FABQ_ITEMS).toHaveLength(16)
  })
})

describe('Wave 2 registry + MCID wiring', () => {
  it('registers CAIT and ATRS as MSK questionnaires', () => {
    expect(MEASURES.CAIT.domains).toEqual(['msk'])
    expect(MEASURES.ATRS.domains).toEqual(['msk'])
    expect(MEASURES.CAIT.higherIsBetter).toBe(true)
    expect(MEASURES.ATRS.higherIsBetter).toBe(true)
  })

  it('registers FABQ as a higher-is-worse MSK questionnaire with a Work subscale', () => {
    expect(MEASURES.FABQ.domains).toEqual(['msk'])
    expect(MEASURES.FABQ.higherIsBetter).toBe(false)
    expect(MEASURES.FABQ.subscales[0].mcidKey).toBe('fabq-w')
  })

  it('labels a worsening FABQ-PA change (higher = worse) as a decline', () => {
    // FABQ higher = worse, so a decrease is improvement.
    const improved = getMCIDStatus('fabq-pa', 8, 16) // -8, beyond MDC 6
    expect(improved.improved).toBe(true)
    expect(improved.meetsThreshold).toBe(true)
    const worse = getMCIDStatus('fabq-pa', 16, 8) // +8, got worse
    expect(worse.improved).toBe(false)
    expect(worse.label).toContain('Declined')
  })

  it('treats a 3-point CAIT gain as meeting the change threshold', () => {
    expect(getMCIDStatus('cait', 27, 24).meetsThreshold).toBe(true)  // +3 ≥ 3
    expect(getMCIDStatus('cait', 26, 24).meetsThreshold).toBe(false) // +2 < 3
  })

  it('labels ATRS change against the measurement-error floor, not "MCID met"', () => {
    const big = getMCIDStatus('atrs', 70, 55) // +15 ≥ 10
    expect(big.meetsThreshold).toBe(true)
    expect(big.label).toContain('beyond measurement error')
    expect(big.label).not.toContain('MCID met')

    const small = getMCIDStatus('atrs', 60, 55) // +5 < 10
    expect(small.meetsThreshold).toBe(false)
    expect(small.label).toContain('within measurement error')
  })
})

describe('Wave 2 follow-up eligibility', () => {
  it('lists CAIT, ATRS, and FABQ as eligible patient questionnaires', () => {
    expect(FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS).toContain('CAIT')
    expect(FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS).toContain('ATRS')
    expect(FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS).toContain('FABQ')
  })

  it('builds and scores a FABQ follow-up questionnaire (16 items)', () => {
    expect(getFollowUpQuestionnaire('FABQ').questions).toHaveLength(16)
    const items = Array(16).fill(0)
    ;[1, 2, 3, 4].forEach(i => { items[i] = 6 })
    const { results, error } = validateFollowUpQuestionnaireAnswers('FABQ', { items })
    expect(error).toBeUndefined()
    expect(results.primaryValue).toBe(24)
  })

  it('builds a CAIT follow-up questionnaire with 9 questions', () => {
    const q = getFollowUpQuestionnaire('CAIT')
    expect(q.questions).toHaveLength(9)
  })

  it('scores valid CAIT follow-up answers', () => {
    const { results, error } = validateFollowUpQuestionnaireAnswers('CAIT', {
      items: [5, 4, 3, 3, 2, 3, 4, 3, 3],
    })
    expect(error).toBeUndefined()
    expect(results.primaryValue).toBe(30)
  })

  it('scores valid ATRS follow-up answers and rejects bad ones', () => {
    const ok = validateFollowUpQuestionnaireAnswers('ATRS', { items: Array(10).fill(8) })
    expect(ok.results.primaryValue).toBe(80)
    const bad = validateFollowUpQuestionnaireAnswers('ATRS', { items: Array(10).fill(99) })
    expect(bad.error).toBeTruthy()
  })
})

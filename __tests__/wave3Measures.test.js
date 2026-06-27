// Wave 3 MSK measures (HAGOS, OMAS) — scoring, missing-item / validation rules,
// directionality, MCID/MDC wiring, registry, pathway, and follow-up eligibility.
// Values cite lib/clinical/hagos.js, lib/clinical/omas.js, and mcid.js headers.

const { calcHAGOS, HAGOS_SECTIONS } = require('../lib/clinical/hagos')
const { calcOMAS, OMAS_ITEMS } = require('../lib/clinical/omas')
const { getMCIDStatus } = require('../lib/clinical/mcid')
const { MEASURES } = require('../lib/clinical/measures')
const { CONDITION_OPTIONS, DIAG_RECS } = require('../lib/clinical/constants')
const {
  FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS,
  getFollowUpQuestionnaire,
  validateFollowUpQuestionnaireAnswers,
} = require('../lib/followupQuestionnaires')

// Item counts per subscale, in the canonical HAGOS order.
const SUBSCALE_LENGTHS = { symptoms: 7, pain: 10, adl: 5, sport: 8, pa: 2, qol: 5 }

function hagosItems(fill) {
  const items = {}
  for (const [key, len] of Object.entries(SUBSCALE_LENGTHS)) {
    items[key] = Array(len).fill(fill)
  }
  return items
}

describe('calcHAGOS — scoring', () => {
  it('scores every subscale 100 (no problems) when all items are best (0)', () => {
    const result = calcHAGOS({ items: hagosItems(0) })
    expect(result.primaryValue).toBe(100)       // Pain is the primary subscale
    expect(result.primaryUnit).toBe('/100')
    expect(result.meta.symptoms).toBe(100)
    expect(result.meta.adl).toBe(100)
    expect(result.meta.sport).toBe(100)
    expect(result.meta.pa).toBe(100)
    expect(result.meta.qol).toBe(100)
  })

  it('scores every subscale 0 when all items are worst (4)', () => {
    const result = calcHAGOS({ items: hagosItems(4) })
    expect(result.primaryValue).toBe(0)
    expect(result.meta.qol).toBe(0)
  })

  it('transforms a subscale mean to 100 - mean*100/4', () => {
    // Pain: all items = 2 → mean 2 → 100 - 50 = 50
    const items = hagosItems(0)
    items.pain = Array(10).fill(2)
    expect(calcHAGOS({ items }).primaryValue).toBe(50)
  })

  it('has six subscales totalling 37 items and never produces a total score', () => {
    const total = HAGOS_SECTIONS.reduce((sum, s) => sum + s.items.length, 0)
    expect(HAGOS_SECTIONS).toHaveLength(6)
    expect(total).toBe(37)
    const result = calcHAGOS({ items: hagosItems(0) })
    expect(result.meta).not.toHaveProperty('total')
    expect(result).not.toHaveProperty('totalScore')
  })
})

describe('calcHAGOS — missing-item rules', () => {
  it('tolerates up to 2 unanswered items in a subscale (mean of answered)', () => {
    const items = hagosItems(0)
    items.symptoms = [0, 0, 0, 0, 0, null, null] // 5 answered, 2 missing
    expect(calcHAGOS({ items }).meta.symptoms).toBe(100)
  })

  it('leaves a non-pain subscale unscored when >2 items are missing, but still scores the rest', () => {
    const items = hagosItems(0)
    items.sport = [0, 0, 0, 0, 0, null, null, null] // 5 answered, 3 missing
    const result = calcHAGOS({ items })
    expect(result).not.toBeNull()
    expect(result.meta.sport).toBeNull()
    expect(result.primaryValue).toBe(100) // Pain unaffected
  })

  it('returns null for the whole assessment when Pain cannot be scored', () => {
    const items = hagosItems(0)
    items.pain = [0, 0, 0, 0, 0, 0, 0, null, null, null] // 3 missing → pain null
    expect(calcHAGOS({ items })).toBeNull()
  })

  it('scores the 2-item Participation subscale when at least one item is answered', () => {
    const items = hagosItems(0)
    items.pa = [0, null] // 1 answered, 1 missing
    expect(calcHAGOS({ items }).meta.pa).toBe(100)
  })

  it('rejects out-of-range item values', () => {
    expect(calcHAGOS({ items: hagosItems(5) })).toBeNull()
    const bad = hagosItems(0)
    bad.pain[0] = 'x'
    expect(calcHAGOS({ items: bad })).toBeNull()
  })
})

describe('HAGOS — registry + MDC wiring', () => {
  it('registers HAGOS as a higher-is-better MSK questionnaire with Pain primary + 5 subscales', () => {
    expect(MEASURES.HAGOS.domains).toEqual(['msk'])
    expect(MEASURES.HAGOS.category).toBe('questionnaire')
    expect(MEASURES.HAGOS.higherIsBetter).toBe(true)
    expect(MEASURES.HAGOS.mcidKey).toBe('hagos-pain')
    expect(MEASURES.HAGOS.primaryLabel).toBe('Pain')
    expect(MEASURES.HAGOS.subscales.map(s => s.key)).toEqual(['symptoms', 'adl', 'sport', 'pa', 'qol'])
    expect(MEASURES.HAGOS.subscales.map(s => s.mcidKey)).toEqual([
      'hagos-symptoms', 'hagos-adl', 'hagos-sport', 'hagos-pa', 'hagos-qol',
    ])
  })

  it('labels HAGOS change against the per-subscale measurement-error floor, not "MCID met"', () => {
    // Pain MDC (individual) = 25.2 (Groen 2017)
    const big = getMCIDStatus('hagos-pain', 100, 74) // +26 ≥ 25.2
    expect(big.improved).toBe(true)
    expect(big.meetsThreshold).toBe(true)
    expect(big.label).toContain('beyond measurement error')
    expect(big.label).not.toContain('MCID met')

    const small = getMCIDStatus('hagos-pain', 84, 74) // +10 < 25.2
    expect(small.meetsThreshold).toBe(false)
    expect(small.label).toContain('within measurement error')
  })

  it('treats a decrease as a decline (higher = better)', () => {
    const worse = getMCIDStatus('hagos-qol', 50, 80)
    expect(worse.improved).toBe(false)
    expect(worse.label).toContain('Declined')
  })
})

describe('HAGOS — Hip / Groin Pain pathway', () => {
  it('adds the Hip / Groin Pain condition recommending HAGOS, NPRS, PSFS', () => {
    expect(CONDITION_OPTIONS).toContain('Hip / Groin Pain')
    expect(DIAG_RECS['Hip / Groin Pain']).toEqual(['HAGOS', 'NPRS', 'PSFS'])
  })
})

describe('HAGOS — follow-up eligibility', () => {
  it('lists HAGOS as an eligible patient questionnaire', () => {
    expect(FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS).toContain('HAGOS')
  })

  it('builds a 37-question HAGOS follow-up and scores valid answers', () => {
    const q = getFollowUpQuestionnaire('HAGOS')
    expect(q.questions).toHaveLength(37)
    const { results, error } = validateFollowUpQuestionnaireAnswers('HAGOS', {
      items: Array(37).fill(0),
    })
    expect(error).toBeUndefined()
    expect(results.primaryValue).toBe(100)
  })

  it('rejects a HAGOS follow-up with the wrong number of answers', () => {
    const { error } = validateFollowUpQuestionnaireAnswers('HAGOS', { items: Array(36).fill(0) })
    expect(error).toBeTruthy()
  })
})

// Best (max) and worst (0) answer for every OMAS item, in canonical order.
const OMAS_BEST = OMAS_ITEMS.map(item => Math.max(...item.options.map(o => o.value)))
const OMAS_WORST = OMAS_ITEMS.map(() => 0)

describe('calcOMAS — scoring', () => {
  it('has nine weighted items summing to a max of 100', () => {
    expect(OMAS_ITEMS).toHaveLength(9)
    expect(OMAS_BEST.reduce((a, b) => a + b, 0)).toBe(100)
  })

  it('scores 100 for the best answers and 0 for the worst', () => {
    const best = calcOMAS({ items: OMAS_BEST })
    expect(best.primaryValue).toBe(100)
    expect(best.primaryUnit).toBe('/100')
    expect(calcOMAS({ items: OMAS_WORST }).primaryValue).toBe(0)
  })

  it('sums item weights (e.g. mild pain drops total to 85)', () => {
    const items = [...OMAS_BEST]
    items[0] = 10 // Pain: "even ground outdoors" = 10 instead of 25
    expect(calcOMAS({ items }).primaryValue).toBe(85)
  })

  it('classifies the four interpretation bands by total', () => {
    // poor ≤30, fair 31–60, good 61–90, excellent 91–100 (Castilho 2021)
    const totalFromPain = pain => calcOMAS({ items: [pain, ...OMAS_BEST.slice(1)] })
    expect(totalFromPain(25).meta.classColor).toBe('green')   // 100 excellent
    expect(totalFromPain(25).interpretation).toContain('Excellent')
    const poor = calcOMAS({ items: [0, 0, 0, 0, 0, 0, 0, 0, 20] }) // total 20
    expect(poor.interpretation).toContain('Poor')
    expect(poor.meta.classColor).toBe('red')
  })
})

describe('calcOMAS — validation', () => {
  it('returns null for the wrong number of items', () => {
    expect(calcOMAS({ items: OMAS_BEST.slice(0, 8) })).toBeNull()
    expect(calcOMAS({ items: [] })).toBeNull()
  })

  it('rejects values that are not an allowed point for that item', () => {
    const bad = [...OMAS_BEST]
    bad[0] = 7 // 7 is not a valid Pain point (only 0/5/10/20/25)
    expect(calcOMAS({ items: bad })).toBeNull()
    const nonNumeric = [...OMAS_BEST]
    nonNumeric[1] = 'x'
    expect(calcOMAS({ items: nonNumeric })).toBeNull()
  })
})

describe('OMAS — registry, MCID, pathway', () => {
  it('registers OMAS as a higher-is-better MSK questionnaire', () => {
    expect(MEASURES.OMAS.domains).toEqual(['msk'])
    expect(MEASURES.OMAS.category).toBe('questionnaire')
    expect(MEASURES.OMAS.higherIsBetter).toBe(true)
    expect(MEASURES.OMAS.mcidKey).toBe('omas')
  })

  it('labels change against the anchored MCID (12.5 pts), not a measurement-error floor', () => {
    const met = getMCIDStatus('omas', 80, 65) // +15 ≥ 12.5
    expect(met.improved).toBe(true)
    expect(met.meetsThreshold).toBe(true)
    expect(met.label).toContain('MCID met')

    const small = getMCIDStatus('omas', 70, 65) // +5 < 12.5
    expect(small.meetsThreshold).toBe(false)
  })

  it('adds the Ankle Fracture pathway recommending OMAS, NPRS, LEFS', () => {
    expect(CONDITION_OPTIONS).toContain('Ankle Fracture')
    expect(DIAG_RECS['Ankle Fracture']).toEqual(['OMAS', 'NPRS', 'LEFS'])
  })
})

describe('OMAS — follow-up eligibility', () => {
  it('lists OMAS as an eligible patient questionnaire', () => {
    expect(FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS).toContain('OMAS')
  })

  it('builds a 9-question OMAS follow-up and scores valid answers', () => {
    const q = getFollowUpQuestionnaire('OMAS')
    expect(q.questions).toHaveLength(9)
    const { results, error } = validateFollowUpQuestionnaireAnswers('OMAS', { items: OMAS_BEST })
    expect(error).toBeUndefined()
    expect(results.primaryValue).toBe(100)
  })

  it('rejects an OMAS follow-up answer that is not a valid point value', () => {
    const bad = [...OMAS_BEST]
    bad[0] = 7
    const { error } = validateFollowUpQuestionnaireAnswers('OMAS', { items: bad })
    expect(error).toBeTruthy()
  })
})

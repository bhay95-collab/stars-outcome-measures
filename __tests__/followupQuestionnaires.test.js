import {
  FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS,
  getAllEligibleFollowUpQuestionnaireOptions,
  getEligibleFollowUpQuestionnaireOptions,
  getFollowUpQuestionnaire,
  questionnaireAttentionLevel,
  validateFollowUpQuestionnaireAnswers,
} from '../lib/followupQuestionnaires'

describe('patient follow-up questionnaires', () => {
  it('exposes safe public questionnaire metadata for eligible measures', () => {
    expect(FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS).toEqual(
      ['ABC', 'FSS', 'HADS', 'PDQ8', 'RPQ', 'BIVI', 'NPRS', 'LEFS', 'BPFS', 'KOOS', 'HOOS', 'HAGOS', 'CAIT', 'ATRS', 'FABQ', 'OMAS']
    )

    const abc = getFollowUpQuestionnaire('ABC')

    expect(abc.name).toMatch(/balance confidence/i)
    expect(abc.questions).toHaveLength(16)
    expect(JSON.stringify(abc)).not.toMatch(/patient_id|user_id|token/i)
  })

  it('exposes the MSK questionnaires with full flat question lists', () => {
    expect(getFollowUpQuestionnaire('NPRS').questions).toHaveLength(1)
    expect(getFollowUpQuestionnaire('LEFS').questions).toHaveLength(20)
    expect(getFollowUpQuestionnaire('BPFS').questions).toHaveLength(12)
    expect(getFollowUpQuestionnaire('KOOS').questions).toHaveLength(42)
    expect(getFollowUpQuestionnaire('HOOS').questions).toHaveLength(40)
    // KOOS subscale section labels survive flattening for the public page
    expect(getFollowUpQuestionnaire('KOOS').questions[0].section).toMatch(/symptoms/i)
  })

  it('scores patient-completed KOOS responses through the subscale engine', () => {
    const result = validateFollowUpQuestionnaireAnswers('KOOS', { items: Array(42).fill(1) })
    expect(result.error).toBeUndefined()
    expect(result.results.primaryValue).toBe(75) // Pain subscale
    expect(result.results.meta.qol).toBe(75)
  })

  it('scores patient-completed NPRS and LEFS responses', () => {
    const nprs = validateFollowUpQuestionnaireAnswers('NPRS', { items: [7] })
    expect(nprs.results.primaryValue).toBe(7)
    expect(questionnaireAttentionLevel('NPRS', nprs.results)).toBe('red')

    const lefs = validateFollowUpQuestionnaireAnswers('LEFS', { items: Array(20).fill(3) })
    expect(lefs.results.primaryValue).toBe(60)
  })

  it('validates and scores ABC patient responses with the clinical engine', () => {
    const result = validateFollowUpQuestionnaireAnswers('ABC', {
      items: Array(16).fill(80),
    })

    expect(result.error).toBeUndefined()
    expect(result.inputs.items).toEqual(Array(16).fill(80))
    expect(result.results).toEqual(expect.objectContaining({
      primaryValue: 80,
      primaryUnit: '%',
    }))
  })

  it('rejects incomplete or out-of-range questionnaire responses', () => {
    expect(validateFollowUpQuestionnaireAnswers('ABC', { items: Array(15).fill(80) }).error).toMatch(/answer all/i)
    expect(validateFollowUpQuestionnaireAnswers('ABC', { items: Array(16).fill(101) }).error).toMatch(/item 1/i)
    expect(validateFollowUpQuestionnaireAnswers('TUG', { items: [] }).error).toMatch(/supported/i)
  })

  it('derives attention level from result classifications', () => {
    const red = validateFollowUpQuestionnaireAnswers('ABC', { items: Array(16).fill(40) })
    const amber = validateFollowUpQuestionnaireAnswers('FSS', { items: Array(9).fill(4) })
    const green = validateFollowUpQuestionnaireAnswers('BIVI', { items: Array(15).fill(0) })

    expect(questionnaireAttentionLevel('ABC', red.results)).toBe('red')
    expect(questionnaireAttentionLevel('FSS', amber.results)).toBe('amber')
    expect(questionnaireAttentionLevel('BIVI', green.results)).toBe('green')
  })

  it('returns all 16 eligible measures regardless of prior assessments', () => {
    const all = getAllEligibleFollowUpQuestionnaireOptions([])
    expect(all).toHaveLength(16)
    expect(all.every(o => !o.hasPriorAssessment)).toBe(true)
    expect(all.every(o => o.sourceAssessmentId === null)).toBe(true)
    expect(all.every(o => o.resultLabel === null)).toBe(true)
  })

  it('marks measures with prior assessments and omits measures without', () => {
    const all = getAllEligibleFollowUpQuestionnaireOptions([
      {
        id: 'abc-1',
        measure: 'ABC',
        results: { primaryValue: 75, primaryUnit: '%', meta: { classColor: 'green' } },
        created_at: '2026-05-10T00:00:00.000Z',
      },
    ])
    const abc = all.find(o => o.measureId === 'ABC')
    const fss = all.find(o => o.measureId === 'FSS')

    expect(abc.hasPriorAssessment).toBe(true)
    expect(abc.sourceAssessmentId).toBe('abc-1')
    expect(abc.resultLabel).toBe('75%')
    expect(fss.hasPriorAssessment).toBe(false)
    expect(fss.sourceAssessmentId).toBeNull()
    expect(fss.resultLabel).toBeNull()
  })

  it('lists latest completed eligible questionnaires for a patient', () => {
    const options = getEligibleFollowUpQuestionnaireOptions([
      {
        id: 'old-abc',
        measure: 'ABC',
        results: { primaryValue: 70, primaryUnit: '%', meta: { classColor: 'amber' } },
        created_at: '2026-05-01T00:00:00.000Z',
      },
      {
        id: 'new-abc',
        measure: 'ABC',
        results: { primaryValue: 82, primaryUnit: '%', meta: { classColor: 'green' } },
        created_at: '2026-05-10T00:00:00.000Z',
      },
      {
        id: 'tug',
        measure: 'TUG',
        results: { primaryValue: 12, primaryUnit: 'sec' },
        created_at: '2026-05-11T00:00:00.000Z',
      },
    ])

    expect(options).toEqual([
      expect.objectContaining({
        measureId: 'ABC',
        sourceAssessmentId: 'new-abc',
        count: 2,
        resultLabel: '82%',
      }),
    ])
  })
})

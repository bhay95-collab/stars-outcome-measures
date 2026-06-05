import {
  FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS,
  getEligibleFollowUpQuestionnaireOptions,
  getFollowUpQuestionnaire,
  questionnaireAttentionLevel,
  validateFollowUpQuestionnaireAnswers,
} from '../lib/followupQuestionnaires'

describe('patient follow-up questionnaires', () => {
  it('exposes safe public questionnaire metadata for eligible measures', () => {
    expect(FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS).toEqual(['ABC', 'FSS', 'HADS', 'PDQ8', 'RPQ', 'BIVI'])

    const abc = getFollowUpQuestionnaire('ABC')

    expect(abc.name).toMatch(/balance confidence/i)
    expect(abc.questions).toHaveLength(16)
    expect(JSON.stringify(abc)).not.toMatch(/patient_id|user_id|token/i)
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

import { buildPatientPathway, DEFAULT_REASSESSMENT_DAYS } from '../lib/clinical/pathways'

const NOW = '2026-06-10T00:00:00.000Z'

function makePatient(overrides = {}) {
  return {
    id: 'patient-1',
    initials: 'AB',
    diagnosis: 'PD',
    ...overrides,
  }
}

function makeAssessment(overrides = {}) {
  return {
    id: `assessment-${Math.random()}`,
    patient_id: 'patient-1',
    measure: 'TUG',
    created_at: '2026-06-01T00:00:00.000Z',
    results: { primaryValue: 12 },
    ...overrides,
  }
}

describe('buildPatientPathway', () => {
  test('asks for a diagnosis when none is recorded', () => {
    const pathway = buildPatientPathway(makePatient({ diagnosis: '' }), [], { now: NOW })

    expect(pathway.statusLabel).toBe('Diagnosis needed')
    expect(pathway.statusTone).toBe('neutral')
    expect(pathway.nextActions).toHaveLength(1)
    expect(pathway.nextActions[0].type).toBe('diagnosis')
    expect(pathway.recommendedMeasures).toEqual([])
    expect(pathway.coveragePercent).toBe(0)
  })

  test('reports no template for an unmapped diagnosis', () => {
    const pathway = buildPatientPathway(makePatient({ diagnosis: 'Rare condition' }), [], { now: NOW })

    expect(pathway.statusLabel).toBe('No pathway template')
    expect(pathway.nextActions[0].type).toBe('pathway')
    expect(pathway.diagnosisLabel).toBe('Rare condition')
  })

  test('matches diagnosis case-insensitively', () => {
    const pathway = buildPatientPathway(makePatient({ diagnosis: 'stroke' }), [], { now: NOW })

    expect(pathway.diagnosis).toBe('Stroke')
    expect(pathway.recommendedMeasures.length).toBeGreaterThan(0)
  })

  test('flags all recommended measures as missing baselines with no assessments', () => {
    const pathway = buildPatientPathway(makePatient(), [], { now: NOW })

    expect(pathway.missingMeasures.length).toBe(pathway.recommendedMeasures.length)
    expect(pathway.dueMeasures).toEqual([])
    expect(pathway.coveragePercent).toBe(0)
    expect(pathway.statusTone).toBe('attention')
    expect(pathway.nextActions[0].type).toBe('baseline')
    expect(pathway.nextActions.length).toBeLessThanOrEqual(4)
  })

  test('counts recorded measures toward coverage', () => {
    const assessments = [makeAssessment({ created_at: '2026-06-05T00:00:00.000Z' })]
    const pathway = buildPatientPathway(makePatient(), assessments, { now: NOW })

    const recommendedCount = pathway.recommendedMeasures.length
    expect(pathway.recordedMeasures.map(item => item.id)).toContain('TUG')
    expect(pathway.coveragePercent).toBe(Math.round((1 / recommendedCount) * 100))
  })

  test('marks a measure due once the reassessment interval has elapsed', () => {
    const overdueDate = '2026-04-01T00:00:00.000Z' // 70 days before NOW
    const pathway = buildPatientPathway(makePatient(), [makeAssessment({ created_at: overdueDate })], { now: NOW })

    const tug = pathway.recommendedMeasures.find(item => item.id === 'TUG')
    expect(tug.hasBaseline).toBe(true)
    expect(tug.isDue).toBe(true)
    expect(tug.daysSinceLast).toBe(70)
    expect(pathway.dueMeasures.map(item => item.id)).toContain('TUG')
    expect(pathway.statusTone).toBe('due')
  })

  test('does not mark a recent measure as due', () => {
    const recentDate = '2026-06-05T00:00:00.000Z' // 5 days before NOW
    const pathway = buildPatientPathway(makePatient(), [makeAssessment({ created_at: recentDate })], { now: NOW })

    const tug = pathway.recommendedMeasures.find(item => item.id === 'TUG')
    expect(tug.isDue).toBe(false)
    expect(pathway.dueMeasures).toEqual([])
  })

  test('uses the latest assessment per measure for due logic', () => {
    const assessments = [
      makeAssessment({ id: 'old', created_at: '2026-01-01T00:00:00.000Z' }),
      makeAssessment({ id: 'new', created_at: '2026-06-05T00:00:00.000Z' }),
    ]
    const pathway = buildPatientPathway(makePatient(), assessments, { now: NOW })

    const tug = pathway.recommendedMeasures.find(item => item.id === 'TUG')
    expect(tug.daysSinceLast).toBe(5)
    expect(tug.isDue).toBe(false)
  })

  test('respects a custom reassessment interval', () => {
    const date = '2026-06-01T00:00:00.000Z' // 9 days before NOW
    const dueAtSeven = buildPatientPathway(makePatient(), [makeAssessment({ created_at: date })], {
      now: NOW,
      reassessmentDays: 7,
    })
    const notDueAtDefault = buildPatientPathway(makePatient(), [makeAssessment({ created_at: date })], { now: NOW })

    expect(dueAtSeven.reassessmentDays).toBe(7)
    expect(dueAtSeven.dueMeasures.map(item => item.id)).toContain('TUG')
    expect(notDueAtDefault.reassessmentDays).toBe(DEFAULT_REASSESSMENT_DAYS)
    expect(notDueAtDefault.dueMeasures).toEqual([])
  })

  test('reports pathway current when all baselines are recorded and nothing is due', () => {
    const patient = makePatient({ diagnosis: 'SCA' }) // SCA pathway: 10MWT, TUG, SARA, FSS
    const recent = '2026-06-05T00:00:00.000Z'
    const assessments = ['10MWT', 'TUG', 'SARA', 'FSS'].map(measure =>
      makeAssessment({ id: measure, measure, created_at: recent })
    )
    const pathway = buildPatientPathway(patient, assessments, { now: NOW })

    expect(pathway.coveragePercent).toBe(100)
    expect(pathway.statusTone).toBe('good')
    expect(pathway.statusLabel).toBe('Pathway current')
    expect(pathway.nextActions[0].type).toBe('current')
  })

  test('ignores assessments for measures outside the registry', () => {
    const assessments = [makeAssessment({ measure: 'Wheelchair Prescription' })]
    const pathway = buildPatientPathway(makePatient(), assessments, { now: NOW })

    expect(pathway.recordedMeasures).toEqual([])
    expect(pathway.coveragePercent).toBe(0)
  })

  test('prefers missing baselines, then due measures, for the preferred measure', () => {
    const patient = makePatient({ diagnosis: 'SCA' })
    const overdue = '2026-04-01T00:00:00.000Z'
    // 10MWT recorded but overdue; TUG, SARA, FSS missing
    const pathway = buildPatientPathway(patient, [makeAssessment({ measure: '10MWT', created_at: overdue })], { now: NOW })

    expect(pathway.missingMeasures.map(item => item.id)).toEqual(['TUG', 'SARA', 'FSS'])
    expect(pathway.preferredMeasureId).toBe('TUG')
    expect(pathway.dueMeasures.map(item => item.id)).toEqual(['10MWT'])
  })
})

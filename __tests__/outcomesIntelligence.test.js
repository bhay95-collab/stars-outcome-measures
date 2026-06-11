import {
  buildOutcomesIntelligence,
  NO_DIAGNOSIS_COHORT_LABEL,
  UNMAPPED_COHORT_LABEL,
} from '../lib/clinical/outcomesIntelligence'

const NOW = '2026-06-10T00:00:00.000Z'

function makePatient(overrides = {}) {
  return {
    id: 'patient-1',
    initials: 'AB',
    diagnosis: 'Stroke',
    ...overrides,
  }
}

function makeAssessment(overrides = {}) {
  return {
    id: `assessment-${Math.random()}`,
    patient_id: 'patient-1',
    measure: '10MWT',
    created_at: '2026-05-01T00:00:00.000Z',
    results: { primaryValue: 0.5, meta: {} },
    ...overrides,
  }
}

describe('buildOutcomesIntelligence', () => {
  test('returns empty model with honest highlight when no data exists', () => {
    const model = buildOutcomesIntelligence([], [], { now: NOW })

    expect(model.totals.patientCount).toBe(0)
    expect(model.totals.assessmentCount).toBe(0)
    expect(model.overall.pairCount).toBe(0)
    expect(model.overall.improvementRate).toBeNull()
    expect(model.overall.mcidRate).toBeNull()
    expect(model.measureRows).toEqual([])
    expect(model.cohorts).toEqual([])
    expect(model.highlights[0]).toMatch(/No outcome measures have been recorded yet/)
  })

  test('counts improvement for higher-is-better measures from baseline to latest', () => {
    const patients = [makePatient()]
    const assessments = [
      makeAssessment({ id: 'a1', created_at: '2026-04-01T00:00:00.000Z', results: { primaryValue: 0.4 } }),
      makeAssessment({ id: 'a2', created_at: '2026-05-01T00:00:00.000Z', results: { primaryValue: 0.45 } }),
      makeAssessment({ id: 'a3', created_at: '2026-06-01T00:00:00.000Z', results: { primaryValue: 0.62 } }),
    ]

    const model = buildOutcomesIntelligence(patients, assessments, { now: NOW })

    expect(model.overall.pairCount).toBe(1)
    expect(model.overall.improvedCount).toBe(1)
    expect(model.overall.improvementRate).toBe(100)
    // 0.62 - 0.40 = 0.22 m/s, above the published 0.06 m/s MCID for 10MWT comfort
    expect(model.overall.mcidEligibleCount).toBe(1)
    expect(model.overall.mcidMetCount).toBe(1)
    expect(model.overall.mcidRate).toBe(100)
  })

  test('counts improvement for lower-is-better measures when value decreases', () => {
    const patients = [makePatient()]
    const assessments = [
      makeAssessment({ id: 'a1', measure: 'TUG', created_at: '2026-04-01T00:00:00.000Z', results: { primaryValue: 20 } }),
      makeAssessment({ id: 'a2', measure: 'TUG', created_at: '2026-06-01T00:00:00.000Z', results: { primaryValue: 14 } }),
    ]

    const model = buildOutcomesIntelligence(patients, assessments, { now: NOW })

    expect(model.overall.improvedCount).toBe(1)
    expect(model.overall.declinedCount).toBe(0)
    // 6 sec change exceeds the 2.0 sec TUG MCID
    expect(model.overall.mcidMetCount).toBe(1)
  })

  test('classifies decline and improvement below MCID separately', () => {
    const patients = [
      makePatient({ id: 'patient-1' }),
      makePatient({ id: 'patient-2' }),
    ]
    const assessments = [
      // patient-1 declined on 10MWT
      makeAssessment({ id: 'a1', patient_id: 'patient-1', created_at: '2026-04-01T00:00:00.000Z', results: { primaryValue: 0.8 } }),
      makeAssessment({ id: 'a2', patient_id: 'patient-1', created_at: '2026-06-01T00:00:00.000Z', results: { primaryValue: 0.6 } }),
      // patient-2 improved but below the 0.06 m/s MCID
      makeAssessment({ id: 'a3', patient_id: 'patient-2', created_at: '2026-04-01T00:00:00.000Z', results: { primaryValue: 0.6 } }),
      makeAssessment({ id: 'a4', patient_id: 'patient-2', created_at: '2026-06-01T00:00:00.000Z', results: { primaryValue: 0.62 } }),
    ]

    const model = buildOutcomesIntelligence(patients, assessments, { now: NOW })

    expect(model.overall.pairCount).toBe(2)
    expect(model.overall.improvedCount).toBe(1)
    expect(model.overall.declinedCount).toBe(1)
    expect(model.overall.improvementRate).toBe(50)
    expect(model.overall.mcidEligibleCount).toBe(2)
    expect(model.overall.mcidMetCount).toBe(0)
    expect(model.overall.mcidRate).toBe(0)
  })

  test('excludes measures without a published MCID from MCID denominators', () => {
    const patients = [makePatient()]
    const assessments = [
      makeAssessment({ id: 'a1', measure: 'FAC', created_at: '2026-04-01T00:00:00.000Z', results: { primaryValue: 2 } }),
      makeAssessment({ id: 'a2', measure: 'FAC', created_at: '2026-06-01T00:00:00.000Z', results: { primaryValue: 4 } }),
    ]

    const model = buildOutcomesIntelligence(patients, assessments, { now: NOW })

    expect(model.overall.improvedCount).toBe(1)
    expect(model.overall.mcidEligibleCount).toBe(0)
    expect(model.overall.mcidRate).toBeNull()
    expect(model.measureRows[0].hasMcid).toBe(false)
  })

  test('ignores non-registry measures and non-numeric results', () => {
    const patients = [makePatient()]
    const assessments = [
      makeAssessment({ id: 'a1', measure: 'Wheelchair Prescription', results: { primaryValue: 1 } }),
      makeAssessment({ id: 'a2', measure: '10MWT', created_at: '2026-04-01T00:00:00.000Z', results: { primaryValue: 'incomplete' } }),
      makeAssessment({ id: 'a3', measure: '10MWT', created_at: '2026-06-01T00:00:00.000Z', results: { primaryValue: 0.5 } }),
    ]

    const model = buildOutcomesIntelligence(patients, assessments, { now: NOW })

    expect(model.totals.assessmentCount).toBe(2)
    // Only one numeric 10MWT result, so no change pair exists
    expect(model.overall.pairCount).toBe(0)
  })

  test('patients with a single result count as assessed but not repeated', () => {
    const patients = [makePatient()]
    const assessments = [makeAssessment()]

    const model = buildOutcomesIntelligence(patients, assessments, { now: NOW })

    expect(model.totals.patientsWithAssessments).toBe(1)
    expect(model.totals.patientsWithRepeat).toBe(0)
    expect(model.highlights.join(' ')).toMatch(/repeat results/i)
  })

  test('groups cohorts by normalized diagnosis with unmapped and missing buckets', () => {
    const patients = [
      makePatient({ id: 'patient-1', diagnosis: 'Stroke' }),
      makePatient({ id: 'patient-2', diagnosis: 'stroke' }),
      makePatient({ id: 'patient-3', diagnosis: 'Rare condition' }),
      makePatient({ id: 'patient-4', diagnosis: '' }),
    ]

    const model = buildOutcomesIntelligence(patients, [], { now: NOW })

    const labels = model.cohorts.map(cohort => cohort.label)
    expect(labels).toContain('Stroke')
    expect(labels).toContain(UNMAPPED_COHORT_LABEL)
    expect(labels).toContain(NO_DIAGNOSIS_COHORT_LABEL)
    expect(model.cohorts.find(cohort => cohort.label === 'Stroke').patientCount).toBe(2)
  })

  test('cohort outcomes only include that cohort’s patients', () => {
    const patients = [
      makePatient({ id: 'patient-1', diagnosis: 'Stroke' }),
      makePatient({ id: 'patient-2', diagnosis: 'PD' }),
    ]
    const assessments = [
      makeAssessment({ id: 'a1', patient_id: 'patient-1', created_at: '2026-04-01T00:00:00.000Z', results: { primaryValue: 0.4 } }),
      makeAssessment({ id: 'a2', patient_id: 'patient-1', created_at: '2026-06-01T00:00:00.000Z', results: { primaryValue: 0.6 } }),
      makeAssessment({ id: 'a3', patient_id: 'patient-2', created_at: '2026-05-01T00:00:00.000Z', results: { primaryValue: 0.5 } }),
    ]

    const model = buildOutcomesIntelligence(patients, assessments, { now: NOW })

    const stroke = model.cohorts.find(cohort => cohort.label === 'Stroke')
    const pd = model.cohorts.find(cohort => cohort.label === 'PD')
    expect(stroke.pairCount).toBe(1)
    expect(stroke.improvedCount).toBe(1)
    expect(stroke.topMeasures).toContain('10MWT')
    expect(pd.pairCount).toBe(0)
    expect(pd.assessmentCount).toBe(1)
  })

  test('counts patient-reported assessments in totals', () => {
    const patients = [makePatient()]
    const assessments = [
      makeAssessment({ id: 'a1', measure: 'ABC', results: { primaryValue: 60, meta: { patientReported: true } } }),
      makeAssessment({ id: 'a2', measure: 'ABC', created_at: '2026-04-01T00:00:00.000Z', results: { primaryValue: 50, meta: {} } }),
    ]

    const model = buildOutcomesIntelligence(patients, assessments, { now: NOW })

    expect(model.totals.patientReportedCount).toBe(1)
    expect(model.totals.assessmentCount).toBe(2)
  })

  test('builds per-measure rows sorted by usage', () => {
    const patients = [makePatient()]
    const assessments = [
      makeAssessment({ id: 'a1', measure: 'TUG', created_at: '2026-04-01T00:00:00.000Z', results: { primaryValue: 20 } }),
      makeAssessment({ id: 'a2', measure: 'TUG', created_at: '2026-05-01T00:00:00.000Z', results: { primaryValue: 18 } }),
      makeAssessment({ id: 'a3', measure: 'TUG', created_at: '2026-06-01T00:00:00.000Z', results: { primaryValue: 15 } }),
      makeAssessment({ id: 'a4', measure: 'BBS', created_at: '2026-06-01T00:00:00.000Z', results: { primaryValue: 40 } }),
    ]

    const model = buildOutcomesIntelligence(patients, assessments, { now: NOW })

    expect(model.measureRows[0].measureId).toBe('TUG')
    expect(model.measureRows[0].assessmentCount).toBe(3)
    expect(model.measureRows[0].pairCount).toBe(1)
    expect(model.measureRows[1].measureId).toBe('BBS')
    expect(model.measureRows[1].pairCount).toBe(0)
  })

  test('records the assessment date range and generation time', () => {
    const patients = [makePatient()]
    const assessments = [
      makeAssessment({ id: 'a1', created_at: '2026-01-15T00:00:00.000Z' }),
      makeAssessment({ id: 'a2', created_at: '2026-06-01T00:00:00.000Z' }),
    ]

    const model = buildOutcomesIntelligence(patients, assessments, { now: NOW })

    expect(model.totals.firstAssessmentAt).toBe('2026-01-15T00:00:00.000Z')
    expect(model.totals.latestAssessmentAt).toBe('2026-06-01T00:00:00.000Z')
    expect(model.generatedAt).toBe(NOW)
  })
})

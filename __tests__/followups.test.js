import {
  buildFollowUpAttentionBoard,
  buildFollowUpComparison,
  FOLLOWUP_ATTENTION,
  FOLLOWUP_STATUS,
  getFollowUpRequestStatus,
  isFollowUpOverdue,
  isPatientReportedAssessment,
  shapeFollowUpRecord,
} from '../lib/followups'
import { hashFollowUpToken } from '../lib/followupTokens'

const NOW = new Date('2026-06-10T00:00:00.000Z')

function makeRequest(overrides = {}) {
  return {
    id: 'followup-1',
    patient_id: 'patient-1',
    measure_id: 'ABC',
    source_assessment_id: 'assessment-source',
    completed_assessment_id: null,
    recipient_email: null,
    sent_at: null,
    email_status: 'manual',
    email_provider_message_id: null,
    email_error: null,
    last_email_attempt_at: null,
    status: 'pending',
    due_at: '2026-06-15T00:00:00.000Z',
    expires_at: '2026-06-22T00:00:00.000Z',
    created_at: '2026-06-01T00:00:00.000Z',
    completed_at: null,
    cancelled_at: null,
    ...overrides,
  }
}

function makeAssessment(id, primaryValue, classColor, createdAt) {
  return {
    id,
    patient_id: 'patient-1',
    measure: 'ABC',
    inputs: { items: [] },
    results: {
      primaryValue,
      primaryUnit: '%',
      interpretation: 'Test interpretation',
      meta: { classColor },
    },
    created_at: createdAt,
  }
}

describe('follow-up helpers', () => {
  it('hashes tokens without exposing the raw token', () => {
    const token = 'secure-token-value'
    const hash = hashFollowUpToken(token)

    expect(hash).toHaveLength(64)
    expect(hash).not.toContain(token)
    expect(hashFollowUpToken(token)).toBe(hash)
  })

  it('derives pending, overdue, expired, and completed request states', () => {
    const now = new Date('2026-05-29T00:00:00.000Z')
    expect(getFollowUpRequestStatus({
      status: 'pending',
      expires_at: '2026-06-01T00:00:00.000Z',
    }, now)).toBe(FOLLOWUP_STATUS.PENDING)
    expect(isFollowUpOverdue({
      status: 'pending',
      due_at: '2026-05-20T00:00:00.000Z',
      expires_at: '2026-06-01T00:00:00.000Z',
    }, now)).toBe(true)
    expect(getFollowUpRequestStatus({
      status: 'pending',
      expires_at: '2026-05-20T00:00:00.000Z',
    }, now)).toBe(FOLLOWUP_STATUS.EXPIRED)
    expect(getFollowUpRequestStatus({
      status: 'completed',
      completed_at: '2026-05-28T00:00:00.000Z',
    }, now)).toBe(FOLLOWUP_STATUS.COMPLETED)
  })

  it('preserves email delivery fields when shaping follow-up records', () => {
    const record = shapeFollowUpRecord(makeRequest({
      recipient_email: 'patient@example.com',
      sent_at: '2026-06-01T00:00:00.000Z',
      email_status: 'sent',
      email_provider_message_id: 'resend-message-1',
      last_email_attempt_at: '2026-06-01T00:00:00.000Z',
    }))

    expect(record).toEqual(expect.objectContaining({
      recipient_email: 'patient@example.com',
      email_status: 'sent',
      email_provider_message_id: 'resend-message-1',
      last_email_attempt_at: '2026-06-01T00:00:00.000Z',
    }))
    expect(record.token_hash).toBeUndefined()
  })

  it('identifies patient-reported assessments by saved meta', () => {
    expect(isPatientReportedAssessment({ results: { meta: { patientReported: true } } })).toBe(true)
    expect(isPatientReportedAssessment({ results: { meta: { source: 'patient_reported_followup' } } })).toBe(true)
    expect(isPatientReportedAssessment({ results: { meta: {} } })).toBe(false)
    expect(isPatientReportedAssessment(null)).toBe(false)
  })
})

describe('follow-up baseline comparison', () => {
  const source = makeAssessment('assessment-source', 80, 'green', '2026-05-01T00:00:00.000Z')

  it('flags a decline beyond the MCID threshold as meaningful', () => {
    const completed = makeAssessment('assessment-completed', 55, 'green', '2026-06-08T00:00:00.000Z')
    const comparison = buildFollowUpComparison(source, completed)

    expect(comparison).toEqual(expect.objectContaining({
      baselineValue: 80,
      currentValue: 55,
      delta: -25,
      direction: 'declined',
      meaningfulDecline: true,
    }))
    expect(comparison.summaryLine).toContain('Vs clinic baseline 80%')
    expect(comparison.summaryLine).toContain('exceeds MCID 18.1%')
  })

  it('reports MCID-met improvement using clinical thresholds', () => {
    const completed = makeAssessment('assessment-completed', 99, 'green', '2026-06-08T00:00:00.000Z')
    const comparison = buildFollowUpComparison(source, completed)

    expect(comparison.direction).toBe('improved')
    expect(comparison.meaningfulDecline).toBe(false)
    expect(comparison.mcidLabel).toContain('MCID met')
  })

  it('returns null without a source assessment or on measure mismatch', () => {
    const completed = makeAssessment('assessment-completed', 55, 'green', '2026-06-08T00:00:00.000Z')
    expect(buildFollowUpComparison(null, completed)).toBeNull()
    expect(buildFollowUpComparison({ ...source, measure: 'FSS' }, completed)).toBeNull()
  })

  it('escalates a green result to amber when the decline exceeds MCID', () => {
    const completed = makeAssessment('assessment-completed', 55, 'green', '2026-06-08T00:00:00.000Z')
    const record = shapeFollowUpRecord(
      makeRequest({
        status: 'completed',
        completed_at: '2026-06-08T00:00:00.000Z',
        completed_assessment_id: 'assessment-completed',
      }),
      null,
      completed,
      NOW,
      source,
    )

    expect(record.assessment.attention_level).toBe(FOLLOWUP_ATTENTION.AMBER)
    expect(record.assessment.comparison.meaningfulDecline).toBe(true)
  })

  it('keeps the questionnaire attention level when there is no meaningful decline', () => {
    const completed = makeAssessment('assessment-completed', 78, 'green', '2026-06-08T00:00:00.000Z')
    const record = shapeFollowUpRecord(
      makeRequest({
        status: 'completed',
        completed_at: '2026-06-08T00:00:00.000Z',
        completed_assessment_id: 'assessment-completed',
      }),
      null,
      completed,
      NOW,
      source,
    )

    expect(record.assessment.attention_level).toBe(FOLLOWUP_ATTENTION.GREEN)
  })
})

describe('follow-up attention board', () => {
  function completedRecord(patientSuffix, classColor, primaryValue, completedAt) {
    const source = makeAssessment(`source-${patientSuffix}`, 80, 'green', '2026-05-01T00:00:00.000Z')
    const completed = makeAssessment(`completed-${patientSuffix}`, primaryValue, classColor, completedAt)
    return shapeFollowUpRecord(
      makeRequest({
        id: `followup-${patientSuffix}`,
        patient_id: `patient-${patientSuffix}`,
        status: 'completed',
        completed_at: completedAt,
        completed_assessment_id: `completed-${patientSuffix}`,
      }),
      null,
      completed,
      NOW,
      source,
    )
  }

  it('surfaces red before amber and filters settled patients', () => {
    const board = buildFollowUpAttentionBoard([
      { patientId: 'patient-amber', patientLabel: 'AB', records: [completedRecord('amber', 'green', 55, '2026-06-08T00:00:00.000Z')] },
      { patientId: 'patient-red', patientLabel: 'CD', records: [completedRecord('red', 'red', 20, '2026-06-07T00:00:00.000Z')] },
      { patientId: 'patient-green', patientLabel: 'EF', records: [completedRecord('green', 'green', 82, '2026-06-06T00:00:00.000Z')] },
    ], NOW)

    expect(board.map(item => item.patientId)).toEqual(['patient-red', 'patient-amber'])
    expect(board[0].attentionLevel).toBe(FOLLOWUP_ATTENTION.RED)
    expect(board[1].latestComparisonLine).toContain('Vs clinic baseline')
  })

  it('includes patients with only overdue pending links', () => {
    const overdueRecord = shapeFollowUpRecord(makeRequest({
      id: 'followup-overdue',
      patient_id: 'patient-overdue',
      due_at: '2026-06-01T00:00:00.000Z',
      expires_at: '2026-06-30T00:00:00.000Z',
    }), null, null, NOW)

    const board = buildFollowUpAttentionBoard([
      { patientId: 'patient-overdue', patientLabel: 'GH', records: [overdueRecord] },
    ], NOW)

    expect(board).toHaveLength(1)
    expect(board[0]).toEqual(expect.objectContaining({
      patientId: 'patient-overdue',
      attentionLevel: FOLLOWUP_ATTENTION.GREEN,
      overdueCount: 1,
      latestLine: null,
    }))
  })
})

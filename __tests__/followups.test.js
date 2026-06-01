import {
  FOLLOWUP_ATTENTION,
  FOLLOWUP_STATUS,
  getFollowUpRequestStatus,
  isFollowUpOverdue,
  scoreFollowUpAttention,
  validateFollowUpAnswers,
} from '../lib/followups'
import { hashFollowUpToken } from '../lib/followupTokens'

describe('follow-up helpers', () => {
  it('hashes tokens without exposing the raw token', () => {
    const token = 'secure-token-value'
    const hash = hashFollowUpToken(token)

    expect(hash).toHaveLength(64)
    expect(hash).not.toContain(token)
    expect(hashFollowUpToken(token)).toBe(hash)
  })

  it('scores red, amber, and green attention levels', () => {
    expect(scoreFollowUpAttention({
      falls_count: 1,
      confidence_score: 8,
      fatigue_score: 2,
      symptoms_change: 'same',
      adherence_level: 'most',
      global_status: 'same',
    })).toBe(FOLLOWUP_ATTENTION.RED)

    expect(scoreFollowUpAttention({
      falls_count: 0,
      confidence_score: 4,
      fatigue_score: 2,
      symptoms_change: 'same',
      adherence_level: 'most',
      global_status: 'same',
    })).toBe(FOLLOWUP_ATTENTION.AMBER)

    expect(scoreFollowUpAttention({
      falls_count: 0,
      confidence_score: 8,
      fatigue_score: 2,
      symptoms_change: 'same',
      adherence_level: 'most',
      global_status: 'same',
    })).toBe(FOLLOWUP_ATTENTION.GREEN)
  })

  it('validates submitted weekly check-in answers', () => {
    const result = validateFollowUpAnswers({
      falls_count: 0,
      confidence_score: 7,
      fatigue_score: 3,
      symptoms_change: 'same',
      adherence_level: 'all',
      global_status: 'same',
      concern_text: 'Doing well.',
    })

    expect(result.error).toBeUndefined()
    expect(result.data).toEqual(expect.objectContaining({
      falls_count: 0,
      confidence_score: 7,
      attention_level: FOLLOWUP_ATTENTION.GREEN,
    }))

    expect(validateFollowUpAnswers({ falls_count: -1 }).error).toMatch(/falls/i)
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
})

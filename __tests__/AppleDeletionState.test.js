import { createDeletionState, verifyDeletionState } from '../lib/apple-deletion-state'

const NOW = 1_700_000_000_000 // fixed epoch ms for deterministic expiry tests
const TTL_MS = 300 * 1000

describe('apple-deletion-state', () => {
  beforeAll(() => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-secret'
  })

  it('round-trips a signed state back to the user id', () => {
    const state = createDeletionState('user-123', NOW)
    expect(verifyDeletionState(state, NOW)).toEqual({ userId: 'user-123' })
  })

  it('rejects a tampered payload', () => {
    const state = createDeletionState('user-123', NOW)
    const [, signature] = state.split('.')
    const forgedPayload = Buffer
      .from(JSON.stringify({ userId: 'attacker', exp: Math.floor(NOW / 1000) + 300 }))
      .toString('base64url')
    expect(verifyDeletionState(`${forgedPayload}.${signature}`, NOW)).toBeNull()
  })

  it('rejects a tampered signature', () => {
    const [payload] = createDeletionState('user-123', NOW).split('.')
    expect(verifyDeletionState(`${payload}.not-a-valid-signature`, NOW)).toBeNull()
  })

  it('rejects an expired state', () => {
    const state = createDeletionState('user-123', NOW)
    expect(verifyDeletionState(state, NOW + TTL_MS + 1000)).toBeNull()
  })

  it('accepts a state right up to its expiry', () => {
    const state = createDeletionState('user-123', NOW)
    expect(verifyDeletionState(state, NOW + TTL_MS)).toEqual({ userId: 'user-123' })
  })

  it('returns null for malformed input', () => {
    expect(verifyDeletionState('', NOW)).toBeNull()
    expect(verifyDeletionState('no-dot-here', NOW)).toBeNull()
    expect(verifyDeletionState(null, NOW)).toBeNull()
    expect(verifyDeletionState('.', NOW)).toBeNull()
  })

  it('requires a user id to create state', () => {
    expect(() => createDeletionState('', NOW)).toThrow(/user id is required/i)
  })
})

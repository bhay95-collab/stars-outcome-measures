import { provisionOAuthProfile } from '../lib/account-provisioning'

function createAdmin(overrides = {}) {
  const state = {
    profile: null,
    deletedAccount: null,
    insertedProfile: null,
    updatedProfile: null,
    deletedUsers: [],
    ...overrides,
  }

  function queryFor(table) {
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      maybeSingle: jest.fn(() => {
        if (table === 'profiles') return Promise.resolve({ data: state.profile, error: null })
        if (table === 'deleted_accounts') return Promise.resolve({ data: state.deletedAccount, error: null })
        return Promise.resolve({ data: null, error: null })
      }),
      insert: jest.fn(payload => {
        state.insertedProfile = payload
        return Promise.resolve({ error: null })
      }),
      update: jest.fn(payload => {
        state.updatedProfile = payload
        return {
          eq: jest.fn(() => Promise.resolve({ error: null })),
        }
      }),
    }
    return query
  }

  const admin = {
    from: jest.fn(queryFor),
    auth: {
      admin: {
        deleteUser: jest.fn(userId => {
          state.deletedUsers.push(userId)
          return Promise.resolve({ error: null })
        }),
      },
    },
  }

  return { admin, state }
}

describe('OAuth profile provisioning', () => {
  const user = { id: 'user-1', email: 'Clinician@Example.com' }

  it('creates the one-time trial and preserves Apple names', async () => {
    const { admin, state } = createAdmin()

    const result = await provisionOAuthProfile(admin, user, {
      firstName: 'Ada',
      lastName: 'Clinician',
    })

    expect(result.created).toBe(true)
    expect(state.insertedProfile).toEqual({
      id: 'user-1',
      email: 'clinician@example.com',
      trial_end_date: expect.any(String),
      first_name: 'Ada',
      last_name: 'Clinician',
    })
  })

  it('does not reset an existing trial on later OAuth logins', async () => {
    const trialEndDate = '2026-06-24T00:00:00.000Z'
    const { admin, state } = createAdmin({
      profile: {
        id: 'user-1',
        first_name: 'Ada',
        last_name: 'Clinician',
        trial_end_date: trialEndDate,
      },
    })

    const result = await provisionOAuthProfile(admin, user)

    expect(result).toEqual({ created: false, trialEndDate })
    expect(state.insertedProfile).toBeNull()
    expect(state.updatedProfile).toBeNull()
  })

  it('removes a recreated auth identity when the email is in the deletion ledger', async () => {
    const { admin, state } = createAdmin({ deletedAccount: { id: 'deleted-1' } })

    const result = await provisionOAuthProfile(admin, user)

    expect(result.status).toBe(403)
    expect(result.error).toMatch(/not eligible/i)
    expect(state.deletedUsers).toEqual(['user-1'])
  })
})

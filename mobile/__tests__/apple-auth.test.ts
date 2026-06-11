import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from '../src/supabase/client';
import { provisionOAuthProfile } from '../src/auth/oauthProvisioning';
import {
  getAppleDeletionAuthorizationCode,
  signInWithApple,
} from '../src/auth/appleAuth';

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(),
  signInAsync: jest.fn(),
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
}))
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}))
jest.mock('../src/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithIdToken: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
    },
  },
}))
jest.mock('../src/auth/oauthProvisioning', () => ({
  provisionOAuthProfile: jest.fn(),
}))

describe('native Sign in with Apple', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' })
    ;(AppleAuthentication.isAvailableAsync as jest.Mock).mockResolvedValue(true)
    ;(Crypto.randomUUID as jest.Mock)
      .mockReturnValueOnce('nonce-a')
      .mockReturnValueOnce('nonce-b')
    ;(Crypto.digestStringAsync as jest.Mock).mockResolvedValue('hashed-nonce')
    ;(AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue({
      identityToken: 'identity-token',
      authorizationCode: 'authorization-code',
      fullName: { givenName: 'Ada', familyName: 'Clinician' },
    })
    ;(supabase.auth.signInWithIdToken as jest.Mock).mockResolvedValue({
      data: { session: { access_token: 'access-token', user: { id: 'user-1' } } },
      error: null,
    })
    ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null })
    ;(supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null })
    ;(provisionOAuthProfile as jest.Mock).mockResolvedValue(undefined)
  })

  it('uses a hashed nonce, signs into Supabase, and provisions the trial profile', async () => {
    await expect(signInWithApple()).resolves.toBe(true)

    expect(AppleAuthentication.signInAsync).toHaveBeenCalledWith(expect.objectContaining({
      nonce: 'hashed-nonce',
      requestedScopes: [0, 1],
    }))
    expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
      provider: 'apple',
      token: 'identity-token',
      nonce: 'nonce-a-nonce-b',
    })
    expect(provisionOAuthProfile).toHaveBeenCalledWith(
      expect.objectContaining({ access_token: 'access-token' }),
      { firstName: 'Ada', lastName: 'Clinician' },
    )
  })

  it('treats a user-cancelled Apple sheet as a non-error result', async () => {
    ;(AppleAuthentication.signInAsync as jest.Mock).mockRejectedValue({ code: 'ERR_REQUEST_CANCELED' })

    await expect(signInWithApple()).resolves.toBe(false)
    expect(supabase.auth.signOut).not.toHaveBeenCalled()
  })

  it('returns a fresh authorization code for account deletion', async () => {
    await expect(getAppleDeletionAuthorizationCode()).resolves.toBe('authorization-code')
  })
})

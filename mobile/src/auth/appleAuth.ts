import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from '../supabase/client';
import { provisionOAuthProfile } from './oauthProvisioning';

export const APPLE_SIGN_IN_ERROR_MESSAGE = 'Sign in with Apple could not be completed. Please try again.';

function isCancellation(error: unknown): boolean {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';
  return code === 'ERR_REQUEST_CANCELED' || code === '1001';
}

function makeRawNonce(): string {
  return `${Crypto.randomUUID()}-${Crypto.randomUUID()}`;
}

export async function signInWithApple(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !(await AppleAuthentication.isAvailableAsync())) {
    throw new Error(APPLE_SIGN_IN_ERROR_MESSAGE);
  }

  const rawNonce = makeRawNonce();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) throw new Error(APPLE_SIGN_IN_ERROR_MESSAGE);

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });
    if (error || !data.session) throw new Error(APPLE_SIGN_IN_ERROR_MESSAGE);

    const firstName = credential.fullName?.givenName;
    const lastName = credential.fullName?.familyName;
    await provisionOAuthProfile(data.session, { firstName, lastName });

    if (firstName || lastName) {
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
        },
      });
    }

    return true;
  } catch (error) {
    if (isCancellation(error)) return false;
    await supabase.auth.signOut().catch(() => undefined);
    throw new Error(error instanceof Error ? error.message : APPLE_SIGN_IN_ERROR_MESSAGE);
  }
}

export async function getAppleDeletionAuthorizationCode(): Promise<string> {
  if (Platform.OS !== 'ios') throw new Error('Apple reauthentication is only available on iOS.');

  try {
    const credential = await AppleAuthentication.signInAsync();
    if (!credential.authorizationCode) {
      throw new Error('Apple did not provide a deletion authorization code.');
    }
    return credential.authorizationCode;
  } catch (error) {
    if (isCancellation(error)) throw new Error('Account deletion was cancelled.');
    throw new Error('Sign in with Apple could not confirm account deletion.');
  }
}

export function userUsesAppleLogin(user: {
  app_metadata?: { providers?: unknown };
  identities?: Array<{ provider?: string }> | null;
} | null): boolean {
  const providers = user?.app_metadata?.providers;
  return (Array.isArray(providers) && providers.includes('apple'))
    || user?.identities?.some(identity => identity.provider === 'apple') === true;
}

import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { supabase } from '../supabase/client';

export const GOOGLE_SIGN_IN_ERROR_MESSAGE = 'Google sign-in could not be completed. Please try again.';

export async function signInWithGoogle(): Promise<boolean> {
  try {
    const redirectTo = makeRedirectUri({ scheme: 'rehabmetricsiq', path: 'auth/callback' });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw new Error(GOOGLE_SIGN_IN_ERROR_MESSAGE);
    if (!data.url) throw new Error(GOOGLE_SIGN_IN_ERROR_MESSAGE);

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== 'success') return false;

    const parsed = Linking.parse(result.url);

    const oauthError = parsed.queryParams?.error;
    if (typeof oauthError === 'string' && oauthError) {
      throw new Error(GOOGLE_SIGN_IN_ERROR_MESSAGE);
    }

    const code = parsed.queryParams?.code;

    if (typeof code !== 'string' || code.length === 0) {
      throw new Error(GOOGLE_SIGN_IN_ERROR_MESSAGE);
    }

    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    if (sessionError) throw new Error(GOOGLE_SIGN_IN_ERROR_MESSAGE);

    return true;
  } catch {
    throw new Error(GOOGLE_SIGN_IN_ERROR_MESSAGE);
  }
}

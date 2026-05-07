import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { supabase } from '../supabase/client';

const PKCE_CODE_PATTERN = /^[A-Za-z0-9_\-]{40,256}$/;

export async function signInWithGoogle(): Promise<boolean> {
  const redirectTo = makeRedirectUri({ scheme: 'rehabmetricsiq' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success') return false;

  const parsed = Linking.parse(result.url);

  const oauthError = parsed.queryParams?.error;
  if (typeof oauthError === 'string' && oauthError) {
    throw new Error(`Sign-in was denied: ${oauthError}`);
  }

  const code = parsed.queryParams?.code;

  if (typeof code !== 'string' || !PKCE_CODE_PATTERN.test(code)) {
    throw new Error('Sign-in could not be completed. Please try again.');
  }

  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
  if (sessionError) throw sessionError;

  return true;
}

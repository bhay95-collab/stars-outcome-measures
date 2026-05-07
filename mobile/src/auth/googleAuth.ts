import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { supabase } from '../supabase/client';

export async function signInWithGoogle(): Promise<boolean> {
  const redirectTo = makeRedirectUri({ scheme: 'rehabmetricsiq', path: 'auth/callback' });

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

  if (typeof code !== 'string' || code.length === 0) {
    throw new Error('Sign-in could not be completed. No authorisation code was returned.');
  }

  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
  if (sessionError) throw sessionError;

  return true;
}

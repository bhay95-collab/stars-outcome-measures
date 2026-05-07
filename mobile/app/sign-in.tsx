import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../src/supabase/client';
import { Screen } from '../src/components/ui/Screen';
import { Button } from '../src/components/ui/Button';
import { TextInput } from '../src/components/ui/TextInput';
import { colors, spacing, typography } from '../src/theme/tokens';
import { signInWithGoogle } from '../src/auth/googleAuth';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  function handleEmailChange(text: string) {
    if (error) setError(null);
    setEmail(text);
  }

  function handlePasswordChange(text: string) {
    if (error) setError(null);
    setPassword(text);
  }

  async function handleSignIn() {
    if (isLoading || isGoogleLoading) return;

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError('Invalid email or password.');
        return;
      }

      router.replace('/(app)/patients');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (isLoading || isGoogleLoading) return;
    setError(null);
    setIsGoogleLoading(true);
    try {
      const completed = await signInWithGoogle();
      if (completed) router.replace('/(app)/patients');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.appName}>RehabMetrics IQ</Text>
            <Text style={styles.tagline}>Sign in to continue</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              label="Sign in"
              onPress={handleSignIn}
              loading={isLoading}
              disabled={isLoading || isGoogleLoading}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              label="Continue with Google"
              onPress={handleGoogleSignIn}
              variant="secondary"
              loading={isGoogleLoading}
              disabled={isLoading || isGoogleLoading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  appName: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.primary,
    marginBottom: spacing.xs,
    letterSpacing: typography.trackingTight,
  },
  tagline: {
    fontSize: typography.sizeMd,
    color: colors.muted,
  },
  form: {
    gap: spacing.md,
  },
  errorText: {
    fontSize: typography.sizeSm,
    color: colors.coral,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: typography.sizeSm,
    color: colors.subtle,
  },
});

import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../src/supabase/client';
import { Screen } from '../src/components/ui/Screen';
import { Button } from '../src/components/ui/Button';
import { TextInput } from '../src/components/ui/TextInput';
import { colors, fonts, spacing, typography } from '../src/theme/tokens';
import { signInWithGoogle } from '../src/auth/googleAuth';

WebBrowser.maybeCompleteAuthSession();

const squareLogo = require('../assets/SquareLogo.png');

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
    <Screen padded={false} style={styles.navyRoot} rootBackground={colors.primary}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Image source={squareLogo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brandName}>RehabMetrics IQ</Text>
            <Text style={styles.tagline}>Data-driven outcomes. Better patient care.</Text>
          </View>

          <View style={styles.formPanel}>
            <Text style={styles.formHeading}>Sign in</Text>

            <View style={styles.fields}>
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
            </View>

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
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  navyRoot: {
    backgroundColor: colors.primary,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    flex: 1,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 18,
    marginBottom: spacing.xs,
  },
  brandName: {
    fontFamily: fonts.serif,
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: typography.trackingTight,
  },
  tagline: {
    fontSize: typography.sizeSm,
    color: 'rgba(255,255,255,0.70)',
    textAlign: 'center',
  },
  formPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  formHeading: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  fields: {
    gap: spacing.sm,
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

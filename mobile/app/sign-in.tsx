import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../src/supabase/client';
import { Screen } from '../src/components/ui/Screen';
import { TextInput } from '../src/components/ui/TextInput';
import { colors, fonts, spacing, typography, radii } from '../src/theme/tokens';
import { signInWithGoogle } from '../src/auth/googleAuth';

WebBrowser.maybeCompleteAuthSession();

const squareLogo = require('../assets/SquareLogo.png');

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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

  return (
    <Screen padded={false} style={styles.navyRoot} rootBackground={colors.primary} safeEdges={['top', 'left', 'right']}>
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
            <Text style={styles.brandName}>
              <Text style={styles.brandMain}>RehabMetrics </Text>
              <Text style={styles.brandIQ}>IQ</Text>
            </Text>
            <Text style={styles.tagline}>
              {'Data-driven outcomes.\nBetter patient care.'}
            </Text>
          </View>

          <View style={[styles.formPanel, { paddingBottom: Math.max(insets.bottom + spacing.lg, spacing.xl) }]}>
            <Text style={styles.formHeading}>Welcome back</Text>
            <Text style={styles.formSubtitle}>Log in to continue to your account.</Text>

            <View style={styles.fields}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                placeholder="you@example.com"
              />
              <TextInput
                label="Password"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                placeholder="Enter your password"
                rightElement={
                  <Pressable
                    onPress={() => setShowPassword(s => !s)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    style={styles.eyePressable}
                  >
                    <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                  </Pressable>
                }
              />
            </View>

            <View style={styles.rememberRow}>
              <Pressable
                onPress={() => setRememberMe(v => !v)}
                style={styles.checkboxRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberMe }}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.rememberLabel}>Remember me</Text>
              </Pressable>
              <Text style={styles.forgotPassword}>Forgot password?</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              onPress={handleSignIn}
              disabled={isLoading || isGoogleLoading}
              style={({ pressed }) => [
                styles.loginButton,
                (isLoading || isGoogleLoading || pressed) && styles.loginButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Log in"
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing in…' : 'Log in'}
              </Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
              style={({ pressed }) => [
                styles.googleButton,
                (isLoading || isGoogleLoading || pressed) && styles.googleButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
            >
              <Text style={styles.googleButtonText}>
                {isGoogleLoading ? 'Opening…' : 'Continue with Google'}
              </Text>
            </Pressable>
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
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 24,
    marginBottom: spacing.xs,
  },
  brandName: {
    lineHeight: 36,
  },
  brandMain: {
    fontFamily: fonts.serif,
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: '#FFFFFF',
    letterSpacing: typography.trackingTight,
  },
  brandIQ: {
    fontFamily: fonts.serif,
    fontSize: typography.size2xl,
    fontWeight: typography.weightMedium,
    color: 'rgba(255,255,255,0.65)',
  },
  tagline: {
    fontSize: typography.sizeSm,
    color: 'rgba(255,255,255,0.70)',
    textAlign: 'center',
    lineHeight: 20,
  },
  formPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.lg,
    gap: spacing.md,
  },
  formHeading: {
    fontFamily: fonts.serif,
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  formSubtitle: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    marginTop: -spacing.xs,
  },
  fields: {
    gap: spacing.xs,
  },
  eyePressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: {
    fontSize: typography.sizeSm,
    color: colors.actionBlue,
    fontWeight: typography.weightMedium,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: typography.weightBold,
    lineHeight: 14,
  },
  rememberLabel: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  forgotPassword: {
    fontSize: typography.sizeSm,
    color: colors.actionBlue,
    fontWeight: typography.weightMedium,
  },
  errorText: {
    fontSize: typography.sizeSm,
    color: colors.coral,
  },
  loginButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonPressed: {
    opacity: 0.85,
  },
  loginButtonText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: '#FFFFFF',
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
  googleButton: {
    height: 52,
    borderRadius: radii.button,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonPressed: {
    opacity: 0.7,
  },
  googleButtonText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
  },
});

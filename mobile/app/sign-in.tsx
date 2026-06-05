import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Pressable, useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { supabase } from '../src/supabase/client';
import { withTimeout, SIGN_IN_TIMEOUT_MS } from '../src/utils/withTimeout';
import { Screen } from '../src/components/ui/Screen';
import { TextInput } from '../src/components/ui/TextInput';
import { LogoWordmark } from '../src/components/ui/LogoWordmark';
import { ThreeBarLoading } from '../src/components/ui/ThreeBarMotif';
import { colors, spacing, typography, radii } from '../src/theme/tokens';

import { GOOGLE_SIGN_IN_ERROR_MESSAGE, signInWithGoogle } from '../src/auth/googleAuth';

WebBrowser.maybeCompleteAuthSession();

const heroVideo = require('../assets/videos/hero-loop.mp4');

const WEB_SIGNUP_URL = 'https://www.rehabmetricsiq.com/signup';
const squareLogo = require('../assets/SquareLogo.png');

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const isAccessExpired = reason === 'access_expired';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const videoPlayer = useVideoPlayer(heroVideo, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

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
      else setError(GOOGLE_SIGN_IN_ERROR_MESSAGE);
    } catch {
      setError(GOOGLE_SIGN_IN_ERROR_MESSAGE);
    } finally {
      setIsGoogleLoading(false);
    }
  }

  async function handleCreateAccount() {
    if (isLoading || isGoogleLoading) return;
    setError(null);

    try {
      await WebBrowser.openBrowserAsync(WEB_SIGNUP_URL);
    } catch {
      setError('Create account could not be opened. Please visit rehabmetricsiq.com/signup.');
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
      let result: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
      try {
        result = await withTimeout(
          supabase.auth.signInWithPassword({ email: email.trim(), password }),
          SIGN_IN_TIMEOUT_MS,
        );
      } catch {
        setError('Unable to sign in. Check your connection and try again.');
        return;
      }

      if (result.error) {
        setError('Invalid email or password.');
        return;
      }

      router.replace('/(app)/patients');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Screen padded={false} style={styles.navyRoot} rootBackground={colors.primaryDark} safeEdges={['left', 'right']}>
      <VideoView
        player={videoPlayer}
        style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.primaryDark }]}
        pointerEvents="none"
        contentFit="cover"
        fullscreenOptions={{ enable: false }}
        allowsPictureInPicture={false}
        nativeControls={false}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.heroScrim]} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="never"
        >
          <View style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}>
            <Image source={squareLogo} style={styles.logo} resizeMode="contain" />
            <LogoWordmark size="lg" tone="light" />
            <Text style={styles.tagline}>
              {'Data-driven outcomes.\nBetter patient care.'}
            </Text>
          </View>

          <View style={[
            styles.formPanel,
            { paddingBottom: Math.max(insets.bottom + spacing.lg, spacing.xl) },
            isTablet && styles.formPanelTablet,
          ]}>
            <View style={styles.formHeader}>
              <Text style={styles.formHeading}>Welcome back</Text>
              <Text style={styles.formSubtitle}>Log in to continue to your account.</Text>
            </View>

            {isAccessExpired ? (
              <View style={styles.accessNotice}>
                <Text style={styles.accessNoticeText}>
                  Your trial or subscription has ended. Visit rehabmetricsiq.com to continue.
                </Text>
              </View>
            ) : null}

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
              {isLoading ? (
                <ThreeBarLoading size="sm" tone="inverse" />
              ) : (
                <Text style={styles.loginButtonText}>Log in</Text>
              )}
            </Pressable>

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
              {isGoogleLoading ? (
                <ThreeBarLoading size="sm" tone="brand" />
              ) : (
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              )}
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>New here?</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.signupCard}>
              <View style={styles.signupCopy}>
                <Text style={styles.signupTitle}>New to RehabMetrics IQ?</Text>
                <Text style={styles.signupText}>Create your account on the secure web signup page.</Text>
              </View>
              <Pressable
                onPress={handleCreateAccount}
                disabled={isLoading || isGoogleLoading}
                accessibilityRole="link"
                accessibilityLabel="Create account on the secure web signup page"
                style={({ pressed }) => [
                  styles.signupButton,
                  pressed && styles.signupButtonPressed,
                  (isLoading || isGoogleLoading) && styles.signupButtonDisabled,
                ]}
              >
                <Text style={styles.signupLink}>Create account</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  navyRoot: {
    backgroundColor: colors.primaryDark,
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
    paddingBottom: spacing.lg + radii.sheet,
    gap: spacing.sm,
    marginBottom: -radii.sheet,
  },
  heroScrim: {
    backgroundColor: 'rgba(16, 41, 71, 0.62)',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 26,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  tagline: {
    fontSize: typography.sizeSm,
    color: colors.secondarySoft,
    textAlign: 'center',
    lineHeight: 20,
  },
  formPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  formPanelTablet: {
    alignSelf: 'center',
    width: '92%',
    maxWidth: 480,
    borderRadius: radii.sheet,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  formHeader: {
    gap: spacing.xs,
  },
  formHeading: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  formSubtitle: {
    fontSize: typography.sizeSm,
    color: colors.muted,
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
  accessNotice: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  accessNoticeText: {
    fontSize: typography.sizeSm,
    color: colors.ink,
    lineHeight: 19,
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
    minWidth: 110,
    textAlign: 'center',
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
  signupCard: {
    marginTop: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    padding: spacing.md,
    gap: spacing.sm,
  },
  signupCopy: {
    gap: spacing.xs,
  },
  signupTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  signupText: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: 19,
  },
  signupButton: {
    minHeight: 44,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  signupButtonPressed: {
    opacity: 0.75,
  },
  signupButtonDisabled: {
    opacity: 0.45,
  },
  signupLink: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.actionBlue,
  },
});

import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Pressable, useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { supabase } from '../src/supabase/client';
import { withTimeout, ACTION_TIMEOUT_MS } from '../src/utils/withTimeout';
import { Screen } from '../src/components/ui/Screen';
import { TextInput } from '../src/components/ui/TextInput';
import { LogoWordmark } from '../src/components/ui/LogoWordmark';
import { GoogleIcon } from '../src/components/ui/GoogleIcon';
import { ThreeBarLoading } from '../src/components/ui/ThreeBarMotif';
import { colors, spacing, typography, radii } from '../src/theme/tokens';

import { GOOGLE_SIGN_IN_ERROR_MESSAGE, signInWithGoogle } from '../src/auth/googleAuth';
import { APPLE_SIGN_IN_ERROR_MESSAGE, signInWithApple } from '../src/auth/appleAuth';

WebBrowser.maybeCompleteAuthSession();

const heroVideo = require('../assets/videos/hero-loop.mp4');

const squareLogo = require('../assets/SquareLogo.png');

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const { verified, deleted } = useLocalSearchParams<{ verified?: string; deleted?: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const isBusy = isLoading || isGoogleLoading || isAppleLoading;

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
    if (isBusy) return;
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

  async function handleAppleSignIn() {
    if (isBusy) return;
    setError(null);
    setIsAppleLoading(true);
    try {
      const completed = await signInWithApple();
      if (completed) router.replace('/(app)/patients');
    } catch (appleError) {
      setError(appleError instanceof Error ? appleError.message : APPLE_SIGN_IN_ERROR_MESSAGE);
    } finally {
      setIsAppleLoading(false);
    }
  }

  async function handleSignIn() {
    if (isBusy) return;

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
          ACTION_TIMEOUT_MS,
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

            {verified === '1' ? (
              <View style={styles.accessNotice}>
                <Text style={styles.accessNoticeText}>
                  Email confirmed. Log in to start your 14-day trial.
                </Text>
              </View>
            ) : null}

            {deleted === '1' ? (
              <View style={styles.accessNotice}>
                <Text style={styles.accessNoticeText}>
                  Your account and clinical data have been deleted.
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

            <Pressable
              onPress={() => router.push('/forgot-password')}
              disabled={isBusy}
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
              style={styles.forgotLink}
            >
              <Text style={styles.forgotLinkText}>Forgot password?</Text>
            </Pressable>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              onPress={handleSignIn}
              disabled={isBusy}
              style={({ pressed }) => [
                styles.loginButton,
                (isBusy || pressed) && styles.loginButtonPressed,
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

            {Platform.OS === 'ios' ? (
              <View style={isBusy && !isAppleLoading ? styles.socialDisabled : undefined}>
                {isAppleLoading ? (
                  <View style={styles.appleLoading}>
                    <ThreeBarLoading size="sm" tone="inverse" />
                  </View>
                ) : (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={radii.button}
                    style={styles.appleButton}
                    onPress={handleAppleSignIn}
                  />
                )}
              </View>
            ) : null}

            <Pressable
              onPress={handleGoogleSignIn}
              disabled={isBusy}
              style={({ pressed }) => [
                styles.googleButton,
                (isBusy || pressed) && styles.googleButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
            >
              {isGoogleLoading ? (
                <ThreeBarLoading size="sm" tone="brand" />
              ) : (
                <View style={styles.googleButtonContent}>
                  <GoogleIcon size={20} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </View>
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
                <Text style={styles.signupText}>Create your account securely without leaving the app.</Text>
              </View>
              <Pressable
                onPress={() => router.push('/sign-up')}
                disabled={isBusy}
                accessibilityRole="button"
                accessibilityLabel="Create account"
                style={({ pressed }) => [
                  styles.signupButton,
                  pressed && styles.signupButtonPressed,
                  isBusy && styles.signupButtonDisabled,
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
    backgroundColor: 'rgba(6, 55, 100, 0.62)',
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
  forgotLink: {
    alignSelf: 'flex-end',
  },
  forgotLinkText: {
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
    fontSize: typography.sizeLg,
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
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonPressed: {
    opacity: 0.7,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  googleButtonText: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  appleButton: {
    width: '100%',
    height: 52,
  },
  appleLoading: {
    height: 52,
    borderRadius: radii.button,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialDisabled: {
    opacity: 0.45,
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

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../src/supabase/client';
import { Screen } from '../src/components/ui/Screen';
import { TextInput } from '../src/components/ui/TextInput';
import { LogoWordmark } from '../src/components/ui/LogoWordmark';
import { ThreeBarLoading } from '../src/components/ui/ThreeBarMotif';
import { colors, spacing, typography, radii } from '../src/theme/tokens';

const WEB_RESET_URL = 'https://www.rehabmetricsiq.com/reset-password';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleEmailChange(text: string) {
    if (error) setError(null);
    setEmail(text);
  }

  async function handleSubmit() {
    if (isLoading) return;

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: WEB_RESET_URL,
    });

    setIsLoading(false);

    if (resetError) {
      setError('Something went wrong. Please check your connection and try again.');
      return;
    }

    setSent(true);
  }

  return (
    <Screen padded={false} style={styles.root} safeEdges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.lg }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.formPanel, { paddingBottom: Math.max(insets.bottom + spacing.lg, spacing.xl) }]}>
            <View style={styles.logoRow}>
              <LogoWordmark size="md" />
            </View>

            {sent ? (
              <View style={styles.sentState}>
                <Text style={styles.heading}>Check your inbox</Text>
                <Text style={styles.subtext}>
                  If an account exists for <Text style={styles.emailBold}>{email.trim()}</Text>, we&apos;ve sent
                  a password reset link. Open it in your browser to set a new password, then log back in here.
                </Text>
                <Text style={[styles.subtext, { marginTop: spacing.xs }]}>
                  Didn&apos;t receive it? Check your spam folder or try again.
                </Text>

                <Pressable
                  onPress={() => router.replace('/sign-in')}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Back to log in"
                >
                  <Text style={styles.primaryButtonText}>Back to log in</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.formHeader}>
                  <Text style={styles.heading}>Reset your password</Text>
                  <Text style={styles.subtext}>
                    Enter your account email and we&apos;ll send you a link to reset your password.
                  </Text>
                </View>

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
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Pressable
                  onPress={handleSubmit}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    (isLoading || pressed) && styles.primaryButtonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Send reset link"
                >
                  {isLoading ? (
                    <ThreeBarLoading size="sm" tone="inverse" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send reset link</Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => router.back()}
                  style={styles.backLink}
                  accessibilityRole="button"
                  accessibilityLabel="Back to log in"
                >
                  <Text style={styles.backLinkText}>← Back to log in</Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formPanel: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  logoRow: {
    marginBottom: spacing.xs,
  },
  formHeader: {
    gap: spacing.xs,
  },
  heading: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  subtext: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: 20,
  },
  emailBold: {
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  fields: {
    gap: spacing.xs,
  },
  errorText: {
    fontSize: typography.sizeSm,
    color: colors.coral,
  },
  primaryButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: '#FFFFFF',
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  backLinkText: {
    fontSize: typography.sizeSm,
    color: colors.actionBlue,
    fontWeight: typography.weightMedium,
  },
  sentState: {
    gap: spacing.sm,
  },
});

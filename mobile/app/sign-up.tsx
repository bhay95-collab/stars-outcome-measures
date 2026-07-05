import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Screen } from '../src/components/ui/Screen';
import { LogoWordmark } from '../src/components/ui/LogoWordmark';
import { TextInput } from '../src/components/ui/TextInput';
import { Button } from '../src/components/ui/Button';
import { apiRequest } from '../src/api/client';
import { colors, radii, spacing, typography } from '../src/theme/tokens';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateAccount() {
    if (!email.trim() || !password || !confirmPassword) {
      setError('Email and both password fields are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await apiRequest('/api/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password,
          source: 'mobile',
        }),
      });
      setIsComplete(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Account creation failed.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isComplete) {
    return (
      <Screen style={styles.centered} safeEdges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.completePanel}>
          <LogoWordmark size="md" />
          <Text style={styles.heading}>Check your email</Text>
          <Text style={styles.body}>
            Open the verification link sent to {email.trim()}. Then return here and log in to start your 14-day trial.
          </Text>
          <Button label="Back to login" onPress={() => router.replace('/sign-in')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false} safeEdges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to login"
          >
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={styles.header}>
            <LogoWordmark size="md" />
            <Text style={styles.heading}>Create your account</Text>
            <Text style={styles.body}>
              Start with 14 days of full access. No payment details are required.
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={text => {
                setEmail(text);
                setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              placeholder="you@example.com"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={text => {
                setPassword(text);
                setError(null);
              }}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="At least 6 characters"
            />
            <TextInput
              label="Confirm password"
              value={confirmPassword}
              onChangeText={text => {
                setConfirmPassword(text);
                setError(null);
              }}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="Repeat your password"
            />

            {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}

            <Button
              label="Create account"
              onPress={handleCreateAccount}
              loading={isLoading}
            />
          </View>

          <Text style={styles.legal}>
            By creating an account, you agree to the{' '}
            <Text
              style={styles.link}
              onPress={() => WebBrowser.openBrowserAsync('https://www.rehabmetricsiq.com/terms')}
            >
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text
              style={styles.link}
              onPress={() => WebBrowser.openBrowserAsync('https://www.rehabmetricsiq.com/privacy')}
            >
              Privacy Policy
            </Text>
            , and confirm you are a qualified health professional.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.xl,
  },
  centered: {
    justifyContent: 'center',
    padding: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  backText: {
    color: colors.actionBlue,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
  },
  header: {
    gap: spacing.sm,
  },
  heading: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  body: {
    fontSize: typography.sizeMd,
    lineHeight: 23,
    color: colors.muted,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    color: colors.coral,
    fontSize: typography.sizeSm,
    lineHeight: 19,
  },
  legal: {
    color: colors.muted,
    fontSize: typography.sizeSm,
    lineHeight: 20,
  },
  link: {
    color: colors.actionBlue,
    fontWeight: typography.weightSemibold,
  },
  completePanel: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
});

import React, { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../auth/AuthProvider';
import {
  getAppleDeletionAuthorizationCode,
  userUsesAppleLogin,
} from '../../auth/appleAuth';
import { apiRequest } from '../../api/client';
import { logOutPurchases } from '../../billing/revenuecat';
import { Button } from '../ui/Button';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const APPLE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

interface AccountSettingsSheetProps {
  visible: boolean;
  avatarUrl?: string | null;
  onDismiss: () => void;
}

function getInitials(name: string, email?: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email?.[0] ?? '?').toUpperCase();
}

export function AccountSettingsSheet({
  visible,
  avatarUrl,
  onDismiss,
}: AccountSettingsSheetProps) {
  const insets = useSafeAreaInsets();
  const { session, user, signOut } = useAuth();
  const [stage, setStage] = useState<'settings' | 'warning' | 'final'>('settings');
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setStage('settings');
      setError(null);
      setIsWorking(false);
    }
  }, [visible]);

  if (!user || !session) return null;

  const accessToken = session.access_token;
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? '';
  const displayName = name || 'Account';
  const appleLogin = userUsesAppleLogin(user);

  function close() {
    if (isWorking) return;
    if (stage !== 'settings') {
      setStage('settings');
      setError(null);
      return;
    }
    onDismiss();
  }

  async function handleSignOut() {
    setIsWorking(true);
    setError(null);
    try {
      await signOut();
      onDismiss();
      router.replace('/sign-in');
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Unable to sign out.');
      setIsWorking(false);
    }
  }

  async function handleDeleteAccount() {
    setIsWorking(true);
    setError(null);
    try {
      const appleAuthorizationCode = appleLogin
        ? await getAppleDeletionAuthorizationCode()
        : undefined;

      await apiRequest('/api/delete-account', {
        method: 'POST',
        accessToken,
        body: JSON.stringify({ appleAuthorizationCode }),
      });

      await logOutPurchases().catch(() => undefined);
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
      onDismiss();
      router.replace('/sign-in?deleted=1');
    } catch (deletionError) {
      setError(deletionError instanceof Error
        ? deletionError.message
        : 'The account could not be deleted.');
      setIsWorking(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.handle} />

        {stage === 'settings' ? (
          <>
            <View style={styles.userRow}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{getInitials(name, user.email)}</Text>
                </View>
              )}
              <View style={styles.userCopy}>
                <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
                {user.email ? <Text style={styles.email} numberOfLines={1}>{user.email}</Text> : null}
              </View>
            </View>

            {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}

            <Button
              label="Sign out"
              onPress={handleSignOut}
              variant="secondary"
              loading={isWorking}
            />
            <Pressable
              onPress={() => {
                setStage('warning');
                setError(null);
              }}
              disabled={isWorking}
              style={({ pressed }) => [styles.deleteEntry, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Delete account"
            >
              <Text style={styles.deleteEntryText}>Delete account</Text>
            </Pressable>
          </>
        ) : null}

        {stage === 'warning' ? (
          <>
            <Text style={styles.title}>Before you delete</Text>
            <Text style={styles.body}>
              Account deletion permanently removes your profile, patients, assessments, and follow-up data.
              This cannot be undone.
            </Text>
            <View style={styles.billingNotice}>
              <Text style={styles.billingTitle}>App Store billing</Text>
              <Text style={styles.billingText}>
                Deleting this account does not cancel an Apple subscription. Cancel it in your App Store
                subscription settings to prevent future renewals.
              </Text>
              <Pressable
                onPress={() => Linking.openURL(APPLE_SUBSCRIPTIONS_URL)}
                style={styles.manageLink}
                accessibilityRole="link"
                accessibilityLabel="Manage Apple subscription"
              >
                <Text style={styles.manageLinkText}>Manage Apple subscription</Text>
              </Pressable>
            </View>
            <Button label="Continue" onPress={() => setStage('final')} />
            <Button label="Keep my account" onPress={() => setStage('settings')} variant="ghost" />
          </>
        ) : null}

        {stage === 'final' ? (
          <>
            <Text style={styles.title}>Delete account permanently?</Text>
            <Text style={styles.body}>
              This is the final confirmation. Your clinical records and account access will be removed immediately.
            </Text>
            {appleLogin ? (
              <Text style={styles.body}>
                Apple will ask you to sign in again so RehabMetrics IQ can revoke its login authorization.
              </Text>
            ) : null}
            {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
            <Pressable
              onPress={handleDeleteAccount}
              disabled={isWorking}
              style={({ pressed }) => [
                styles.dangerButton,
                (pressed || isWorking) && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Delete account permanently"
            >
              <Text style={styles.dangerButtonText}>
                {isWorking ? 'Deleting account...' : 'Delete account permanently'}
              </Text>
            </Pressable>
            <Button
              label="Cancel"
              onPress={() => setStage('settings')}
              variant="ghost"
              disabled={isWorking}
            />
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,27,51,0.48)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    padding: spacing.lg,
    gap: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    alignSelf: 'center',
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: colors.primaryDark,
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
  },
  userCopy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.ink,
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
  },
  email: {
    color: colors.muted,
    fontSize: typography.sizeSm,
    marginTop: spacing.xs,
  },
  title: {
    color: colors.ink,
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
  },
  body: {
    color: colors.muted,
    fontSize: typography.sizeMd,
    lineHeight: 23,
  },
  billingNotice: {
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  billingTitle: {
    color: colors.ink,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
  },
  billingText: {
    color: colors.muted,
    fontSize: typography.sizeSm,
    lineHeight: 20,
  },
  manageLink: {
    minHeight: 44,
    justifyContent: 'center',
  },
  manageLinkText: {
    color: colors.actionBlue,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
  },
  deleteEntry: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteEntryText: {
    color: colors.coral,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
  },
  dangerButton: {
    minHeight: 50,
    borderRadius: radii.button,
    backgroundColor: '#A53624',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  dangerButtonText: {
    color: colors.surface,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
  },
  pressed: {
    opacity: 0.68,
  },
  error: {
    color: colors.coral,
    fontSize: typography.sizeSm,
    lineHeight: 20,
  },
});

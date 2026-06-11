import { useCallback, useEffect, useRef, useState } from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '../../src/theme/tokens';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { checkAccess, type AccessStatus } from '../../src/supabase/access';
import { withTimeout } from '../../src/utils/withTimeout';

const ACCESS_CHECK_TIMEOUT_MS = 8000;

export default function AppLayout() {
  const { session, isLoading } = useAuth();
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [isAccessCheckFailed, setIsAccessCheckFailed] = useState(false);
  const isCheckingAccessRef = useRef(false);

  const runAccessCheck = useCallback(() => {
    let isActive = true;

    if (!session) {
      setAccessStatus(null);
      setIsCheckingAccess(false);
      setIsAccessCheckFailed(false);
      isCheckingAccessRef.current = false;
      return () => { isActive = false; };
    }

    if (isCheckingAccessRef.current) return () => { isActive = false; };
    isCheckingAccessRef.current = true;
    setIsCheckingAccess(true);
    setIsAccessCheckFailed(false);

    withTimeout(checkAccess(session.user.id), ACCESS_CHECK_TIMEOUT_MS)
      .then(status => {
        if (isActive) {
          setAccessStatus(status);
          setIsAccessCheckFailed(false);
        }
      })
      .catch(() => {
        if (isActive) {
          // Network failure or timeout — do not grant access; show retry screen
          setIsAccessCheckFailed(true);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsCheckingAccess(false);
          isCheckingAccessRef.current = false;
        }
      });

    return () => {
      isActive = false;
      isCheckingAccessRef.current = false;
    };
  }, [session?.user.id]);

  useEffect(runAccessCheck, [runAccessCheck]);

  const isAccessPending = !!session && accessStatus === null && !isAccessCheckFailed;

  if (isLoading || isCheckingAccess || isAccessPending) {
    return (
      <View style={styles.center}>
        <LoadingState label="Loading clinical workspace" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  if (isAccessCheckFailed) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          Unable to connect. Check your connection and try again.
        </Text>
        <TouchableOpacity
          onPress={runAccessCheck}
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text style={styles.retryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!accessStatus?.hasAccess) {
    return <Redirect href="/subscribe" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  message: {
    fontSize: typography.sizeMd,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
  },
});

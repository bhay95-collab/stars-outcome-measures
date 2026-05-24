import { useEffect, useState } from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../src/theme/tokens';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { checkAccess, type AccessStatus } from '../../src/supabase/access';

const ACCESS_CHECK_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Access check timed out.')), ms)
    ),
  ]);
}

export default function AppLayout() {
  const { session, isLoading } = useAuth();
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      if (!session) {
        setAccessStatus(null);
        setIsCheckingAccess(false);
        return;
      }

      setIsCheckingAccess(true);
      try {
        const status = await withTimeout(checkAccess(session.user.id), ACCESS_CHECK_TIMEOUT_MS);
        if (isActive) setAccessStatus(status);
      } catch {
        if (isActive) setAccessStatus({ hasAccess: true, reason: 'none' });
      } finally {
        if (isActive) setIsCheckingAccess(false);
      }
    };

    run();

    return () => {
      isActive = false;
    };
  }, [session?.user.id]);

  const isAccessPending = !!session && accessStatus === null;

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

  if (!accessStatus?.hasAccess) {
    return <Redirect href="/sign-in?reason=access_expired" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});

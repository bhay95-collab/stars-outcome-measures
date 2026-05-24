import { Redirect } from 'expo-router';
import { useAuth } from '../src/auth/AuthProvider';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '../src/theme/tokens';
import { LoadingState } from '../src/components/ui/LoadingState';

export default function RootIndex() {
  const { session, isLoading, isSessionCheckFailed, retrySessionCheck } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <LoadingState label="Opening RehabMetrics IQ" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(app)/patients" />;
  }

  if (isSessionCheckFailed) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          Unable to connect. Check your connection and try again.
        </Text>
        <TouchableOpacity
          onPress={retrySessionCheck}
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text style={styles.retryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <Redirect href="/sign-in" />;
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

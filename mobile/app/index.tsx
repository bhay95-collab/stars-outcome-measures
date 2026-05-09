import { Redirect } from 'expo-router';
import { useAuth } from '../src/auth/AuthProvider';
import { View, StyleSheet } from 'react-native';
import { colors } from '../src/theme/tokens';
import { LoadingState } from '../src/components/ui/LoadingState';

export default function RootIndex() {
  const { session, isLoading } = useAuth();

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

  return <Redirect href="/sign-in" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});

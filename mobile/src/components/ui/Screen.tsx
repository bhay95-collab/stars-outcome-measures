import React from 'react';
import { StyleSheet, View, ScrollView, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/tokens';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, scrollable = false, style }: ScreenProps) {
  const inner = scrollable ? (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, style]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, style]}>{children}</View>
  );

  return <SafeAreaView style={styles.root}>{inner}</SafeAreaView>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.md,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
});

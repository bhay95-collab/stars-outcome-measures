import React from 'react';
import { StyleSheet, View, ScrollView, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/tokens';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  rootBackground?: string;
  safeEdges?: Edge[];
}

export function Screen({
  children,
  scrollable = false,
  padded = true,
  style,
  rootBackground,
  safeEdges,
}: ScreenProps) {
  const pad = padded ? spacing.md : 0;
  const inner = scrollable ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { padding: pad }, style]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { padding: pad }, style]}>{children}</View>
  );

  return (
    <SafeAreaView
      edges={safeEdges}
      style={[styles.root, rootBackground ? { backgroundColor: rootBackground } : null]}
    >
      {inner}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
});

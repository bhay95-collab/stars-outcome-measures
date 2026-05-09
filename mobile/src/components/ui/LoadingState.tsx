import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';
import { ThreeBarLoading } from './ThreeBarMotif';

interface LoadingStateProps {
  label?: string;
  tone?: 'brand' | 'inverse';
}

export function LoadingState({ label = 'Loading', tone = 'brand' }: LoadingStateProps) {
  const isInverse = tone === 'inverse';

  return (
    <View style={styles.container} accessibilityRole="progressbar">
      <ThreeBarLoading tone={isInverse ? 'inverse' : 'brand'} size="md" />
      <Text style={[styles.label, isInverse && styles.labelInverse]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  label: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.muted,
  },
  labelInverse: {
    color: 'rgba(255,255,255,0.78)',
  },
});

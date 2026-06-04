import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, typography, spacing } from '../../theme/tokens';

interface SectionLabelProps {
  children: React.ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.muted,
    letterSpacing: 0.2,
    marginBottom: spacing.sm,
  },
});

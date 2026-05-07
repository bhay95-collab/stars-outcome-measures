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
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    letterSpacing: typography.trackingWide,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
});

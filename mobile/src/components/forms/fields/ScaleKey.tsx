import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '../../../theme/tokens';

export interface ScaleKeyEntry {
  value: number;
  label: string;
}

interface ScaleKeyProps {
  entries: ScaleKeyEntry[];
  title?: string;
}

/**
 * Compact response-scale legend shown once per questionnaire so the meaning of
 * each numeric chip is always visible without crowding the chips themselves.
 * Used only for measures whose response anchors are uniform across every item.
 */
export function ScaleKey({ entries, title = 'SCALE' }: ScaleKeyProps) {
  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.title}>{title}</Text>
      <View style={styles.entries}>
        {entries.map(entry => (
          <View key={entry.value} style={styles.entry}>
            <Text style={styles.value}>{entry.value}</Text>
            <Text style={styles.label}>{entry.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizeXs,
    color: colors.subtle,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
  },
  entries: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.md,
    rowGap: spacing.xs,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
    color: colors.primary,
  },
  label: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
});

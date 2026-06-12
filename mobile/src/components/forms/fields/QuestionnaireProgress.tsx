import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '../../../theme/tokens';

interface QuestionnaireProgressProps {
  scoredCount: number;
  itemCount: number;
  /** Running raw total — only pass for measures whose final score is that raw sum. */
  runningTotal?: number;
  /** Maximum raw total, shown alongside runningTotal (e.g. 63). */
  maxTotal?: number;
  /** Optional node shown on the right of the header (e.g. a subscale legend) in place of the total. */
  headerRight?: React.ReactNode;
}

/**
 * Unified progress header for every questionnaire: "scored" count on the left and,
 * for raw-sum measures, the running total over its maximum on the right. Measures
 * whose final score is an index (not the raw sum) omit the total to avoid implying
 * the wrong unit.
 */
export function QuestionnaireProgress({
  scoredCount,
  itemCount,
  runningTotal,
  maxTotal,
  headerRight,
}: QuestionnaireProgressProps) {
  const percent = itemCount > 0 ? (scoredCount / itemCount) * 100 : 0;
  const showTotal = runningTotal !== undefined && maxTotal !== undefined;

  return (
    <View style={styles.card}>
      <Text style={styles.meta}>PROGRESS</Text>
      <View style={styles.header}>
        <Text style={styles.count}>
          {scoredCount} / {itemCount} scored
        </Text>
        {headerRight !== undefined ? (
          headerRight
        ) : showTotal ? (
          <View style={styles.scoreRow}>
            <Text style={styles.score}>{runningTotal}</Text>
            <Text style={styles.unit}>/{maxTotal}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` as `${number}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  meta: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  count: { fontSize: typography.sizeMd, color: colors.muted, fontWeight: typography.weightMedium },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  score: { fontSize: typography.size2xl, fontWeight: typography.weightBold, color: colors.primary },
  unit: { fontSize: typography.sizeSm, color: colors.muted },
  track: {
    height: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: { height: 4, backgroundColor: colors.primary, borderRadius: 2 },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { ThreeBarMotif } from '../ui/ThreeBarMotif';

interface TUGMeta {
  classColor: string;
  fallRisk: boolean;
}

interface TUGResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: TUGMeta;
}

interface ResultPreviewCardProps {
  result: TUGResult;
  label?: string;
}

export function ResultPreviewCard({ result, label = 'RESULT' }: ResultPreviewCardProps) {
  const { primaryValue, primaryUnit, interpretation, meta } = result;
  const displayValue = Number.isInteger(primaryValue)
    ? String(primaryValue)
    : primaryValue.toFixed(1);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.microLabel}>{label}</Text>
        <ThreeBarMotif size="sm" tone="soft" />
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{displayValue}</Text>
        <Text style={styles.unit}>{primaryUnit}</Text>
      </View>
      <View style={styles.pillRow}>
        <View style={styles.interpPill}>
          <Text style={styles.interpText}>{interpretation}</Text>
        </View>
        {meta.fallRisk ? (
          <View style={styles.fallRiskPill}>
            <Text style={styles.fallRiskText}>Fall risk</Text>
          </View>
        ) : null}
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
    borderColor: colors.secondarySoft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  microLabel: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  value: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.actionBlue,
  },
  unit: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  interpPill: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  interpText: {
    fontSize: typography.sizeSm,
    color: colors.ink,
  },
  fallRiskPill: {
    backgroundColor: colors.coral,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  fallRiskText: {
    fontSize: typography.sizeSm,
    color: colors.surface,
    fontWeight: typography.weightSemibold,
  },
});

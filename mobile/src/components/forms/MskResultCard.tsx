import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThreeBarMotif } from '../ui/ThreeBarMotif';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface MskResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta?: Record<string, unknown>;
}

interface MskResultCardProps {
  result: MskResult;
  label: string;
  caption?: string;
  warning?: string | null;
}

const COLOR_MAP: Record<string, string> = {
  green: colors.success,
  amber: colors.amber,
  red: colors.coral,
  grey: colors.subtle,
};

function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function MskResultCard({ result, label, caption, warning }: MskResultCardProps) {
  const classColor = typeof result.meta?.classColor === 'string' ? result.meta.classColor : 'grey';
  const color = COLOR_MAP[classColor] ?? colors.subtle;

  return (
    <View style={styles.resultCard}>
      <View style={styles.resultHeaderRow}>
        <View style={styles.resultBody}>
          <Text style={styles.resultMeta}>{label}</Text>
          <View style={styles.resultValueRow}>
            <Text style={styles.resultValue}>{formatValue(result.primaryValue)}</Text>
            <Text style={styles.resultUnit}>{result.primaryUnit}</Text>
            <View style={[styles.colorDot, { backgroundColor: color }]} />
          </View>
          {caption ? <Text style={styles.resultCaption}>{caption}</Text> : null}
        </View>
        <ThreeBarMotif size="sm" tone="soft" />
      </View>
      <View style={[styles.interpPill, { borderColor: color }]}>
        <Text style={[styles.interpText, { color }]}>{result.interpretation}</Text>
      </View>
      {warning ? <Text style={styles.warning}>{warning}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  resultCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  resultBody: { flex: 1 },
  resultMeta: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
    marginBottom: spacing.xs,
  },
  resultValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  resultValue: {
    fontSize: 36,
    fontWeight: typography.weightBold,
    color: colors.actionBlue,
    lineHeight: 40,
  },
  resultUnit: {
    fontSize: typography.sizeMd,
    color: colors.muted,
    fontWeight: typography.weightSemibold,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignSelf: 'center',
  },
  resultCaption: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  interpPill: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
  },
  interpText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
  },
  warning: {
    fontSize: typography.sizeSm,
    color: colors.amber,
    fontWeight: typography.weightMedium,
  },
});

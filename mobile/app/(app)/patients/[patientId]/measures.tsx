import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MEASURES } from '../../../../src/clinical/adapter';
import type { MeasureDefinition } from '../../../../src/clinical/adapter';
import { Screen } from '../../../../src/components/ui/Screen';
import { Card } from '../../../../src/components/ui/Card';
import { SectionLabel } from '../../../../src/components/ui/SectionLabel';
import { colors, spacing, typography } from '../../../../src/theme/tokens';

type Category = 'performance' | 'independence' | 'questionnaire';

const GROUPS: { label: string; category: Category }[] = [
  { label: 'Performance', category: 'performance' },
  { label: 'Independence', category: 'independence' },
  { label: 'Questionnaire', category: 'questionnaire' },
];

function MeasureRow({
  measure,
  patientId,
  hasBorder,
}: {
  measure: MeasureDefinition;
  patientId: string;
  hasBorder: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/patients/${patientId}/assess/${measure.id}`)}
      style={[styles.measureRow, hasBorder && styles.measureRowBorder]}
      accessibilityRole="button"
      accessibilityLabel={measure.name}
      activeOpacity={0.6}
    >
      <View style={styles.measureInfo}>
        <Text style={styles.measureName}>{measure.name}</Text>
        {measure.primaryUnit ? (
          <Text style={styles.measureUnit}>{measure.primaryUnit}</Text>
        ) : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function MeasureSelectorScreen() {
  const params = useLocalSearchParams<{ patientId: string }>();
  const patientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;

  const measuresByCategory = useMemo(() => {
    const map = new Map<Category, MeasureDefinition[]>();
    for (const { category } of GROUPS) {
      map.set(
        category,
        Object.values(MEASURES).filter(m => m.category === category && m.id !== 'ISNCSCI'),
      );
    }
    return map;
  }, []);

  return (
    <Screen scrollable>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.screenTitle}>Select Measure</Text>

      {GROUPS.map(group => {
        const measures = measuresByCategory.get(group.category) ?? [];
        return (
          <View key={group.category} style={styles.group}>
            <SectionLabel>{group.label}</SectionLabel>
            <Card style={styles.groupCard}>
              {measures.map((m, idx) => (
                <MeasureRow
                  key={m.id}
                  measure={m}
                  patientId={patientId}
                  hasBorder={idx < measures.length - 1}
                />
              ))}
            </Card>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.sizeSm,
    color: colors.primary,
    fontWeight: typography.weightMedium,
  },
  screenTitle: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  group: {
    marginBottom: spacing.lg,
  },
  groupCard: {
    padding: 0,
  },
  measureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  measureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  measureInfo: {
    flex: 1,
  },
  measureName: {
    fontSize: typography.sizeMd,
    color: colors.ink,
    fontWeight: typography.weightMedium,
  },
  measureUnit: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  chevron: {
    fontSize: typography.sizeLg,
    color: colors.subtle,
  },
});

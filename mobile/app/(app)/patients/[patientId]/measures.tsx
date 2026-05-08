import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MEASURES } from '../../../../src/clinical/adapter';
import type { MeasureDefinition } from '../../../../src/clinical/adapter';
import { Screen } from '../../../../src/components/ui/Screen';
import { Card } from '../../../../src/components/ui/Card';
import { SectionLabel } from '../../../../src/components/ui/SectionLabel';
import { NavyHeader } from '../../../../src/components/ui/NavyHeader';
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
      <Text style={styles.measureName}>{measure.name}</Text>
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
    <Screen padded={false} rootBackground={colors.primary} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        leftLabel="← Back"
        onLeft={() => router.back()}
        title="Select Measure"
      />
      <ScrollView style={styles.panel} contentContainerStyle={styles.content}>
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
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  group: {
    gap: spacing.xs,
  },
  groupCard: {
    padding: 0,
    overflow: 'hidden',
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
  measureName: {
    flex: 1,
    fontSize: typography.sizeMd,
    color: colors.ink,
    fontWeight: typography.weightMedium,
  },
  chevron: {
    fontSize: typography.sizeLg,
    color: colors.subtle,
  },
});

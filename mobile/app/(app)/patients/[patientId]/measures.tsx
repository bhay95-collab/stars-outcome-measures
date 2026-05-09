import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MEASURES, buildPatientPathway } from '../../../../src/clinical/adapter';
import type { MeasureDefinition, PatientPathway } from '../../../../src/clinical/adapter';
import { getPatient } from '../../../../src/supabase/patients';
import { getAssessmentsForPatient } from '../../../../src/supabase/assessments';
import { Screen } from '../../../../src/components/ui/Screen';
import { Card } from '../../../../src/components/ui/Card';
import { NavyHeader } from '../../../../src/components/ui/NavyHeader';
import { ThreeBarMotif } from '../../../../src/components/ui/ThreeBarMotif';
import { colors, spacing, typography, radii } from '../../../../src/theme/tokens';

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
  pathwayStatus,
}: {
  measure: MeasureDefinition;
  patientId: string;
  hasBorder: boolean;
  pathwayStatus: { state: string; label: string } | null;
}) {
  const shortName = measure.id;
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/patients/${patientId}/assess/${measure.id}`)}
      style={[styles.measureRow, hasBorder && styles.measureRowBorder]}
      accessibilityRole="button"
      accessibilityLabel={`${shortName}, ${measure.name}`}
      activeOpacity={0.6}
    >
      <View style={styles.measureText}>
        <Text style={styles.measureName}>{shortName}</Text>
        <Text style={styles.measureFullName}>{measure.name}</Text>
      </View>
      {pathwayStatus ? (
        <View style={[
          styles.pathwayBadge,
          pathwayStatus.state === 'due'
            ? styles.pathwayBadge_due
            : pathwayStatus.state === 'recorded'
              ? styles.pathwayBadge_recorded
              : styles.pathwayBadge_missing,
        ]}>
          <Text style={styles.pathwayBadgeText}>{pathwayStatus.label}</Text>
        </View>
      ) : null}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function getPathwayStatus(pathway: PatientPathway | null, measureId: string): { state: string; label: string } | null {
  if (!pathway?.recommendedMeasures.some(item => item.id === measureId)) return null;
  if (pathway.dueMeasures.some(item => item.id === measureId)) return { state: 'due', label: 'Due' };
  if (pathway.missingMeasures.some(item => item.id === measureId)) return { state: 'missing', label: 'Baseline' };
  return { state: 'recorded', label: 'Pathway' };
}

export default function MeasureSelectorScreen() {
  const params = useLocalSearchParams<{ patientId: string }>();
  const patientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;
  const [pathway, setPathway] = useState<PatientPathway | null>(null);

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

  useEffect(() => {
    Promise.all([getPatient(patientId), getAssessmentsForPatient(patientId)])
      .then(([patient, assessments]) => {
        setPathway(buildPatientPathway(patient, assessments));
      })
      .catch(() => setPathway(null));
  }, [patientId]);

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        leftLabel="‹"
        onLeft={() => router.back()}
        title="Select Measure"
      />
      <ScrollView style={styles.panel} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>New Assessment</Text>
            {pathway ? (
              <Text style={styles.heroStatus}>{pathway.statusLabel}</Text>
            ) : null}
            <Text style={styles.heroSubtitle}>
              {pathway ? pathway.explanation.badgeHelp : 'Choose the next measure to record.'}
            </Text>
          </View>
          <ThreeBarMotif size="md" tone="soft" />
        </View>

        {GROUPS.map(group => {
          const measures = measuresByCategory.get(group.category) ?? [];
          return (
            <View key={group.category} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{group.label}</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{measures.length}</Text>
                </View>
              </View>
              <Card style={styles.groupCard}>
                {measures.map((m, idx) => (
                  <MeasureRow
                    key={m.id}
                    measure={m}
                    patientId={patientId}
                    hasBorder={idx < measures.length - 1}
                    pathwayStatus={getPathwayStatus(pathway, m.id)}
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
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  heroStatus: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  heroSubtitle: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  group: {
    gap: spacing.xs,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupTitle: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
    letterSpacing: typography.trackingWide,
    textTransform: 'uppercase',
  },
  countPill: {
    minWidth: 28,
    minHeight: 24,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
  },
  countText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: colors.primary,
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
    minHeight: 58,
  },
  measureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  measureText: {
    flex: 1,
    gap: spacing.xs,
  },
  measureName: {
    fontSize: typography.sizeMd,
    color: colors.ink,
    fontWeight: typography.weightMedium,
  },
  measureFullName: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    fontWeight: typography.weightMedium,
  },
  pathwayBadge: {
    minHeight: 24,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: colors.primarySoft,
    borderColor: colors.secondarySoft,
  },
  pathwayBadge_missing: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.secondarySoft,
  },
  pathwayBadge_due: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  pathwayBadge_recorded: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  pathwayBadgeText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: colors.primary,
  },
  chevron: {
    fontSize: typography.sizeLg,
    color: colors.subtle,
  },
});

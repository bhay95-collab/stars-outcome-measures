import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MEASURES, buildPatientPathway } from '../../../../src/clinical/adapter';
import type { MeasureDefinition, PatientPathway } from '../../../../src/clinical/adapter';
import { getPatient } from '../../../../src/supabase/patients';
import { getAssessmentsForPatient } from '../../../../src/supabase/assessments';
import { withTimeout, AUTH_TIMEOUT_MS } from '../../../../src/utils/withTimeout';
import { Screen } from '../../../../src/components/ui/Screen';
import { Card } from '../../../../src/components/ui/Card';
import { NavyHeader } from '../../../../src/components/ui/NavyHeader';
import { getValidPatientId } from '../../../../src/utils/routing';
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
          <Text style={[
            styles.pathwayBadgeText,
            pathwayStatus.state === 'due'
              ? styles.pathwayBadgeText_due
              : pathwayStatus.state === 'recorded'
                ? styles.pathwayBadgeText_recorded
                : null,
          ]}>{pathwayStatus.label}</Text>
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
  const patientId = getValidPatientId(params.patientId);
  const [pathway, setPathway] = useState<PatientPathway | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  function handleRetry() {
    setIsFetching(true);
    setRetryKey(k => k + 1);
  }

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
    if (!patientId) {
      setPathway(null);
      setRouteError('Invalid patient link.');
      return;
    }

    let isActive = true;
    setRouteError(null);
    setIsNetworkError(false);
    withTimeout(
      Promise.all([getPatient(patientId), getAssessmentsForPatient(patientId)]),
      AUTH_TIMEOUT_MS,
    )
      .then(([patient, assessments]) => {
        if (!isActive) return;
        if (!patient) {
          setPathway(null);
          setRouteError('Patient not found.');
          return;
        }
        setPathway(buildPatientPathway(patient, assessments));
      })
      .catch(() => {
        if (!isActive) return;
        setPathway(null);
        setIsNetworkError(true);
        setRouteError('Unable to load patient data. Check your connection and try again.');
      })
      .finally(() => {
        if (isActive) setIsFetching(false);
      });

    return () => {
      isActive = false;
    };
  }, [patientId, retryKey]);

  if (routeError || !patientId) {
    return (
      <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
        <NavyHeader
          leftLabel="‹"
          onLeft={() => router.back()}
          title="Select Measure"
        />
        <ScrollView style={styles.panel} contentContainerStyle={styles.content}>
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{routeError ?? 'Invalid patient link.'}</Text>
            {isNetworkError && patientId ? (
              <TouchableOpacity
                onPress={handleRetry}
                disabled={isFetching}
                style={styles.retryButton}
                accessibilityRole="button"
                accessibilityLabel="Try again"
              >
                <Text style={styles.retryButtonText}>Try again</Text>
              </TouchableOpacity>
            ) : null}
          </Card>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        leftLabel="‹"
        onLeft={() => router.back()}
        title="Select Measure"
      />
      <ScrollView style={styles.panel} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>New Assessment</Text>
          {pathway ? (
            <Text style={styles.heroStatus}>{pathway.statusLabel}</Text>
          ) : null}
          <Text style={styles.heroSubtitle}>
            {pathway ? pathway.explanation.badgeHelp : 'Choose the next measure to record.'}
          </Text>
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.muted,
    letterSpacing: 0.2,
  },
  countPill: {
    minWidth: 28,
    minHeight: 24,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    color: colors.subtle,
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
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
  },
  pathwayBadge_missing: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
  },
  pathwayBadge_due: {
    backgroundColor: colors.amberSoft,
    borderColor: colors.amberBorder,
  },
  pathwayBadge_recorded: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successBorder,
  },
  pathwayBadgeText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    color: colors.subtle,
  },
  pathwayBadgeText_due: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.amber,
  },
  pathwayBadgeText_recorded: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.success,
  },
  chevron: {
    fontSize: typography.sizeLg,
    color: colors.subtle,
  },
  errorCard: {
    gap: spacing.md,
  },
  errorText: {
    fontSize: typography.sizeMd,
    color: colors.coral,
  },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
  },
});

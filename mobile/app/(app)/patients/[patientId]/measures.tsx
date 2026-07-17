import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MEASURES, buildPatientPathway } from '../../../../src/clinical/adapter';
import type { MeasureDefinition, PatientPathway } from '../../../../src/clinical/adapter';
import { isMobileMeasureSupported, isMobileMeasureWebOnly } from '../../../../src/clinical/mobileMeasures';
import {
  MEASURE_SELECTOR_FILTERS,
  getMeasureFilterCounts,
  getMeasuresByCategory,
  getVisibleMeasureGroups,
  resolveMeasureFilter,
} from '../../../../src/clinical/measureSelector';
import type { MeasureFilter } from '../../../../src/clinical/measureSelector';
import { getPatient } from '../../../../src/supabase/patients';
import { getAssessmentsForPatient } from '../../../../src/supabase/assessments';
import { withTimeout, AUTH_TIMEOUT_MS } from '../../../../src/utils/withTimeout';
import { Screen } from '../../../../src/components/ui/Screen';
import { Card } from '../../../../src/components/ui/Card';
import { NavyHeader } from '../../../../src/components/ui/NavyHeader';
import { getValidPatientId } from '../../../../src/utils/routing';
import { colors, spacing, typography, radii } from '../../../../src/theme/tokens';

function MeasureRow({
  measure,
  patientId,
  hasBorder,
  pathwayStatus,
  supported,
}: {
  measure: MeasureDefinition;
  patientId: string;
  hasBorder: boolean;
  pathwayStatus: { state: string; label: string } | null;
  supported: boolean;
}) {
  const shortName = measure.id;
  const statusText = pathwayStatus ? `, ${pathwayStatus.label.toLowerCase()}` : '';
  const availabilityText = supported ? '' : ', coming soon';
  const accessibilityLabel = `${shortName}, ${measure.name}${statusText}${availabilityText}`;
  return (
    <TouchableOpacity
      onPress={supported ? () => router.push(`/(app)/patients/${patientId}/assess/${measure.id}`) : undefined}
      disabled={!supported}
      style={[
        styles.measureRow,
        hasBorder && styles.measureRowBorder,
        !supported && styles.measureRowDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !supported }}
      activeOpacity={supported ? 0.6 : 1}
    >
      <View style={styles.measureText}>
        <Text style={[styles.measureName, !supported && styles.measureNameDisabled]}>{shortName}</Text>
        <Text style={[styles.measureFullName, !supported && styles.measureFullNameDisabled]}>{measure.name}</Text>
      </View>
      <View style={styles.badgeGroup}>
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
        {!supported ? (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming soon</Text>
          </View>
        ) : null}
      </View>
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
  const [activeFilter, setActiveFilter] = useState<MeasureFilter>('recommended');

  function handleRetry() {
    setIsFetching(true);
    setRetryKey(k => k + 1);
  }

  const measuresByCategory = useMemo(() => {
    return getMeasuresByCategory(MEASURES);
  }, []);

  const recommendedMeasureIds = useMemo(
    () => pathway?.recommendedMeasures
      .filter(item => !isMobileMeasureWebOnly(item.id))
      .map(item => item.id) ?? [],
    [pathway],
  );

  const filterCounts = useMemo(() => getMeasureFilterCounts({
    measuresByCategory,
    recommendedMeasureIds,
  }), [measuresByCategory, recommendedMeasureIds]);

  const resolvedFilter = resolveMeasureFilter(activeFilter, filterCounts.recommended);

  const visibleGroups = useMemo(() => getVisibleMeasureGroups({
    measuresByCategory,
    filter: resolvedFilter,
    recommendedMeasureIds,
  }), [measuresByCategory, recommendedMeasureIds, resolvedFilter]);

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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterViewport}
          contentContainerStyle={styles.filterStrip}
        >
          {MEASURE_SELECTOR_FILTERS.map(filter => {
            const selected = resolvedFilter === filter.id;
            const disabled = filter.id === 'recommended' && filterCounts.recommended === 0;
            return (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setActiveFilter(filter.id)}
                disabled={disabled}
                style={[
                  styles.filterChip,
                  selected && styles.filterChipSelected,
                  disabled && styles.filterChipDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${filter.label}, ${filterCounts[filter.id]} measures`}
                accessibilityState={{ selected, disabled }}
                activeOpacity={0.72}
              >
                <Text style={[
                  styles.filterChipText,
                  selected && styles.filterChipTextSelected,
                  disabled && styles.filterChipTextDisabled,
                ]}>{filter.label}</Text>
                <View style={[
                  styles.filterChipCount,
                  selected && styles.filterChipCountSelected,
                  disabled && styles.filterChipCountDisabled,
                ]}>
                  <Text style={[
                    styles.filterChipCountText,
                    selected && styles.filterChipCountTextSelected,
                    disabled && styles.filterChipCountTextDisabled,
                  ]}>{filterCounts[filter.id]}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {visibleGroups.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No measures match this view.</Text>
          </Card>
        ) : null}

        {visibleGroups.map(group => {
          const measures = group.measures;
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
                    supported={isMobileMeasureSupported(m.id)}
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
  filterViewport: {
    marginHorizontal: -spacing.md,
  },
  filterStrip: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    minHeight: 44,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    opacity: 0.72,
  },
  filterChipText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
  },
  filterChipTextSelected: {
    color: colors.surface,
  },
  filterChipTextDisabled: {
    color: colors.subtle,
  },
  filterChipCount: {
    minWidth: 24,
    minHeight: 22,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipCountSelected: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  filterChipCountDisabled: {
    backgroundColor: colors.surfaceSoft,
  },
  filterChipCountText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: colors.subtle,
  },
  filterChipCountTextSelected: {
    color: colors.surface,
  },
  filterChipCountTextDisabled: {
    color: colors.subtle,
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
  emptyCard: {
    padding: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizeSm,
    color: colors.muted,
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
  measureRowDisabled: {
    opacity: 0.72,
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
  measureNameDisabled: {
    color: colors.muted,
  },
  measureFullName: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    fontWeight: typography.weightMedium,
  },
  measureFullNameDisabled: {
    color: colors.subtle,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  comingSoonBadge: {
    minHeight: 24,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
  },
  comingSoonText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    color: colors.subtle,
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

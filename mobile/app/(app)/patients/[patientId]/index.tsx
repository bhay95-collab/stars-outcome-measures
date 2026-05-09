import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getPatient } from '../../../../src/supabase/patients';
import { getAssessmentsForPatient } from '../../../../src/supabase/assessments';
import type { Patient, Assessment, AssessmentResults } from '../../../../src/types/domain';
import { Screen } from '../../../../src/components/ui/Screen';
import { Card } from '../../../../src/components/ui/Card';
import { SectionLabel } from '../../../../src/components/ui/SectionLabel';
import { Button } from '../../../../src/components/ui/Button';
import { NavyHeader } from '../../../../src/components/ui/NavyHeader';
import { PatientAvatar } from '../../../../src/components/ui/PatientAvatar';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { LoadingState } from '../../../../src/components/ui/LoadingState';
import { MEASURES, buildPatientPathway } from '../../../../src/clinical/adapter';
import { colors, spacing, typography, radii } from '../../../../src/theme/tokens';

function formatPrimary(results: AssessmentResults): string {
  const v = results?.primaryValue;
  const u = results?.primaryUnit;
  if (v == null || !Number.isFinite(Number(v))) return '—';
  const n = Number(v);
  const formatted = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return u ? `${formatted} ${u}` : formatted;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatCompactDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short',
  });
}

function getLatestPerMeasure(assessments: Assessment[]): Assessment[] {
  const seen = new Set<string>();
  return assessments.filter(a => {
    if (seen.has(a.measure)) return false;
    seen.add(a.measure);
    return true;
  });
}

function getLatestDate(assessments: Assessment[]): string | null {
  if (assessments.length === 0) return null;
  return assessments
    .map(a => a.created_at)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
}

function MeasureRow({ assessment }: { assessment: Assessment }) {
  const measureName = MEASURES[assessment.measure]?.name ?? assessment.measure;
  const measureShortName = MEASURES[assessment.measure]?.id ?? assessment.measure;
  return (
    <Card style={styles.measureCard}>
      <View>
        <Text style={styles.measureTitle}>{measureShortName}</Text>
        <Text style={styles.measureLabel}>{measureName}</Text>
      </View>
      <View style={styles.measureMeta}>
        <Text style={styles.measureValue}>{formatPrimary(assessment.results)}</Text>
        <Text style={styles.measureDate}>{formatDate(assessment.created_at)}</Text>
      </View>
    </Card>
  );
}

export default function PatientSummaryScreen() {
  const params = useLocalSearchParams<{ patientId: string }>();
  const patientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [latest, setLatest] = useState<Assessment[]>([]);
  const [assessmentCount, setAssessmentCount] = useState(0);
  const [latestAssessmentDate, setLatestAssessmentDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPatient(patientId), getAssessmentsForPatient(patientId)])
      .then(([p, assessments]) => {
        setPatient(p);
        setAssessments(assessments);
        setLatest(getLatestPerMeasure(assessments));
        setAssessmentCount(assessments.length);
        setLatestAssessmentDate(getLatestDate(assessments));
      })
      .catch(() => setError('Unable to load patient data.'))
      .finally(() => setIsLoading(false));
  }, [patientId]);

  if (isLoading) {
    return (
      <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
        <NavyHeader leftLabel="‹" onLeft={() => router.back()} />
        <View style={styles.panel}>
          <View style={styles.center}><LoadingState label="Loading patient" /></View>
        </View>
      </Screen>
    );
  }

  const pathway = buildPatientPathway(patient, assessments);
  const pathwayActions = pathway.nextActions.filter(action => action.detail).slice(0, 3);

  if (error || !patient) {
    return (
      <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
        <NavyHeader leftLabel="‹" onLeft={() => router.back()} />
        <View style={styles.panel}>
          <View style={styles.center}>
            <Text style={styles.errorText}>{error ?? 'Patient not found.'}</Text>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backLink}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backLinkText}>‹</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader leftLabel="‹" onLeft={() => router.back()} />
      <ScrollView
        style={styles.panel}
        contentContainerStyle={styles.scroll}
      >
        <Card style={styles.patientCard} elevated>
          <View style={styles.patientHeader}>
            <PatientAvatar name={patient.initials} size="md" />
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.initials}</Text>
              {patient.condition ? (
                <Text style={styles.condition}>{patient.condition}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryValue}>{latest.length}</Text>
              <Text style={styles.summaryLabel}>Measures</Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryValue}>{assessmentCount}</Text>
              <Text style={styles.summaryLabel}>Assessments</Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryValue}>
                {latestAssessmentDate ? formatCompactDate(latestAssessmentDate) : '—'}
              </Text>
              <Text style={styles.summaryLabel}>Latest</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.pathwayCard}>
          <View style={styles.pathwayHeader}>
            <View>
              <Text style={styles.pathwayKicker}>SMART REHAB PATHWAY</Text>
              <Text style={styles.pathwayStatus}>{pathway.statusLabel}</Text>
            </View>
            <View style={styles.pathwayScore}>
              <Text style={styles.pathwayScoreValue}>{pathway.coveragePercent}%</Text>
              <Text style={styles.pathwayScoreLabel}>covered</Text>
            </View>
          </View>
          <View style={styles.pathwayProgress} accessibilityElementsHidden>
            <View style={[styles.pathwayProgressFill, { width: `${pathway.coveragePercent}%` }]} />
          </View>
          {pathwayActions.map(action => (
            <View key={`${action.type}-${action.measureId ?? action.label}`} style={styles.pathwayAction}>
              <Text style={styles.pathwayActionTitle}>{action.label}</Text>
              <Text style={styles.pathwayActionText}>{action.detail}</Text>
            </View>
          ))}
        </Card>

        <SectionLabel>Recorded Measures</SectionLabel>

        {latest.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              title="No measures recorded yet"
              hint="Tap New Assessment to record the first measure."
            />
          </Card>
        ) : (
          <View style={styles.measureList}>
            {latest.map(a => <MeasureRow key={a.id} assessment={a} />)}
          </View>
        )}

        <View style={styles.actions}>
          <Button
            label="New Assessment"
            onPress={() => router.push(`/(app)/patients/${patientId}/measures`)}
          />
        </View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: typography.sizeMd,
    color: colors.coral,
    marginBottom: spacing.md,
  },
  backLink: {
    minHeight: 48,
    justifyContent: 'center',
  },
  backLinkText: {
    fontSize: typography.sizeSm,
    color: colors.primary,
  },
  scroll: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  patientCard: {
    gap: spacing.md,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  condition: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  pathwayCard: {
    gap: spacing.sm,
  },
  pathwayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  pathwayKicker: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
    letterSpacing: typography.trackingWide,
  },
  pathwayStatus: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  pathwayScore: {
    alignItems: 'flex-end',
  },
  pathwayScoreValue: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.primary,
  },
  pathwayScoreLabel: {
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  pathwayProgress: {
    height: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.secondarySoft,
  },
  pathwayProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  pathwayAction: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  pathwayActionTitle: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  pathwayActionText: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
    padding: spacing.sm,
    minHeight: 68,
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  measureList: {
    gap: spacing.sm,
  },
  measureCard: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  measureTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  measureLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  measureMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  measureValue: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  measureDate: {
    fontSize: typography.sizeXs,
    color: colors.subtle,
  },
  emptyCard: {
    padding: 0,
  },
  actions: {
    marginTop: spacing.sm,
  },
});

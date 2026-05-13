import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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

const HISTORY_LIMIT = 8;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function formatPrimaryParts(results: AssessmentResults | null | undefined): { value: string; unit: string | null } {
  const record = asRecord(results);
  const v = record?.primaryValue;
  const u = record?.primaryUnit;
  if (v == null || !Number.isFinite(Number(v))) return { value: '—', unit: null };
  const n = Number(v);
  const formatted = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return {
    value: formatted,
    unit: typeof u === 'string' && u.trim() ? u.trim() : null,
  };
}

function formatDate(iso: string | null | undefined): string {
  const date = new Date(iso ?? '');
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatCompactDate(iso: string | null | undefined): string {
  const date = new Date(iso ?? '');
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short',
  });
}

function getStringField(record: unknown, keys: string[]): string | null {
  const safeRecord = asRecord(record);
  if (!safeRecord) return null;
  for (const key of keys) {
    const value = safeRecord[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function formatMetaLabel(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAssessmentMetaLabel(assessment: Assessment): string | null {
  const inputs = assessment.inputs;
  const resultMeta = asRecord(assessment.results)?.meta;
  const label = getStringField(inputs, ['variant', 'pace', 'condition', 'mode', 'testType'])
    ?? getStringField(resultMeta, ['variant', 'pace', 'condition', 'mode', 'testType']);
  return label ? formatMetaLabel(label) : null;
}

function getInterpretation(results: AssessmentResults | null | undefined): string {
  const interpretation = asRecord(results)?.interpretation;
  return typeof interpretation === 'string' ? interpretation.trim() : '';
}

function getPatientClinicalLabel(patient: Patient): string | null {
  return patient.diagnosis ?? patient.condition ?? null;
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

function AssessmentHistoryCard({ assessment }: { assessment: Assessment }) {
  const measureName = MEASURES[assessment.measure]?.name ?? assessment.measure;
  const measureShortName = MEASURES[assessment.measure]?.id ?? assessment.measure;
  const primary = formatPrimaryParts(assessment.results);
  const interpretation = getInterpretation(assessment.results);
  const metaLabel = getAssessmentMetaLabel(assessment);

  return (
    <Card style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <View style={styles.historyTitleGroup}>
          <Text style={styles.historyMeasure}>{measureShortName}</Text>
          <Text style={styles.historyMeasureName}>{measureName}</Text>
        </View>
        <Text style={styles.historyDate}>{formatDate(assessment.created_at)}</Text>
      </View>
      <View style={styles.historyResultRow}>
        <Text style={styles.historyValue}>{primary.value}</Text>
        {primary.unit ? <Text style={styles.historyUnit}>{primary.unit}</Text> : null}
      </View>
      {(interpretation || metaLabel) ? (
        <View style={styles.historyPillRow}>
          {interpretation ? (
            <View style={styles.interpretationPill}>
              <Text style={styles.interpretationText}>{interpretation}</Text>
            </View>
          ) : null}
          {metaLabel ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{metaLabel}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
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
  const hasLoadedPatientData = useRef(false);

  useFocusEffect(useCallback(() => {
    let isActive = true;

    if (!hasLoadedPatientData.current) {
      setIsLoading(true);
    }
    setError(null);

    Promise.all([getPatient(patientId), getAssessmentsForPatient(patientId)])
      .then(([p, assessments]) => {
        if (!isActive) return;
        setPatient(p);
        setAssessments(assessments);
        setLatest(getLatestPerMeasure(assessments));
        setAssessmentCount(assessments.length);
        setLatestAssessmentDate(getLatestDate(assessments));
      })
      .catch(() => {
        if (!isActive) return;
        setError('Unable to load patient data.');
      })
      .finally(() => {
        if (!isActive) return;
        hasLoadedPatientData.current = true;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [patientId]));

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
  const recentHistory = assessments.slice(0, HISTORY_LIMIT);
  const clinicalLabel = patient ? getPatientClinicalLabel(patient) : null;

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
              {clinicalLabel ? (
                <Text style={styles.condition}>{clinicalLabel}</Text>
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
          <View style={styles.pathwayExplanation}>
            <Text style={styles.pathwayExplanationTitle}>What this means</Text>
            <Text style={styles.pathwayExplanationText}>{pathway.explanation.detail}</Text>
            <Text style={styles.pathwayCaution}>{pathway.explanation.caution}</Text>
          </View>
          {pathwayActions.map(action => (
            <View key={`${action.type}-${action.measureId ?? action.label}`} style={styles.pathwayAction}>
              <Text style={styles.pathwayActionTitle}>{action.label}</Text>
              <Text style={styles.pathwayActionText}>{action.detail}</Text>
            </View>
          ))}
        </Card>

        <SectionLabel>Recent Assessment History</SectionLabel>

        {recentHistory.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              title="No assessment history yet"
              hint="Save an assessment to build this patient's mobile history."
            />
          </Card>
        ) : (
          <View style={styles.historyList}>
            {recentHistory.map(a => <AssessmentHistoryCard key={a.id} assessment={a} />)}
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
  pathwayExplanation: {
    borderWidth: 1,
    borderColor: colors.secondarySoft,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  pathwayExplanationTitle: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: colors.primary,
    letterSpacing: typography.trackingWide,
    textTransform: 'uppercase',
  },
  pathwayExplanationText: {
    fontSize: typography.sizeSm,
    color: colors.ink,
    lineHeight: 20,
  },
  pathwayCaution: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    lineHeight: 17,
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
  historyList: {
    gap: spacing.sm,
  },
  historyCard: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  historyTitleGroup: {
    flex: 1,
  },
  historyMeasure: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  historyMeasureName: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  historyDate: {
    fontSize: typography.sizeXs,
    color: colors.subtle,
    marginTop: 2,
  },
  historyResultRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  historyValue: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  historyUnit: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.muted,
  },
  historyPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  interpretationPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
  },
  interpretationText: {
    fontSize: typography.sizeSm,
    color: colors.ink,
  },
  metaPill: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaPillText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
  },
  emptyCard: {
    padding: 0,
  },
  actions: {
    marginTop: spacing.sm,
  },
});

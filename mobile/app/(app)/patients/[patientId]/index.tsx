import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getPatient } from '../../../../src/supabase/patients';
import { getAssessmentsForPatient } from '../../../../src/supabase/assessments';
import type { Patient, Assessment, AssessmentResults } from '../../../../src/types/domain';
import { Screen } from '../../../../src/components/ui/Screen';
import { Card } from '../../../../src/components/ui/Card';
import { SectionLabel } from '../../../../src/components/ui/SectionLabel';
import { Button } from '../../../../src/components/ui/Button';
import { MEASURES } from '../../../../src/clinical/adapter';
import { colors, spacing, typography } from '../../../../src/theme/tokens';

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

function getLatestPerMeasure(assessments: Assessment[]): Assessment[] {
  const seen = new Set<string>();
  return assessments.filter(a => {
    if (seen.has(a.measure)) return false;
    seen.add(a.measure);
    return true;
  });
}

function MeasureRow({ assessment }: { assessment: Assessment }) {
  const measureName = MEASURES[assessment.measure]?.name ?? assessment.measure;
  return (
    <Card style={styles.measureCard}>
      <Text style={styles.measureLabel}>{measureName}</Text>
      <View style={styles.measureMeta}>
        <Text style={styles.measureValue}>{formatPrimary(assessment.results)}</Text>
        <Text style={styles.measureDate}>{formatDate(assessment.created_at)}</Text>
      </View>
    </Card>
  );
}

const PATIENT_AVATAR_SIZE = 52;

function getInitials(raw: string): string {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PatientSummaryScreen() {
  const params = useLocalSearchParams<{ patientId: string }>();
  const patientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [latest, setLatest] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPatient(patientId), getAssessmentsForPatient(patientId)])
      .then(([p, assessments]) => {
        setPatient(p);
        setLatest(getLatestPerMeasure(assessments));
      })
      .catch(() => setError('Unable to load patient data.'))
      .finally(() => setIsLoading(false));
  }, [patientId]);

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      </Screen>
    );
  }

  if (error || !patient) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Patient not found.'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backLinkText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back to patients">
        <Text style={styles.backButtonText}>← Patients</Text>
      </TouchableOpacity>

      <View style={styles.patientHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(patient.initials)}</Text>
        </View>
        <View>
          <Text style={styles.initials}>{patient.initials}</Text>
          {patient.condition ? <Text style={styles.condition}>{patient.condition}</Text> : null}
        </View>
      </View>

      <SectionLabel>Recorded Measures</SectionLabel>

      {latest.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No measures recorded yet.</Text>
          <Text style={styles.emptyHint}>Tap New Assessment to record the first measure.</Text>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: PATIENT_AVATAR_SIZE,
    height: PATIENT_AVATAR_SIZE,
    borderRadius: PATIENT_AVATAR_SIZE / 2,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  initials: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  condition: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  measureList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  measureCard: {
    gap: spacing.xs,
  },
  measureLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.muted,
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
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: typography.sizeMd,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  emptyHint: {
    fontSize: typography.sizeSm,
    color: colors.subtle,
    textAlign: 'center',
  },
  actions: {
    marginTop: spacing.md,
  },
});

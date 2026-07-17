import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore - JS clinical module, no type declarations
import { calc30STS } from '@clinical/sts30';
import { getPatient } from '../../supabase/patients';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { NavyHeader } from '../ui/NavyHeader';
import { Button } from '../ui/Button';
import { AssessmentPatientCard } from './AssessmentPatientCard';
import { MskResultCard } from './MskResultCard';
import { NumericClinicalInput } from './NumericClinicalInput';
import { useAssessmentSave } from './useAssessmentSave';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface STS30Result {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: Record<string, unknown>;
}

function parseStandCount(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const count = Number(trimmed);
  if (!Number.isInteger(count) || count < 0 || count > 60) return null;
  return count;
}

function validateStandCount(input: string): string | null {
  if (!input.trim()) return 'Enter the number of stands completed.';
  const count = Number(input.trim());
  if (!Number.isInteger(count)) return 'Stands must be a whole number.';
  if (count < 0) return 'Stands cannot be negative.';
  if (count > 60) return 'Check the count. The maximum accepted value is 60.';
  return null;
}

function getAge(patient: Patient | null): number | null {
  if (!patient?.dob_year) return null;
  return new Date().getFullYear() - patient.dob_year;
}

function getNormCaption(result: STS30Result, age: number | null, gender: string | null | undefined): string {
  const norm = result.meta.normRange;
  if (norm && typeof norm === 'object' && 'lo' in norm && 'hi' in norm) {
    const range = norm as { lo: number; hi: number };
    return `Age norm ${range.lo}-${range.hi} | Age ${age ?? '-'}`;
  }
  if (age && (gender === 'M' || gender === 'F')) return `Age ${age} | No age norm for this age band`;
  return 'Add birth year and sex for age-norm comparison';
}

export function STS30Form({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [standsInput, setStandsInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  const age = getAge(patient);
  const gender = patient?.gender ?? null;
  const standCount = parseStandCount(standsInput);

  const result = useMemo(() => {
    if (standCount === null) return null;
    return calc30STS({ stands: standCount, age, gender }) as STS30Result | null;
  }, [age, gender, standCount]);

  const buildPayload = useCallback(() => {
    if (!result || standCount === null) return null;
    return {
      inputs: { stands: standCount, age, gender },
      results: result as unknown as Record<string, unknown>,
    };
  }, [age, gender, result, standCount]);

  const {
    saveState,
    saveError,
    handleSave,
    resetSaveState,
    saveDisabled,
  } = useAssessmentSave({ patientId, measure: '30STS', buildPayload });

  function handleChange(text: string) {
    resetSaveState();
    setError(null);
    setStandsInput(text);
  }

  function handleBlur() {
    setError(validateStandCount(standsInput));
  }

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title="30STS" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <AssessmentPatientCard patient={patient} />

        <View style={styles.intro}>
          <Text style={styles.title}>30-Second Sit to Stand</Text>
          <Text style={styles.prompt}>
            Count full stands completed in 30 seconds with arms crossed over the chest.
          </Text>
        </View>

        <View style={styles.inputCard}>
          <NumericClinicalInput
            label="FULL STANDS"
            value={standsInput}
            onChangeText={handleChange}
            onBlur={handleBlur}
            unit="stands"
            error={error ?? undefined}
          />
        </View>

        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>
            Use a standard chair, keep the setup consistent, and stop if safety or symptoms change. Higher count indicates better lower-limb functional strength.
          </Text>
        </View>

        {result ? (
          <>
            <MskResultCard
              result={result}
              label="30STS RESULT"
              caption={getNormCaption(result, age, gender)}
            />
            {saveState === 'saved' ? (
              <View style={styles.savedBanner}>
                <Text style={styles.savedText}>Result saved</Text>
              </View>
            ) : (
              <>
                <Button
                  label="Save Result"
                  onPress={handleSave}
                  loading={saveState === 'saving'}
                  disabled={saveDisabled}
                />
                {(saveState === 'error' || saveState === 'timed-out') && saveError ? (
                  <Text style={styles.saveErrorText}>{saveError}</Text>
                ) : null}
              </>
            )}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
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
  intro: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  prompt: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: 19,
  },
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  infoPanel: {
    backgroundColor: colors.panel,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  infoText: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: 19,
  },
  savedBanner: {
    backgroundColor: colors.secondarySoft,
    borderRadius: radii.card,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  savedText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
  },
  saveErrorText: {
    fontSize: typography.sizeSm,
    color: colors.coral,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
  },
});

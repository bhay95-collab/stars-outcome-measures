import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore - JS clinical module, no type declarations
import { calcLESS, LESS_MAX_ERRORS } from '@clinical/less';
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

interface LESSResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: Record<string, unknown>;
}

function parseErrors(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const errors = Number(trimmed);
  if (!Number.isInteger(errors) || errors < 0 || errors > LESS_MAX_ERRORS) return null;
  return errors;
}

function validateErrors(input: string): string | null {
  if (!input.trim()) return 'Enter the total landing error count.';
  const errors = Number(input.trim());
  if (!Number.isInteger(errors)) return 'Errors must be a whole number.';
  if (errors < 0) return 'Errors cannot be negative.';
  if (errors > LESS_MAX_ERRORS) return `Errors cannot be greater than ${LESS_MAX_ERRORS}.`;
  return null;
}

export function LESSForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [errorsInput, setErrorsInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  const errors = parseErrors(errorsInput);
  const result = useMemo(() => {
    if (errors === null) return null;
    return calcLESS({ errors }) as LESSResult | null;
  }, [errors]);

  const buildPayload = useCallback(() => {
    if (!result || errors === null) return null;
    return {
      inputs: { errors },
      results: result as unknown as Record<string, unknown>,
    };
  }, [errors, result]);

  const {
    saveState,
    saveError,
    handleSave,
    resetSaveState,
    saveDisabled,
  } = useAssessmentSave({ patientId, measure: 'LESS', buildPayload });

  function handleChange(text: string) {
    resetSaveState();
    setError(null);
    setErrorsInput(text);
  }

  function handleBlur() {
    setError(validateErrors(errorsInput));
  }

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title="LESS" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <AssessmentPatientCard patient={patient} />

        <View style={styles.intro}>
          <Text style={styles.title}>Landing Error Scoring System</Text>
          <Text style={styles.prompt}>
            Enter the total drop-vertical-jump landing error count from the clinician rating.
          </Text>
        </View>

        <View style={styles.inputCard}>
          <NumericClinicalInput
            label="TOTAL ERRORS"
            value={errorsInput}
            onChangeText={handleChange}
            onBlur={handleBlur}
            unit={`/ ${LESS_MAX_ERRORS}`}
            error={error ?? undefined}
          />
        </View>

        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>
            LESS totals range from 0 to {LESS_MAX_ERRORS}. Higher error count indicates poorer landing mechanics. Less than 5 errors is the supportive RTS context.
          </Text>
        </View>

        {result ? (
          <>
            <MskResultCard
              result={result}
              label="LESS RESULT"
              caption={`Total landing errors out of ${LESS_MAX_ERRORS}`}
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

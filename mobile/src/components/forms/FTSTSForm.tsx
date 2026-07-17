import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore - JS clinical module, no type declarations
import { calcFTSTS } from '@clinical/ftsts';
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

interface FTSTSResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: Record<string, unknown>;
}

function parseTime(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const seconds = Number(trimmed);
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 300) return null;
  return seconds;
}

function validateTime(input: string): string | null {
  if (!input.trim()) return 'Enter the time to complete five stands.';
  const seconds = Number(input.trim());
  if (!Number.isFinite(seconds)) return 'Time must be a number.';
  if (seconds <= 0) return 'Time must be greater than 0 seconds.';
  if (seconds > 300) return 'Check the time. The maximum accepted value is 300 seconds.';
  return null;
}

export function FTSTSForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [timeInput, setTimeInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  const time = parseTime(timeInput);
  const result = useMemo(() => {
    if (time === null) return null;
    return calcFTSTS({ time }) as FTSTSResult | null;
  }, [time]);

  const buildPayload = useCallback(() => {
    if (!result || time === null) return null;
    return {
      inputs: { time },
      results: result as unknown as Record<string, unknown>,
    };
  }, [result, time]);

  const {
    saveState,
    saveError,
    handleSave,
    resetSaveState,
    saveDisabled,
  } = useAssessmentSave({ patientId, measure: 'FTSTS', buildPayload });

  function handleChange(text: string) {
    resetSaveState();
    setError(null);
    setTimeInput(text);
  }

  function handleBlur() {
    setError(validateTime(timeInput));
  }

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title="FTSTS" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <AssessmentPatientCard patient={patient} />

        <View style={styles.intro}>
          <Text style={styles.title}>Five Times Sit to Stand</Text>
          <Text style={styles.prompt}>
            Time five full sit-to-stand repetitions from a standard chair with arms crossed.
          </Text>
        </View>

        <View style={styles.inputCard}>
          <NumericClinicalInput
            label="TIME"
            value={timeInput}
            onChangeText={handleChange}
            onBlur={handleBlur}
            unit="sec"
            error={error ?? undefined}
          />
        </View>

        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>
            Keep chair height, footwear, aids, and guarding consistent. Lower time indicates better transitional movement performance.
          </Text>
        </View>

        {result ? (
          <>
            <MskResultCard
              result={result}
              label="FTSTS RESULT"
              caption="Lower time indicates better performance"
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

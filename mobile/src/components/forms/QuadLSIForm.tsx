import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore - JS clinical module, no type declarations
import { calcQuadLSI } from '@clinical/quadLSI';
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

interface QuadLSIResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: Record<string, unknown>;
}

function parseNumber(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function validateInvolved(input: string): string | null {
  if (!input.trim()) return 'Enter involved limb strength.';
  const value = Number(input.trim());
  if (!Number.isFinite(value)) return 'Strength must be a number.';
  if (value < 0) return 'Strength cannot be negative.';
  return null;
}

function validateUninvolved(input: string): string | null {
  if (!input.trim()) return 'Enter uninvolved limb strength.';
  const value = Number(input.trim());
  if (!Number.isFinite(value)) return 'Strength must be a number.';
  if (value <= 0) return 'Uninvolved strength must be greater than 0.';
  return null;
}

export function QuadLSIForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [involvedInput, setInvolvedInput] = useState('');
  const [uninvolvedInput, setUninvolvedInput] = useState('');
  const [involvedError, setInvolvedError] = useState<string | null>(null);
  const [uninvolvedError, setUninvolvedError] = useState<string | null>(null);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  const involved = parseNumber(involvedInput);
  const uninvolved = parseNumber(uninvolvedInput);

  const result = useMemo(() => {
    if (involved === null || uninvolved === null) return null;
    return calcQuadLSI({ involved, uninvolved }) as QuadLSIResult | null;
  }, [involved, uninvolved]);

  const buildPayload = useCallback(() => {
    if (!result || involved === null || uninvolved === null) return null;
    return {
      inputs: { involved, uninvolved },
      results: result as unknown as Record<string, unknown>,
    };
  }, [involved, result, uninvolved]);

  const {
    saveState,
    saveError,
    handleSave,
    resetSaveState,
    saveDisabled,
  } = useAssessmentSave({ patientId, measure: 'QuadLSI', buildPayload });

  function handleInvolvedChange(text: string) {
    resetSaveState();
    setInvolvedError(null);
    setInvolvedInput(text);
  }

  function handleUninvolvedChange(text: string) {
    resetSaveState();
    setUninvolvedError(null);
    setUninvolvedInput(text);
  }

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title="QuadLSI" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <AssessmentPatientCard patient={patient} />

        <View style={styles.intro}>
          <Text style={styles.title}>Quadriceps Strength LSI</Text>
          <Text style={styles.prompt}>
            Enter peak quadriceps strength for both limbs using the same unit.
          </Text>
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputGrid}>
            <View style={styles.inputCell}>
              <NumericClinicalInput
                label="INVOLVED"
                value={involvedInput}
                onChangeText={handleInvolvedChange}
                onBlur={() => setInvolvedError(validateInvolved(involvedInput))}
                error={involvedError ?? undefined}
              />
            </View>
            <View style={styles.inputCell}>
              <NumericClinicalInput
                label="UNINVOLVED"
                value={uninvolvedInput}
                onChangeText={handleUninvolvedChange}
                onBlur={() => setUninvolvedError(validateUninvolved(uninvolvedInput))}
                error={uninvolvedError ?? undefined}
              />
            </View>
          </View>
          <Text style={styles.helperText}>
            Use the same unit for both limbs: Nm, kg, N, or your local dynamometry unit.
          </Text>
        </View>

        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>
            LSI = involved divided by uninvolved multiplied by 100. The RTS strength cut-off is 90 percent, but LSI alone does not clear return to sport.
          </Text>
        </View>

        {result ? (
          <>
            <MskResultCard
              result={result}
              label="QUAD LSI RESULT"
              caption={`Involved ${involved ?? '-'} | Uninvolved ${uninvolved ?? '-'}`}
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
  content: { padding: spacing.md, gap: spacing.md },
  intro: { gap: spacing.xs, paddingHorizontal: spacing.xs },
  title: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  prompt: { fontSize: typography.sizeSm, color: colors.muted, lineHeight: 19 },
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputCell: {
    flex: 1,
  },
  helperText: { fontSize: typography.sizeSm, color: colors.muted, lineHeight: 19 },
  infoPanel: {
    backgroundColor: colors.panel,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  infoText: { fontSize: typography.sizeSm, color: colors.muted, lineHeight: 19 },
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

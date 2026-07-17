import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcNPRS, NPRS_CONTEXT_OPTIONS } from '@clinical/nprs';
import { getPatient } from '../../supabase/patients';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { NavyHeader } from '../ui/NavyHeader';
import { Button } from '../ui/Button';
import { AssessmentPatientCard } from './AssessmentPatientCard';
import { MskResultCard } from './MskResultCard';
import { useAssessmentSave } from './useAssessmentSave';
import { ChoiceChipRow } from './fields/ChoiceChipRow';
import type { ChoiceChipOption, ChoiceChipValue } from './fields/ChoiceChipRow';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface NPRSContextOption {
  value: string;
  label: string;
}

interface NPRSResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: Record<string, unknown>;
}

const SCORE_OPTIONS: ChoiceChipOption[] = Array.from({ length: 11 }, (_, value) => ({ value }));
const CONTEXT_LABELS: Record<string, string> = {
  current: 'Current',
  average24h: 'Average',
  worst24h: 'Worst',
  best24h: 'Best',
};

export function NPRSForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [context, setContext] = useState('current');

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  const result = useMemo(() => {
    return score !== null ? calcNPRS({ score, context }) as NPRSResult | null : null;
  }, [context, score]);

  const buildPayload = useCallback(() => {
    if (!result || score === null) return null;
    return {
      inputs: { score, context },
      results: result as unknown as Record<string, unknown>,
    };
  }, [context, result, score]);

  const {
    saveState,
    saveError,
    handleSave,
    resetSaveState,
    saveDisabled,
  } = useAssessmentSave({ patientId, measure: 'NPRS', buildPayload });

  function handleContext(value: ChoiceChipValue) {
    resetSaveState();
    setContext(String(value));
  }

  function handleScore(value: ChoiceChipValue) {
    resetSaveState();
    setScore(Number(value));
  }

  const contextOptions: ChoiceChipOption[] = (NPRS_CONTEXT_OPTIONS as NPRSContextOption[]).map(option => ({
    value: option.value,
    displayLabel: CONTEXT_LABELS[option.value] ?? option.label,
    label: option.label,
  }));
  const contextLabel = (NPRS_CONTEXT_OPTIONS as NPRSContextOption[])
    .find(option => option.value === context)?.label ?? 'Current pain';

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title="NPRS" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <AssessmentPatientCard patient={patient} />

        <View style={styles.intro}>
          <Text style={styles.title}>Numeric Pain Rating Scale</Text>
          <Text style={styles.prompt}>Record the same pain context at reassessment so change is comparable.</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>PAIN BEING RATED</Text>
          <ChoiceChipRow
            options={contextOptions}
            selected={context}
            onSelect={handleContext}
            label="Pain context"
            wrap
          />
          <Text style={styles.helperText}>{contextLabel}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>PAIN INTENSITY</Text>
          <Text style={styles.helperText}>0 = no pain. 10 = worst pain imaginable.</Text>
          <ChoiceChipRow
            options={SCORE_OPTIONS}
            selected={score}
            onSelect={handleScore}
            label="Pain intensity from 0 to 10"
            wrap
          />
        </View>

        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>
            NPRS: 0 no pain, 1-3 mild, 4-6 moderate, 7-10 severe. MCID is approximately 2 points or about 30 percent reduction.
          </Text>
        </View>

        {result ? (
          <>
            <MskResultCard
              result={result}
              label="NPRS RESULT"
              caption={String(result.meta.contextLabel ?? contextLabel)}
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
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
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

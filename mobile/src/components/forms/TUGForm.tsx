import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcTUG } from '@clinical/tug';
import { getPatient } from '../../supabase/patients';
import { saveAssessment } from '../../supabase/assessments';
import { useAuth } from '../../auth/AuthProvider';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { Card } from '../ui/Card';
import { NavyHeader } from '../ui/NavyHeader';
import { PatientAvatar } from '../ui/PatientAvatar';
import { Button } from '../ui/Button';
import { NumericClinicalInput } from './NumericClinicalInput';
import { ResultPreviewCard } from './ResultPreviewCard';
import { SegmentedControl } from './SegmentedControl';
import { ClinicalTimer } from './ClinicalTimer';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { ACTION_TIMEOUT_MS } from '../../utils/withTimeout';

interface TUGResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { classColor: string; fallRisk: boolean };
}

type SaveState = 'idle' | 'saving' | 'timed-out' | 'saved' | 'error';

const TUG_VARIANTS = ['TUG', 'TUG Fast', 'TUG Dual'];

function validateTime(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return 'Enter a time to calculate';
  const num = Number(trimmed);
  if (isNaN(num)) return 'Please enter a valid number';
  if (num <= 0) return 'Time must be greater than 0';
  return null;
}

export function TUGForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [variantIndex, setVariantIndex] = useState(0);
  const [timeInput, setTimeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TUGResult | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [timerResetSignal, setTimerResetSignal] = useState(0);

  useEffect(() => {
    getPatient(patientId)
      .then(p => setPatient(p))
      .catch(() => null);
  }, [patientId]);

  function resetSaveState() {
    setSaveState('idle');
    setSaveError(null);
  }

  function handleVariantChange(idx: number) {
    setVariantIndex(idx);
    setResult(null);
    resetSaveState();
  }

  function handleChange(text: string) {
    setTimeInput(text);
    setError(null);
    setResult(null);
    resetSaveState();
  }

  function resetTimingInputs() {
    setTimeInput('');
    setError(null);
    setResult(null);
    setTimerResetSignal(signal => signal + 1);
  }

  function handleBlur() {
    const validationError = validateTime(timeInput);
    if (validationError) {
      setError(validationError);
      return;
    }
    const r = calcTUG({ time: Number(timeInput.trim()), fastTime: null, dualTime: null }) as TUGResult | null;
    if (r) setResult(r);
  }

  function handleUseTime(seconds: number) {
    const text = seconds.toFixed(1);
    setTimeInput(text);
    setError(null);
    resetSaveState();
    const r = calcTUG({ time: seconds, fastTime: null, dualTime: null }) as TUGResult | null;
    if (r) setResult(r);
  }

  async function handleSave() {
    if (saveState === 'saving' || saveState === 'timed-out' || !result) return;

    const time = Number(timeInput.trim());
    const variant = TUG_VARIANTS[variantIndex];
    if (!isFinite(time) || time <= 0 || !variant) return;

    if (!user) {
      setSaveError('Your session has expired. Please sign in again.');
      setSaveState('error');
      return;
    }

    setSaveState('saving');
    setSaveError(null);

    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      setSaveState('timed-out');
      setSaveError('Save timed out. Your result may not have been saved. Check your connection before trying again.');
    }, ACTION_TIMEOUT_MS);

    try {
      await saveAssessment({
        patient_id: patientId,
        measure: 'TUG',
        inputs: { variant, time },
        results: {
          ...result,
          meta: {
            ...result.meta,
            encounterDate: new Date().toISOString(),
          },
        },
      });
      clearTimeout(timeoutId);
      if (!timedOut) {
        resetTimingInputs();
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 3000);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      if (!timedOut) {
        setSaveError(e instanceof Error ? e.message : 'Unable to save result. Please try again.');
        setSaveState('error');
      }
    }
  }

  const avatarName = patient?.initials ?? '?';
  const resultLabel = TUG_VARIANTS[variantIndex].toUpperCase();

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        mode="nav"
        leftLabel="‹"
        onLeft={() => router.back()}
        title="Timed Up and Go"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.patientCard}>
          <PatientAvatar name={avatarName} size="sm" />
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient?.initials ?? '…'}</Text>
            {patient?.condition ? (
              <Text style={styles.patientSub} numberOfLines={1}>{patient.condition}</Text>
            ) : null}
          </View>
        </Card>

        <Card>
          <Text style={styles.trialHeading}>Trial 1</Text>

          <SegmentedControl
            options={TUG_VARIANTS}
            selectedIndex={variantIndex}
            onSelect={handleVariantChange}
          />

          <View style={styles.divider} />

          <ClinicalTimer onUseTime={handleUseTime} resetSignal={timerResetSignal} />

          <View style={styles.divider} />

          <NumericClinicalInput
            label="TIME (SECONDS)"
            value={timeInput}
            onChangeText={handleChange}
            onBlur={handleBlur}
            unit="sec"
            error={error ?? undefined}
          />
        </Card>

        {saveState === 'saved' && result === null ? (
          <View style={styles.savedBanner}>
            <Text style={styles.savedText}>Result saved</Text>
          </View>
        ) : null}

        {result !== null ? (
          <>
            <ResultPreviewCard result={result} label={resultLabel} />
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
                  disabled={saveState === 'saving' || saveState === 'timed-out'}
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
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  patientInfo: { flex: 1 },
  patientName: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  patientSub: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  trialHeading: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
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

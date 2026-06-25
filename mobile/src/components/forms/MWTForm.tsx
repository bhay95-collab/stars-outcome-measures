import React, { useState, useEffect } from 'react';
import { useMountedRef } from '../../hooks/useMountedRef';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPatient } from '../../supabase/patients';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { Card } from '../ui/Card';
import { NavyHeader } from '../ui/NavyHeader';
import { PatientAvatar } from '../ui/PatientAvatar';
import { NumericClinicalInput } from './NumericClinicalInput';
import { SegmentedControl } from './SegmentedControl';
import { ClinicalTimer } from './ClinicalTimer';
import { ThreeBarMotif } from '../ui/ThreeBarMotif';
import { saveAssessment } from '../../supabase/assessments';
import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../ui/Button';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { ACTION_TIMEOUT_MS } from '../../utils/withTimeout';

type SaveState = 'idle' | 'saving' | 'timed-out' | 'saved' | 'error';

interface MWTResult {
  pace: string;
  time: number;
  speed: number;
  interpretation: string;
  steps: number | null;
  stepLength: number | null;
  cadence: number | null;
}

interface MWTErrors {
  time?: string;
}

const MWT_PACES = ['Comfortable', 'Fast'] as const;

function deriveClassColor(speed: number): 'red' | 'amber' | 'green' {
  if (speed < 0.4) return 'red';
  if (speed < 1.2) return 'amber';
  return 'green';
}

function buildMWTSaveResults(r: MWTResult, encounterDate: string): Record<string, unknown> {
  return {
    primaryValue: r.speed,
    primaryUnit: 'm/s',
    interpretation: r.interpretation,
    meta: {
      classColor: deriveClassColor(r.speed),
      pace: r.pace,
      steps: r.steps,
      stepLength: r.stepLength,
      cadence: r.cadence,
      encounterDate,
    },
  };
}

function classifySpeed(speed: number): string {
  if (speed < 0.4) return 'Household ambulator';
  if (speed < 0.8) return 'Limited community ambulator';
  if (speed < 1.2) return 'Community ambulator';
  return 'Full community ambulator';
}

function computeMWT(
  distanceStr: string,
  timeStr: string,
  stepsStr: string,
  paceIndex: number,
): MWTResult | null {
  const distance = Number(distanceStr.trim());
  const time = Number(timeStr.trim());
  if (!isFinite(distance) || distance <= 0) return null;
  if (!isFinite(time) || time <= 0) return null;

  const speed = parseFloat((distance / time).toFixed(3));
  const stepsRaw = stepsStr.trim() ? Number(stepsStr.trim()) : null;
  const steps =
    stepsRaw !== null && isFinite(stepsRaw) && stepsRaw > 0 ? stepsRaw : null;

  return {
    pace: MWT_PACES[paceIndex] ?? MWT_PACES[0],
    time,
    speed,
    interpretation: classifySpeed(speed),
    steps,
    stepLength: steps !== null ? parseFloat((distance / steps).toFixed(3)) : null,
    cadence: steps !== null ? parseFloat(((steps / time) * 60).toFixed(1)) : null,
  };
}

export function MWTForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [paceIndex, setPaceIndex] = useState(0);
  const [timeInput, setTimeInput] = useState('');
  const [stepsInput, setStepsInput] = useState('');
  const [errors, setErrors] = useState<MWTErrors>({});
  const [result, setResult] = useState<MWTResult | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [timerResetSignal, setTimerResetSignal] = useState(0);

  const mountedRef = useMountedRef();

  useEffect(() => {
    getPatient(patientId)
      .then(p => setPatient(p))
      .catch(() => null);
  }, [patientId]);


  function resetSaveState() {
    setSaveState('idle');
    setSaveError(null);
  }

  function handlePaceChange(idx: number) {
    setPaceIndex(idx);
    setResult(null);
    resetSaveState();
  }

  function handleTimeChange(text: string) {
    setTimeInput(text);
    setResult(null);
    setErrors(prev => ({ ...prev, time: undefined }));
    resetSaveState();
  }

  function handleStepsChange(text: string) {
    setStepsInput(text);
    setResult(null);
    resetSaveState();
  }

  function resetTimingInputs() {
    setTimeInput('');
    setStepsInput('');
    setErrors({});
    setResult(null);
    setTimerResetSignal(signal => signal + 1);
  }

  async function handleSave() {
    if (saveState === 'saving' || saveState === 'timed-out' || !result) return;

    const time = Number(timeInput.trim());
    if (!isFinite(time) || time <= 0) return;

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
      if (mountedRef.current) {
        setSaveState('timed-out');
        setSaveError('Save timed out. Your result may not have been saved. Check your connection before trying again.');
      }
    }, ACTION_TIMEOUT_MS);

    try {
      await saveAssessment({
        patient_id: patientId,
        measure: '10MWT',
        inputs: { pace: result.pace, time: result.time, steps: result.steps ?? null },
        results: buildMWTSaveResults(result, new Date().toISOString()),
      });
      clearTimeout(timeoutId);
      if (!timedOut) {
        resetTimingInputs();
        setSaveState('saved');
        setTimeout(() => { if (mountedRef.current) setSaveState('idle'); }, 3000);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      if (!timedOut && mountedRef.current) {
        setSaveError(e instanceof Error ? e.message : 'Unable to save result. Please try again.');
        setSaveState('error');
      }
    }
  }

  function handleTimeBlur() {
    const timeNum = Number(timeInput.trim());
    if (!timeInput.trim()) {
      setErrors(prev => ({ ...prev, time: 'Enter a time to calculate' }));
      return;
    }
    if (!isFinite(timeNum) || timeNum <= 0) {
      setErrors(prev => ({ ...prev, time: 'Please enter a valid number' }));
      return;
    }
    setErrors(prev => ({ ...prev, time: undefined }));
    const r = computeMWT('10', timeInput, stepsInput, paceIndex);
    if (r) setResult(r);
  }

  function handleUseTime(seconds: number) {
    const text = seconds.toFixed(1);
    setTimeInput(text);
    setErrors(prev => ({ ...prev, time: undefined }));
    resetSaveState();
    const r = computeMWT('10', text, stepsInput, paceIndex);
    if (r) setResult(r);
  }

  function handleStepsBlur() {
    const timeNum = Number(timeInput.trim());
    if (!isFinite(timeNum) || timeNum <= 0) return;
    const r = computeMWT('10', timeInput, stepsInput, paceIndex);
    if (r) setResult(r);
  }

  const avatarName = patient?.initials ?? '?';
  const paceLabel = (MWT_PACES[paceIndex] ?? MWT_PACES[0]).toUpperCase();

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        mode="nav"
        leftLabel="‹"
        onLeft={() => router.back()}
        title="10 Metre Walk Test"
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
          <Text style={styles.trialHeading}>10MWT</Text>

          <Text style={styles.fieldLabel}>PACE</Text>
          <SegmentedControl
            options={[...MWT_PACES]}
            selectedIndex={paceIndex}
            onSelect={handlePaceChange}
          />

          <View style={styles.divider} />

          <ClinicalTimer onUseTime={handleUseTime} resetSignal={timerResetSignal} />

          <View style={styles.divider} />

          <NumericClinicalInput
            label="TIME (SECONDS)"
            value={timeInput}
            onChangeText={handleTimeChange}
            onBlur={handleTimeBlur}
            unit="sec"
            error={errors.time}
          />

          <View style={styles.divider} />

          <NumericClinicalInput
            label="STEPS (OPTIONAL)"
            value={stepsInput}
            onChangeText={handleStepsChange}
            onBlur={handleStepsBlur}
            unit="steps"
          />
        </Card>

        {saveState === 'saved' && result === null ? (
          <View style={styles.savedBanner}>
            <Text style={styles.savedText}>Result saved</Text>
          </View>
        ) : null}

        {result !== null ? (
          <>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewLabel}>{paceLabel} RESULT</Text>
                <ThreeBarMotif size="sm" tone="soft" />
              </View>

              <View style={styles.valueRow}>
                <Text style={styles.primaryValue}>{result.speed.toFixed(2)}</Text>
                <Text style={styles.primaryUnit}>m/s</Text>
              </View>

              <View style={styles.interpPill}>
                <Text style={styles.interpText}>{result.interpretation}</Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaGrid}>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>TIME</Text>
                  <Text style={styles.metaValue}>{result.time} sec</Text>
                </View>
                {result.steps !== null ? (
                  <View style={styles.metaCell}>
                    <Text style={styles.metaLabel}>STEPS</Text>
                    <Text style={styles.metaValue}>{result.steps}</Text>
                  </View>
                ) : null}
                {result.stepLength !== null ? (
                  <View style={styles.metaCell}>
                    <Text style={styles.metaLabel}>STEP LENGTH</Text>
                    <Text style={styles.metaValue}>{result.stepLength.toFixed(2)} m</Text>
                  </View>
                ) : null}
                {result.cadence !== null ? (
                  <View style={styles.metaCell}>
                    <Text style={styles.metaLabel}>CADENCE</Text>
                    <Text style={styles.metaValue}>{result.cadence.toFixed(1)} spm</Text>
                  </View>
                ) : null}
              </View>
            </View>
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
  fieldLabel: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
    marginBottom: spacing.sm,
  },
  previewCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  previewLabel: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  primaryValue: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.actionBlue,
  },
  primaryUnit: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  interpPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  interpText: {
    fontSize: typography.sizeSm,
    color: colors.ink,
  },
  metaDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaCell: {
    minWidth: '44%',
    flex: 1,
    gap: spacing.xs,
  },
  metaLabel: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    letterSpacing: typography.trackingWide,
  },
  metaValue: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
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

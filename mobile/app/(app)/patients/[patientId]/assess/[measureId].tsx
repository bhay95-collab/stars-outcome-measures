import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcTUG } from '@clinical/tug';
import { MEASURES } from '../../../../../src/clinical/adapter';
import { getPatient } from '../../../../../src/supabase/patients';
import type { Patient } from '../../../../../src/types/domain';
import { Screen } from '../../../../../src/components/ui/Screen';
import { Card } from '../../../../../src/components/ui/Card';
import { NavyHeader } from '../../../../../src/components/ui/NavyHeader';
import { PatientAvatar } from '../../../../../src/components/ui/PatientAvatar';
import { NumericClinicalInput } from '../../../../../src/components/forms/NumericClinicalInput';
import { ResultPreviewCard } from '../../../../../src/components/forms/ResultPreviewCard';
import { SegmentedControl } from '../../../../../src/components/forms/SegmentedControl';
import { ClinicalTimer } from '../../../../../src/components/forms/ClinicalTimer';
import { colors, spacing, typography, radii } from '../../../../../src/theme/tokens';

const TUG_ID = 'TUG';
const HIMAT_ID = 'HiMAT';
const MWT_ID = '10MWT';

const TUG_VARIANTS = ['TUG', 'TUG Fast', 'TUG Dual'];
const MWT_PACES = ['Comfortable', 'Fast'] as const;

// --- TUG types ---

interface TUGResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { classColor: string; fallRisk: boolean };
}

// --- 10MWT types ---

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

// --- shared helpers ---

function validateTime(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return 'Enter a time to calculate';
  const num = Number(trimmed);
  if (isNaN(num)) return 'Please enter a valid number';
  if (num <= 0) return 'Time must be greater than 0';
  return null;
}

// --- 10MWT helpers ---

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

// --- TUG form ---

function TUGForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [variantIndex, setVariantIndex] = useState(0);
  const [timeInput, setTimeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TUGResult | null>(null);

  useEffect(() => {
    getPatient(patientId)
      .then(p => setPatient(p))
      .catch(() => null);
  }, [patientId]);

  function handleVariantChange(idx: number) {
    setVariantIndex(idx);
    setResult(null);
  }

  function handleChange(text: string) {
    setTimeInput(text);
    setError(null);
    setResult(null);
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
    const r = calcTUG({ time: seconds, fastTime: null, dualTime: null }) as TUGResult | null;
    if (r) setResult(r);
  }

  const avatarName = patient?.initials ?? '?';
  const resultLabel = TUG_VARIANTS[variantIndex].toUpperCase();

  return (
    <Screen padded={false} rootBackground={colors.primary} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        mode="nav"
        leftLabel="← Back"
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

          <ClinicalTimer onUseTime={handleUseTime} />

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

        {result !== null ? (
          <ResultPreviewCard result={result} label={resultLabel} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

// --- 10MWT form ---

function MWTForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [paceIndex, setPaceIndex] = useState(0);
  const [timeInput, setTimeInput] = useState('');
  const [stepsInput, setStepsInput] = useState('');
  const [errors, setErrors] = useState<MWTErrors>({});
  const [result, setResult] = useState<MWTResult | null>(null);

  useEffect(() => {
    getPatient(patientId)
      .then(p => setPatient(p))
      .catch(() => null);
  }, [patientId]);

  function handlePaceChange(idx: number) {
    setPaceIndex(idx);
    setResult(null);
  }

  function handleTimeChange(text: string) {
    setTimeInput(text);
    setResult(null);
    setErrors(prev => ({ ...prev, time: undefined }));
  }

  function handleStepsChange(text: string) {
    setStepsInput(text);
    setResult(null);
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
    <Screen padded={false} rootBackground={colors.primary} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        mode="nav"
        leftLabel="← Back"
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

          <Text style={styles.mwtFieldLabel}>PACE</Text>
          <SegmentedControl
            options={[...MWT_PACES]}
            selectedIndex={paceIndex}
            onSelect={handlePaceChange}
          />

          <View style={styles.divider} />

          <ClinicalTimer onUseTime={handleUseTime} />

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

        {result !== null ? (
          <View style={styles.mwtPreviewCard}>
            <Text style={styles.mwtMicroLabel}>{paceLabel} RESULT</Text>

            <View style={styles.mwtValueRow}>
              <Text style={styles.mwtPrimaryValue}>{result.speed.toFixed(2)}</Text>
              <Text style={styles.mwtPrimaryUnit}>m/s</Text>
            </View>

            <View style={styles.mwtInterpPill}>
              <Text style={styles.mwtInterpText}>{result.interpretation}</Text>
            </View>

            <View style={styles.mwtDivider} />

            <View style={styles.mwtMetaGrid}>
              <View style={styles.mwtMetaCell}>
                <Text style={styles.mwtMetaLabel}>TIME</Text>
                <Text style={styles.mwtMetaValue}>{result.time} sec</Text>
              </View>
              {result.steps !== null ? (
                <View style={styles.mwtMetaCell}>
                  <Text style={styles.mwtMetaLabel}>STEPS</Text>
                  <Text style={styles.mwtMetaValue}>{result.steps}</Text>
                </View>
              ) : null}
              {result.stepLength !== null ? (
                <View style={styles.mwtMetaCell}>
                  <Text style={styles.mwtMetaLabel}>STEP LENGTH</Text>
                  <Text style={styles.mwtMetaValue}>{result.stepLength.toFixed(2)} m</Text>
                </View>
              ) : null}
              {result.cadence !== null ? (
                <View style={styles.mwtMetaCell}>
                  <Text style={styles.mwtMetaLabel}>CADENCE</Text>
                  <Text style={styles.mwtMetaValue}>{result.cadence.toFixed(1)} spm</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

// --- route dispatcher ---

export default function AssessScreen() {
  const params = useLocalSearchParams<{ patientId: string; measureId: string }>();
  const measureId = Array.isArray(params.measureId) ? params.measureId[0] : params.measureId;
  const patientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;

  if (measureId === TUG_ID) {
    return <TUGForm patientId={patientId} />;
  }

  if (measureId === MWT_ID) {
    return <MWTForm patientId={patientId} />;
  }

  const measure = MEASURES[measureId];

  return (
    <Screen padded={false}>
      <NavyHeader leftLabel="← Back" onLeft={() => router.back()} />
      <View style={styles.stubContent}>
        {measure ? (
          <>
            <Text style={styles.measureName}>{measure.name}</Text>
            <Text style={styles.measureCategory}>{measure.category.toUpperCase()}</Text>
            <Card style={styles.messageCard}>
              <Text style={styles.messageText}>
                {measureId === HIMAT_ID
                  ? 'HiMAT is not yet available on mobile.'
                  : 'Assessment form coming soon.'}
              </Text>
            </Card>
          </>
        ) : (
          <Card style={styles.messageCard}>
            <Text style={styles.messageText}>Measure not found.</Text>
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  patientInfo: {
    flex: 1,
  },
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
  // Stub (other measures)
  stubContent: {
    flex: 1,
    padding: spacing.md,
  },
  measureName: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  measureCategory: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  messageCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  messageText: {
    fontSize: typography.sizeMd,
    color: colors.muted,
    textAlign: 'center',
  },
  // 10MWT input card
  mwtFieldLabel: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  // 10MWT result preview
  mwtPreviewCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  mwtMicroLabel: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    letterSpacing: 1,
  },
  mwtValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  mwtPrimaryValue: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.actionBlue,
  },
  mwtPrimaryUnit: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  mwtInterpPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  mwtInterpText: {
    fontSize: typography.sizeSm,
    color: colors.ink,
  },
  mwtDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  mwtMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mwtMetaCell: {
    minWidth: '44%',
    flex: 1,
    gap: spacing.xs,
  },
  mwtMetaLabel: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    letterSpacing: 1,
  },
  mwtMetaValue: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
});

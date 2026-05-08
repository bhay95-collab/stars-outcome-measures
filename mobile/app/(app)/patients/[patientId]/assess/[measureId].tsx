import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcTUG } from '@clinical/tug';
// @ts-ignore — JS clinical module, no type declarations
import { calcFAC } from '@clinical/fac';
import { BBSForm } from '../../../../../src/components/forms/BBSForm';
import { PASSForm } from '../../../../../src/components/forms/PASSForm';
import { TISForm } from '../../../../../src/components/forms/TISForm';
import { MASForm }  from '../../../../../src/components/forms/MASForm';
import { COVSForm } from '../../../../../src/components/forms/COVSForm';
import { FGAForm }  from '../../../../../src/components/forms/FGAForm';
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
import { SixMinuteCountdown } from '../../../../../src/components/forms/SixMinuteCountdown';
import type { SixMWTTimerStatus } from '../../../../../src/components/forms/SixMinuteCountdown';
import { colors, spacing, typography, radii } from '../../../../../src/theme/tokens';

const TUG_ID = 'TUG';
const HIMAT_ID = 'HiMAT';
const MWT_ID = '10MWT';
const SMWT_ID = '6MWT';
const FAC_ID = 'FAC';
const BBS_ID = 'BBS';
const PASS_ID = 'PASS';
const TIS_ID  = 'TIS';
const MAS_ID  = 'MAS';
const COVS_ID = 'COVS';
const FGA_ID  = 'FGA';

const TUG_VARIANTS = ['TUG', 'TUG Fast', 'TUG Dual'];
const MWT_PACES = ['Comfortable', 'Fast'] as const;
const LAP_LENGTHS = [10, 20, 25, 30, 50] as const;
const ASSISTIVE_DEVICES = ['None', 'Cane', 'Walker', 'Crutches', 'Other'] as const;

const FAC_LEVELS = [
  { label: 'Non-functional ambulator',      classColor: 'red'   },
  { label: 'Dependent — level 2 assist',    classColor: 'red'   },
  { label: 'Dependent — level 1 assist',    classColor: 'amber' },
  { label: 'Dependent — supervision',       classColor: 'amber' },
  { label: 'Independent on level surfaces', classColor: 'green' },
  { label: 'Fully independent ambulator',   classColor: 'green' },
] as const;

const FAC_COLOR_MAP: Record<string, string> = {
  red:   '#ee8a70',
  amber: '#a05c00',
  green: '#107C10',
};

// --- TUG types ---

interface TUGResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { classColor: string; fallRisk: boolean };
}

// --- FAC types ---

interface FACResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { classColor: 'red' | 'amber' | 'green' };
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

// --- 6MWT form ---

function SixMWTForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [timerStatus, setTimerStatus] = useState<SixMWTTimerStatus>('idle');
  const [lapLengthIndex, setLapLengthIndex] = useState(2); // default 25 m
  const [lapCount, setLapCount] = useState(0);
  const [manualDistance, setManualDistance] = useState('');
  const [deviceIndex, setDeviceIndex] = useState(0);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  const lapLength = LAP_LENGTHS[lapLengthIndex] ?? LAP_LENGTHS[2];
  const lapDerived = lapCount * lapLength;

  const validManualDistance = (() => {
    const n = Number(manualDistance.trim());
    return manualDistance.trim() && isFinite(n) && n > 0 ? n : null;
  })();

  const recordedDistance = validManualDistance ?? lapDerived;
  const speedMps =
    recordedDistance > 0 ? parseFloat((recordedDistance / 360).toFixed(3)) : null;
  const showResult = timerStatus !== 'idle' && recordedDistance > 0;

  return (
    <Screen padded={false} rootBackground={colors.primary} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        mode="nav"
        leftLabel="‹"
        onLeft={() => router.back()}
        title="6 Minute Walk Test"
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
          <PatientAvatar name={patient?.initials ?? '?'} size="sm" />
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient?.initials ?? '…'}</Text>
            {patient?.condition ? (
              <Text style={styles.patientSub} numberOfLines={1}>{patient.condition}</Text>
            ) : null}
          </View>
        </Card>

        <Card>
          <Text style={styles.trialHeading}>Timer</Text>
          <SixMinuteCountdown onStatusChange={setTimerStatus} />
        </Card>

        <Card>
          <Text style={styles.trialHeading}>Laps</Text>
          <Text style={styles.mwtFieldLabel}>LAP LENGTH</Text>
          <SegmentedControl
            options={LAP_LENGTHS.map(l => `${l}m`)}
            selectedIndex={lapLengthIndex}
            onSelect={setLapLengthIndex}
          />
          <View style={styles.divider} />
          <Text style={styles.mwtFieldLabel}>LAP COUNT</Text>
          <View style={styles.smwtStepper}>
            <Pressable
              style={({ pressed }) => [
                styles.smwtStepBtn,
                lapCount === 0 && styles.smwtStepBtnDisabled,
                pressed && styles.smwtStepBtnPressed,
              ]}
              onPress={() => setLapCount(c => Math.max(0, c - 1))}
              disabled={lapCount === 0}
              accessibilityRole="button"
              accessibilityLabel="Decrease lap count"
            >
              <Text style={styles.smwtStepBtnText}>−</Text>
            </Pressable>
            <Text style={styles.smwtStepValue}>{lapCount}</Text>
            <Pressable
              style={({ pressed }) => [styles.smwtStepBtn, pressed && styles.smwtStepBtnPressed]}
              onPress={() => setLapCount(c => c + 1)}
              accessibilityRole="button"
              accessibilityLabel="Increase lap count"
            >
              <Text style={styles.smwtStepBtnText}>+</Text>
            </Pressable>
          </View>
          {lapCount > 0 ? (
            <Text style={styles.smwtDerivedLabel}>{lapDerived} m calculated</Text>
          ) : null}
        </Card>

        <Card>
          <Text style={styles.trialHeading}>Optional</Text>
          <NumericClinicalInput
            label="MANUAL DISTANCE (OVERRIDES LAPS)"
            value={manualDistance}
            onChangeText={setManualDistance}
            unit="m"
          />
          <View style={styles.divider} />
          <Text style={styles.mwtFieldLabel}>ASSISTIVE DEVICE</Text>
          <SegmentedControl
            options={[...ASSISTIVE_DEVICES]}
            selectedIndex={deviceIndex}
            onSelect={setDeviceIndex}
          />
        </Card>

        {showResult ? (
          <View style={styles.mwtPreviewCard}>
            <Text style={styles.mwtMicroLabel}>6MWT RESULT</Text>
            <View style={styles.mwtValueRow}>
              <Text style={styles.mwtPrimaryValue}>{recordedDistance}</Text>
              <Text style={styles.mwtPrimaryUnit}>m</Text>
            </View>
            <View style={styles.mwtDivider} />
            <View style={styles.mwtMetaGrid}>
              <View style={styles.mwtMetaCell}>
                <Text style={styles.mwtMetaLabel}>SPEED</Text>
                <Text style={styles.mwtMetaValue}>
                  {speedMps !== null ? `${speedMps.toFixed(2)} m/s` : '—'}
                </Text>
              </View>
              <View style={styles.mwtMetaCell}>
                <Text style={styles.mwtMetaLabel}>LAPS</Text>
                <Text style={styles.mwtMetaValue}>
                  {lapCount > 0 ? `${lapCount} × ${lapLength}m` : '—'}
                </Text>
              </View>
              {deviceIndex > 0 ? (
                <View style={styles.mwtMetaCell}>
                  <Text style={styles.mwtMetaLabel}>AID</Text>
                  <Text style={styles.mwtMetaValue}>{ASSISTIVE_DEVICES[deviceIndex]}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

// --- FAC form ---

function FACForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [result, setResult] = useState<FACResult | null>(null);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  function handleSelectLevel(level: number) {
    setSelectedLevel(level);
    const r = calcFAC({ level }) as FACResult | null;
    if (r) setResult(r);
  }

  return (
    <Screen padded={false} rootBackground={colors.primary} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        mode="nav"
        leftLabel="‹"
        onLeft={() => router.back()}
        title="Functional Ambulation"
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
          <PatientAvatar name={patient?.initials ?? '?'} size="sm" />
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient?.initials ?? '…'}</Text>
            {patient?.condition ? (
              <Text style={styles.patientSub} numberOfLines={1}>{patient.condition}</Text>
            ) : null}
          </View>
        </Card>

        <Card>
          <Text style={styles.trialHeading}>Classification</Text>
          <Text style={styles.mwtFieldLabel}>SELECT LEVEL</Text>
          <View style={styles.facLevelList}>
            {FAC_LEVELS.map(({ label }, idx) => {
              const isSelected = selectedLevel === idx;
              return (
                <Pressable
                  key={idx}
                  onPress={() => handleSelectLevel(idx)}
                  style={({ pressed }) => [
                    styles.facLevelRow,
                    idx < FAC_LEVELS.length - 1 && styles.facLevelRowBorder,
                    isSelected && styles.facLevelRowSelected,
                    pressed && styles.facLevelRowPressed,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`FAC level ${idx}: ${label}`}
                >
                  <View style={[styles.facLevelBadge, isSelected && styles.facLevelBadgeSelected]}>
                    <Text style={[styles.facLevelBadgeText, isSelected && styles.facLevelBadgeTextSelected]}>
                      {idx}
                    </Text>
                  </View>
                  <Text style={[styles.facLevelLabel, isSelected && styles.facLevelLabelSelected]}>
                    {label}
                  </Text>
                  {isSelected ? (
                    <Text style={styles.facLevelCheck}>✓</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Card>

        {result !== null ? (
          <View style={styles.mwtPreviewCard}>
            <Text style={styles.mwtMicroLabel}>FAC RESULT</Text>
            <View style={styles.mwtValueRow}>
              <Text style={styles.mwtPrimaryValue}>{result.primaryValue}</Text>
              <Text style={styles.mwtPrimaryUnit}>{result.primaryUnit}</Text>
              <View style={[
                styles.facColorDot,
                { backgroundColor: FAC_COLOR_MAP[result.meta.classColor] ?? colors.muted },
              ]} />
            </View>
            <View style={styles.mwtInterpPill}>
              <Text style={styles.mwtInterpText}>{result.interpretation}</Text>
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

  if (measureId === SMWT_ID) {
    return <SixMWTForm patientId={patientId} />;
  }

  if (measureId === FAC_ID) {
    return <FACForm patientId={patientId} />;
  }

  if (measureId === BBS_ID) {
    return <BBSForm patientId={patientId} />;
  }

  if (measureId === PASS_ID) {
    return <PASSForm patientId={patientId} />;
  }

  if (measureId === TIS_ID) {
    return <TISForm patientId={patientId} />;
  }

  if (measureId === MAS_ID) {
    return <MASForm patientId={patientId} />;
  }

  if (measureId === COVS_ID) {
    return <COVSForm patientId={patientId} />;
  }

  if (measureId === FGA_ID) {
    return <FGAForm patientId={patientId} />;
  }

  const measure = MEASURES[measureId];

  return (
    <Screen padded={false}>
      <NavyHeader leftLabel="‹" onLeft={() => router.back()} />
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
  // FAC level picker
  facLevelList: {
    gap: 0,
  },
  facLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    minHeight: 52,
    gap: spacing.sm,
  },
  facLevelRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  facLevelRowSelected: {
    backgroundColor: colors.primarySoft,
  },
  facLevelRowPressed: {
    opacity: 0.65,
  },
  facLevelBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facLevelBadgeSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  facLevelBadgeText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
    color: colors.muted,
  },
  facLevelBadgeTextSelected: {
    color: '#FFFFFF',
  },
  facLevelLabel: {
    flex: 1,
    fontSize: typography.sizeMd,
    color: colors.ink,
  },
  facLevelLabelSelected: {
    fontWeight: typography.weightSemibold,
    color: colors.actionBlue,
  },
  facLevelCheck: {
    fontSize: typography.sizeMd,
    color: colors.actionBlue,
    fontWeight: typography.weightBold,
  },
  facColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: spacing.xs,
    alignSelf: 'center',
  },
  // 6MWT lap stepper
  smwtStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  smwtStepBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smwtStepBtnDisabled: {
    opacity: 0.35,
  },
  smwtStepBtnPressed: {
    opacity: 0.65,
  },
  smwtStepBtnText: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.actionBlue,
    lineHeight: 26,
  },
  smwtStepValue: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.ink,
    minWidth: 48,
    textAlign: 'center',
  },
  smwtDerivedLabel: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
});

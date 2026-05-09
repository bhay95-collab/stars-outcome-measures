import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
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
import { SixMinuteCountdown } from './SixMinuteCountdown';
import type { SixMWTTimerStatus } from './SixMinuteCountdown';
import { ThreeBarMotif } from '../ui/ThreeBarMotif';
// @ts-ignore — JS clinical module, no type declarations
import { calc6MWT } from '@clinical/sixmwt';
import { saveAssessment } from '../../supabase/assessments';
import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../ui/Button';
import { colors, spacing, typography, radii } from '../../theme/tokens';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface SixMWTResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { classColor: string };
}

const LAP_LENGTHS = [10, 20, 25, 30, 50] as const;
const ASSISTIVE_DEVICES = ['None', 'Cane', 'Walker', 'Crutches', 'Other'] as const;

export function SixMWTForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [timerStatus, setTimerStatus] = useState<SixMWTTimerStatus>('idle');
  const [lapLengthIndex, setLapLengthIndex] = useState(2); // default 25 m
  const [lapCount, setLapCount] = useState(0);
  const [manualDistance, setManualDistance] = useState('');
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  function resetSaveState() {
    setSaveState('idle');
    setSaveError(null);
  }

  function handleTimerStatusChange(status: SixMWTTimerStatus) {
    setTimerStatus(status);
    resetSaveState();
  }

  function handleLapLengthChange(idx: number) {
    setLapLengthIndex(idx);
    resetSaveState();
  }

  function handleLapCountDecrement() {
    setLapCount(c => Math.max(0, c - 1));
    resetSaveState();
  }

  function handleLapCountIncrement() {
    setLapCount(c => c + 1);
    resetSaveState();
  }

  function handleManualDistanceChange(text: string) {
    setManualDistance(text);
    resetSaveState();
  }

  function handleDeviceChange(idx: number) {
    setDeviceIndex(idx);
    resetSaveState();
  }

  async function handleSave() {
    if (saveState === 'saving' || !showResult) return;

    if (!user) {
      setSaveError('Your session has expired. Please sign in again.');
      setSaveState('error');
      return;
    }

    setSaveState('saving');
    setSaveError(null);

    try {
      // @ts-ignore — age/gender/height/weight are optional in the clinical module
      const r = calc6MWT({ distance: recordedDistance }) as SixMWTResult;
      await saveAssessment({
        patient_id: patientId,
        measure: '6MWT',
        inputs: {
          distanceM: recordedDistance,
          lapCount,
          lapLengthM: lapLength,
          manualOverride: validManualDistance !== null,
          assistiveDevice: ASSISTIVE_DEVICES[deviceIndex],
        },
        results: {
          ...r,
          meta: { ...r.meta, encounterDate: new Date().toISOString() },
        },
      });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Unable to save result. Please try again.');
      setSaveState('error');
    }
  }

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
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
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
          <SixMinuteCountdown onStatusChange={handleTimerStatusChange} />
        </Card>

        <Card>
          <Text style={styles.trialHeading}>Laps</Text>
          <Text style={styles.fieldLabel}>LAP LENGTH</Text>
          <SegmentedControl
            options={LAP_LENGTHS.map(l => `${l}m`)}
            selectedIndex={lapLengthIndex}
            onSelect={handleLapLengthChange}
          />
          <View style={styles.divider} />
          <Text style={styles.fieldLabel}>LAP COUNT</Text>
          <View style={styles.stepper}>
            <Pressable
              style={({ pressed }) => [
                styles.stepBtn,
                lapCount === 0 && styles.stepBtnDisabled,
                pressed && styles.stepBtnPressed,
              ]}
              onPress={handleLapCountDecrement}
              disabled={lapCount === 0}
              accessibilityRole="button"
              accessibilityLabel="Decrease lap count"
            >
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepValue}>{lapCount}</Text>
            <Pressable
              style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}
              onPress={handleLapCountIncrement}
              accessibilityRole="button"
              accessibilityLabel="Increase lap count"
            >
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>
          {lapCount > 0 ? (
            <Text style={styles.derivedLabel}>{lapDerived} m calculated</Text>
          ) : null}
        </Card>

        <Card>
          <Text style={styles.trialHeading}>Optional</Text>
          <NumericClinicalInput
            label="MANUAL DISTANCE (OVERRIDES LAPS)"
            value={manualDistance}
            onChangeText={handleManualDistanceChange}
            unit="m"
          />
          <View style={styles.divider} />
          <Text style={styles.fieldLabel}>ASSISTIVE DEVICE</Text>
          <SegmentedControl
            options={[...ASSISTIVE_DEVICES]}
            selectedIndex={deviceIndex}
            onSelect={handleDeviceChange}
          />
        </Card>

        {showResult ? (
          <>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewLabel}>6MWT RESULT</Text>
                <ThreeBarMotif size="sm" tone="soft" />
              </View>
              <View style={styles.valueRow}>
                <Text style={styles.primaryValue}>{recordedDistance}</Text>
                <Text style={styles.primaryUnit}>m</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaGrid}>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>SPEED</Text>
                  <Text style={styles.metaValue}>
                    {speedMps !== null ? `${speedMps.toFixed(2)} m/s` : '—'}
                  </Text>
                </View>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>LAPS</Text>
                  <Text style={styles.metaValue}>
                    {lapCount > 0 ? `${lapCount} × ${lapLength}m` : '—'}
                  </Text>
                </View>
                {deviceIndex > 0 ? (
                  <View style={styles.metaCell}>
                    <Text style={styles.metaLabel}>AID</Text>
                    <Text style={styles.metaValue}>{ASSISTIVE_DEVICES[deviceIndex]}</Text>
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
                  disabled={saveState === 'saving'}
                />
                {saveState === 'error' && saveError ? (
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { opacity: 0.35 },
  stepBtnPressed: { opacity: 0.65 },
  stepBtnText: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.actionBlue,
    lineHeight: 26,
  },
  stepValue: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.ink,
    minWidth: 48,
    textAlign: 'center',
  },
  derivedLabel: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    marginTop: spacing.xs,
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

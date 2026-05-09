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
import { colors, spacing, typography, radii } from '../../theme/tokens';

const LAP_LENGTHS = [10, 20, 25, 30, 50] as const;
const ASSISTIVE_DEVICES = ['None', 'Cane', 'Walker', 'Crutches', 'Other'] as const;

export function SixMWTForm({ patientId }: { patientId: string }) {
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
          <SixMinuteCountdown onStatusChange={setTimerStatus} />
        </Card>

        <Card>
          <Text style={styles.trialHeading}>Laps</Text>
          <Text style={styles.fieldLabel}>LAP LENGTH</Text>
          <SegmentedControl
            options={LAP_LENGTHS.map(l => `${l}m`)}
            selectedIndex={lapLengthIndex}
            onSelect={setLapLengthIndex}
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
              onPress={() => setLapCount(c => Math.max(0, c - 1))}
              disabled={lapCount === 0}
              accessibilityRole="button"
              accessibilityLabel="Decrease lap count"
            >
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepValue}>{lapCount}</Text>
            <Pressable
              style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}
              onPress={() => setLapCount(c => c + 1)}
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
            onChangeText={setManualDistance}
            unit="m"
          />
          <View style={styles.divider} />
          <Text style={styles.fieldLabel}>ASSISTIVE DEVICE</Text>
          <SegmentedControl
            options={[...ASSISTIVE_DEVICES]}
            selectedIndex={deviceIndex}
            onSelect={setDeviceIndex}
          />
        </Card>

        {showResult ? (
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
});

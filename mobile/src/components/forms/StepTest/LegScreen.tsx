import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../ui/Screen';
import { Card } from '../../ui/Card';
import { NavyHeader } from '../../ui/NavyHeader';
import { PatientAvatar } from '../../ui/PatientAvatar';
import { NumericClinicalInput } from '../NumericClinicalInput';
import type { Patient } from '../../../types/domain';
import type { LegInput } from './types';
import { colors, spacing, typography, radii } from '../../../theme/tokens';

interface LegScreenProps {
  legLabel: string;
  stepLabel: string;
  input: LegInput;
  onChange: (input: LegInput) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
  patient: Patient | null;
  stepHeight?: string;
  onStepHeightChange?: (v: string) => void;
  savedNotice?: boolean;
}

type TimerStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'complete';

const DURATION_MS = 15_000;

function formatMmSs(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function LegScreen({
  legLabel, stepLabel, input, onChange, onNext, onBack, canProceed, patient,
  stepHeight, onStepHeightChange, savedNotice,
}: LegScreenProps) {
  const insets = useSafeAreaInsets();
  const [remainingMs, setRemainingMs] = useState(DURATION_MS);
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle');
  const [manualText, setManualText] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetRef  = useRef(0);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startInterval(remaining: number) {
    targetRef.current = Date.now() + remaining;
    intervalRef.current = setInterval(() => {
      const left = Math.max(0, targetRef.current - Date.now());
      setRemainingMs(left);
      if (left === 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setTimerStatus('complete');
      }
    }, 50);
  }

  function start() {
    if (input.steps === null) {
      onChange({ ...input, steps: 0 });
    }
    startInterval(remainingMs);
    setTimerStatus('running');
  }

  function pause() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimerStatus('paused');
  }

  function resume() {
    startInterval(remainingMs);
    setTimerStatus('running');
  }

  function stop() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimerStatus('stopped');
  }

  function reset() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRemainingMs(DURATION_MS);
    setTimerStatus('idle');
    setManualText('');
    onChange({ ...input, steps: null });
  }

  function handleUnable(next: boolean) {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRemainingMs(DURATION_MS);
    setTimerStatus('idle');
    setManualText('');
    onChange({ unable: next, steps: null });
  }

  function handleIncrement() {
    onChange({ ...input, steps: (input.steps ?? 0) + 1 });
  }

  function handleDecrement() {
    onChange({ ...input, steps: Math.max(0, (input.steps ?? 0) - 1) });
  }

  function handleManualChange(text: string) {
    setManualText(text);
    const n = parseInt(text.trim(), 10);
    if (!isNaN(n) && n >= 0) {
      onChange({ ...input, steps: n });
    }
  }

  const isComplete   = timerStatus === 'complete';
  const isRunning    = timerStatus === 'running';
  const isPaused     = timerStatus === 'paused';
  const isActive     = isRunning || isPaused;
  const isDone       = timerStatus === 'stopped' || isComplete;
  const canIncrement = !input.unable && isActive;
  const canDecrement = !input.unable && (input.steps ?? 0) > 0;

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={onBack} title="Step Test" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
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
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>{stepLabel}</Text>
          </View>
        </Card>

        {savedNotice ? (
          <View style={styles.savedBanner}>
            <Text style={styles.savedText}>Result saved</Text>
          </View>
        ) : null}

        {stepHeight !== undefined && onStepHeightChange !== undefined ? (
          <Card>
            <NumericClinicalInput
              label="STEP HEIGHT"
              value={stepHeight}
              onChangeText={onStepHeightChange}
              unit="cm"
            />
          </Card>
        ) : null}

        <View style={styles.instructionCard}>
          <Text style={styles.instructionLabel}>NOW TESTING</Text>
          <Text style={styles.instructionText}>{legLabel}</Text>
        </View>

        {input.unable ? (
          <Card style={styles.unableNote}>
            <Text style={styles.unableNoteText}>Score recorded as 0</Text>
          </Card>
        ) : (
          <>
            <Card>
              <Text style={styles.microLabel}>15-SECOND TIMER</Text>
              <View style={styles.timerDisplay}>
                <Text
                  style={[
                    styles.timerText,
                    isRunning  && styles.timerRunning,
                    isComplete && styles.timerComplete,
                  ]}
                >
                  {formatMmSs(isComplete ? 0 : remainingMs)}
                </Text>
              </View>
              <View style={styles.timerControls}>
                {timerStatus === 'idle' && (
                  <Pressable
                    onPress={start}
                    style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.btnPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Start 15-second timer"
                  >
                    <Text style={styles.btnTextLight}>Start</Text>
                  </Pressable>
                )}
                {isRunning && (
                  <View style={styles.btnRow}>
                    <Pressable
                      onPress={pause}
                      style={({ pressed }) => [styles.btn, styles.btnOutline, styles.btnFlex, pressed && styles.btnPressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Pause timer"
                    >
                      <Text style={styles.btnTextDark}>Pause</Text>
                    </Pressable>
                    <Pressable
                      onPress={stop}
                      style={({ pressed }) => [styles.btn, styles.btnStop, styles.btnStopFixed, pressed && styles.btnPressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Stop test early"
                    >
                      <Text style={styles.btnTextLight}>Stop</Text>
                    </Pressable>
                  </View>
                )}
                {isPaused && (
                  <View style={styles.btnRow}>
                    <Pressable
                      onPress={resume}
                      style={({ pressed }) => [styles.btn, styles.btnPrimary, styles.btnFlex, pressed && styles.btnPressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Resume timer"
                    >
                      <Text style={styles.btnTextLight}>Resume</Text>
                    </Pressable>
                    <Pressable
                      onPress={stop}
                      style={({ pressed }) => [styles.btn, styles.btnStop, styles.btnStopFixed, pressed && styles.btnPressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Stop test early"
                    >
                      <Text style={styles.btnTextLight}>Stop</Text>
                    </Pressable>
                  </View>
                )}
                {isDone && (
                  <Pressable
                    onPress={reset}
                    style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.btnPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Reset timer"
                  >
                    <Text style={styles.btnTextDark}>Reset</Text>
                  </Pressable>
                )}
              </View>
            </Card>

            <Card style={styles.counterCard}>
              <Text style={styles.microLabel}>STEP COUNT</Text>
              <Text style={styles.countDisplay}>{input.steps ?? 0}</Text>
              <Text style={styles.countUnit}>steps</Text>
              <View style={styles.counterBtnRow}>
                <Pressable
                  onPress={handleDecrement}
                  disabled={!canDecrement}
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnDecrement,
                    !canDecrement && styles.btnDisabled,
                    pressed && canDecrement && styles.btnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Remove one step"
                >
                  <Text style={[styles.btnTextDark, !canDecrement && styles.btnTextDisabled]}>−</Text>
                </Pressable>
                <Pressable
                  onPress={handleIncrement}
                  disabled={!canIncrement}
                  style={({ pressed }) => [
                    styles.btnIncrement,
                    styles.btnFlex,
                    !canIncrement && styles.btnDisabled,
                    pressed && canIncrement && styles.btnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Add one step"
                >
                  <Text style={[styles.btnIncrementText, !canIncrement && styles.btnTextDisabled]}>
                    + STEP
                  </Text>
                </Pressable>
              </View>
            </Card>

            <Card>
              <NumericClinicalInput
                label="MANUAL COUNT (OVERRIDE)"
                value={manualText}
                onChangeText={handleManualChange}
                unit="steps"
              />
            </Card>
          </>
        )}

        <Pressable
          onPress={() => handleUnable(!input.unable)}
          style={({ pressed }) => [
            styles.unableToggle,
            input.unable && styles.unableToggleActive,
            pressed && styles.unableTogglePressed,
          ]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: input.unable }}
          accessibilityLabel="Unable to stand unsupported"
        >
          <View style={[styles.toggleIndicator, input.unable && styles.toggleIndicatorActive]}>
            {input.unable ? <Text style={styles.toggleCheck}>✓</Text> : null}
          </View>
          <Text style={[styles.unableLabel, input.unable && styles.unableLabelActive]}>
            Unable to stand unsupported
          </Text>
        </Pressable>

        <Pressable
          onPress={onNext}
          disabled={!canProceed}
          style={({ pressed }) => [
            styles.nextBtn,
            !canProceed && styles.nextBtnDisabled,
            pressed && canProceed && styles.nextBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Next"
        >
          <Text style={styles.nextBtnText}>Next</Text>
        </Pressable>
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
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
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
  stepPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
  },
  stepPillText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
    letterSpacing: typography.trackingWide,
  },
  instructionCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  instructionLabel: {
    fontSize: typography.sizeXs,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: typography.trackingWide,
    fontWeight: typography.weightSemibold,
  },
  instructionText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  unableNote: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.secondarySoft,
  },
  unableNoteText: {
    fontSize: typography.sizeSm,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    textAlign: 'center',
  },
  microLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
    letterSpacing: typography.trackingWide,
    marginBottom: spacing.xs,
  },
  timerDisplay: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  timerText: {
    fontSize: 56,
    fontWeight: typography.weightBold,
    color: colors.ink,
    lineHeight: 64,
    letterSpacing: -1,
  },
  timerRunning: {
    color: colors.actionBlue,
  },
  timerComplete: {
    color: colors.success,
  },
  timerControls: {
    gap: spacing.xs,
  },
  btn: {
    height: 48,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btnFlex: {
    flex: 1,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnStop: {
    backgroundColor: colors.coral,
  },
  btnStopFixed: {
    width: 88,
  },
  btnOutline: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  btnPressed: {
    opacity: 0.75,
  },
  btnDisabled: {
    opacity: 0.3,
  },
  btnTextLight: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: '#FFFFFF',
  },
  btnTextDark: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightMedium,
    color: colors.ink,
  },
  btnTextDisabled: {
    color: colors.muted,
  },
  counterCard: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  countDisplay: {
    fontSize: 80,
    fontWeight: typography.weightBold,
    color: colors.ink,
    lineHeight: 88,
    letterSpacing: -2,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  countUnit: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  counterBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  btnDecrement: {
    width: 56,
    height: 64,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0,
  },
  btnIncrement: {
    height: 64,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  btnIncrementText: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: '#FFFFFF',
    letterSpacing: typography.trackingWide,
  },
  unableToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  unableToggleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  unableTogglePressed: {
    opacity: 0.7,
  },
  toggleIndicator: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIndicatorActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleCheck: {
    fontSize: typography.sizeXs,
    color: '#FFFFFF',
    fontWeight: typography.weightBold,
    lineHeight: 14,
  },
  unableLabel: {
    flex: 1,
    fontSize: typography.sizeMd,
    color: colors.muted,
  },
  unableLabelActive: {
    color: colors.primary,
    fontWeight: typography.weightSemibold,
  },
  nextBtn: {
    height: 52,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.35,
  },
  nextBtnPressed: {
    opacity: 0.8,
  },
  nextBtnText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: '#FFFFFF',
  },
});

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../ui/Screen';
import { Card } from '../../ui/Card';
import { NavyHeader } from '../../ui/NavyHeader';
import { PatientAvatar } from '../../ui/PatientAvatar';
import { NumericClinicalInput } from '../NumericClinicalInput';
import type { Patient } from '../../../types/domain';
import type { StepInput } from './types';
import { colors, spacing, typography, radii } from '../../../theme/tokens';

interface StepTestScreenProps {
  input: StepInput;
  onChange: (input: StepInput) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
  patient: Patient | null;
  score: number | null;
}

type TimerStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'complete';

const DURATION_MS = 15_000;

function formatMmSs(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function StepCounterCard({
  label, steps, manualText, onIncrement, onDecrement, onManualChange,
}: {
  label: string;
  steps: number | null;
  manualText: string;
  onIncrement: () => void;
  onDecrement: () => void;
  onManualChange: (text: string) => void;
}) {
  const canDecrement = (steps ?? 0) > 0;
  return (
    <Card>
      <Text style={styles.counterLabel}>{label}</Text>
      <Text style={styles.countDisplay}>{steps ?? 0}</Text>
      <Text style={styles.countUnit}>steps</Text>
      <View style={styles.counterBtnRow}>
        <Pressable
          onPress={onDecrement}
          disabled={!canDecrement}
          style={({ pressed }) => [
            styles.btnDecrement,
            !canDecrement && styles.btnDisabled,
            pressed && canDecrement && styles.btnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Remove one step — ${label}`}
        >
          <Text style={[styles.btnTextDark, !canDecrement && styles.btnTextDisabled]}>−</Text>
        </Pressable>
        <Pressable
          onPress={onIncrement}
          style={({ pressed }) => [styles.btnIncrement, styles.btnFlex, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Add one step — ${label}`}
        >
          <Text style={styles.btnIncrementText}>+ STEP</Text>
        </Pressable>
      </View>
      <NumericClinicalInput
        label="MANUAL COUNT (OVERRIDE)"
        value={manualText}
        onChangeText={onManualChange}
        unit="steps"
      />
    </Card>
  );
}

export function StepTestScreen({
  input, onChange, onNext, onBack, canProceed, patient, score,
}: StepTestScreenProps) {
  const insets = useSafeAreaInsets();
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle');
  const [remainingMs, setRemainingMs] = useState(DURATION_MS);
  const [affectedText, setAffectedText] = useState(
    input.affectedSteps !== null ? String(input.affectedSteps) : ''
  );
  const [nonAffectedText, setNonAffectedText] = useState(
    input.nonAffectedSteps !== null ? String(input.nonAffectedSteps) : ''
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetRef = useRef(0);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
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

  function start() { startInterval(remainingMs); setTimerStatus('running'); }
  function pause() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setTimerStatus('paused');
  }
  function resume() { startInterval(remainingMs); setTimerStatus('running'); }
  function stop() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setTimerStatus('stopped');
  }
  function resetTimer() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setRemainingMs(DURATION_MS);
    setTimerStatus('idle');
  }

  function handleUnable(next: boolean) {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setRemainingMs(DURATION_MS);
    setTimerStatus('idle');
    setAffectedText('');
    setNonAffectedText('');
    onChange({ unable: next, affectedSteps: null, nonAffectedSteps: null });
  }

  function handleAffectedChange(text: string) {
    setAffectedText(text);
    const n = parseInt(text.trim(), 10);
    onChange({ ...input, affectedSteps: !isNaN(n) && n >= 0 ? n : null });
  }

  function handleNonAffectedChange(text: string) {
    setNonAffectedText(text);
    const n = parseInt(text.trim(), 10);
    onChange({ ...input, nonAffectedSteps: !isNaN(n) && n >= 0 ? n : null });
  }

  function incrementAffected() {
    const next = (input.affectedSteps ?? 0) + 1;
    setAffectedText(String(next));
    onChange({ ...input, affectedSteps: next });
  }
  function decrementAffected() {
    const next = Math.max(0, (input.affectedSteps ?? 0) - 1);
    setAffectedText(String(next));
    onChange({ ...input, affectedSteps: next });
  }
  function incrementNonAffected() {
    const next = (input.nonAffectedSteps ?? 0) + 1;
    setNonAffectedText(String(next));
    onChange({ ...input, nonAffectedSteps: next });
  }
  function decrementNonAffected() {
    const next = Math.max(0, (input.nonAffectedSteps ?? 0) - 1);
    setNonAffectedText(String(next));
    onChange({ ...input, nonAffectedSteps: next });
  }

  const isRunning  = timerStatus === 'running';
  const isPaused   = timerStatus === 'paused';
  const isComplete = timerStatus === 'complete';
  const isDone     = timerStatus === 'stopped' || isComplete;

  const avg =
    input.affectedSteps !== null && input.nonAffectedSteps !== null
      ? (input.affectedSteps + input.nonAffectedSteps) / 2
      : null;

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={onBack} title="BOOMER" />

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
            <Text style={styles.stepPillText}>1 OF 4</Text>
          </View>
        </Card>

        <View style={styles.instructionCard}>
          <Text style={styles.instructionLabel}>STEP TEST</Text>
          <Text style={styles.instructionText}>7.5 cm step · 15 seconds</Text>
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
                <Text style={[
                  styles.timerText,
                  isRunning && styles.timerRunning,
                  isComplete && styles.timerComplete,
                ]}>
                  {formatMmSs(isComplete ? 0 : remainingMs)}
                </Text>
              </View>
              <View style={styles.timerControls}>
                {timerStatus === 'idle' && (
                  <Pressable
                    onPress={start}
                    style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.btnPressed]}
                    accessibilityRole="button" accessibilityLabel="Start 15-second timer"
                  >
                    <Text style={styles.btnTextLight}>Start</Text>
                  </Pressable>
                )}
                {isRunning && (
                  <View style={styles.btnRow}>
                    <Pressable
                      onPress={pause}
                      style={({ pressed }) => [styles.btn, styles.btnOutline, styles.btnFlex, pressed && styles.btnPressed]}
                      accessibilityRole="button" accessibilityLabel="Pause timer"
                    >
                      <Text style={styles.btnTextDark}>Pause</Text>
                    </Pressable>
                    <Pressable
                      onPress={stop}
                      style={({ pressed }) => [styles.btn, styles.btnStop, styles.btnStopFixed, pressed && styles.btnPressed]}
                      accessibilityRole="button" accessibilityLabel="Stop timer"
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
                      accessibilityRole="button" accessibilityLabel="Resume timer"
                    >
                      <Text style={styles.btnTextLight}>Resume</Text>
                    </Pressable>
                    <Pressable
                      onPress={stop}
                      style={({ pressed }) => [styles.btn, styles.btnStop, styles.btnStopFixed, pressed && styles.btnPressed]}
                      accessibilityRole="button" accessibilityLabel="Stop timer"
                    >
                      <Text style={styles.btnTextLight}>Stop</Text>
                    </Pressable>
                  </View>
                )}
                {isDone && (
                  <Pressable
                    onPress={resetTimer}
                    style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.btnPressed]}
                    accessibilityRole="button" accessibilityLabel="Reset timer"
                  >
                    <Text style={styles.btnTextDark}>Reset</Text>
                  </Pressable>
                )}
              </View>
            </Card>

            <StepCounterCard
              label="AFFECTED LEG"
              steps={input.affectedSteps}
              manualText={affectedText}
              onIncrement={incrementAffected}
              onDecrement={decrementAffected}
              onManualChange={handleAffectedChange}
            />

            <StepCounterCard
              label="NON-AFFECTED LEG"
              steps={input.nonAffectedSteps}
              manualText={nonAffectedText}
              onIncrement={incrementNonAffected}
              onDecrement={decrementNonAffected}
              onManualChange={handleNonAffectedChange}
            />

            {avg !== null && score !== null ? (
              <View style={styles.avgPreview}>
                <Text style={styles.avgText}>Average: {avg.toFixed(1)} steps</Text>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeText}>{score} / 4</Text>
                </View>
              </View>
            ) : null}
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
  patientSub: { fontSize: typography.sizeSm, color: colors.muted, marginTop: spacing.xs },
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
  },
  unableNote: { backgroundColor: colors.primarySoft, borderColor: colors.secondarySoft },
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
  timerDisplay: { alignItems: 'center', paddingVertical: spacing.sm },
  timerText: {
    fontSize: 56,
    fontWeight: typography.weightBold,
    color: colors.ink,
    lineHeight: 64,
    letterSpacing: -1,
  },
  timerRunning: { color: colors.actionBlue },
  timerComplete: { color: colors.success },
  timerControls: { gap: spacing.xs },
  btn: {
    height: 48,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  btnRow: { flexDirection: 'row', gap: spacing.sm },
  btnFlex: { flex: 1 },
  btnPrimary: { backgroundColor: colors.primary },
  btnStop: { backgroundColor: colors.coral },
  btnStopFixed: { width: 88 },
  btnOutline: { borderColor: colors.border, backgroundColor: colors.surface },
  btnPressed: { opacity: 0.75 },
  btnDisabled: { opacity: 0.3 },
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
  btnTextDisabled: { color: colors.muted },
  counterLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
    letterSpacing: typography.trackingWide,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  countDisplay: {
    fontSize: 72,
    fontWeight: typography.weightBold,
    color: colors.ink,
    lineHeight: 80,
    letterSpacing: -2,
    textAlign: 'center',
  },
  countUnit: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  counterBtnRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
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
  avgPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
  },
  avgText: {
    fontSize: typography.sizeSm,
    color: colors.primary,
    fontWeight: typography.weightMedium,
  },
  scoreBadge: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  scoreBadgeText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
    color: '#FFFFFF',
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
  unableToggleActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  unableTogglePressed: { opacity: 0.7 },
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
  toggleIndicatorActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleCheck: {
    fontSize: typography.sizeXs,
    color: '#FFFFFF',
    fontWeight: typography.weightBold,
    lineHeight: 14,
  },
  unableLabel: { flex: 1, fontSize: typography.sizeMd, color: colors.muted },
  unableLabelActive: { color: colors.primary, fontWeight: typography.weightSemibold },
  nextBtn: {
    height: 52,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled: { opacity: 0.35 },
  nextBtnPressed: { opacity: 0.8 },
  nextBtnText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: '#FFFFFF',
  },
});

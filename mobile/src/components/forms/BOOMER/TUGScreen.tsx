import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../ui/Screen';
import { Card } from '../../ui/Card';
import { NavyHeader } from '../../ui/NavyHeader';
import { PatientAvatar } from '../../ui/PatientAvatar';
import { ClinicalTimer } from '../ClinicalTimer';
import { NumericClinicalInput } from '../NumericClinicalInput';
import type { Patient } from '../../../types/domain';
import type { TimedInput } from './types';
import { colors, spacing, typography, radii } from '../../../theme/tokens';

interface TUGScreenProps {
  input: TimedInput;
  onChange: (input: TimedInput) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
  patient: Patient | null;
  score: number | null;
}

export function TUGScreen({
  input, onChange, onNext, onBack, canProceed, patient, score,
}: TUGScreenProps) {
  const insets = useSafeAreaInsets();
  const [timeText, setTimeText] = useState(
    input.seconds !== null ? input.seconds.toFixed(1) : ''
  );

  function handleUseTime(seconds: number) {
    const text = seconds.toFixed(1);
    setTimeText(text);
    onChange({ unable: false, seconds });
  }

  function handleTimeChange(text: string) {
    setTimeText(text);
    const n = parseFloat(text.trim());
    onChange({ unable: false, seconds: isFinite(n) && n > 0 ? n : null });
  }

  function handleUnable(next: boolean) {
    setTimeText('');
    onChange({ unable: next, seconds: null });
  }

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
            <Text style={styles.stepPillText}>2 OF 4</Text>
          </View>
        </Card>

        <View style={styles.instructionCard}>
          <Text style={styles.instructionLabel}>TIMED UP AND GO</Text>
          <Text style={styles.instructionText}>Comfortable pace</Text>
        </View>

        {input.unable ? (
          <Card style={styles.unableNote}>
            <Text style={styles.unableNoteText}>Score recorded as 0</Text>
          </Card>
        ) : (
          <>
            <Card>
              <ClinicalTimer onUseTime={handleUseTime} />
            </Card>

            <Card>
              <NumericClinicalInput
                label="TIME (SECONDS)"
                value={timeText}
                onChangeText={handleTimeChange}
                unit="sec"
              />
              {score !== null ? (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>SCORE</Text>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreBadgeText}>{score} / 4</Text>
                  </View>
                </View>
              ) : null}
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
          accessibilityLabel="Unable to complete TUG"
        >
          <View style={[styles.toggleIndicator, input.unable && styles.toggleIndicatorActive]}>
            {input.unable ? <Text style={styles.toggleCheck}>✓</Text> : null}
          </View>
          <Text style={[styles.unableLabel, input.unable && styles.unableLabelActive]}>
            Unable to complete
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
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  scoreLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    letterSpacing: typography.trackingWide,
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

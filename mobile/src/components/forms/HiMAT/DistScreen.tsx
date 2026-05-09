import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NumericClinicalInput } from '../NumericClinicalInput';
import { Screen } from '../../ui/Screen';
import { Card } from '../../ui/Card';
import { NavyHeader } from '../../ui/NavyHeader';
import { PatientAvatar } from '../../ui/PatientAvatar';
import type { Patient } from '../../../types/domain';
import type { DistInput } from './types';
import { colors, spacing, typography, radii } from '../../../theme/tokens';

interface DistScreenProps {
  title: string;
  note: string;
  input: DistInput;
  onChange: (input: DistInput) => void;
  onNext: () => void;
  onBack: () => void;
  stepLabel: string;
  canProceed: boolean;
  patient: Patient | null;
}

export function DistScreen({
  title, note, input, onChange, onNext, onBack, stepLabel, canProceed, patient,
}: DistScreenProps) {
  const insets = useSafeAreaInsets();
  const [texts, setTexts] = useState<[string, string, string]>(() => [
    input.trials[0] !== null ? String(input.trials[0]) : '',
    input.trials[1] !== null ? String(input.trials[1]) : '',
    input.trials[2] !== null ? String(input.trials[2]) : '',
  ]);

  function handleTrialChange(idx: 0 | 1 | 2, text: string) {
    const nextTexts: [string, string, string] = [texts[0], texts[1], texts[2]];
    nextTexts[idx] = text;
    setTexts(nextTexts);

    const n = parseFloat(text);
    const nextTrials: [number | null, number | null, number | null] = [
      input.trials[0], input.trials[1], input.trials[2],
    ];
    nextTrials[idx] = (!isNaN(n) && n > 0) ? n : null;
    onChange({ trials: nextTrials });
  }

  const filled = input.trials.filter((v): v is number => v !== null && v > 0);
  const average = filled.length > 0
    ? filled.reduce((s, v) => s + v, 0) / filled.length
    : null;

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={onBack} title={title} />

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
            <Text style={styles.stepText}>{stepLabel}</Text>
          </View>
        </Card>

        <View style={styles.instructionCard}>
          <Text style={styles.instructionLabel}>WHAT TO TIME</Text>
          <Text style={styles.instructionText}>{title}</Text>
        </View>

        <Card style={styles.noteCard}>
          <Text style={styles.noteLabel}>INSTRUCTIONS</Text>
          <Text style={styles.noteText}>{note}</Text>
        </Card>

        <Card style={styles.trialsCard}>
          <Text style={styles.trialsHeading}>TRIAL DISTANCES</Text>
          <View style={styles.trialsGrid}>
            {([0, 1, 2] as const).map(idx => (
              <View key={idx} style={styles.trialField}>
                <NumericClinicalInput
                  label={`TRIAL ${idx + 1}`}
                  value={texts[idx]}
                  onChangeText={text => handleTrialChange(idx, text)}
                  unit="cm"
                />
              </View>
            ))}
          </View>
        </Card>

        {average !== null ? (
          <View style={styles.averageCard}>
            <Text style={styles.averageLabel}>
              {filled.length < 3 ? `AVERAGE (${filled.length} OF 3)` : 'AVERAGE — 3 TRIALS'}
            </Text>
            <View style={styles.averageValueRow}>
              <Text style={styles.averageValue}>{average.toFixed(1)}</Text>
              <Text style={styles.averageUnit}>cm</Text>
            </View>
            {filled.length < 3 ? (
              <Text style={styles.averageNote}>Enter all 3 trials to proceed</Text>
            ) : null}
          </View>
        ) : null}

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
  stepPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
  },
  stepText: {
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
  noteCard: {
    gap: spacing.xs,
  },
  noteLabel: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
  },
  noteText: {
    fontSize: typography.sizeSm,
    color: colors.ink,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  trialsCard: {
    gap: spacing.md,
  },
  trialsHeading: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
  },
  trialsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  trialField: {
    flex: 1,
  },
  averageCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
  },
  averageLabel: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
  },
  averageValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  averageValue: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.actionBlue,
  },
  averageUnit: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  averageNote: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    fontStyle: 'italic',
  },
  nextBtn: {
    height: 52,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
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

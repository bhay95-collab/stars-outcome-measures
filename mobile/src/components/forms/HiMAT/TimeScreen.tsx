import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClinicalTimer } from '../ClinicalTimer';
import { NumericClinicalInput } from '../NumericClinicalInput';
import { Screen } from '../../ui/Screen';
import { Card } from '../../ui/Card';
import { NavyHeader } from '../../ui/NavyHeader';
import { PatientAvatar } from '../../ui/PatientAvatar';
import type { Patient } from '../../../types/domain';
import type { TimeInput } from './types';
import { colors, spacing, typography, radii } from '../../../theme/tokens';

interface TimeScreenProps {
  title: string;
  hasFail?: boolean;
  failLabel?: string;
  input: TimeInput;
  onChange: (input: TimeInput) => void;
  onNext: () => void;
  onBack: () => void;
  stepLabel: string;
  canProceed: boolean;
  patient: Patient | null;
}

export function TimeScreen({
  title, hasFail, failLabel, input, onChange,
  onNext, onBack, stepLabel, canProceed, patient,
}: TimeScreenProps) {
  const insets = useSafeAreaInsets();
  const [manualText, setManualText] = useState(
    () => input.val !== null ? input.val.toFixed(1) : ''
  );

  function handleUseTime(seconds: number) {
    const v = Math.round(seconds * 10) / 10;
    setManualText(v.toFixed(1));
    onChange({ val: v, unable: false });
  }

  function handleManualChange(text: string) {
    setManualText(text);
    const n = parseFloat(text);
    onChange({ val: (!isNaN(n) && n > 0) ? n : null, unable: false });
  }

  function handleFailToggle() {
    onChange({ ...input, unable: !input.unable });
  }

  return (
    <Screen padded={false} rootBackground={colors.primary} safeEdges={['top', 'left', 'right']}>
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

        <Card style={[styles.timerCard, input.unable && styles.disabledCard]}>
          <ClinicalTimer onUseTime={handleUseTime} />
        </Card>

        <Card style={input.unable ? styles.disabledCard : undefined}>
          <NumericClinicalInput
            label="OR ENTER TIME MANUALLY"
            value={manualText}
            onChangeText={handleManualChange}
            unit="sec"
            editable={!input.unable}
          />
          {input.val !== null && !input.unable ? (
            <Text style={styles.recordedTime}>Recorded: {input.val.toFixed(1)} sec</Text>
          ) : null}
        </Card>

        {hasFail ? (
          <Pressable
            onPress={handleFailToggle}
            style={({ pressed }) => [
              styles.failRow,
              input.unable && styles.failRowActive,
              pressed && styles.failRowPressed,
            ]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: input.unable }}
            accessibilityLabel={failLabel}
          >
            <View style={[styles.failCheckbox, input.unable && styles.failCheckboxActive]}>
              {input.unable ? <Text style={styles.failCheckmark}>✓</Text> : null}
            </View>
            <View style={styles.failTextGroup}>
              <Text style={[styles.failLabel, input.unable && styles.failLabelActive]}>
                {failLabel}
              </Text>
              {input.unable ? (
                <Text style={styles.failNote}>Fail recorded — item scored 0</Text>
              ) : null}
            </View>
          </Pressable>
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
  stepPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stepText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.actionBlue,
    letterSpacing: 0.5,
  },
  instructionCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  instructionLabel: {
    fontSize: typography.sizeXs,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    fontWeight: typography.weightSemibold,
  },
  instructionText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  timerCard: {
    gap: spacing.sm,
  },
  disabledCard: {
    opacity: 0.45,
  },
  recordedTime: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  failRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  failRowActive: {
    borderColor: colors.coral,
    backgroundColor: '#FFF5F3',
  },
  failRowPressed: {
    opacity: 0.75,
  },
  failCheckbox: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  failCheckboxActive: {
    backgroundColor: colors.coral,
    borderColor: colors.coral,
  },
  failCheckmark: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: '#FFFFFF',
  },
  failTextGroup: {
    flex: 1,
    gap: 4,
  },
  failLabel: {
    fontSize: typography.sizeMd,
    color: colors.ink,
  },
  failLabelActive: {
    color: '#b5451b',
    fontWeight: typography.weightSemibold,
  },
  failNote: {
    fontSize: typography.sizeSm,
    color: '#b5451b',
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

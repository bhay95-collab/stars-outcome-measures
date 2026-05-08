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
import type { StairsInput } from './types';
import { colors, spacing, typography, radii } from '../../../theme/tokens';

interface StairsScreenProps {
  title: string;
  depNote: string;
  indNote: string;
  input: StairsInput;
  onChange: (input: StairsInput) => void;
  onNext: () => void;
  onBack: () => void;
  stepLabel: string;
  canProceed: boolean;
  patient: Patient | null;
}

export function StairsScreen({
  title, depNote, indNote, input, onChange, onNext, onBack, stepLabel, canProceed, patient,
}: StairsScreenProps) {
  const insets = useSafeAreaInsets();
  const [depText, setDepText] = useState(
    () => input.depVal !== null ? input.depVal.toFixed(1) : ''
  );
  const [indText, setIndText] = useState(
    () => input.indVal !== null ? input.indVal.toFixed(1) : ''
  );

  const isInd = input.mode === 'IND';
  const isDep = input.mode === 'DEP';

  function handleToggle() {
    onChange({ ...input, mode: isInd ? 'DEP' : 'IND' });
  }

  function handleDepUseTime(seconds: number) {
    const v = Math.round(seconds * 10) / 10;
    setDepText(v.toFixed(1));
    onChange({ ...input, depVal: v });
  }

  function handleIndUseTime(seconds: number) {
    const v = Math.round(seconds * 10) / 10;
    setIndText(v.toFixed(1));
    onChange({ ...input, indVal: v });
  }

  function handleDepManualChange(text: string) {
    setDepText(text);
    const n = parseFloat(text);
    onChange({ ...input, depVal: (!isNaN(n) && n > 0) ? n : null });
  }

  function handleIndManualChange(text: string) {
    setIndText(text);
    const n = parseFloat(text);
    onChange({ ...input, indVal: (!isNaN(n) && n > 0) ? n : null });
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

        <Pressable
          onPress={handleToggle}
          style={({ pressed }) => [
            styles.toggleRow,
            isInd && styles.toggleRowActive,
            pressed && styles.toggleRowPressed,
          ]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isInd }}
          accessibilityLabel="Independent: reciprocal pattern, no rail"
        >
          <View style={[styles.toggleCheckbox, isInd && styles.toggleCheckboxActive]}>
            {isInd ? <Text style={styles.toggleCheckmark}>✓</Text> : null}
          </View>
          <View style={styles.toggleTextGroup}>
            <Text style={[styles.toggleLabel, isInd && styles.toggleLabelActive]}>
              Independent: reciprocal pattern, no rail
            </Text>
            <Text style={styles.toggleSub}>{isInd ? indNote : depNote}</Text>
          </View>
        </Pressable>

        {input.mode === null ? (
          <Card style={styles.modePromptCard}>
            <Text style={styles.modePromptText}>
              Select independence status above, then time the patient.
            </Text>
          </Card>
        ) : null}

        {isDep ? (
          <>
            <Card style={styles.timerCard}>
              <ClinicalTimer onUseTime={handleDepUseTime} />
            </Card>
            <Card>
              <NumericClinicalInput
                label="OR ENTER TIME MANUALLY"
                value={depText}
                onChangeText={handleDepManualChange}
                unit="sec"
              />
              {input.depVal !== null ? (
                <Text style={styles.recordedTime}>
                  Recorded: {input.depVal.toFixed(1)} sec
                </Text>
              ) : null}
            </Card>
          </>
        ) : null}

        {isInd ? (
          <>
            <Card style={styles.timerCard}>
              <ClinicalTimer onUseTime={handleIndUseTime} />
            </Card>
            <Card>
              <NumericClinicalInput
                label="OR ENTER TIME MANUALLY"
                value={indText}
                onChangeText={handleIndManualChange}
                unit="sec"
              />
              {input.indVal !== null ? (
                <Text style={styles.recordedTime}>
                  Recorded: {input.indVal.toFixed(1)} sec
                </Text>
              ) : null}
            </Card>
          </>
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  toggleRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  toggleRowPressed: {
    opacity: 0.75,
  },
  toggleCheckbox: {
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
  toggleCheckboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleCheckmark: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: '#FFFFFF',
  },
  toggleTextGroup: {
    flex: 1,
    gap: 4,
  },
  toggleLabel: {
    fontSize: typography.sizeMd,
    color: colors.ink,
  },
  toggleLabelActive: {
    color: colors.primary,
    fontWeight: typography.weightSemibold,
  },
  toggleSub: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    fontStyle: 'italic',
  },
  modePromptCard: {
    backgroundColor: colors.primarySoft,
  },
  modePromptText: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    fontStyle: 'italic',
  },
  timerCard: {
    gap: spacing.sm,
  },
  recordedTime: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    marginTop: spacing.sm,
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

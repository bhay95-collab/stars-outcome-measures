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
  input: StairsInput;
  onChange: (input: StairsInput) => void;
  onNext: () => void;
  onBack: () => void;
  stepLabel: string;
  canProceed: boolean;
  patient: Patient | null;
}

export function StairsScreen({
  title, input, onChange, onNext, onBack, stepLabel, canProceed, patient,
}: StairsScreenProps) {
  const insets = useSafeAreaInsets();
  const [depText, setDepText] = useState(
    () => input.depVal !== null ? input.depVal.toFixed(1) : ''
  );
  const [indText, setIndText] = useState(
    () => input.indVal !== null ? input.indVal.toFixed(1) : ''
  );

  const isDep = input.mode === 'DEP';
  const isInd = input.mode === 'IND';

  function selectMode(mode: 'DEP' | 'IND') {
    onChange({ ...input, mode });
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

        <Card style={styles.modeCard}>
          <Text style={styles.modeHeading}>INDEPENDENCE STATUS</Text>
          <Text style={styles.modeSub}>Select before timing — this affects the score.</Text>
          <View style={styles.modeTileRow}>
            <Pressable
              onPress={() => selectMode('DEP')}
              style={[styles.modeTile, isDep && styles.modeTileActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: isDep }}
              accessibilityLabel="Dependent"
            >
              <Text style={[styles.modeTileTitle, isDep && styles.modeTileTitleActive]}>
                Dependent
              </Text>
              <Text style={[styles.modeTileSub, isDep && styles.modeTileSubActive]}>
                Rail or non-reciprocal
              </Text>
            </Pressable>

            <Pressable
              onPress={() => selectMode('IND')}
              style={[styles.modeTile, isInd && styles.modeTileActiveGreen]}
              accessibilityRole="radio"
              accessibilityState={{ checked: isInd }}
              accessibilityLabel="Independent"
            >
              <Text style={[styles.modeTileTitle, isInd && styles.modeTileTitleActiveGreen]}>
                Independent
              </Text>
              <Text style={[styles.modeTileSub, isInd && styles.modeTileSubActiveGreen]}>
                No rail, reciprocal
              </Text>
            </Pressable>
          </View>
        </Card>

        {input.mode === null ? (
          <Card style={styles.promptCard}>
            <Text style={styles.promptText}>
              Select Dependent or Independent above, then time the patient.
            </Text>
          </Card>
        ) : null}

        {isDep ? (
          <>
            <Card style={styles.timerCard}>
              <ClinicalTimer key="dep" onUseTime={handleDepUseTime} />
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
              <ClinicalTimer key="ind" onUseTime={handleIndUseTime} />
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
  modeCard: {
    gap: spacing.sm,
  },
  modeHeading: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    letterSpacing: typography.trackingWide,
    fontWeight: typography.weightSemibold,
  },
  modeSub: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    fontStyle: 'italic',
  },
  modeTileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  modeTile: {
    flex: 1,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    padding: spacing.sm,
    gap: 4,
    alignItems: 'center',
  },
  modeTileActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  modeTileActiveGreen: {
    borderColor: colors.success,
    backgroundColor: colors.successSoft,
  },
  modeTileTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    textAlign: 'center',
  },
  modeTileTitleActive: {
    color: colors.primary,
  },
  modeTileTitleActiveGreen: {
    color: colors.success,
  },
  modeTileSub: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
  modeTileSubActive: {
    color: colors.actionBlue,
  },
  modeTileSubActiveGreen: {
    color: colors.success,
  },
  promptCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.secondarySoft,
  },
  promptText: {
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

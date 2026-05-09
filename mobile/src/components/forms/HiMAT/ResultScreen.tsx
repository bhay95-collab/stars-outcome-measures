import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../ui/Screen';
import { Card } from '../../ui/Card';
import { NavyHeader } from '../../ui/NavyHeader';
import { PatientAvatar } from '../../ui/PatientAvatar';
import { ThreeBarMotif } from '../../ui/ThreeBarMotif';
import type { Patient } from '../../../types/domain';
import type { HiMATResult } from './types';
import { colors, spacing, typography, radii } from '../../../theme/tokens';

interface ResultScreenProps {
  result: HiMATResult | null;
  patient: Patient | null;
  onBack: () => void;
  onStartOver: () => void;
}

const RESULT_ROWS = [
  'Walk',
  'Walk Backward',
  'Walk on Toes',
  'Walk over Obstacle',
  'Run',
  'Skip',
  'Hop Forward',
  'Bound Affected',
  'Bound Non-Affected',
  'Up Stairs',
  'Down Stairs',
];

const COLOR_MAP: Record<string, string> = {
  green: colors.success,
  amber: '#a05c00',
  red:   colors.coral,
};

function buildDisplayScores(itemScores: number[]): number[] {
  return [
    itemScores[0],
    itemScores[1],
    itemScores[2],
    itemScores[3],
    itemScores[4],
    itemScores[5],
    itemScores[6],
    itemScores[7],
    itemScores[8],
    itemScores[9]  + itemScores[10],
    itemScores[11] + itemScores[12],
  ];
}

export function ResultScreen({ result, patient, onBack, onStartOver }: ResultScreenProps) {
  const insets = useSafeAreaInsets();
  const displayScores = result ? buildDisplayScores(result.meta.itemScores) : null;

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={onBack} title="Result" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
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

        {result !== null && displayScores !== null ? (
          <>
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultMicroLabel}>HiMAT RESULT</Text>
                <ThreeBarMotif size="sm" tone="soft" />
              </View>
              <View style={styles.resultValueRow}>
                <Text style={styles.resultValue}>{result.primaryValue}</Text>
                <Text style={styles.resultUnit}>{result.primaryUnit}</Text>
                <View style={[
                  styles.resultColorDot,
                  { backgroundColor: COLOR_MAP[result.meta.classColor] ?? colors.muted },
                ]} />
              </View>
              <View style={styles.resultInterpPill}>
                <Text style={styles.resultInterpText}>{result.interpretation}</Text>
              </View>
            </View>

            <Card style={styles.scoresCard}>
              <Text style={styles.scoresHeading}>ITEM SCORES</Text>
              {RESULT_ROWS.map((label, i) => (
                <View
                  key={i}
                  style={[styles.scoreRow, i < RESULT_ROWS.length - 1 && styles.scoreRowBorder]}
                >
                  <Text style={styles.scoreLabel}>{label}</Text>
                  <View style={[
                    styles.scoreChip,
                    displayScores[i] > 0 && styles.scoreChipFilled,
                  ]}>
                    <Text style={[
                      styles.scoreChipText,
                      displayScores[i] > 0 && styles.scoreChipTextFilled,
                    ]}>
                      {displayScores[i]}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        ) : (
          <Card>
            <Text style={styles.errorText}>
              Unable to calculate result. Please check all inputs and try again.
            </Text>
          </Card>
        )}

        <Pressable
          onPress={onStartOver}
          style={({ pressed }) => [styles.startOverBtn, pressed && styles.startOverBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Start over"
        >
          <Text style={styles.startOverBtnText}>Start Over</Text>
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
  resultCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  resultMicroLabel: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
  },
  resultValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  resultValue: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.actionBlue,
  },
  resultUnit: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  resultColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: spacing.xs,
    alignSelf: 'center',
  },
  resultInterpPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultInterpText: {
    fontSize: typography.sizeSm,
    color: colors.ink,
  },
  scoresCard: {
    gap: spacing.xs,
  },
  scoresHeading: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
    marginBottom: spacing.xs,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  scoreRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scoreLabel: {
    fontSize: typography.sizeSm,
    color: colors.ink,
    flex: 1,
  },
  scoreChip: {
    minWidth: 32,
    height: 28,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  scoreChipFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  scoreChipText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
  },
  scoreChipTextFilled: {
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    fontStyle: 'italic',
  },
  startOverBtn: {
    height: 52,
    borderRadius: radii.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startOverBtnPressed: {
    opacity: 0.7,
  },
  startOverBtnText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
});

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../ui/Screen';
import { Card } from '../../ui/Card';
import { NavyHeader } from '../../ui/NavyHeader';
import { PatientAvatar } from '../../ui/PatientAvatar';
import { ThreeBarMotif } from '../../ui/ThreeBarMotif';
import { Button } from '../../ui/Button';
import type { Patient } from '../../../types/domain';
import type { StepInput, TimedInput, FRInput, BOOMERResult } from './types';
import { colors, spacing, typography, radii } from '../../../theme/tokens';

type SaveState = 'idle' | 'saving' | 'timed-out' | 'saved' | 'error';

const COLOR_MAP = {
  green: colors.success,
  amber: colors.amber,
  red: colors.coral,
} as const;

interface ResultScreenProps {
  stepInput: StepInput;
  tugInput: TimedInput;
  frInput: FRInput;
  stanceInput: TimedInput;
  scores: { step: number | null; tug: number | null; fr: number | null; stance: number | null };
  result: BOOMERResult;
  patient: Patient | null;
  onBack: () => void;
  onStartOver: () => void;
  saveState: SaveState;
  saveError: string | null;
  onSave: () => void;
}

function measurementLabel(label: string, value: string | null): string {
  if (value === null) return label;
  return value;
}

export function ResultScreen({
  stepInput, tugInput, frInput, stanceInput, scores, result, patient, onBack, onStartOver,
  saveState, saveError, onSave,
}: ResultScreenProps) {
  const insets = useSafeAreaInsets();
  const dotColor = COLOR_MAP[result.meta.classColor];

  const stepMeasurement = stepInput.unable
    ? 'Unable'
    : stepInput.affectedSteps !== null && stepInput.nonAffectedSteps !== null
      ? `${stepInput.affectedSteps} / ${stepInput.nonAffectedSteps} steps`
      : '—';

  const tugMeasurement = tugInput.unable
    ? 'Unable'
    : tugInput.seconds !== null
      ? `${tugInput.seconds.toFixed(1)} sec`
      : '—';

  const frMeasurement = frInput.unable
    ? 'Unable'
    : frInput.cm !== null
      ? `${frInput.cm} cm`
      : '—';

  const stanceMeasurement = stanceInput.unable
    ? 'Unable'
    : stanceInput.seconds !== null
      ? `${stanceInput.seconds.toFixed(1)} sec`
      : '—';

  const componentRows: { label: string; measurement: string; score: number | null }[] = [
    { label: 'Step Test', measurement: stepMeasurement, score: scores.step },
    { label: 'Timed Up & Go', measurement: tugMeasurement, score: scores.tug },
    { label: 'Functional Reach', measurement: frMeasurement, score: scores.fr },
    { label: 'Static Stance', measurement: stanceMeasurement, score: scores.stance },
  ];

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={onBack} title="BOOMER" />

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
          <View style={styles.completePill}>
            <Text style={styles.completePillText}>COMPLETE</Text>
          </View>
        </Card>

        <Card style={styles.resultHeaderCard}>
          <View style={styles.resultHeaderRow}>
            <View>
              <Text style={styles.resultHeaderLabel}>BOOMER RESULT</Text>
              <Text style={styles.resultTotal}>
                {result.primaryValue}
                <Text style={styles.resultUnit}> {result.primaryUnit}</Text>
              </Text>
            </View>
            <ThreeBarMotif size="md" tone="soft" />
          </View>
          <View style={styles.interpretationRow}>
            <View style={[styles.colorDot, { backgroundColor: dotColor }]} />
            <View style={[styles.interpPill, { borderColor: dotColor }]}>
              <Text style={[styles.interpText, { color: dotColor }]}>{result.interpretation}</Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.breakdownTitle}>COMPONENT SCORES</Text>
          {componentRows.map((row, idx) => (
            <View key={row.label}>
              {idx > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.componentRow}>
                <View style={styles.componentLeft}>
                  <Text style={styles.componentLabel}>{row.label}</Text>
                  <Text style={styles.componentMeasurement}>{row.measurement}</Text>
                </View>
                {row.score !== null ? (
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreBadgeText}>{row.score}/4</Text>
                  </View>
                ) : (
                  <View style={styles.scoreBadgeEmpty}>
                    <Text style={styles.scoreBadgeEmptyText}>—</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </Card>

        {saveState === 'saved' ? (
          <View style={styles.savedBanner}>
            <Text style={styles.savedText}>Result saved</Text>
          </View>
        ) : (
          <>
            <Button
              label="Save Result"
              onPress={onSave}
              loading={saveState === 'saving'}
              disabled={saveState === 'saving' || saveState === 'timed-out'}
            />
            {(saveState === 'error' || saveState === 'timed-out') && saveError ? (
              <Text style={styles.saveErrorText}>{saveError}</Text>
            ) : null}
          </>
        )}

        <Pressable
          onPress={onStartOver}
          style={({ pressed }) => [
            styles.startOverBtn,
            pressed && styles.startOverBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Start Over"
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
  completePill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
  },
  completePillText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
    letterSpacing: typography.trackingWide,
  },
  resultHeaderCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.secondarySoft,
    gap: spacing.sm,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  resultHeaderLabel: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    letterSpacing: typography.trackingWide,
    fontWeight: typography.weightSemibold,
    marginBottom: spacing.xs,
  },
  resultTotal: {
    fontSize: 42,
    fontWeight: typography.weightBold,
    color: colors.actionBlue,
    lineHeight: 48,
  },
  resultUnit: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
  },
  interpretationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  interpPill: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  interpText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
  },
  breakdownTitle: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    letterSpacing: typography.trackingWide,
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  componentLeft: { flex: 1, gap: spacing.xs },
  componentLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  componentMeasurement: {
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  scoreBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
    minWidth: 44,
    alignItems: 'center',
  },
  scoreBadgeText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
    color: colors.primary,
  },
  scoreBadgeEmpty: {
    minWidth: 44,
    alignItems: 'center',
  },
  scoreBadgeEmptyText: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  startOverBtn: {
    height: 52,
    borderRadius: radii.button,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startOverBtnPressed: { opacity: 0.7 },
  startOverBtnText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
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

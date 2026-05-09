import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../ui/Screen';
import { Card } from '../../ui/Card';
import { NavyHeader } from '../../ui/NavyHeader';
import { PatientAvatar } from '../../ui/PatientAvatar';
import { ThreeBarMotif } from '../../ui/ThreeBarMotif';
import type { Patient } from '../../../types/domain';
import type { StepTestResult } from './types';
import { colors, spacing, typography, radii } from '../../../theme/tokens';

interface ResultScreenProps {
  result: StepTestResult | null;
  patient: Patient | null;
  stepHeight: string;
  onBack: () => void;
  onStartOver: () => void;
}

const COLOR_MAP: Record<string, string> = {
  green: colors.success,
  red:   colors.coral,
  grey:  colors.muted,
};

function LegResultCard({
  label,
  steps,
  interp,
  colorKey,
  isLower,
}: {
  label: string;
  steps: number;
  interp: string;
  colorKey: string;
  isLower: boolean;
}) {
  const accentColor = COLOR_MAP[colorKey] ?? colors.muted;
  return (
    <View style={[styles.legCard, isLower && styles.legCardLower]}>
      <Text style={styles.legCardLabel}>{label}</Text>
      <View style={styles.legValueRow}>
        <Text style={styles.legValue}>{steps}</Text>
        <Text style={styles.legUnit}>steps</Text>
        <View style={[styles.colorDot, { backgroundColor: accentColor }]} />
      </View>
      <View style={[styles.interpPill, { borderColor: accentColor }]}>
        <Text style={[styles.interpText, { color: accentColor }]}>{interp}</Text>
      </View>
      {isLower ? (
        <Text style={styles.lowerNote}>Lower score</Text>
      ) : null}
    </View>
  );
}

export function ResultScreen({ result, patient, stepHeight, onBack, onStartOver }: ResultScreenProps) {
  const insets = useSafeAreaInsets();

  const affectedSteps     = result?.primaryValue ?? 0;
  const affectedInterp    = result?.interpretation ?? '—';
  const affectedColor     = result?.meta.classColor ?? 'grey';
  const nonAffectedSteps  = result?.meta.nonAffectedSteps ?? 0;
  const nonAffectedInterp = result?.meta.nonAffectedInterp ?? '—';
  const nonAffectedColor  = result?.meta.nonAffectedColor ?? 'grey';
  const asymmetryIndex    = result?.meta.asymmetryIndex ?? null;
  const asymmetry         = result?.meta.asymmetry ?? false;

  const affectedIsLower    = affectedSteps < nonAffectedSteps;
  const nonAffectedIsLower = nonAffectedSteps < affectedSteps;

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={onBack} title="Step Test" />

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

        <View style={styles.resultHeader}>
          <View style={styles.resultHeaderCopy}>
            <Text style={styles.microLabel}>STEP TEST COMPLETE</Text>
            <Text style={styles.resultTitle}>Results</Text>
          </View>
          <ThreeBarMotif size="md" tone="soft" />
        </View>

        <View style={styles.legRow}>
          <LegResultCard
            label="AFFECTED LEG"
            steps={affectedSteps}
            interp={affectedInterp}
            colorKey={affectedColor}
            isLower={affectedIsLower}
          />
          <LegResultCard
            label="NON-AFFECTED"
            steps={nonAffectedSteps}
            interp={nonAffectedInterp}
            colorKey={nonAffectedColor}
            isLower={nonAffectedIsLower}
          />
        </View>

        <Card style={styles.contextCard}>
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>STEP HEIGHT</Text>
            <Text style={styles.contextValue}>{stepHeight || '7.5'} cm</Text>
          </View>
          <View style={styles.contextDivider} />
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>DURATION</Text>
            <Text style={styles.contextValue}>15 sec</Text>
          </View>
          {asymmetryIndex !== null ? (
            <>
              <View style={styles.contextDivider} />
              <View style={styles.contextRow}>
                <Text style={styles.contextLabel}>ASYMMETRY INDEX</Text>
                <Text style={[styles.contextValue, asymmetry && styles.contextValueWarning]}>
                  {asymmetryIndex}%{asymmetry ? ' ▲' : ''}
                </Text>
              </View>
            </>
          ) : null}
        </Card>

        {asymmetry ? (
          <Card style={styles.asymmetryCard}>
            <Text style={styles.asymmetryText}>
              Asymmetry index {asymmetryIndex}% — consider further assessment of limb symmetry.
            </Text>
          </Card>
        ) : null}

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
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  resultHeaderCopy: {
    gap: spacing.xs,
  },
  microLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
    letterSpacing: typography.trackingWide,
  },
  resultTitle: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  legRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  legCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  legCardLower: {
    borderColor: colors.coral,
    backgroundColor: '#FFF5F3',
  },
  legCardLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
    letterSpacing: typography.trackingWide,
    marginBottom: spacing.xs,
  },
  legValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  legValue: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  legUnit: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignSelf: 'center',
    marginLeft: spacing.xs,
  },
  interpPill: {
    alignSelf: 'flex-start',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
  },
  interpText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
  },
  lowerNote: {
    fontSize: typography.sizeXs,
    color: colors.coral,
    fontWeight: typography.weightSemibold,
    marginTop: spacing.xs,
  },
  contextCard: {
    gap: 0,
  },
  contextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  contextDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  contextLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    letterSpacing: typography.trackingWide,
  },
  contextValue: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  contextValueWarning: {
    color: colors.coral,
  },
  asymmetryCard: {
    backgroundColor: '#FFF5F3',
    borderColor: colors.coral,
  },
  asymmetryText: {
    fontSize: typography.sizeSm,
    color: colors.coral,
    lineHeight: 20,
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
    fontWeight: typography.weightMedium,
    color: colors.ink,
  },
});

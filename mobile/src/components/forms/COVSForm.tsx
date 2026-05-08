import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcCOVS, COVS_ITEMS } from '@clinical/covs';
import { getPatient } from '../../supabase/patients';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { Card } from '../ui/Card';
import { NavyHeader } from '../ui/NavyHeader';
import { PatientAvatar } from '../ui/PatientAvatar';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface COVSResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { classColor: 'red' | 'amber' | 'green' };
}

const COVS_SCORE_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;
const ITEM_COUNT = 13;
const MAX_SCORE = 91;

const COVS_COLOR_MAP: Record<string, string> = {
  green: colors.success,
  amber: '#a05c00',
  red:   colors.coral,
};

export function COVSForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [scores, setScores] = useState<(number | null)[]>(Array(ITEM_COUNT).fill(null));
  const [result, setResult] = useState<COVSResult | null>(null);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  function handleScore(itemIdx: number, score: number) {
    const next = scores.map((s, i) => (i === itemIdx ? score : s));
    setScores(next);
    if (next.every(s => s !== null)) {
      const r = calcCOVS({ items: next }) as COVSResult | null;
      setResult(r);
    } else {
      setResult(null);
    }
  }

  const scoredCount = scores.filter(s => s !== null).length;
  const runningTotal = scores.reduce<number>((sum, s) => sum + (s ?? 0), 0);
  const allScored = scoredCount === ITEM_COUNT;
  const progressPercent = (scoredCount / ITEM_COUNT) * 100;

  return (
    <Screen padded={false} rootBackground={colors.primary} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        mode="nav"
        leftLabel="‹"
        onLeft={() => router.back()}
        title="Clinical Outcome Variables Scale"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
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
        </Card>

        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>PROGRESS</Text>
          <View style={styles.progressHeader}>
            <Text style={styles.progressCount}>{scoredCount} / {ITEM_COUNT} scored</Text>
            <View style={styles.progressScoreRow}>
              <Text style={styles.progressScore}>{runningTotal}</Text>
              <Text style={styles.progressScoreUnit}>/{MAX_SCORE}</Text>
            </View>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` as any }]} />
          </View>
        </View>

        <Card style={styles.itemsCard}>
          {(COVS_ITEMS as string[]).map((itemName: string, idx: number) => {
            const isScored = scores[idx] !== null;
            const isLast = idx === ITEM_COUNT - 1;
            return (
              <View
                key={idx}
                style={[styles.itemRow, !isLast && styles.itemRowBorder]}
              >
                <View style={styles.itemHeader}>
                  <View style={[styles.itemBadge, isScored && styles.itemBadgeScored]}>
                    <Text style={[styles.itemBadgeText, isScored && styles.itemBadgeTextScored]}>
                      {idx + 1}
                    </Text>
                  </View>
                  <Text style={styles.itemName} numberOfLines={3}>{itemName}</Text>
                  {isScored ? (
                    <Text style={styles.itemCheck}>✓</Text>
                  ) : null}
                </View>

                <View style={styles.scoreRow}>
                  {COVS_SCORE_OPTIONS.map(score => {
                    const isSelected = scores[idx] === score;
                    return (
                      <Pressable
                        key={score}
                        onPress={() => handleScore(idx, score)}
                        style={({ pressed }) => [
                          styles.scoreBtn,
                          isSelected && styles.scoreBtnSelected,
                          pressed && styles.scoreBtnPressed,
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`Item ${idx + 1} score ${score}`}
                      >
                        <Text style={[styles.scoreBtnText, isSelected && styles.scoreBtnTextSelected]}>
                          {score}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </Card>

        {allScored && result !== null ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultMicroLabel}>COVS RESULT</Text>
            <View style={styles.resultValueRow}>
              <Text style={styles.resultValue}>{result.primaryValue}</Text>
              <Text style={styles.resultUnit}>{result.primaryUnit}</Text>
              <View style={[
                styles.resultColorDot,
                { backgroundColor: COVS_COLOR_MAP[result.meta.classColor] ?? colors.muted },
              ]} />
            </View>
            <View style={styles.resultInterpPill}>
              <Text style={styles.resultInterpText}>{result.interpretation}</Text>
            </View>
          </View>
        ) : null}
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
  progressCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  progressLabel: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    letterSpacing: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressCount: {
    fontSize: typography.sizeMd,
    color: colors.muted,
    fontWeight: typography.weightMedium,
  },
  progressScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  progressScore: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.actionBlue,
  },
  progressScoreUnit: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: colors.actionBlue,
    borderRadius: radii.sm,
  },
  itemsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  itemRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  itemBadge: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  itemBadgeScored: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemBadgeText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: colors.muted,
  },
  itemBadgeTextScored: {
    color: '#FFFFFF',
  },
  itemName: {
    flex: 1,
    fontSize: typography.sizeMd,
    color: colors.ink,
  },
  itemCheck: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
    color: colors.success,
    flexShrink: 0,
    marginTop: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 4,
  },
  scoreBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  scoreBtnPressed: {
    opacity: 0.65,
  },
  scoreBtnText: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
  },
  scoreBtnTextSelected: {
    color: '#FFFFFF',
  },
  resultCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  resultMicroLabel: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    letterSpacing: 1,
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
    borderRadius: radii.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  resultInterpText: {
    fontSize: typography.sizeSm,
    color: colors.ink,
  },
});

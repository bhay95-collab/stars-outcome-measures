import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcFSS, FSS_ITEMS } from '@clinical/fss';
import { getPatient } from '../../supabase/patients';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { Card } from '../ui/Card';
import { NavyHeader } from '../ui/NavyHeader';
import { PatientAvatar } from '../ui/PatientAvatar';
import { ThreeBarMotif } from '../ui/ThreeBarMotif';
import { ScoreChipRow } from './fields/ScoreChipRow';
import type { ChipOption } from './fields/ScoreChipRow';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface FSSResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { classColor: 'green' | 'amber' | 'red'; mean: number };
}

const ITEM_COUNT = 9;

const FSS_OPTIONS: ChipOption[] = [1, 2, 3, 4, 5, 6, 7].map(v => ({ value: v }));

const COLOR_MAP: Record<string, string> = {
  green: colors.success,
  amber: '#a05c00',
  red: colors.coral,
};

export function FSSForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [scores, setScores] = useState<(number | null)[]>(Array(ITEM_COUNT).fill(null));
  const [result, setResult] = useState<FSSResult | null>(null);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  function handleScore(idx: number, value: number) {
    const next = scores.map((s, i) => (i === idx ? value : s));
    setScores(next);
    if (next.every(s => s !== null)) {
      setResult(calcFSS({ items: next }) as FSSResult | null);
    } else {
      setResult(null);
    }
  }

  const scoredCount = scores.filter(s => s !== null).length;
  const runningTotal = scores.reduce<number>((sum, s) => sum + (s ?? 0), 0);
  const progressPercent = (scoredCount / ITEM_COUNT) * 100;

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title="FSS" />

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
        </Card>

        <View style={styles.progressCard}>
          <Text style={styles.progressMeta}>PROGRESS</Text>
          <View style={styles.progressHeader}>
            <Text style={styles.progressCount}>{scoredCount} / {ITEM_COUNT} scored</Text>
            <View style={styles.progressScoreRow}>
              <Text style={styles.progressScore}>{runningTotal}</Text>
              <Text style={styles.progressUnit}>/63</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` as any }]} />
          </View>
        </View>

        <Card>
          {(FSS_ITEMS as string[]).map((itemText: string, idx: number) => {
            const isLast = idx === ITEM_COUNT - 1;
            return (
              <View key={idx} style={[styles.itemRow, !isLast && styles.itemBorder]}>
                <View style={styles.itemHeader}>
                  <View style={[styles.itemBadge, scores[idx] !== null && styles.itemBadgeScored]}>
                    <Text style={[styles.itemNum, scores[idx] !== null && styles.itemNumScored]}>
                      {idx + 1}
                    </Text>
                  </View>
                  <Text style={styles.itemText}>{itemText}</Text>
                  {scores[idx] !== null ? <Text style={styles.itemCheck}>✓</Text> : null}
                </View>
                <View style={styles.chipWrap}>
                  <ScoreChipRow
                    options={FSS_OPTIONS}
                    selected={scores[idx]}
                    onSelect={v => handleScore(idx, v)}
                  />
                </View>
              </View>
            );
          })}
        </Card>

        {result !== null ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeaderRow}>
              <View>
                <Text style={styles.resultMeta}>FSS RESULT</Text>
                <View style={styles.resultValueRow}>
                  <Text style={styles.resultValue}>{result.primaryValue}</Text>
                  <Text style={styles.resultUnit}>{result.primaryUnit}</Text>
                  <View style={[styles.colorDot, { backgroundColor: COLOR_MAP[result.meta.classColor] }]} />
                </View>
                <Text style={styles.resultMean}>Mean: {result.meta.mean}</Text>
              </View>
              <ThreeBarMotif size="sm" tone="soft" />
            </View>
            <View style={[styles.interpPill, { borderColor: COLOR_MAP[result.meta.classColor] }]}>
              <Text style={[styles.interpText, { color: COLOR_MAP[result.meta.classColor] }]}>
                {result.interpretation}
              </Text>
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
  patientName: { fontSize: typography.sizeMd, fontWeight: typography.weightSemibold, color: colors.ink },
  patientSub: { fontSize: typography.sizeSm, color: colors.muted, marginTop: spacing.xs },
  progressCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
  },
  progressMeta: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
  },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressCount: { fontSize: typography.sizeMd, color: colors.muted, fontWeight: typography.weightMedium },
  progressScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  progressScore: { fontSize: typography.size2xl, fontWeight: typography.weightBold, color: colors.primary },
  progressUnit: { fontSize: typography.sizeSm, color: colors.muted },
  progressTrack: {
    height: 4,
    backgroundColor: colors.secondarySoft,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: 4, backgroundColor: colors.primary, borderRadius: 2 },
  itemRow: { paddingVertical: spacing.md, gap: spacing.sm },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  itemBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemBadgeScored: { backgroundColor: colors.primarySoft, borderColor: colors.secondarySoft },
  itemNum: { fontSize: typography.sizeXs, fontWeight: typography.weightBold, color: colors.muted },
  itemNumScored: { color: colors.primary },
  itemText: { flex: 1, fontSize: typography.sizeSm, color: colors.ink, lineHeight: 20 },
  itemCheck: { fontSize: typography.sizeSm, color: colors.primary },
  chipWrap: { paddingLeft: 32 },
  resultCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
  },
  resultHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  resultMeta: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
    marginBottom: spacing.xs,
  },
  resultValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  resultValue: { fontSize: 36, fontWeight: typography.weightBold, color: colors.actionBlue, lineHeight: 40 },
  resultUnit: { fontSize: typography.sizeMd, color: colors.muted, fontWeight: typography.weightSemibold },
  colorDot: { width: 10, height: 10, borderRadius: 5, alignSelf: 'center' },
  resultMean: { fontSize: typography.sizeSm, color: colors.muted, marginTop: spacing.xs },
  interpPill: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  interpText: { fontSize: typography.sizeSm, fontWeight: typography.weightSemibold },
});

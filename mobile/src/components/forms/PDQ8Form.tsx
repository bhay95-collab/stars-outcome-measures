import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcPDQ8, PDQ8_ITEMS, PDQ8_OPTIONS } from '@clinical/pdq8';
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

interface PDQ8Result {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { classColor: 'green' | 'amber' | 'red'; rawSum: number };
}

interface PDQ8ItemType { label: string }
interface PDQ8OptionType { value: number; label: string }

const ITEM_COUNT = 8;

const COLOR_MAP: Record<string, string> = {
  green: colors.success,
  amber: '#a05c00',
  red: colors.coral,
};

export function PDQ8Form({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [scores, setScores] = useState<(number | null)[]>(Array(ITEM_COUNT).fill(null));
  const [result, setResult] = useState<PDQ8Result | null>(null);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  const chipOptions: ChipOption[] = (PDQ8_OPTIONS as PDQ8OptionType[]).map(o => ({
    value: o.value,
    label: o.label,
  }));

  function handleScore(idx: number, value: number) {
    const next = scores.map((s, i) => (i === idx ? value : s));
    setScores(next);
    if (next.every(s => s !== null)) {
      setResult(calcPDQ8({ items: next }) as PDQ8Result | null);
    } else {
      setResult(null);
    }
  }

  const scoredCount = scores.filter(s => s !== null).length;
  const progressPercent = (scoredCount / ITEM_COUNT) * 100;

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title="PDQ-8" />

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
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` as any }]} />
          </View>
        </View>

        <Card>
          {(PDQ8_ITEMS as PDQ8ItemType[]).map((item: PDQ8ItemType, idx: number) => {
            const isLast = idx === ITEM_COUNT - 1;
            return (
              <View key={idx} style={[styles.itemRow, !isLast && styles.itemBorder]}>
                <View style={styles.itemHeader}>
                  <View style={[styles.itemBadge, scores[idx] !== null && styles.itemBadgeScored]}>
                    <Text style={[styles.itemNum, scores[idx] !== null && styles.itemNumScored]}>
                      {idx + 1}
                    </Text>
                  </View>
                  <Text style={styles.itemText}>{item.label}</Text>
                  {scores[idx] !== null ? <Text style={styles.itemCheck}>✓</Text> : null}
                </View>
                <View style={styles.chipWrap}>
                  <ScoreChipRow
                    options={chipOptions}
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
                <Text style={styles.resultMeta}>PDQ-8 RESULT</Text>
                <View style={styles.resultValueRow}>
                  <Text style={styles.resultValue}>{result.primaryValue}</Text>
                  <Text style={styles.resultUnit}>{result.primaryUnit}</Text>
                  <View style={[styles.colorDot, { backgroundColor: COLOR_MAP[result.meta.classColor] }]} />
                </View>
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
  interpPill: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  interpText: { fontSize: typography.sizeSm, fontWeight: typography.weightSemibold },
});

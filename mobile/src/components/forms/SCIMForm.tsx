import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcSCIM, SCIM_ITEMS } from '@clinical/scim';
import { getPatient } from '../../supabase/patients';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { Card } from '../ui/Card';
import { NavyHeader } from '../ui/NavyHeader';
import { PatientAvatar } from '../ui/PatientAvatar';
import { ThreeBarMotif } from '../ui/ThreeBarMotif';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface SCIMResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { sc: number; rs: number; mob: number; classColor: 'green' | 'amber' | 'red' };
}

interface SCIMOption { v: number; t: string }
interface SCIMItemType { sub: string; label: string; max: number; opts: SCIMOption[] }

const ITEM_COUNT = 19;

const SUBSCALES: { label: string; key: string; range: [number, number]; max: number }[] = [
  { label: 'Self-care',                key: 'sc',  range: [0, 5],   max: 20 },
  { label: 'Respiration & Sphincters', key: 'rs',  range: [6, 9],   max: 36 },
  { label: 'Mobility',                 key: 'mob', range: [10, 18], max: 40 },
];

const COLOR_MAP: Record<string, string> = {
  green: colors.success,
  amber: colors.amber,
  red: colors.coral,
};

function stripPrefix(t: string): string {
  return t.replace(/^\d+ — /, '');
}

export function SCIMForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [scores, setScores] = useState<(number | null)[]>(Array(ITEM_COUNT).fill(null));
  const [result, setResult] = useState<SCIMResult | null>(null);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  function handleScore(idx: number, value: number) {
    const next = scores.map((s, i) => (i === idx ? value : s));
    setScores(next);
    if (next.every(s => s !== null)) {
      setResult(calcSCIM({ items: next }) as SCIMResult | null);
    } else {
      setResult(null);
    }
  }

  const scoredCount = scores.filter(s => s !== null).length;
  const runningTotal = scores.reduce<number>((sum, s) => sum + (s ?? 0), 0);
  const progressPercent = (scoredCount / ITEM_COUNT) * 100;
  const items = SCIM_ITEMS as SCIMItemType[];

  function subscaleRunning(range: [number, number]): number {
    return scores.slice(range[0], range[1] + 1).reduce<number>((sum, s) => sum + (s ?? 0), 0);
  }

  function renderSection(sub: typeof SUBSCALES[number]) {
    const sectionItems = items.slice(sub.range[0], sub.range[1] + 1);
    const subTotal = subscaleRunning(sub.range);
    return (
      <Card key={sub.key}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{sub.label.toUpperCase()}</Text>
          <View style={styles.sectionScoreRow}>
            <Text style={styles.sectionScore}>{subTotal}</Text>
            <Text style={styles.sectionMax}>/{sub.max}</Text>
          </View>
        </View>

        {sectionItems.map((item, localIdx) => {
          const idx = sub.range[0] + localIdx;
          const isLast = localIdx === sectionItems.length - 1;
          return (
            <View key={item.label} style={[styles.itemRow, !isLast && styles.itemBorder]}>
              <View style={styles.itemHeader}>
                <View style={[styles.itemBadge, scores[idx] !== null && styles.itemBadgeScored]}>
                  <Text style={[styles.itemNum, scores[idx] !== null && styles.itemNumScored]}>
                    {idx + 1}
                  </Text>
                </View>
                <Text style={styles.itemText}>{item.label}</Text>
                {scores[idx] !== null ? <Text style={styles.itemCheck}>✓</Text> : null}
              </View>

              <View style={styles.optionList}>
                {item.opts.map(opt => {
                  const isSelected = scores[idx] === opt.v;
                  return (
                    <Pressable
                      key={opt.v}
                      onPress={() => handleScore(idx, opt.v)}
                      style={({ pressed }) => [
                        styles.optionRow,
                        isSelected && styles.optionRowSelected,
                        pressed && styles.optionRowPressed,
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={opt.t}
                    >
                      <View style={[styles.optionValueBadge, isSelected && styles.optionValueBadgeSelected]}>
                        <Text style={[styles.optionValue, isSelected && styles.optionValueSelected]}>
                          {opt.v}
                        </Text>
                      </View>
                      <Text
                        style={[styles.optionDesc, isSelected && styles.optionDescSelected]}
                        numberOfLines={3}
                      >
                        {stripPrefix(opt.t)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </Card>
    );
  }

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title="SCIM III" />

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
          <Text style={styles.progressMeta}>
          {scoredCount < ITEM_COUNT ? 'RUNNING TOTAL' : 'TOTAL'}
        </Text>
          <View style={styles.progressHeader}>
            <Text style={styles.progressCount}>{scoredCount} / {ITEM_COUNT} scored</Text>
            <View style={styles.progressScoreRow}>
              <Text style={styles.progressScore}>{runningTotal}</Text>
              <Text style={styles.progressUnit}>/100</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` as any }]} />
          </View>
        </View>

        {SUBSCALES.map(sub => renderSection(sub))}

        {result !== null ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeaderRow}>
              <Text style={styles.resultMeta}>SCIM RESULT</Text>
              <ThreeBarMotif size="sm" tone="soft" />
            </View>

            <View style={styles.resultValueRow}>
              <Text style={styles.resultValue}>{result.primaryValue}</Text>
              <Text style={styles.resultUnit}>{result.primaryUnit}</Text>
              <View style={[styles.colorDot, { backgroundColor: COLOR_MAP[result.meta.classColor] }]} />
            </View>

            <View style={styles.subscaleRow}>
              <View style={styles.subscaleBadge}>
                <Text style={styles.subscaleLabel}>SC</Text>
                <Text style={styles.subscaleScore}>
                  {result.meta.sc}<Text style={styles.subscaleMax}>/20</Text>
                </Text>
              </View>
              <View style={styles.subscaleBadge}>
                <Text style={styles.subscaleLabel}>RS</Text>
                <Text style={styles.subscaleScore}>
                  {result.meta.rs}<Text style={styles.subscaleMax}>/36</Text>
                </Text>
              </View>
              <View style={styles.subscaleBadge}>
                <Text style={styles.subscaleLabel}>MOB</Text>
                <Text style={styles.subscaleScore}>
                  {result.meta.mob}<Text style={styles.subscaleMax}>/40</Text>
                </Text>
              </View>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightBold,
    letterSpacing: typography.trackingWide,
  },
  sectionScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  sectionScore: { fontSize: typography.sizeMd, fontWeight: typography.weightBold, color: colors.primary },
  sectionMax: { fontSize: typography.sizeXs, color: colors.muted },
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
  optionList: { paddingLeft: 32, gap: spacing.xs },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionRowSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.secondarySoft,
  },
  optionRowPressed: { opacity: 0.65 },
  optionValueBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionValueBadgeSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionValue: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
    color: colors.muted,
  },
  optionValueSelected: { color: '#FFFFFF' },
  optionDesc: {
    flex: 1,
    fontSize: typography.sizeSm,
    color: colors.ink,
    lineHeight: 18,
    paddingTop: 2,
  },
  optionDescSelected: { color: colors.primary, fontWeight: typography.weightMedium },
  resultCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  resultMeta: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
  },
  resultValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  resultValue: { fontSize: 36, fontWeight: typography.weightBold, color: colors.actionBlue, lineHeight: 40 },
  resultUnit: { fontSize: typography.sizeMd, color: colors.muted, fontWeight: typography.weightSemibold },
  colorDot: { width: 10, height: 10, borderRadius: 5, alignSelf: 'center' },
  subscaleRow: { flexDirection: 'row', gap: spacing.sm },
  subscaleBadge: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  subscaleLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    letterSpacing: typography.trackingWide,
  },
  subscaleScore: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.actionBlue,
  },
  subscaleMax: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.muted,
  },
  interpPill: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  interpText: { fontSize: typography.sizeSm, fontWeight: typography.weightSemibold },
});

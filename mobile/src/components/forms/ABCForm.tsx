import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcABC, ABC_ITEMS } from '@clinical/abc';
import { getPatient } from '../../supabase/patients';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { Card } from '../ui/Card';
import { NavyHeader } from '../ui/NavyHeader';
import { PatientAvatar } from '../ui/PatientAvatar';
import { ThreeBarMotif } from '../ui/ThreeBarMotif';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface ABCResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { classColor: 'green' | 'amber' | 'red' };
}

interface ABCItemType { label: string }

const ITEM_COUNT = 16;

const COLOR_MAP: Record<string, string> = {
  green: colors.success,
  amber: colors.amber,
  red: colors.coral,
};

function parsePercent(text: string): number | null {
  const n = parseFloat(text.trim());
  if (!isFinite(n) || n < 0 || n > 100) return null;
  return n;
}

export function ABCForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [inputs, setInputs] = useState<string[]>(Array(ITEM_COUNT).fill(''));
  const [values, setValues] = useState<(number | null)[]>(Array(ITEM_COUNT).fill(null));
  const [result, setResult] = useState<ABCResult | null>(null);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  function handleChange(idx: number, text: string) {
    const nextInputs = inputs.map((s, i) => (i === idx ? text : s));
    const parsed = parsePercent(text);
    const nextValues = values.map((v, i) => (i === idx ? parsed : v));
    setInputs(nextInputs);
    setValues(nextValues);
    if (nextValues.every(v => v !== null)) {
      setResult(calcABC({ items: nextValues }) as ABCResult | null);
    } else {
      setResult(null);
    }
  }

  const enteredCount = values.filter(v => v !== null).length;
  const progressPercent = (enteredCount / ITEM_COUNT) * 100;

  const runningMean = enteredCount > 0
    ? parseFloat((values.reduce<number>((sum, v) => sum + (v ?? 0), 0) / enteredCount).toFixed(1))
    : 0;

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title="ABC" />

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
            <Text style={styles.progressCount}>{enteredCount} / {ITEM_COUNT} entered</Text>
            {enteredCount > 0 ? (
              <View style={styles.progressScoreRow}>
                <Text style={styles.progressScore}>{runningMean}</Text>
                <Text style={styles.progressUnit}>% mean</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` as any }]} />
          </View>
        </View>

        <Card>
          <Text style={styles.inputHint}>Enter confidence % (0–100) for each activity</Text>
          {(ABC_ITEMS as ABCItemType[]).map((item: ABCItemType, idx: number) => {
            const isLast = idx === ITEM_COUNT - 1;
            const isEntered = values[idx] !== null;
            return (
              <View key={item.label} style={[styles.itemRow, !isLast && styles.itemBorder]}>
                <View style={[styles.itemBadge, isEntered && styles.itemBadgeScored]}>
                  <Text style={[styles.itemNum, isEntered && styles.itemNumScored]}>
                    {idx + 1}
                  </Text>
                </View>
                <Text style={styles.itemText}>{item.label}</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={[styles.percentInput, isEntered && styles.percentInputFilled]}
                    value={inputs[idx]}
                    onChangeText={text => handleChange(idx, text)}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={colors.subtle}
                    textAlign="center"
                    maxLength={5}
                    accessibilityLabel={`Item ${idx + 1} confidence percentage`}
                  />
                  <Text style={styles.percentUnit}>%</Text>
                </View>
              </View>
            );
          })}
        </Card>

        {result !== null ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeaderRow}>
              <View>
                <Text style={styles.resultMeta}>ABC RESULT</Text>
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
  inputHint: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
  itemText: { flex: 1, fontSize: typography.sizeSm, color: colors.ink, lineHeight: 18 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 0 },
  percentInput: {
    width: 52,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    textAlign: 'center',
  },
  percentInputFilled: {
    borderColor: colors.secondarySoft,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
  },
  percentUnit: { fontSize: typography.sizeSm, color: colors.muted, width: 14 },
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

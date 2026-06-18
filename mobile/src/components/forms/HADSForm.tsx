import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcHADS, HADS_ITEMS } from '@clinical/hads';
import { getPatient } from '../../supabase/patients';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { Card } from '../ui/Card';
import { NavyHeader } from '../ui/NavyHeader';
import { PatientAvatar } from '../ui/PatientAvatar';
import { ThreeBarMotif } from '../ui/ThreeBarMotif';
import { ScoreChipRow } from './fields/ScoreChipRow';
import type { ChipOption } from './fields/ScoreChipRow';
import { QuestionnaireItem } from './fields/QuestionnaireItem';
import { QuestionnaireProgress } from './fields/QuestionnaireProgress';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { saveAssessment } from '../../supabase/assessments';
import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../ui/Button';
import { ACTION_TIMEOUT_MS } from '../../utils/withTimeout';

interface HADSResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: {
    classColor: 'green' | 'amber' | 'red';
    depressionScore: number;
    depressionClassification: string;
    depressionColor: 'green' | 'amber' | 'red';
  };
}

interface HADSItemType {
  text: string;
  subscale: 'A' | 'D';
}

const ITEM_COUNT = 14;

const HADS_OPTIONS: ChipOption[] = [0, 1, 2, 3].map(v => ({ value: v }));

const COLOR_MAP: Record<string, string> = {
  green: colors.success,
  amber: colors.amber,
  red: colors.coral,
};

const SUBSCALE_COLOR: Record<string, string> = {
  A: colors.primary,
  D: colors.violet,
};

type SaveState = 'idle' | 'saving' | 'timed-out' | 'saved' | 'error';

export function HADSForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [scores, setScores] = useState<(number | null)[]>(Array(ITEM_COUNT).fill(null));
  const [result, setResult] = useState<HADSResult | null>(null);
  const { user } = useAuth();
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  function resetSaveState() {
    setSaveState('idle');
    setSaveError(null);
  }

  async function handleSave() {
    if (saveState === 'saving' || saveState === 'timed-out' || !result) return;
    if (!user) {
      setSaveError('Your session has expired. Please sign in again.');
      setSaveState('error');
      return;
    }
    setSaveState('saving');
    setSaveError(null);

    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      setSaveState('timed-out');
      setSaveError('Save timed out. Your result may not have been saved. Check your connection before trying again.');
    }, ACTION_TIMEOUT_MS);
    try {
      await saveAssessment({
        patient_id: patientId,
        measure: 'HADS',
        inputs: { items: scores as number[] },
        results: {
          ...result,
          meta: { ...result.meta, encounterDate: new Date().toISOString() },
        },
      });
      clearTimeout(timeoutId);
      if (!timedOut) {
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 3000);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      if (!timedOut) {
        setSaveError(e instanceof Error ? e.message : 'Unable to save result. Please try again.');
        setSaveState('error');
      }
    }
  }

  function handleScore(idx: number, value: number) {
    resetSaveState();
    const next = scores.map((s, i) => (i === idx ? value : s));
    setScores(next);
    if (next.every(s => s !== null)) {
      setResult(calcHADS({ items: next }) as HADSResult | null);
    } else {
      setResult(null);
    }
  }

  const scoredCount = scores.filter(s => s !== null).length;

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title="HADS" />

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

        <QuestionnaireProgress
          scoredCount={scoredCount}
          itemCount={ITEM_COUNT}
          headerRight={
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: SUBSCALE_COLOR.A }]} />
              <Text style={styles.legendText}>Anxiety</Text>
              <View style={[styles.legendDot, { backgroundColor: SUBSCALE_COLOR.D }]} />
              <Text style={styles.legendText}>Depression</Text>
            </View>
          }
        />

        <Card>
          {(HADS_ITEMS as HADSItemType[]).map((item: HADSItemType, idx: number) => (
            <QuestionnaireItem
              key={item.text}
              index={idx}
              text={item.text}
              scored={scores[idx] !== null}
              showDivider={idx !== ITEM_COUNT - 1}
              trailing={
                <View style={[styles.subscalePill, { backgroundColor: SUBSCALE_COLOR[item.subscale] }]}>
                  <Text style={styles.subscalePillText}>{item.subscale}</Text>
                </View>
              }
            >
              <ScoreChipRow
                options={HADS_OPTIONS}
                label={item.text}
                selected={scores[idx]}
                onSelect={v => handleScore(idx, v)}
              />
            </QuestionnaireItem>
          ))}
        </Card>

        {result !== null ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeaderRow}>
              <Text style={styles.resultMeta}>HADS RESULT</Text>
              <ThreeBarMotif size="sm" tone="soft" />
            </View>

            <View style={styles.subscaleResultRow}>
              <View style={styles.subscaleResultBlock}>
                <View style={styles.subscaleResultHeader}>
                  <View style={[styles.subscaleResultDot, { backgroundColor: SUBSCALE_COLOR.A }]} />
                  <Text style={styles.subscaleResultLabel}>ANXIETY</Text>
                </View>
                <View style={styles.subscaleScoreRow}>
                  <Text style={styles.subscaleScoreValue}>{result.primaryValue}</Text>
                  <Text style={styles.subscaleScoreUnit}>/21</Text>
                  <View style={[styles.colorDot, { backgroundColor: COLOR_MAP[result.meta.classColor] }]} />
                </View>
                <View style={[styles.interpPill, { borderColor: COLOR_MAP[result.meta.classColor] }]}>
                  <Text style={[styles.interpText, { color: COLOR_MAP[result.meta.classColor] }]}>
                    {result.interpretation}
                  </Text>
                </View>
              </View>

              <View style={styles.subscaleResultBlock}>
                <View style={styles.subscaleResultHeader}>
                  <View style={[styles.subscaleResultDot, { backgroundColor: SUBSCALE_COLOR.D }]} />
                  <Text style={styles.subscaleResultLabel}>DEPRESSION</Text>
                </View>
                <View style={styles.subscaleScoreRow}>
                  <Text style={styles.subscaleScoreValue}>{result.meta.depressionScore}</Text>
                  <Text style={styles.subscaleScoreUnit}>/21</Text>
                  <View style={[styles.colorDot, { backgroundColor: COLOR_MAP[result.meta.depressionColor] }]} />
                </View>
                <View style={[styles.interpPill, { borderColor: COLOR_MAP[result.meta.depressionColor] }]}>
                  <Text style={[styles.interpText, { color: COLOR_MAP[result.meta.depressionColor] }]}>
                    {result.meta.depressionClassification}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {result !== null ? (
          saveState === 'saved' ? (
            <View style={styles.savedBanner}>
              <Text style={styles.savedText}>Result saved</Text>
            </View>
          ) : (
            <>
              <Button
                label="Save Result"
                onPress={handleSave}
                loading={saveState === 'saving'}
                disabled={saveState === 'saving' || saveState === 'timed-out'}
              />
              {(saveState === 'error' || saveState === 'timed-out') && saveError ? (
                <Text style={styles.saveErrorText}>{saveError}</Text>
              ) : null}
            </>
          )
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
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: typography.sizeXs, color: colors.muted },
  subscalePill: {
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  subscalePillText: { fontSize: typography.sizeXs, fontWeight: typography.weightBold, color: '#FFFFFF' },
  chipWrap: { paddingLeft: 32 },
  resultCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.md,
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
  subscaleResultRow: { flexDirection: 'row', gap: spacing.sm },
  subscaleResultBlock: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  subscaleResultHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  subscaleResultDot: { width: 8, height: 8, borderRadius: 4 },
  subscaleResultLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: colors.muted,
    letterSpacing: typography.trackingWide,
  },
  subscaleScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  subscaleScoreValue: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.actionBlue,
    lineHeight: 32,
  },
  subscaleScoreUnit: { fontSize: typography.sizeSm, color: colors.muted },
  colorDot: { width: 8, height: 8, borderRadius: 4, alignSelf: 'center' },
  interpPill: {
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  interpText: { fontSize: 10, fontWeight: typography.weightSemibold },
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

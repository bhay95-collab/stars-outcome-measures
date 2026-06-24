import React, { useState, useEffect, useRef } from 'react';
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
import { ScaleKey } from './fields/ScaleKey';
import type { ScaleKeyEntry } from './fields/ScaleKey';
import { QuestionnaireItem } from './fields/QuestionnaireItem';
import { QuestionnaireProgress } from './fields/QuestionnaireProgress';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { saveAssessment } from '../../supabase/assessments';
import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../ui/Button';
import { ACTION_TIMEOUT_MS } from '../../utils/withTimeout';

interface FSSResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { classColor: 'green' | 'amber' | 'red'; mean: number };
}

const ITEM_COUNT = 9;

const FSS_OPTIONS: ChipOption[] = [1, 2, 3, 4, 5, 6, 7].map(v => ({ value: v }));

// FSS is a 7-point agreement scale; only the endpoints carry standard anchors.
const FSS_SCALE_KEY: ScaleKeyEntry[] = [
  { value: 1, label: 'Strongly disagree' },
  { value: 7, label: 'Strongly agree' },
];

const COLOR_MAP: Record<string, string> = {
  green: colors.success,
  amber: colors.amber,
  red: colors.coral,
};

type SaveState = 'idle' | 'saving' | 'timed-out' | 'saved' | 'error';

export function FSSForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [scores, setScores] = useState<(number | null)[]>(Array(ITEM_COUNT).fill(null));
  const [result, setResult] = useState<FSSResult | null>(null);
  const { user } = useAuth();
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  useEffect(() => () => { mountedRef.current = false; }, []);

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
      if (mountedRef.current) {
        setSaveState('timed-out');
        setSaveError('Save timed out. Your result may not have been saved. Check your connection before trying again.');
      }
    }, ACTION_TIMEOUT_MS);
    try {
      await saveAssessment({
        patient_id: patientId,
        measure: 'FSS',
        inputs: { items: scores as number[] },
        results: {
          ...result,
          meta: { ...result.meta, encounterDate: new Date().toISOString() },
        },
      });
      clearTimeout(timeoutId);
      if (!timedOut) {
        setSaveState('saved');
        setTimeout(() => { if (mountedRef.current) setSaveState('idle'); }, 3000);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      if (!timedOut && mountedRef.current) {
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
      setResult(calcFSS({ items: next }) as FSSResult | null);
    } else {
      setResult(null);
    }
  }

  const scoredCount = scores.filter(s => s !== null).length;
  const runningTotal = scores.reduce<number>((sum, s) => sum + (s ?? 0), 0);

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

        <QuestionnaireProgress
          scoredCount={scoredCount}
          itemCount={ITEM_COUNT}
          runningTotal={runningTotal}
          maxTotal={63}
        />

        <ScaleKey entries={FSS_SCALE_KEY} />

        <Card>
          {(FSS_ITEMS as string[]).map((itemText: string, idx: number) => (
            <QuestionnaireItem
              key={itemText}
              index={idx}
              text={itemText}
              scored={scores[idx] !== null}
              showDivider={idx !== ITEM_COUNT - 1}
            >
              <ScoreChipRow
                options={FSS_OPTIONS}
                label={itemText}
                selected={scores[idx]}
                onSelect={v => handleScore(idx, v)}
              />
            </QuestionnaireItem>
          ))}
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

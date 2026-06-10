import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcSARA, SARA_ITEMS } from '@clinical/sara';
import { getPatient } from '../../supabase/patients';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { Card } from '../ui/Card';
import { NavyHeader } from '../ui/NavyHeader';
import { PatientAvatar } from '../ui/PatientAvatar';
import { ClinicalTimer } from './ClinicalTimer';
import { ThreeBarMotif } from '../ui/ThreeBarMotif';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { saveAssessment } from '../../supabase/assessments';
import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../ui/Button';
import { SAVE_TIMEOUT_MS } from '../../utils/withTimeout';

interface SARAResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { classColor: 'red' | 'amber' | 'green' };
}

interface BilateralScore {
  right: number | null;
  left: number | null;
}

interface FastAltSecs {
  right: number | null;
  left: number | null;
}

interface SaraItem {
  label: string;
  options: number[];
}

type SaveState = 'idle' | 'saving' | 'timed-out' | 'saved' | 'error';

const ITEM_COUNT = 8;
const UNI_COUNT = 4;
const BIL_COUNT = 4;
const FAST_ALT_BIL_IDX = 2; // bilateral[2] = fast alternating hand movements (item 6 overall)

const SARA_COLOR_MAP: Record<string, string> = {
  green: colors.success,
  amber: colors.amber,
  red:   colors.coral,
};

function getBilateralMean(b: BilateralScore): number | null {
  if (b.right === null || b.left === null) return null;
  return (b.right + b.left) / 2;
}

function formatScore(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

const uniItems = (SARA_ITEMS as SaraItem[]).slice(0, UNI_COUNT);
const bilItems = (SARA_ITEMS as SaraItem[]).slice(UNI_COUNT);

export function SARAForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [unilateral, setUnilateral] = useState<(number | null)[]>(Array(UNI_COUNT).fill(null));
  const [bilateral, setBilateral] = useState<BilateralScore[]>(
    Array.from({ length: BIL_COUNT }, () => ({ right: null, left: null })),
  );
  const [fastAlt, setFastAlt] = useState<FastAltSecs>({ right: null, left: null });
  const [result, setResult] = useState<SARAResult | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [timerResetSignal, setTimerResetSignal] = useState(0);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  function tryCalc(uni: (number | null)[], bil: BilateralScore[]) {
    const means = bil.map(getBilateralMean);
    const items = [...uni, ...means];
    if (items.some(v => v === null)) {
      setResult(null);
      return;
    }
    const r = calcSARA({ items: items as number[] }) as SARAResult | null;
    setResult(r);
  }

  function resetSaveState() {
    setSaveState('idle');
    setSaveError(null);
  }

  function resetAssessmentCapture() {
    setUnilateral(Array(UNI_COUNT).fill(null));
    setBilateral(Array.from({ length: BIL_COUNT }, () => ({ right: null, left: null })));
    setFastAlt({ right: null, left: null });
    setResult(null);
    setTimerResetSignal(signal => signal + 1);
  }

  function handleUnilateral(itemIdx: number, score: number) {
    const next = unilateral.map((s, i) => (i === itemIdx ? (s === score ? null : score) : s));
    setUnilateral(next);
    tryCalc(next, bilateral);
    resetSaveState();
  }

  function handleBilateral(bilIdx: number, side: 'right' | 'left', score: number) {
    const next = bilateral.map((b, i) =>
      i === bilIdx ? { ...b, [side]: b[side] === score ? null : score } : b,
    );
    setBilateral(next);
    tryCalc(unilateral, next);
    resetSaveState();
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
    }, SAVE_TIMEOUT_MS);
    try {
      await saveAssessment({
        patient_id: patientId,
        measure: 'SARA',
        inputs: {
          unilateral: [...unilateral],
          bilateral: bilateral.map(b => ({ right: b.right, left: b.left })),
          fastAlt: { right: fastAlt.right, left: fastAlt.left },
        },
        results: {
          ...result,
          meta: { ...result.meta, encounterDate: new Date().toISOString() },
        },
      });
      clearTimeout(timeoutId);
      if (!timedOut) {
        resetAssessmentCapture();
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

  const bilateralMeans = bilateral.map(getBilateralMean);
  const runningTotal =
    unilateral.reduce<number>((s, v) => s + (v ?? 0), 0) +
    bilateralMeans.reduce<number>((s, m) => s + (m ?? 0), 0);
  const scoredCount =
    unilateral.filter(v => v !== null).length +
    bilateral.filter(b => b.right !== null && b.left !== null).length;

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        mode="nav"
        leftLabel="‹"
        onLeft={() => router.back()}
        title="SARA"
      />

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

        <Card style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              <Text style={styles.progressHighlight}>{scoredCount}</Text>
              <Text style={styles.progressMuted}> / {ITEM_COUNT} items scored</Text>
            </Text>
            <Text style={styles.progressText}>
              <Text style={styles.progressMuted}>Running: </Text>
              <Text style={styles.progressHighlight}>{formatScore(runningTotal)}</Text>
              <Text style={styles.progressMuted}> / 40</Text>
            </Text>
          </View>
        </Card>

        {uniItems.map((item, idx) => {
          const selected = unilateral[idx];
          const maxScore = item.options[item.options.length - 1];
          return (
            <Card key={idx}>
              <View style={styles.itemHeader}>
                <Text style={styles.microLabel}>{item.label.toUpperCase()}</Text>
                <Text style={styles.itemMax}>/{maxScore}</Text>
              </View>
              <View style={styles.chipRow}>
                {item.options.map(score => {
                  const isSelected = selected === score;
                  return (
                    <Pressable
                      key={score}
                      onPress={() => handleUnilateral(idx, score)}
                      style={({ pressed }) => [
                        styles.chip,
                        isSelected && styles.chipSelected,
                        pressed && styles.chipPressed,
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${item.label} score ${score}`}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {score}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          );
        })}

        {bilItems.map((item, bilIdx) => {
          const b = bilateral[bilIdx];
          const mean = bilateralMeans[bilIdx];
          const isFastAlt = bilIdx === FAST_ALT_BIL_IDX;

          return (
            <Card key={bilIdx + UNI_COUNT}>
              <Text style={styles.bilItemLabel}>{item.label.toUpperCase()}</Text>

              {(['right', 'left'] as const).map(side => {
                const sideScore = b[side];
                return (
                  <View key={side} style={styles.sideSection}>
                    <Text style={styles.sideLabel}>{side === 'right' ? 'RIGHT' : 'LEFT'}</Text>
                    <View style={styles.chipRow}>
                      {item.options.map(score => {
                        const isSelected = sideScore === score;
                        return (
                          <Pressable
                            key={score}
                            onPress={() => handleBilateral(bilIdx, side, score)}
                            style={({ pressed }) => [
                              styles.chip,
                              isSelected && styles.chipSelected,
                              pressed && styles.chipPressed,
                            ]}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: isSelected }}
                            accessibilityLabel={`${item.label} ${side} score ${score}`}
                          >
                            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                              {score}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {isFastAlt ? (
                      <View style={styles.timerSection}>
                        <ClinicalTimer
                          resetSignal={timerResetSignal}
                          onUseTime={secs => {
                            setFastAlt(prev => ({ ...prev, [side]: secs }));
                            resetSaveState();
                          }}
                        />
                        {fastAlt[side] !== null ? (
                          <Text style={styles.timerRef}>
                            {fastAlt[side]!.toFixed(1)}s recorded — select score above
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              })}

              <View style={styles.meanRow}>
                <Text style={styles.meanLabel}>MEAN</Text>
                <Text style={styles.meanValue}>
                  {mean !== null ? formatScore(mean) : '—'}
                </Text>
              </View>
            </Card>
          );
        })}

        {saveState === 'saved' && result === null ? (
          <View style={styles.savedBanner}>
            <Text style={styles.savedText}>Result saved</Text>
          </View>
        ) : null}

        {result !== null ? (
          <>
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.microLabel}>SARA RESULT</Text>
                <ThreeBarMotif size="sm" tone="soft" />
              </View>
              <View style={styles.resultValueRow}>
                <Text style={styles.resultValue}>{formatScore(result.primaryValue)}</Text>
                <Text style={styles.resultUnit}>{result.primaryUnit}</Text>
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: SARA_COLOR_MAP[result.meta.classColor] ?? colors.muted },
                  ]}
                />
              </View>
              <View style={styles.interpPill}>
                <Text style={styles.interpText}>{result.interpretation}</Text>
              </View>
            </View>
            {saveState === 'saved' ? (
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
            )}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const CHIP_SIZE = 40;

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
  progressCard: {
    paddingVertical: spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  progressText: {
    fontSize: typography.sizeSm,
  },
  progressHighlight: {
    fontWeight: typography.weightBold,
    color: colors.actionBlue,
  },
  progressMuted: {
    color: colors.muted,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  microLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
    letterSpacing: typography.trackingWide,
  },
  itemMax: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    letterSpacing: typography.trackingWide,
  },
  bilItemLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
    letterSpacing: typography.trackingWide,
    marginBottom: spacing.md,
  },
  sideSection: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  sideLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    letterSpacing: typography.trackingWide,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    width: CHIP_SIZE,
    height: CHIP_SIZE,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPressed: {
    opacity: 0.65,
  },
  chipText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  timerSection: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  timerRef: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    fontStyle: 'italic',
  },
  meanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  meanLabel: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    letterSpacing: typography.trackingWide,
  },
  meanValue: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: colors.actionBlue,
    minWidth: 32,
    textAlign: 'right',
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
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignSelf: 'center',
    marginLeft: spacing.xs,
  },
  interpPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  interpText: {
    fontSize: typography.sizeSm,
    color: colors.ink,
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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcPSFS, getPreviousPSFSActivities, PSFS_MAX_ACTIVITIES } from '@clinical/psfs';
import { getPatient } from '../../supabase/patients';
import { getAssessmentsForPatient } from '../../supabase/assessments';
import type { Patient, Assessment } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { NavyHeader } from '../ui/NavyHeader';
import { Button } from '../ui/Button';
import { AssessmentPatientCard } from './AssessmentPatientCard';
import { MskResultCard } from './MskResultCard';
import { useAssessmentSave } from './useAssessmentSave';
import { ChoiceChipRow } from './fields/ChoiceChipRow';
import type { ChoiceChipOption, ChoiceChipValue } from './fields/ChoiceChipRow';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface PSFSActivity {
  name: string;
  score: number;
}

interface PSFSRow {
  name: string;
  score: number | null;
  previousScore: number | null;
}

interface PSFSResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: Record<string, unknown>;
}

const SCORE_OPTIONS: ChoiceChipOption[] = Array.from({ length: 11 }, (_, value) => ({ value }));

function buildInitialRows(assessments: Assessment[]): PSFSRow[] {
  const previous = getPreviousPSFSActivities(assessments) as PSFSActivity[] | null;
  if (previous?.length) {
    return previous.map(activity => ({
      name: activity.name,
      score: null,
      previousScore: Number.isFinite(activity.score) ? activity.score : null,
    }));
  }
  return [
    { name: '', score: null, previousScore: null },
    { name: '', score: null, previousScore: null },
    { name: '', score: null, previousScore: null },
  ];
}

export function PSFSForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [rows, setRows] = useState<PSFSRow[]>(() => buildInitialRows([]));
  const [previousLoadFailed, setPreviousLoadFailed] = useState(false);
  // Tracks whether the clinician has started editing before the prefill fetch
  // resolves — so a slow-connection load can never overwrite in-progress input.
  const userTouchedRef = useRef(false);

  useEffect(() => {
    let isActive = true;
    Promise.all([getPatient(patientId), getAssessmentsForPatient(patientId)])
      .then(([nextPatient, assessments]) => {
        if (!isActive) return;
        setPatient(nextPatient);
        if (!userTouchedRef.current) {
          setRows(buildInitialRows(assessments));
        }
      })
      .catch(() => {
        if (!isActive) return;
        // Previous activities couldn't load. On a reassessment the clinician must
        // be warned, or they may enter freshly-worded activities and break the
        // like-for-like comparison PSFS depends on.
        setPreviousLoadFailed(true);
        getPatient(patientId).then(p => {
          if (isActive) setPatient(p);
        }).catch(() => null);
      });
    return () => {
      isActive = false;
    };
  }, [patientId]);

  const ratedRows = useMemo(
    () => rows.filter(row => row.name.trim() && row.score !== null),
    [rows],
  );
  const incomplete = rows.some(row => (row.name.trim() && row.score === null) || (!row.name.trim() && row.score !== null));
  const isFollowUp = rows.some(row => row.previousScore !== null);
  const result = useMemo(() => {
    if (!ratedRows.length) return null;
    return calcPSFS({
      activities: ratedRows.map(row => ({ name: row.name, score: row.score })),
    }) as PSFSResult | null;
  }, [ratedRows]);

  const buildPayload = useCallback(() => {
    if (!result || incomplete) return null;
    return {
      inputs: { activities: result.meta.activities },
      results: result as unknown as Record<string, unknown>,
    };
  }, [incomplete, result]);

  const {
    saveState,
    saveError,
    handleSave,
    resetSaveState,
    saveDisabled,
  } = useAssessmentSave({ patientId, measure: 'PSFS', buildPayload });

  function updateRow(index: number, patch: Partial<PSFSRow>) {
    userTouchedRef.current = true;
    resetSaveState();
    setRows(prev => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    userTouchedRef.current = true;
    resetSaveState();
    setRows(prev => (
      prev.length < PSFS_MAX_ACTIVITIES
        ? [...prev, { name: '', score: null, previousScore: null }]
        : prev
    ));
  }

  function removeRow(index: number) {
    userTouchedRef.current = true;
    resetSaveState();
    setRows(prev => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function handleScore(index: number, value: ChoiceChipValue) {
    updateRow(index, { score: Number(value) });
  }

  const canSave = !!result && !incomplete;

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title="PSFS" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <AssessmentPatientCard patient={patient} />

        <View style={styles.intro}>
          <Text style={styles.title}>Patient Specific Functional Scale</Text>
          <Text style={styles.prompt}>
            Name the activities that matter to this patient, then rate each from unable to pre-injury level.
          </Text>
        </View>

        {previousLoadFailed ? (
          <View style={styles.warningPanel}>
            <Text style={styles.warningText}>
              Couldn&apos;t load this patient&apos;s previous activities. If this is a reassessment, check your connection and reopen the form so you re-rate the same activities — otherwise scores won&apos;t be comparable.
            </Text>
          </View>
        ) : null}

        {isFollowUp ? (
          <View style={styles.infoPanel}>
            <Text style={styles.infoText}>
              Reassessment: previous activities are carried over. Re-rate the same activities where possible so scores remain comparable.
            </Text>
          </View>
        ) : null}

        {rows.map((row, index) => (
          <View key={`psfs-${index}`} style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <View style={styles.activityTitleGroup}>
                <Text style={styles.sectionLabel}>ACTIVITY {index + 1}</Text>
                {row.previousScore !== null ? (
                  <Text style={styles.previousScore}>Previous rating {row.previousScore}/10</Text>
                ) : null}
              </View>
              {rows.length > 1 && row.previousScore === null ? (
                <Pressable
                  onPress={() => removeRow(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove activity ${index + 1}`}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </Pressable>
              ) : null}
            </View>

            <TextInput
              style={styles.activityInput}
              value={row.name}
              onChangeText={text => updateRow(index, { name: text })}
              placeholder="e.g. Walking the dog"
              placeholderTextColor={colors.subtle}
              returnKeyType="done"
            />

            <Text style={styles.helperText}>0 = unable. 10 = pre-injury level.</Text>
            <ChoiceChipRow
              options={SCORE_OPTIONS}
              selected={row.score}
              onSelect={value => handleScore(index, value)}
              label={`Rating for activity ${index + 1}`}
              wrap
            />
          </View>
        ))}

        {!isFollowUp && rows.length < PSFS_MAX_ACTIVITIES ? (
          <Button label="Add Activity" variant="secondary" onPress={addRow} />
        ) : null}

        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>
            PSFS: score is the average of nominated activity ratings. MCID is approximately 2 points. There are no severity bands by design.
          </Text>
        </View>

        {result ? (
          <>
            <MskResultCard
              result={result}
              label="PSFS RESULT"
              caption={`${ratedRows.length} activit${ratedRows.length === 1 ? 'y' : 'ies'} rated`}
              warning={incomplete ? 'Name each rated activity and select its 0-10 rating before saving.' : null}
            />
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
                  disabled={!canSave || saveDisabled}
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

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    overflow: 'hidden',
  },
  content: { padding: spacing.md, gap: spacing.md },
  intro: { gap: spacing.xs, paddingHorizontal: spacing.xs },
  title: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  prompt: { fontSize: typography.sizeSm, color: colors.muted, lineHeight: 19 },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  activityTitleGroup: { flex: 1, gap: spacing.xs },
  sectionLabel: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
  },
  previousScore: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  removeButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  removeButtonText: {
    fontSize: typography.sizeSm,
    color: colors.coral,
    fontWeight: typography.weightSemibold,
  },
  activityInput: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizeMd,
    color: colors.ink,
  },
  helperText: { fontSize: typography.sizeSm, color: colors.muted, lineHeight: 19 },
  infoPanel: {
    backgroundColor: colors.panel,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  infoText: { fontSize: typography.sizeSm, color: colors.muted, lineHeight: 19 },
  warningPanel: {
    backgroundColor: colors.panel,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.coral,
    padding: spacing.md,
  },
  warningText: { fontSize: typography.sizeSm, color: colors.ink, lineHeight: 19 },
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

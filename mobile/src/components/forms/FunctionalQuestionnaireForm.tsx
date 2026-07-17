import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPatient } from '../../supabase/patients';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { Card } from '../ui/Card';
import { NavyHeader } from '../ui/NavyHeader';
import { Button } from '../ui/Button';
import { AssessmentPatientCard } from './AssessmentPatientCard';
import { MskResultCard } from './MskResultCard';
import { useAssessmentSave } from './useAssessmentSave';
import { ChoiceChipRow } from './fields/ChoiceChipRow';
import type { ChoiceChipOption } from './fields/ChoiceChipRow';
import { QuestionnaireItem } from './fields/QuestionnaireItem';
import { QuestionnaireProgress } from './fields/QuestionnaireProgress';
import { ScaleKey } from './fields/ScaleKey';
import type { ScaleKeyEntry } from './fields/ScaleKey';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface QuestionnaireItemDefinition {
  label: string;
}

interface QuestionnaireOptionDefinition {
  value: number;
  label: string;
}

interface FunctionalQuestionnaireResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: Record<string, unknown>;
}

interface FunctionalQuestionnaireFormProps {
  patientId: string;
  measureId: string;
  title: string;
  resultLabel: string;
  items: QuestionnaireItemDefinition[];
  options: QuestionnaireOptionDefinition[];
  maxTotal: number;
  scaleTitle: string;
  prompt: string;
  infoText: string;
  calc: (input: { items: number[] }) => FunctionalQuestionnaireResult | null;
  wrapChoices?: boolean;
}

export function FunctionalQuestionnaireForm({
  patientId,
  measureId,
  title,
  resultLabel,
  items,
  options,
  maxTotal,
  scaleTitle,
  prompt,
  infoText,
  calc,
  wrapChoices = false,
}: FunctionalQuestionnaireFormProps) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [scores, setScores] = useState<(number | null)[]>(() => Array(items.length).fill(null));

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  const result = useMemo(() => {
    if (!scores.every(score => score !== null)) return null;
    return calc({ items: scores as number[] });
  }, [calc, scores]);

  const buildPayload = useCallback(() => {
    if (!result || !scores.every(score => score !== null)) return null;
    return {
      inputs: { items: scores as number[] },
      results: result as unknown as Record<string, unknown>,
    };
  }, [result, scores]);

  const {
    saveState,
    saveError,
    handleSave,
    resetSaveState,
    saveDisabled,
  } = useAssessmentSave({ patientId, measure: measureId, buildPayload });

  function handleScore(index: number, value: number) {
    resetSaveState();
    setScores(prev => prev.map((score, i) => (i === index ? value : score)));
  }

  const scoredCount = scores.filter(score => score !== null).length;
  const runningTotal = scores.reduce<number>((sum, score) => sum + (score ?? 0), 0);
  const chipOptions: ChoiceChipOption[] = options.map(option => ({
    value: option.value,
    label: option.label,
  }));
  const scaleEntries: ScaleKeyEntry[] = options.map(option => ({
    value: option.value,
    label: option.label.replace(/^\d+\s.\s/, ''),
  }));

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title={measureId} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <AssessmentPatientCard patient={patient} />

        <View style={styles.intro}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.prompt}>{prompt}</Text>
        </View>

        <QuestionnaireProgress
          scoredCount={scoredCount}
          itemCount={items.length}
          runningTotal={runningTotal}
          maxTotal={maxTotal}
        />

        <ScaleKey entries={scaleEntries} title={scaleTitle} />

        <Card>
          {items.map((item, idx) => (
            <QuestionnaireItem
              key={`${measureId}-${idx}`}
              index={idx}
              text={item.label}
              scored={scores[idx] !== null}
              showDivider={idx !== items.length - 1}
            >
              <ChoiceChipRow
                options={chipOptions}
                selected={scores[idx]}
                label={item.label}
                onSelect={value => handleScore(idx, Number(value))}
                wrap={wrapChoices}
              />
            </QuestionnaireItem>
          ))}
        </Card>

        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>{infoText}</Text>
        </View>

        {result ? (
          <>
            <MskResultCard
              result={result}
              label={resultLabel}
              caption={`${scoredCount}/${items.length} items scored`}
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
                  disabled={saveDisabled}
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
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  intro: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  prompt: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: 19,
  },
  infoPanel: {
    backgroundColor: colors.panel,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  infoText: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: 19,
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

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
import type { ChoiceChipOption, ChoiceChipValue } from './fields/ChoiceChipRow';
import { QuestionnaireItem } from './fields/QuestionnaireItem';
import { QuestionnaireProgress } from './fields/QuestionnaireProgress';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface WeightedOptionDefinition {
  value: number;
  label: string;
}

interface WeightedItemDefinition {
  key?: string;
  label: string;
  options: WeightedOptionDefinition[];
}

interface WeightedQuestionnaireResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: Record<string, unknown>;
}

interface WeightedQuestionnaireFormProps {
  patientId: string;
  measureId: string;
  title: string;
  resultLabel: string;
  prompt: string;
  infoText: string;
  items: WeightedItemDefinition[];
  maxTotal: number;
  calc: (input: { items: number[] }) => WeightedQuestionnaireResult | null;
}

function encodeChoice(optionIndex: number, value: number): string {
  return `${optionIndex}:${value}`;
}

function decodeChoice(choice: string | null): number | null {
  if (!choice) return null;
  const [, value] = choice.split(':');
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

function buildOptions(item: WeightedItemDefinition): ChoiceChipOption[] {
  return item.options.map((option, index) => ({
    value: encodeChoice(index, option.value),
    displayLabel: String(option.value),
    label: option.label,
  }));
}

export function WeightedQuestionnaireForm({
  patientId,
  measureId,
  title,
  resultLabel,
  prompt,
  infoText,
  items,
  maxTotal,
  calc,
}: WeightedQuestionnaireFormProps) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [choices, setChoices] = useState<(string | null)[]>(() => Array(items.length).fill(null));

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  const scores = useMemo(() => choices.map(decodeChoice), [choices]);
  const complete = scores.every(score => score !== null);
  const runningTotal = scores.reduce<number>((sum, score) => sum + (score ?? 0), 0);

  const result = useMemo(() => {
    if (!complete) return null;
    return calc({ items: scores as number[] });
  }, [calc, complete, scores]);

  const buildPayload = useCallback(() => {
    if (!result || !complete) return null;
    return {
      inputs: { items: scores as number[] },
      results: result as unknown as Record<string, unknown>,
    };
  }, [complete, result, scores]);

  const {
    saveState,
    saveError,
    handleSave,
    resetSaveState,
    saveDisabled,
  } = useAssessmentSave({ patientId, measure: measureId, buildPayload });

  function handleChoice(index: number, value: ChoiceChipValue) {
    resetSaveState();
    setChoices(prev => prev.map((choice, i) => (i === index ? String(value) : choice)));
  }

  const scoredCount = choices.filter(choice => choice !== null).length;

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

        <Card>
          {items.map((item, idx) => (
            <QuestionnaireItem
              key={item.key ?? `${measureId}-${idx}`}
              index={idx}
              text={item.label}
              scored={choices[idx] !== null}
              showDivider={idx !== items.length - 1}
            >
              <ChoiceChipRow
                options={buildOptions(item)}
                selected={choices[idx]}
                onSelect={value => handleChoice(idx, value)}
                label={`${measureId} item ${idx + 1}`}
                wrap
              />
              <View style={styles.optionKey}>
                {item.options.map((option, optionIndex) => (
                  <Text key={`${idx}-${optionIndex}-${option.value}`} style={styles.optionKeyText}>
                    <Text style={styles.optionKeyValue}>{option.value}</Text>
                    {` ${option.label}`}
                  </Text>
                ))}
              </View>
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
  optionKey: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  optionKeyText: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    lineHeight: 16,
  },
  optionKeyValue: {
    fontWeight: typography.weightBold,
    color: colors.primary,
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

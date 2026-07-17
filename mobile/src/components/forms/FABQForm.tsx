import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore - JS clinical module, no type declarations
import { calcFABQ, FABQ_ITEMS, FABQ_RESPONSE_OPTIONS } from '@clinical/fabq';
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
import { ScaleKey } from './fields/ScaleKey';
import type { ScaleKeyEntry } from './fields/ScaleKey';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface FABQItem {
  label: string;
  section: string;
  scored: boolean;
}

interface FABQOption {
  value: number;
  label: string;
}

interface FABQResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: Record<string, unknown>;
}

interface SectionGroup {
  title: string;
  items: Array<FABQItem & { globalIndex: number }>;
}

const ITEMS = FABQ_ITEMS as FABQItem[];
const OPTIONS = FABQ_RESPONSE_OPTIONS as FABQOption[];

function buildSections(): SectionGroup[] {
  return ITEMS.reduce<SectionGroup[]>((groups, item, index) => {
    const current = groups[groups.length - 1];
    if (!current || current.title !== item.section) {
      groups.push({ title: item.section, items: [{ ...item, globalIndex: index }] });
    } else {
      current.items.push({ ...item, globalIndex: index });
    }
    return groups;
  }, []);
}

const CHIP_OPTIONS: ChoiceChipOption[] = OPTIONS.map(option => ({
  value: option.value,
  displayLabel: String(option.value),
  label: option.label,
}));

const SCALE_ENTRIES: ScaleKeyEntry[] = OPTIONS.map(option => ({
  value: option.value,
  label: option.label.replace(/^\d+\s.\s/, ''),
}));

export function FABQForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [scores, setScores] = useState<(number | null)[]>(() => Array(ITEMS.length).fill(null));

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  const complete = scores.every(score => score !== null);
  const scoredCount = scores.filter(score => score !== null).length;
  const sections = useMemo(buildSections, []);

  const result = useMemo(() => {
    if (!complete) return null;
    return calcFABQ({ items: scores as number[] }) as FABQResult | null;
  }, [complete, scores]);

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
  } = useAssessmentSave({ patientId, measure: 'FABQ', buildPayload });

  function handleScore(index: number, value: ChoiceChipValue) {
    resetSaveState();
    setScores(prev => prev.map((score, i) => (i === index ? Number(value) : score)));
  }

  const workScore = typeof result?.meta.work === 'number' ? result.meta.work : null;

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title="FABQ" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <AssessmentPatientCard patient={patient} />

        <View style={styles.intro}>
          <Text style={styles.title}>Fear-Avoidance Beliefs Questionnaire</Text>
          <Text style={styles.prompt}>
            Ask the patient to rate agreement with each statement about physical activity and work.
          </Text>
        </View>

        <QuestionnaireProgress
          scoredCount={scoredCount}
          itemCount={ITEMS.length}
        />

        <ScaleKey entries={SCALE_ENTRIES} title="AGREEMENT SCALE" />

        {sections.map(section => (
          <View key={section.title} style={styles.sectionBlock}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionProgress}>
                {section.items.filter(item => scores[item.globalIndex] !== null).length} / {section.items.length} answered
              </Text>
            </View>

            <Card>
              {section.items.map((item, idx) => (
                <QuestionnaireItem
                  key={`${section.title}-${item.globalIndex}`}
                  index={item.globalIndex}
                  text={item.label}
                  scored={scores[item.globalIndex] !== null}
                  showDivider={idx !== section.items.length - 1}
                  trailing={!item.scored ? (
                    <View style={styles.contextBadge}>
                      <Text style={styles.contextBadgeText}>Context</Text>
                    </View>
                  ) : undefined}
                >
                  <ChoiceChipRow
                    options={CHIP_OPTIONS}
                    selected={scores[item.globalIndex]}
                    onSelect={value => handleScore(item.globalIndex, value)}
                    label={`FABQ item ${item.globalIndex + 1}`}
                    wrap
                  />
                </QuestionnaireItem>
              ))}
            </Card>
          </View>
        ))}

        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>
            FABQ: Physical Activity uses items 2-5 (/24), and Work uses items 6, 7, 9, 10, 11, 12, and 15 (/42). Higher scores indicate more fear-avoidance beliefs.
          </Text>
        </View>

        {result ? (
          <>
            <MskResultCard
              result={result}
              label="FABQ RESULT"
              caption={`PA ${result.primaryValue}/24 | Work ${workScore ?? '-'}/42`}
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
  sectionBlock: {
    gap: spacing.sm,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
  },
  sectionProgress: {
    fontSize: typography.sizeXs,
    color: colors.subtle,
    fontWeight: typography.weightMedium,
  },
  contextBadge: {
    minHeight: 22,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contextBadgeText: {
    fontSize: typography.sizeXs,
    color: colors.subtle,
    fontWeight: typography.weightMedium,
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

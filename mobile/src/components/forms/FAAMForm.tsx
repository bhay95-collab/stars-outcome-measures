import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcFAAM, FAAM_ADL_ITEMS, FAAM_SPORT_ITEMS, FAAM_OPTIONS } from '@clinical/faam';
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
import { colors, spacing, typography, radii } from '../../theme/tokens';

type FAAMValue = number | 'na' | null;

interface FAAMItem {
  label: string;
}

interface FAAMOption {
  value: number | 'na';
  label: string;
}

interface FAAMResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: Record<string, unknown>;
}

const ADL_COUNT = 21;
const SPORT_COUNT = 8;

function countResponses(values: FAAMValue[]): number {
  return values.filter(value => value !== null).length;
}

function toFaamValue(value: ChoiceChipValue): FAAMValue {
  return value === 'na' ? 'na' : Number(value);
}

function buildOptions(): ChoiceChipOption[] {
  return (FAAM_OPTIONS as FAAMOption[]).map(option => ({
    value: option.value,
    displayLabel: option.value === 'na' ? 'N/A' : String(option.value),
    label: option.label,
  }));
}

interface FAAMSectionProps {
  title: string;
  intro: string;
  items: FAAMItem[];
  values: FAAMValue[];
  onChange: (index: number, value: FAAMValue) => void;
  onClearAll?: () => void;
}

function FAAMSection({
  title,
  intro,
  items,
  values,
  onChange,
  onClearAll,
}: FAAMSectionProps) {
  const options = buildOptions();
  const responses = countResponses(values);

  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionHeadCopy}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionIntro}>{intro}</Text>
          <Text style={styles.progressText}>{responses} / {items.length} answered</Text>
        </View>
        {onClearAll && responses > 0 ? (
          <Pressable
            onPress={onClearAll}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${title}`}
            style={styles.clearAllButton}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      <Card>
        {items.map((item, idx) => (
          <QuestionnaireItem
            key={`${title}-${idx}`}
            index={idx}
            text={item.label}
            scored={values[idx] !== null}
            showDivider={idx !== items.length - 1}
            trailing={values[idx] !== null ? (
              <Pressable
                onPress={() => onChange(idx, null)}
                accessibilityRole="button"
                accessibilityLabel={`Clear ${title} item ${idx + 1}`}
                style={styles.clearItemButton}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
            ) : undefined}
          >
            <ChoiceChipRow
              options={options}
              selected={values[idx]}
              onSelect={value => onChange(idx, toFaamValue(value))}
              label={`${title} item ${idx + 1}`}
              wrap
            />
          </QuestionnaireItem>
        ))}
      </Card>
    </View>
  );
}

export function FAAMForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [adl, setAdl] = useState<FAAMValue[]>(() => Array(ADL_COUNT).fill(null));
  const [sport, setSport] = useState<FAAMValue[]>(() => Array(SPORT_COUNT).fill(null));

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  const result = useMemo(() => {
    return calcFAAM({ adl, sport }) as FAAMResult | null;
  }, [adl, sport]);
  const sportStarted = sport.some(value => value !== null);
  const sportPending = sportStarted && !!result && result.meta.sport == null;

  const buildPayload = useCallback(() => {
    if (!result) return null;
    return {
      inputs: { adl, sport },
      results: result as unknown as Record<string, unknown>,
    };
  }, [adl, result, sport]);

  const {
    saveState,
    saveError,
    handleSave,
    resetSaveState,
    saveDisabled,
  } = useAssessmentSave({ patientId, measure: 'FAAM', buildPayload });

  function updateAdl(index: number, value: FAAMValue) {
    resetSaveState();
    setAdl(prev => prev.map((item, i) => (i === index ? value : item)));
  }

  function updateSport(index: number, value: FAAMValue) {
    resetSaveState();
    setSport(prev => prev.map((item, i) => (i === index ? value : item)));
  }

  function clearSport() {
    resetSaveState();
    setSport(Array(SPORT_COUNT).fill(null));
  }

  const adlAnswered = Number(result?.meta.adlAnswered ?? countResponses(adl));
  const sportAnswered = Number(result?.meta.sportAnswered ?? countResponses(sport));
  const sportScore = typeof result?.meta.sport === 'number' ? result.meta.sport : null;

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title="FAAM" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <AssessmentPatientCard patient={patient} />

        <View style={styles.intro}>
          <Text style={styles.title}>Foot and Ankle Ability Measure</Text>
          <Text style={styles.prompt}>
            Use N/A only when an activity is limited by something other than the foot or ankle.
          </Text>
        </View>

        <FAAMSection
          title="ADL"
          intro="Activities of daily living. At least 19 of 21 responses are needed."
          items={FAAM_ADL_ITEMS}
          values={adl}
          onChange={updateAdl}
        />

        <FAAMSection
          title="Sport"
          intro="Optional sport subscale. Skip entirely if it is not relevant, or answer at least 7 of 8 items."
          items={FAAM_SPORT_ITEMS}
          values={sport}
          onChange={updateSport}
          onClearAll={clearSport}
        />

        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>
            FAAM: each subscale is scored as a percentage. ADL below 90 percent or Sport below 80 percent indicates functional deficit range. MCID is 8 points for ADL and 9 for Sport.
          </Text>
        </View>

        {result ? (
          <>
            <MskResultCard
              result={result}
              label="FAAM RESULT"
              caption={`ADL ${adlAnswered}/21 answered${sportScore !== null ? ` · Sport ${sportScore}% (${sportAnswered}/8)` : ''}`}
              warning={sportPending ? 'Sport subscale incomplete. Answer at least 7 of 8 sport items or clear the sport section.' : null}
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
  content: { padding: spacing.md, gap: spacing.md },
  intro: { gap: spacing.xs, paddingHorizontal: spacing.xs },
  title: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  prompt: { fontSize: typography.sizeSm, color: colors.muted, lineHeight: 19 },
  sectionBlock: { gap: spacing.sm },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionHeadCopy: { flex: 1, gap: spacing.xs },
  sectionTitle: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  sectionIntro: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: 19,
  },
  progressText: {
    fontSize: typography.sizeSm,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
  },
  clearAllButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  clearItemButton: {
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  clearButtonText: {
    fontSize: typography.sizeSm,
    color: colors.coral,
    fontWeight: typography.weightSemibold,
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

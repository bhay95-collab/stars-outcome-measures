import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore - JS clinical module, no type declarations
import {
  calcCMS,
  CMS_POSITIONING_OPTIONS,
  CMS_ELEVATION_OPTIONS,
  CMS_ER_OPTIONS,
  CMS_IR_OPTIONS,
} from '@clinical/cms';
import { getPatient } from '../../supabase/patients';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { Card } from '../ui/Card';
import { NavyHeader } from '../ui/NavyHeader';
import { Button } from '../ui/Button';
import { AssessmentPatientCard } from './AssessmentPatientCard';
import { MskResultCard } from './MskResultCard';
import { NumericClinicalInput } from './NumericClinicalInput';
import { useAssessmentSave } from './useAssessmentSave';
import { ChoiceChipRow } from './fields/ChoiceChipRow';
import type { ChoiceChipOption, ChoiceChipValue } from './fields/ChoiceChipRow';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface CMSOption {
  value: number;
  label: string;
}

interface CMSInput {
  pain: number;
  adlWork: number;
  adlRecreation: number;
  adlSleep: number;
  adlPositioning: number;
  romFlexion: number;
  romAbduction: number;
  romER: number;
  romIR: number;
  strengthKg: number;
}

interface CMSResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: Record<string, unknown>;
}

// Constant–Murley scores higher = better on every subscale, including pain —
// the inverse of the NPRS/VAS convention. Each field carries a direction anchor
// so a clinician cannot enter an inverted value (e.g. 0 for a pain-free shoulder).
const NUMERIC_FIELDS = [
  { key: 'pain', label: 'PAIN', min: 0, max: 15, integer: true, unit: '/15', anchor: '15 = no pain · 0 = severe pain' },
  { key: 'adlWork', label: 'WORK', min: 0, max: 4, integer: true, unit: '/4', anchor: '4 = full work activity · 0 = unable' },
  { key: 'adlRecreation', label: 'RECREATION', min: 0, max: 4, integer: true, unit: '/4', anchor: '4 = full recreation/sport · 0 = unable' },
  { key: 'adlSleep', label: 'SLEEP', min: 0, max: 2, integer: true, unit: '/2', anchor: '2 = undisturbed · 0 = sleep disturbed by pain' },
  { key: 'strengthKg', label: 'ABDUCTION STRENGTH', min: 0, max: 50, integer: false, unit: 'kg', anchor: '' },
] as const;

type CMSNumericKey = typeof NUMERIC_FIELDS[number]['key'];
type CMSChoiceKey = 'adlPositioning' | 'romFlexion' | 'romAbduction' | 'romER' | 'romIR';

const EMPTY_NUMERIC_INPUTS: Record<CMSNumericKey, string> = {
  pain: '',
  adlWork: '',
  adlRecreation: '',
  adlSleep: '',
  strengthKg: '',
};

const EMPTY_CHOICE_INPUTS: Record<CMSChoiceKey, number | null> = {
  adlPositioning: null,
  romFlexion: null,
  romAbduction: null,
  romER: null,
  romIR: null,
};

const CHOICE_FIELDS: Array<{
  key: CMSChoiceKey;
  label: string;
  helper: string;
  options: CMSOption[];
}> = [
  {
    key: 'adlPositioning',
    label: 'Pain-free hand positioning',
    helper: 'Highest level the patient can reach without pain.',
    options: CMS_POSITIONING_OPTIONS as CMSOption[],
  },
  {
    key: 'romFlexion',
    label: 'Forward flexion',
    helper: 'Measured active elevation range.',
    options: CMS_ELEVATION_OPTIONS as CMSOption[],
  },
  {
    key: 'romAbduction',
    label: 'Abduction',
    helper: 'Measured active abduction range.',
    options: CMS_ELEVATION_OPTIONS as CMSOption[],
  },
  {
    key: 'romER',
    label: 'External rotation',
    helper: 'Best achieved external rotation position.',
    options: CMS_ER_OPTIONS as CMSOption[],
  },
  {
    key: 'romIR',
    label: 'Internal rotation',
    helper: 'Best achieved internal rotation landmark.',
    options: CMS_IR_OPTIONS as CMSOption[],
  },
];

function parseNumeric(value: string, field: typeof NUMERIC_FIELDS[number]): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const numberValue = Number(trimmed);
  if (!Number.isFinite(numberValue)) return null;
  if (field.integer && !Number.isInteger(numberValue)) return null;
  if (numberValue < field.min || numberValue > field.max) return null;
  return numberValue;
}

function validateNumeric(value: string, field: typeof NUMERIC_FIELDS[number]): string | null {
  if (!value.trim()) return `Enter ${field.label.toLowerCase()}.`;
  const numberValue = Number(value.trim());
  if (!Number.isFinite(numberValue)) return 'Value must be a number.';
  if (field.integer && !Number.isInteger(numberValue)) return 'Value must be a whole number.';
  if (numberValue < field.min || numberValue > field.max) {
    return `Enter a value from ${field.min} to ${field.max}.`;
  }
  return null;
}

function toChipOptions(options: CMSOption[]): ChoiceChipOption[] {
  return options.map(option => ({
    value: option.value,
    displayLabel: String(option.value),
    label: option.label,
  }));
}

function ChoiceField({
  label,
  helper,
  options,
  value,
  onChange,
}: {
  label: string;
  helper: string;
  options: CMSOption[];
  value: number | null;
  onChange: (value: number) => void;
}) {
  const selected = options.find(option => option.value === value);

  return (
    <View style={styles.choiceField}>
      <Text style={styles.fieldTitle}>{label}</Text>
      <Text style={styles.fieldHelper}>{helper}</Text>
      <ChoiceChipRow
        options={toChipOptions(options)}
        selected={value}
        onSelect={(nextValue: ChoiceChipValue) => onChange(Number(nextValue))}
        label={label}
        wrap
      />
      {selected ? <Text style={styles.selectedOption}>{selected.label}</Text> : null}
      <View style={styles.optionKey}>
        {options.map(option => (
          <Text key={`${label}-${option.value}`} style={styles.optionKeyText}>
            <Text style={styles.optionKeyValue}>{option.value}</Text>
            {` ${option.label}`}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
      <Card style={styles.sectionCard}>{children}</Card>
    </View>
  );
}

export function CMSForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [numericInputs, setNumericInputs] = useState<Record<CMSNumericKey, string>>(EMPTY_NUMERIC_INPUTS);
  const [numericErrors, setNumericErrors] = useState<Partial<Record<CMSNumericKey, string>>>({});
  const [choiceInputs, setChoiceInputs] = useState<Record<CMSChoiceKey, number | null>>(EMPTY_CHOICE_INPUTS);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  const cmsInput = useMemo<CMSInput | null>(() => {
    const numericValues = {} as Record<CMSNumericKey, number>;
    for (const field of NUMERIC_FIELDS) {
      const parsed = parseNumeric(numericInputs[field.key], field);
      if (parsed === null) return null;
      numericValues[field.key] = parsed;
    }

    const { adlPositioning, romFlexion, romAbduction, romER, romIR } = choiceInputs;
    if ([adlPositioning, romFlexion, romAbduction, romER, romIR].some(value => value === null)) {
      return null;
    }

    return {
      pain: numericValues.pain,
      adlWork: numericValues.adlWork,
      adlRecreation: numericValues.adlRecreation,
      adlSleep: numericValues.adlSleep,
      adlPositioning: adlPositioning as number,
      romFlexion: romFlexion as number,
      romAbduction: romAbduction as number,
      romER: romER as number,
      romIR: romIR as number,
      strengthKg: numericValues.strengthKg,
    };
  }, [choiceInputs, numericInputs]);

  const result = useMemo(() => {
    if (!cmsInput) return null;
    return calcCMS(cmsInput) as CMSResult | null;
  }, [cmsInput]);

  const buildPayload = useCallback(() => {
    if (!result || !cmsInput) return null;
    return {
      inputs: cmsInput as unknown as Record<string, unknown>,
      results: result as unknown as Record<string, unknown>,
    };
  }, [cmsInput, result]);

  const {
    saveState,
    saveError,
    handleSave,
    resetSaveState,
    saveDisabled,
  } = useAssessmentSave({ patientId, measure: 'CMS', buildPayload });

  function handleNumericChange(key: CMSNumericKey, text: string) {
    resetSaveState();
    setNumericErrors(prev => ({ ...prev, [key]: undefined }));
    setNumericInputs(prev => ({ ...prev, [key]: text }));
  }

  function handleNumericBlur(field: typeof NUMERIC_FIELDS[number]) {
    setNumericErrors(prev => ({
      ...prev,
      [field.key]: validateNumeric(numericInputs[field.key], field) ?? undefined,
    }));
  }

  function handleChoiceChange(key: CMSChoiceKey, value: number) {
    resetSaveState();
    setChoiceInputs(prev => ({ ...prev, [key]: value }));
  }

  const completedCount = NUMERIC_FIELDS.filter(field => parseNumeric(numericInputs[field.key], field) !== null).length
    + Object.values(choiceInputs).filter(value => value !== null).length;

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title="CMS" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <AssessmentPatientCard patient={patient} />

        <View style={styles.intro}>
          <Text style={styles.title}>Constant-Murley Score</Text>
          <Text style={styles.prompt}>
            Record pain, activities, shoulder range, and abduction strength for one shoulder.
          </Text>
          <Text style={styles.progressText}>{completedCount} / 10 components complete</Text>
        </View>

        <Section title="Pain and Activities" subtitle="Pain /15 plus ADL /20">
          {NUMERIC_FIELDS.slice(0, 4).map(field => (
            <View key={field.key} style={styles.numericBlock}>
              <NumericClinicalInput
                label={field.label}
                value={numericInputs[field.key]}
                onChangeText={text => handleNumericChange(field.key, text)}
                onBlur={() => handleNumericBlur(field)}
                unit={field.unit}
                error={numericErrors[field.key]}
              />
              {field.anchor ? <Text style={styles.fieldHelper}>{field.anchor}</Text> : null}
            </View>
          ))}
          <ChoiceField
            label={CHOICE_FIELDS[0].label}
            helper={CHOICE_FIELDS[0].helper}
            options={CHOICE_FIELDS[0].options}
            value={choiceInputs.adlPositioning}
            onChange={value => handleChoiceChange('adlPositioning', value)}
          />
        </Section>

        <Section title="Range and Strength" subtitle="ROM /40 plus strength /25">
          {CHOICE_FIELDS.slice(1).map(field => (
            <ChoiceField
              key={field.key}
              label={field.label}
              helper={field.helper}
              options={field.options}
              value={choiceInputs[field.key]}
              onChange={value => handleChoiceChange(field.key, value)}
            />
          ))}
          <View style={styles.numericBlock}>
            <NumericClinicalInput
              label={NUMERIC_FIELDS[4].label}
              value={numericInputs.strengthKg}
              onChangeText={text => handleNumericChange('strengthKg', text)}
              onBlur={() => handleNumericBlur(NUMERIC_FIELDS[4])}
              unit={NUMERIC_FIELDS[4].unit}
              error={numericErrors.strengthKg}
            />
            <Text style={styles.fieldHelper}>
              Strength is scored as 1 point per 0.45 kg of abduction force, capped at 25.
            </Text>
          </View>
        </Section>

        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>
            CMS totals pain, ADL, ROM, and strength to /100. Higher scores indicate better shoulder function. Interpret against diagnosis, age, sex, and repeated setup.
          </Text>
        </View>

        {result ? (
          <>
            <MskResultCard
              result={result}
              label="CMS RESULT"
              caption={`Pain ${result.meta.pain}/15 | ADL ${result.meta.adl}/20 | ROM ${result.meta.rom}/40 | Strength ${result.meta.strength}/25`}
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
  progressText: {
    fontSize: typography.sizeSm,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHead: {
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizeLg,
    color: colors.ink,
    fontWeight: typography.weightBold,
  },
  sectionSubtitle: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  sectionCard: {
    gap: spacing.md,
  },
  numericBlock: {
    gap: spacing.xs,
  },
  choiceField: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fieldTitle: {
    fontSize: typography.sizeMd,
    color: colors.ink,
    fontWeight: typography.weightSemibold,
  },
  fieldHelper: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: 19,
  },
  selectedOption: {
    fontSize: typography.sizeSm,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
  },
  optionKey: {
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

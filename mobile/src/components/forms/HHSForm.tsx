import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore - JS clinical module, no type declarations
import {
  calcHHS,
  HHS_PAIN_OPTIONS,
  HHS_LIMP_OPTIONS,
  HHS_SUPPORT_OPTIONS,
  HHS_DISTANCE_OPTIONS,
  HHS_STAIRS_OPTIONS,
  HHS_SHOES_OPTIONS,
  HHS_SITTING_OPTIONS,
  HHS_TRANSPORT_OPTIONS,
  HHS_DEFORMITY_CRITERIA,
  HHS_ROM_FIELDS,
} from '@clinical/harrisHip';
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

interface HHSOption {
  value: number;
  label: string;
}

type HHSSelectKey =
  | 'pain'
  | 'limp'
  | 'support'
  | 'distance'
  | 'stairs'
  | 'shoesSocks'
  | 'sitting'
  | 'transport';

type HHSDeformityKey = 'flexionContracture' | 'adduction' | 'internalRotation' | 'legLength';
type HHSRomKey = 'flexion' | 'abduction' | 'adduction' | 'externalRotation' | 'internalRotation';

interface HHSRomField {
  key: HHSRomKey;
  label: string;
  max: number;
}

interface HHSInput {
  pain: number;
  limp: number;
  support: number;
  distance: number;
  stairs: number;
  shoesSocks: number;
  sitting: number;
  transport: number;
  deformity: Record<HHSDeformityKey, boolean>;
  rom: Record<HHSRomKey, number>;
}

interface HHSResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: Record<string, unknown>;
}

interface HHSSelectField {
  key: HHSSelectKey;
  label: string;
  options: HHSOption[];
}

const SELECT_SECTIONS: Array<{ heading: string; helper: string; fields: HHSSelectField[] }> = [
  {
    heading: 'Pain',
    helper: 'Choose the single pain description that best represents the hip.',
    fields: [{ key: 'pain', label: 'Pain', options: HHS_PAIN_OPTIONS as HHSOption[] }],
  },
  {
    heading: 'Function: Gait',
    helper: 'Score observed gait impact and walking capacity.',
    fields: [
      { key: 'limp', label: 'Limp', options: HHS_LIMP_OPTIONS as HHSOption[] },
      { key: 'support', label: 'Walking support', options: HHS_SUPPORT_OPTIONS as HHSOption[] },
      { key: 'distance', label: 'Distance walked', options: HHS_DISTANCE_OPTIONS as HHSOption[] },
    ],
  },
  {
    heading: 'Function: Activities',
    helper: 'Score the activity items using the published HHS weights.',
    fields: [
      { key: 'stairs', label: 'Stairs', options: HHS_STAIRS_OPTIONS as HHSOption[] },
      { key: 'shoesSocks', label: 'Shoes and socks', options: HHS_SHOES_OPTIONS as HHSOption[] },
      { key: 'sitting', label: 'Sitting', options: HHS_SITTING_OPTIONS as HHSOption[] },
      { key: 'transport', label: 'Public transportation', options: HHS_TRANSPORT_OPTIONS as HHSOption[] },
    ],
  },
];

const EMPTY_SELECTS: Record<HHSSelectKey, number | null> = {
  pain: null,
  limp: null,
  support: null,
  distance: null,
  stairs: null,
  shoesSocks: null,
  sitting: null,
  transport: null,
};

const EMPTY_DEFORMITY: Record<HHSDeformityKey, boolean> = {
  flexionContracture: false,
  adduction: false,
  internalRotation: false,
  legLength: false,
};

const EMPTY_ROM: Record<HHSRomKey, string> = {
  flexion: '',
  abduction: '',
  adduction: '',
  externalRotation: '',
  internalRotation: '',
};

function toChipOptions(options: HHSOption[]): ChoiceChipOption[] {
  return options.map(option => ({
    value: option.value,
    displayLabel: String(option.value),
    label: option.label,
  }));
}

function parseRomValue(value: string, field: HHSRomField): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const degrees = Number(trimmed);
  if (!Number.isFinite(degrees) || !Number.isInteger(degrees)) return null;
  if (degrees < 0 || degrees > field.max) return null;
  return degrees;
}

function validateRomValue(value: string, field: HHSRomField): string | null {
  if (!value.trim()) return `Enter ${field.label.toLowerCase()} degrees.`;
  const degrees = Number(value.trim());
  if (!Number.isFinite(degrees)) return 'Degrees must be a number.';
  if (!Number.isInteger(degrees)) return 'Degrees must be a whole number.';
  if (degrees < 0 || degrees > field.max) return `Enter 0 to ${field.max} degrees.`;
  return null;
}

function ChoiceField({
  field,
  value,
  onChange,
}: {
  field: HHSSelectField;
  value: number | null;
  onChange: (value: number) => void;
}) {
  const selected = field.options.find(option => option.value === value);

  return (
    <View style={styles.choiceField}>
      <Text style={styles.fieldTitle}>{field.label}</Text>
      <ChoiceChipRow
        options={toChipOptions(field.options)}
        selected={value}
        onSelect={(nextValue: ChoiceChipValue) => onChange(Number(nextValue))}
        label={field.label}
        wrap
      />
      {selected ? <Text style={styles.selectedOption}>{selected.label}</Text> : null}
      <View style={styles.optionKey}>
        {field.options.map(option => (
          <Text key={`${field.key}-${option.value}`} style={styles.optionKeyText}>
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

export function HHSForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [selects, setSelects] = useState<Record<HHSSelectKey, number | null>>(EMPTY_SELECTS);
  const [deformity, setDeformity] = useState<Record<HHSDeformityKey, boolean>>(EMPTY_DEFORMITY);
  const [romInputs, setRomInputs] = useState<Record<HHSRomKey, string>>(EMPTY_ROM);
  const [romErrors, setRomErrors] = useState<Partial<Record<HHSRomKey, string>>>({});

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  const hhsInput = useMemo<HHSInput | null>(() => {
    if (Object.values(selects).some(value => value === null)) return null;

    const rom = {} as Record<HHSRomKey, number>;
    for (const field of HHS_ROM_FIELDS as HHSRomField[]) {
      const parsed = parseRomValue(romInputs[field.key], field);
      if (parsed === null) return null;
      rom[field.key] = parsed;
    }

    return {
      pain: selects.pain as number,
      limp: selects.limp as number,
      support: selects.support as number,
      distance: selects.distance as number,
      stairs: selects.stairs as number,
      shoesSocks: selects.shoesSocks as number,
      sitting: selects.sitting as number,
      transport: selects.transport as number,
      deformity,
      rom,
    };
  }, [deformity, romInputs, selects]);

  const result = useMemo(() => {
    if (!hhsInput) return null;
    return calcHHS(hhsInput) as HHSResult | null;
  }, [hhsInput]);

  const buildPayload = useCallback(() => {
    if (!result || !hhsInput) return null;
    return {
      inputs: hhsInput as unknown as Record<string, unknown>,
      results: result as unknown as Record<string, unknown>,
    };
  }, [hhsInput, result]);

  const {
    saveState,
    saveError,
    handleSave,
    resetSaveState,
    saveDisabled,
  } = useAssessmentSave({ patientId, measure: 'HHS', buildPayload });

  function handleSelect(key: HHSSelectKey, value: number) {
    resetSaveState();
    setSelects(prev => ({ ...prev, [key]: value }));
  }

  function handleDeformity(key: HHSDeformityKey) {
    resetSaveState();
    setDeformity(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function handleRomChange(key: HHSRomKey, text: string) {
    resetSaveState();
    setRomErrors(prev => ({ ...prev, [key]: undefined }));
    setRomInputs(prev => ({ ...prev, [key]: text }));
  }

  function handleRomBlur(field: HHSRomField) {
    setRomErrors(prev => ({
      ...prev,
      [field.key]: validateRomValue(romInputs[field.key], field) ?? undefined,
    }));
  }

  const romTotal = useMemo(() => (
    (HHS_ROM_FIELDS as HHSRomField[]).reduce((sum, field) => {
      const parsed = parseRomValue(romInputs[field.key], field);
      return sum + (parsed ?? 0);
    }, 0)
  ), [romInputs]);

  const selectedCount = Object.values(selects).filter(value => value !== null).length;
  const romCount = (HHS_ROM_FIELDS as HHSRomField[]).filter(
    field => parseRomValue(romInputs[field.key], field) !== null,
  ).length;

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title="HHS" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <AssessmentPatientCard patient={patient} />

        <View style={styles.intro}>
          <Text style={styles.title}>Harris Hip Score</Text>
          <Text style={styles.prompt}>
            Clinician-administered hip composite covering pain, function, deformity, and ROM.
          </Text>
          <Text style={styles.progressText}>{selectedCount + romCount} / 13 scored fields complete</Text>
        </View>

        {SELECT_SECTIONS.map(section => (
          <Section key={section.heading} title={section.heading} subtitle={section.helper}>
            {section.fields.map(field => (
              <ChoiceField
                key={field.key}
                field={field}
                value={selects[field.key]}
                onChange={value => handleSelect(field.key, value)}
              />
            ))}
          </Section>
        ))}

        <Section title="Absence of Deformity" subtitle="All four criteria must be met for the 4 deformity points">
          {(HHS_DEFORMITY_CRITERIA as Array<{ key: HHSDeformityKey; label: string }>).map(criterion => {
            const checked = deformity[criterion.key];
            return (
              <Pressable
                key={criterion.key}
                onPress={() => handleDeformity(criterion.key)}
                style={({ pressed }) => [
                  styles.checkboxRow,
                  checked && styles.checkboxRowChecked,
                  pressed && styles.checkboxRowPressed,
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={criterion.label}
              >
                <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
                  {checked ? <View style={styles.checkboxDot} /> : null}
                </View>
                <Text style={[styles.checkboxLabel, checked && styles.checkboxLabelChecked]}>
                  {criterion.label}
                </Text>
              </Pressable>
            );
          })}
          <Text style={styles.fieldHelper}>
            Unselected criteria are scored as not met. If any criterion is not met, deformity contributes 0 points.
          </Text>
        </Section>

        <Section title="Range of Motion" subtitle="Total arc scored to a maximum of 5 points">
          <View style={styles.romGrid}>
            {(HHS_ROM_FIELDS as HHSRomField[]).map(field => (
              <View key={field.key} style={styles.romCell}>
                <NumericClinicalInput
                  label={field.label.toUpperCase()}
                  value={romInputs[field.key]}
                  onChangeText={text => handleRomChange(field.key, text)}
                  onBlur={() => handleRomBlur(field)}
                  unit="deg"
                  error={romErrors[field.key]}
                />
                <Text style={styles.romHint}>0 to {field.max} deg</Text>
              </View>
            ))}
          </View>
          <View style={styles.totalArcPanel}>
            <Text style={styles.totalArcLabel}>TOTAL ARC</Text>
            <Text style={styles.totalArcValue}>{romTotal} deg</Text>
            <Text style={styles.totalArcHint}>
              {result ? `${result.meta.romPoints}/5 ROM points` : 'Complete ROM fields to score'}
            </Text>
          </View>
        </Section>

        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>
            HHS totals pain /44, function /47, absence of deformity /4, and ROM /5. Bands are poor under 70, fair 70-79, good 80-89, and excellent 90-100.
          </Text>
        </View>

        {result ? (
          <>
            <MskResultCard
              result={result}
              label="HHS RESULT"
              caption={`Pain ${result.meta.painPoints}/44 | Gait ${result.meta.gaitPoints}/33 | Activities ${result.meta.activityPoints}/14`}
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
    lineHeight: 19,
  },
  sectionCard: {
    gap: spacing.md,
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
  checkboxRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.panel,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  checkboxRowChecked: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  checkboxRowPressed: {
    opacity: 0.76,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surface,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: typography.sizeSm,
    color: colors.ink,
    lineHeight: 19,
  },
  checkboxLabelChecked: {
    color: colors.primary,
    fontWeight: typography.weightSemibold,
  },
  romGrid: {
    gap: spacing.md,
  },
  romCell: {
    gap: spacing.xs,
  },
  romHint: {
    fontSize: typography.sizeXs,
    color: colors.muted,
  },
  totalArcPanel: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    padding: spacing.md,
    gap: spacing.xs,
  },
  totalArcLabel: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
  },
  totalArcValue: {
    fontSize: typography.size2xl,
    color: colors.actionBlue,
    fontWeight: typography.weightBold,
  },
  totalArcHint: {
    fontSize: typography.sizeSm,
    color: colors.muted,
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

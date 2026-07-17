import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore - JS clinical module, no type declarations
import { calcHopBattery } from '@clinical/hopBattery';
import { getPatient } from '../../supabase/patients';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { NavyHeader } from '../ui/NavyHeader';
import { Button } from '../ui/Button';
import { AssessmentPatientCard } from './AssessmentPatientCard';
import { MskResultCard } from './MskResultCard';
import { NumericClinicalInput } from './NumericClinicalInput';
import { useAssessmentSave } from './useAssessmentSave';
import { colors, spacing, typography, radii } from '../../theme/tokens';

type HopField =
  | 'singleInv'
  | 'singleUninv'
  | 'tripleInv'
  | 'tripleUninv'
  | 'crossInv'
  | 'crossUninv'
  | 'timedInv'
  | 'timedUninv';

interface HopDefinition {
  key: 'single' | 'triple' | 'crossover' | 'timed';
  label: string;
  invField: HopField;
  unField: HopField;
  unit: string;
  hint: string;
}

interface HopBatteryResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: Record<string, unknown>;
}

const HOPS: HopDefinition[] = [
  {
    key: 'single',
    label: 'Single hop for distance',
    invField: 'singleInv',
    unField: 'singleUninv',
    unit: 'cm',
    hint: 'Longer distance is better.',
  },
  {
    key: 'triple',
    label: 'Triple hop for distance',
    invField: 'tripleInv',
    unField: 'tripleUninv',
    unit: 'cm',
    hint: 'Longer distance is better.',
  },
  {
    key: 'crossover',
    label: 'Triple crossover hop',
    invField: 'crossInv',
    unField: 'crossUninv',
    unit: 'cm',
    hint: 'Longer distance is better.',
  },
  {
    key: 'timed',
    label: '6-metre timed hop',
    invField: 'timedInv',
    unField: 'timedUninv',
    unit: 'sec',
    hint: 'Faster time is better, so the LSI ratio is inverted.',
  },
];

const EMPTY_VALUES: Record<HopField, string> = {
  singleInv: '',
  singleUninv: '',
  tripleInv: '',
  tripleUninv: '',
  crossInv: '',
  crossUninv: '',
  timedInv: '',
  timedUninv: '',
};

const FIELD_LABELS: Record<HopField, string> = {
  singleInv: 'Single hop involved',
  singleUninv: 'Single hop uninvolved',
  tripleInv: 'Triple hop involved',
  tripleUninv: 'Triple hop uninvolved',
  crossInv: 'Crossover hop involved',
  crossUninv: 'Crossover hop uninvolved',
  timedInv: 'Timed hop involved',
  timedUninv: 'Timed hop uninvolved',
};

function parseValues(values: Record<HopField, string>): Record<HopField, number> | null {
  const entries = Object.entries(values).map(([key, value]) => {
    const n = Number(value.trim());
    return [key, n] as const;
  });
  if (entries.some(([, value]) => !Number.isFinite(value) || value <= 0)) return null;
  return Object.fromEntries(entries) as Record<HopField, number>;
}

function validateField(value: string, label: string): string | null {
  if (!value.trim()) return `Enter ${label.toLowerCase()}.`;
  const n = Number(value.trim());
  if (!Number.isFinite(n)) return 'Value must be a number.';
  if (n <= 0) return 'Value must be greater than 0.';
  return null;
}

function formatLSI(result: HopBatteryResult | null, key: HopDefinition['key']): string {
  const value = result?.meta[key];
  return typeof value === 'number' ? `${value}%` : '-';
}

export function HopBatteryForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [values, setValues] = useState<Record<HopField, string>>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Partial<Record<HopField, string>>>({});

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  const numericValues = useMemo(() => parseValues(values), [values]);
  const result = useMemo(() => {
    if (!numericValues) return null;
    return calcHopBattery(numericValues) as HopBatteryResult | null;
  }, [numericValues]);

  const buildPayload = useCallback(() => {
    if (!result || !numericValues) return null;
    return {
      inputs: { ...numericValues },
      results: result as unknown as Record<string, unknown>,
    };
  }, [numericValues, result]);

  const {
    saveState,
    saveError,
    handleSave,
    resetSaveState,
    saveDisabled,
  } = useAssessmentSave({ patientId, measure: 'HopBattery', buildPayload });

  function handleField(field: HopField, value: string) {
    resetSaveState();
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setValues(prev => ({ ...prev, [field]: value }));
  }

  function handleBlur(field: HopField) {
    setErrors(prev => ({
      ...prev,
      [field]: validateField(values[field], FIELD_LABELS[field]),
    }));
  }

  const lsiCaption = result
    ? `Single ${formatLSI(result, 'single')} | Triple ${formatLSI(result, 'triple')} | Cross ${formatLSI(result, 'crossover')} | Timed ${formatLSI(result, 'timed')}`
    : '';

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title="HopBattery" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <AssessmentPatientCard patient={patient} />

        <View style={styles.intro}>
          <Text style={styles.title}>Single-Leg Hop Battery</Text>
          <Text style={styles.prompt}>
            Record involved and uninvolved limb performance for each hop test.
          </Text>
        </View>

        <View style={styles.hopList}>
          {HOPS.map(hop => (
            <View key={hop.key} style={styles.hopBlock}>
              <View style={styles.hopHeader}>
                <View style={styles.hopTitleGroup}>
                  <Text style={styles.hopTitle}>{hop.label}</Text>
                  <Text style={styles.hopHint}>{hop.hint}</Text>
                </View>
                <View style={styles.lsiPill}>
                  <Text style={styles.lsiPillLabel}>LSI</Text>
                  <Text style={styles.lsiPillValue}>{formatLSI(result, hop.key)}</Text>
                </View>
              </View>
              <View style={styles.inputGrid}>
                <View style={styles.inputCell}>
                  <NumericClinicalInput
                    label="INVOLVED"
                    value={values[hop.invField]}
                    onChangeText={value => handleField(hop.invField, value)}
                    onBlur={() => handleBlur(hop.invField)}
                    unit={hop.unit}
                    error={errors[hop.invField]}
                  />
                </View>
                <View style={styles.inputCell}>
                  <NumericClinicalInput
                    label="UNINVOLVED"
                    value={values[hop.unField]}
                    onChangeText={value => handleField(hop.unField, value)}
                    onBlur={() => handleBlur(hop.unField)}
                    unit={hop.unit}
                    error={errors[hop.unField]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>
            Distance hop LSI uses involved divided by uninvolved. Timed hop LSI inverts the ratio so higher remains better. The limiting hop is the primary score.
          </Text>
        </View>

        {result ? (
          <>
            <MskResultCard
              result={result}
              label="HOP BATTERY RESULT"
              caption={lsiCaption}
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
  hopList: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hopBlock: {
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  hopTitleGroup: { flex: 1, gap: spacing.xs },
  hopTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  hopHint: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: 18,
  },
  lsiPill: {
    minWidth: 68,
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  lsiPillLabel: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    fontWeight: typography.weightSemibold,
  },
  lsiPillValue: {
    fontSize: typography.sizeMd,
    color: colors.primary,
    fontWeight: typography.weightBold,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputCell: {
    flex: 1,
  },
  infoPanel: {
    backgroundColor: colors.panel,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  infoText: { fontSize: typography.sizeSm, color: colors.muted, lineHeight: 19 },
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

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcTUG } from '@clinical/tug';
import { getPatient } from '../../supabase/patients';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { Card } from '../ui/Card';
import { NavyHeader } from '../ui/NavyHeader';
import { PatientAvatar } from '../ui/PatientAvatar';
import { NumericClinicalInput } from './NumericClinicalInput';
import { ResultPreviewCard } from './ResultPreviewCard';
import { SegmentedControl } from './SegmentedControl';
import { ClinicalTimer } from './ClinicalTimer';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface TUGResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { classColor: string; fallRisk: boolean };
}

const TUG_VARIANTS = ['TUG', 'TUG Fast', 'TUG Dual'];

function validateTime(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return 'Enter a time to calculate';
  const num = Number(trimmed);
  if (isNaN(num)) return 'Please enter a valid number';
  if (num <= 0) return 'Time must be greater than 0';
  return null;
}

export function TUGForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [variantIndex, setVariantIndex] = useState(0);
  const [timeInput, setTimeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TUGResult | null>(null);

  useEffect(() => {
    getPatient(patientId)
      .then(p => setPatient(p))
      .catch(() => null);
  }, [patientId]);

  function handleVariantChange(idx: number) {
    setVariantIndex(idx);
    setResult(null);
  }

  function handleChange(text: string) {
    setTimeInput(text);
    setError(null);
    setResult(null);
  }

  function handleBlur() {
    const validationError = validateTime(timeInput);
    if (validationError) {
      setError(validationError);
      return;
    }
    const r = calcTUG({ time: Number(timeInput.trim()), fastTime: null, dualTime: null }) as TUGResult | null;
    if (r) setResult(r);
  }

  function handleUseTime(seconds: number) {
    const text = seconds.toFixed(1);
    setTimeInput(text);
    setError(null);
    const r = calcTUG({ time: seconds, fastTime: null, dualTime: null }) as TUGResult | null;
    if (r) setResult(r);
  }

  const avatarName = patient?.initials ?? '?';
  const resultLabel = TUG_VARIANTS[variantIndex].toUpperCase();

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        mode="nav"
        leftLabel="‹"
        onLeft={() => router.back()}
        title="Timed Up and Go"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.patientCard}>
          <PatientAvatar name={avatarName} size="sm" />
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient?.initials ?? '…'}</Text>
            {patient?.condition ? (
              <Text style={styles.patientSub} numberOfLines={1}>{patient.condition}</Text>
            ) : null}
          </View>
        </Card>

        <Card>
          <Text style={styles.trialHeading}>Trial 1</Text>

          <SegmentedControl
            options={TUG_VARIANTS}
            selectedIndex={variantIndex}
            onSelect={handleVariantChange}
          />

          <View style={styles.divider} />

          <ClinicalTimer onUseTime={handleUseTime} />

          <View style={styles.divider} />

          <NumericClinicalInput
            label="TIME (SECONDS)"
            value={timeInput}
            onChangeText={handleChange}
            onBlur={handleBlur}
            unit="sec"
            error={error ?? undefined}
          />
        </Card>

        {result !== null ? (
          <ResultPreviewCard result={result} label={resultLabel} />
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
  trialHeading: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
});

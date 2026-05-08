import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcTUG } from '@clinical/tug';
import { MEASURES } from '../../../../../src/clinical/adapter';
import { getPatient } from '../../../../../src/supabase/patients';
import type { Patient } from '../../../../../src/types/domain';
import { Screen } from '../../../../../src/components/ui/Screen';
import { Card } from '../../../../../src/components/ui/Card';
import { NavyHeader } from '../../../../../src/components/ui/NavyHeader';
import { PatientAvatar } from '../../../../../src/components/ui/PatientAvatar';
import { NumericClinicalInput } from '../../../../../src/components/forms/NumericClinicalInput';
import { ResultPreviewCard } from '../../../../../src/components/forms/ResultPreviewCard';
import { SegmentedControl } from '../../../../../src/components/forms/SegmentedControl';
import { ClinicalTimer } from '../../../../../src/components/forms/ClinicalTimer';
import { colors, spacing, typography, radii } from '../../../../../src/theme/tokens';

const TUG_ID = 'TUG';
const HIMAT_ID = 'HiMAT';

const TUG_VARIANTS = ['TUG', 'TUG Fast', 'TUG Dual'];

interface TUGResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { classColor: string; fallRisk: boolean };
}

function validateTime(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return 'Enter a time to calculate';
  const num = Number(trimmed);
  if (isNaN(num)) return 'Please enter a valid number';
  if (num <= 0) return 'Time must be greater than 0';
  return null;
}

function TUGForm({ patientId }: { patientId: string }) {
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
    const r = calcTUG({ time: Number(timeInput.trim()) }) as TUGResult | null;
    if (r) setResult(r);
  }

  function handleUseTime(seconds: number) {
    const text = seconds.toFixed(1);
    setTimeInput(text);
    setError(null);
    const r = calcTUG({ time: seconds }) as TUGResult | null;
    if (r) setResult(r);
  }

  const avatarName = patient?.initials ?? '?';
  const resultLabel = TUG_VARIANTS[variantIndex].toUpperCase();

  return (
    <Screen padded={false} rootBackground={colors.primary} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        mode="nav"
        leftLabel="← Back"
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

export default function AssessScreen() {
  const params = useLocalSearchParams<{ patientId: string; measureId: string }>();
  const measureId = Array.isArray(params.measureId) ? params.measureId[0] : params.measureId;
  const patientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;

  if (measureId === TUG_ID) {
    return <TUGForm patientId={patientId} />;
  }

  const measure = MEASURES[measureId];

  return (
    <Screen padded={false}>
      <NavyHeader leftLabel="← Back" onLeft={() => router.back()} />
      <View style={styles.stubContent}>
        {measure ? (
          <>
            <Text style={styles.measureName}>{measure.name}</Text>
            <Text style={styles.measureCategory}>{measure.category.toUpperCase()}</Text>
            <Card style={styles.messageCard}>
              <Text style={styles.messageText}>
                {measureId === HIMAT_ID
                  ? 'HiMAT is not yet available on mobile.'
                  : 'Assessment form coming soon.'}
              </Text>
            </Card>
          </>
        ) : (
          <Card style={styles.messageCard}>
            <Text style={styles.messageText}>Measure not found.</Text>
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
  // Stub (other measures)
  stubContent: {
    flex: 1,
    padding: spacing.md,
  },
  measureName: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  measureCategory: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  messageCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  messageText: {
    fontSize: typography.sizeMd,
    color: colors.muted,
    textAlign: 'center',
  },
});

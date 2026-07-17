import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore - JS clinical module, no type declarations
import { calcACLSigns } from '@clinical/aclSigns';
import { getPatient } from '../../supabase/patients';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { NavyHeader } from '../ui/NavyHeader';
import { Button } from '../ui/Button';
import { AssessmentPatientCard } from './AssessmentPatientCard';
import { MskResultCard } from './MskResultCard';
import { useAssessmentSave } from './useAssessmentSave';
import { ChoiceChipRow } from './fields/ChoiceChipRow';
import type { ChoiceChipOption, ChoiceChipValue } from './fields/ChoiceChipRow';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface ACLSignsResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: Record<string, unknown>;
}

const YES_NO_OPTIONS: ChoiceChipOption[] = [
  { value: 'yes', displayLabel: 'Yes', label: 'Yes' },
  { value: 'no', displayLabel: 'No', label: 'No' },
];

function toBoolean(value: string | null): boolean | null {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
}

export function ACLSignsForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [fullExtensionChoice, setFullExtensionChoice] = useState<string | null>(null);
  const [effusionChoice, setEffusionChoice] = useState<string | null>(null);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  const fullExtension = toBoolean(fullExtensionChoice);
  const effusionTraceToZero = toBoolean(effusionChoice);
  const complete = fullExtension !== null && effusionTraceToZero !== null;

  const result = useMemo(() => {
    if (!complete) return null;
    return calcACLSigns({ fullExtension, effusionTraceToZero }) as ACLSignsResult | null;
  }, [complete, effusionTraceToZero, fullExtension]);

  const buildPayload = useCallback(() => {
    if (!result || fullExtension === null || effusionTraceToZero === null) return null;
    return {
      inputs: { fullExtension, effusionTraceToZero },
      results: result as unknown as Record<string, unknown>,
    };
  }, [effusionTraceToZero, fullExtension, result]);

  const {
    saveState,
    saveError,
    handleSave,
    resetSaveState,
    saveDisabled,
  } = useAssessmentSave({ patientId, measure: 'ACLSigns', buildPayload });

  function handleFullExtension(value: ChoiceChipValue) {
    resetSaveState();
    setFullExtensionChoice(String(value));
  }

  function handleEffusion(value: ChoiceChipValue) {
    resetSaveState();
    setEffusionChoice(String(value));
  }

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="nav" leftLabel="‹" onLeft={() => router.back()} title="ACLSigns" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <AssessmentPatientCard patient={patient} />

        <View style={styles.intro}>
          <Text style={styles.title}>ACL Clinical Signs</Text>
          <Text style={styles.prompt}>
            Record today&apos;s extension and effusion gate signs as explicit clinician judgements.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>FULL ACTIVE KNEE EXTENSION</Text>
          <Text style={styles.helperText}>Equal to the other side.</Text>
          <ChoiceChipRow
            options={YES_NO_OPTIONS}
            selected={fullExtensionChoice}
            onSelect={handleFullExtension}
            label="Full active knee extension"
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>EFFUSION TRACE-ZERO</Text>
          <Text style={styles.helperText}>Modified stroke test trace-to-zero judgement.</Text>
          <ChoiceChipRow
            options={YES_NO_OPTIONS}
            selected={effusionChoice}
            onSelect={handleEffusion}
            label="Effusion trace-zero"
          />
        </View>

        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>
            Both signs support early ACL phase-gate decisions. This record supports the RTS workspace, but does not clear an athlete for sport.
          </Text>
        </View>

        {result ? (
          <>
            <MskResultCard
              result={result}
              label="ACL SIGNS RESULT"
              caption={`${result.primaryValue}/2 gate signs met`}
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
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
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

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcFAC } from '@clinical/fac';
import { getPatient } from '../../supabase/patients';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { Card } from '../ui/Card';
import { NavyHeader } from '../ui/NavyHeader';
import { PatientAvatar } from '../ui/PatientAvatar';
import { ThreeBarMotif } from '../ui/ThreeBarMotif';
import { saveAssessment } from '../../supabase/assessments';
import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../ui/Button';
import { colors, spacing, typography, radii } from '../../theme/tokens';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface FACResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { classColor: 'red' | 'amber' | 'green' };
}

const FAC_LEVELS = [
  { label: 'Non-functional ambulator',      classColor: 'red'   },
  { label: 'Dependent — level 2 assist',    classColor: 'red'   },
  { label: 'Dependent — level 1 assist',    classColor: 'amber' },
  { label: 'Dependent — supervision',       classColor: 'amber' },
  { label: 'Independent on level surfaces', classColor: 'green' },
  { label: 'Fully independent ambulator',   classColor: 'green' },
] as const;

const FAC_COLOR_MAP: Record<string, string> = {
  red:   colors.coral,
  amber: colors.amber,
  green: colors.success,
};

export function FACForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [result, setResult] = useState<FACResult | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  function resetSaveState() {
    setSaveState('idle');
    setSaveError(null);
  }

  function handleSelectLevel(level: number) {
    setSelectedLevel(level);
    resetSaveState();
    const r = calcFAC({ level }) as FACResult | null;
    if (r) setResult(r);
  }

  async function handleSave() {
    if (saveState === 'saving' || selectedLevel === null || !result) return;

    if (!user) {
      setSaveError('Your session has expired. Please sign in again.');
      setSaveState('error');
      return;
    }

    setSaveState('saving');
    setSaveError(null);

    try {
      await saveAssessment({
        patient_id: patientId,
        measure: 'FAC',
        inputs: { level: selectedLevel },
        results: {
          ...result,
          meta: { ...result.meta, encounterDate: new Date().toISOString() },
        },
      });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Unable to save result. Please try again.');
      setSaveState('error');
    }
  }

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        mode="nav"
        leftLabel="‹"
        onLeft={() => router.back()}
        title="Functional Ambulation"
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
          <PatientAvatar name={patient?.initials ?? '?'} size="sm" />
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient?.initials ?? '…'}</Text>
            {patient?.condition ? (
              <Text style={styles.patientSub} numberOfLines={1}>{patient.condition}</Text>
            ) : null}
          </View>
        </Card>

        <Card>
          <Text style={styles.trialHeading}>Classification</Text>
          <Text style={styles.fieldLabel}>SELECT LEVEL</Text>
          <View style={styles.levelList}>
            {FAC_LEVELS.map(({ label }, idx) => {
              const isSelected = selectedLevel === idx;
              return (
                <Pressable
                  key={label}
                  onPress={() => handleSelectLevel(idx)}
                  style={({ pressed }) => [
                    styles.levelRow,
                    idx < FAC_LEVELS.length - 1 && styles.levelRowBorder,
                    isSelected && styles.levelRowSelected,
                    pressed && styles.levelRowPressed,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`FAC level ${idx}: ${label}`}
                >
                  <View style={[styles.levelBadge, isSelected && styles.levelBadgeSelected]}>
                    <Text style={[styles.levelBadgeText, isSelected && styles.levelBadgeTextSelected]}>
                      {idx}
                    </Text>
                  </View>
                  <Text style={[styles.levelLabel, isSelected && styles.levelLabelSelected]}>
                    {label}
                  </Text>
                  {isSelected ? (
                    <Text style={styles.levelCheck}>✓</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Card>

        {result !== null ? (
          <>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewLabel}>FAC RESULT</Text>
                <ThreeBarMotif size="sm" tone="soft" />
              </View>
              <View style={styles.valueRow}>
                <Text style={styles.primaryValue}>{result.primaryValue}</Text>
                <Text style={styles.primaryUnit}>{result.primaryUnit}</Text>
                <View style={[
                  styles.colorDot,
                  { backgroundColor: FAC_COLOR_MAP[result.meta.classColor] ?? colors.muted },
                ]} />
              </View>
              <View style={styles.interpPill}>
                <Text style={styles.interpText}>{result.interpretation}</Text>
              </View>
            </View>
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
                  disabled={saveState === 'saving'}
                />
                {saveState === 'error' && saveError ? (
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
  fieldLabel: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
    marginBottom: spacing.sm,
  },
  levelList: { gap: 0 },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    minHeight: 52,
    gap: spacing.sm,
  },
  levelRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  levelRowSelected: { backgroundColor: colors.primarySoft },
  levelRowPressed: { opacity: 0.65 },
  levelBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  levelBadgeText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
    color: colors.muted,
  },
  levelBadgeTextSelected: { color: '#FFFFFF' },
  levelLabel: {
    flex: 1,
    fontSize: typography.sizeMd,
    color: colors.ink,
  },
  levelLabelSelected: {
    fontWeight: typography.weightSemibold,
    color: colors.actionBlue,
  },
  levelCheck: {
    fontSize: typography.sizeMd,
    color: colors.actionBlue,
    fontWeight: typography.weightBold,
  },
  previewCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  previewLabel: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  primaryValue: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.actionBlue,
  },
  primaryUnit: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: spacing.xs,
    alignSelf: 'center',
  },
  interpPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  interpText: {
    fontSize: typography.sizeSm,
    color: colors.ink,
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

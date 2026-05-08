import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcTIS } from '@clinical/tis';
import { getPatient } from '../../supabase/patients';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { Card } from '../ui/Card';
import { NavyHeader } from '../ui/NavyHeader';
import { PatientAvatar } from '../ui/PatientAvatar';
import { NumericClinicalInput } from './NumericClinicalInput';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface TISResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: {
    classColor: 'red' | 'amber' | 'green';
    staticScore: number;
    dynamicScore: number;
    coordinationScore: number;
  };
}

interface TISErrors {
  static?: string;
  dynamic?: string;
  coord?: string;
}

const STATIC_MAX  = 7;
const DYNAMIC_MAX = 10;
const COORD_MAX   = 6;

const TIS_COLOR_MAP: Record<string, string> = {
  green: colors.success,
  amber: '#a05c00',
  red:   colors.coral,
};

function validateSection(value: string, max: number): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  if (isNaN(n) || !isFinite(n)) return 'Please enter a valid number';
  if (n < 0)   return 'Score cannot be below 0';
  if (n > max) return `Maximum score is ${max}`;
  return undefined;
}

function attemptResult(
  sVal: string,
  dVal: string,
  cVal: string,
): TISResult | null {
  if (!sVal.trim() || !dVal.trim() || !cVal.trim()) return null;
  const s = Number(sVal.trim());
  const d = Number(dVal.trim());
  const c = Number(cVal.trim());
  if (!isFinite(s) || !isFinite(d) || !isFinite(c)) return null;
  return calcTIS({ staticScore: s, dynamicScore: d, coordinationScore: c }) as TISResult | null;
}

export function TISForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient]           = useState<Patient | null>(null);
  const [staticInput, setStaticInput]   = useState('');
  const [dynamicInput, setDynamicInput] = useState('');
  const [coordInput, setCoordInput]     = useState('');
  const [errors, setErrors]             = useState<TISErrors>({});
  const [result, setResult]             = useState<TISResult | null>(null);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  function handleStaticChange(text: string) {
    setStaticInput(text);
    setResult(null);
    setErrors(prev => ({ ...prev, static: undefined }));
  }

  function handleDynamicChange(text: string) {
    setDynamicInput(text);
    setResult(null);
    setErrors(prev => ({ ...prev, dynamic: undefined }));
  }

  function handleCoordChange(text: string) {
    setCoordInput(text);
    setResult(null);
    setErrors(prev => ({ ...prev, coord: undefined }));
  }

  function handleStaticBlur() {
    const err = validateSection(staticInput, STATIC_MAX);
    setErrors(prev => ({ ...prev, static: err }));
    if (!err) setResult(attemptResult(staticInput, dynamicInput, coordInput));
  }

  function handleDynamicBlur() {
    const err = validateSection(dynamicInput, DYNAMIC_MAX);
    setErrors(prev => ({ ...prev, dynamic: err }));
    if (!err) setResult(attemptResult(staticInput, dynamicInput, coordInput));
  }

  function handleCoordBlur() {
    const err = validateSection(coordInput, COORD_MAX);
    setErrors(prev => ({ ...prev, coord: err }));
    if (!err) setResult(attemptResult(staticInput, dynamicInput, coordInput));
  }

  return (
    <Screen padded={false} rootBackground={colors.primary} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        mode="nav"
        leftLabel="‹"
        onLeft={() => router.back()}
        title="Trunk Impairment Scale"
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
          <Text style={styles.sectionLabel}>STATIC SITTING BALANCE</Text>
          <NumericClinicalInput
            label=""
            value={staticInput}
            onChangeText={handleStaticChange}
            onBlur={handleStaticBlur}
            unit={`/ ${STATIC_MAX}`}
            error={errors.static}
          />

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>DYNAMIC SITTING BALANCE</Text>
          <NumericClinicalInput
            label=""
            value={dynamicInput}
            onChangeText={handleDynamicChange}
            onBlur={handleDynamicBlur}
            unit={`/ ${DYNAMIC_MAX}`}
            error={errors.dynamic}
          />

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>COORDINATION</Text>
          <NumericClinicalInput
            label=""
            value={coordInput}
            onChangeText={handleCoordChange}
            onBlur={handleCoordBlur}
            unit={`/ ${COORD_MAX}`}
            error={errors.coord}
          />
        </Card>

        {result !== null ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultMicroLabel}>TIS RESULT</Text>
            <View style={styles.resultValueRow}>
              <Text style={styles.resultValue}>{result.primaryValue}</Text>
              <Text style={styles.resultUnit}>{result.primaryUnit}</Text>
              <View style={[
                styles.resultColorDot,
                { backgroundColor: TIS_COLOR_MAP[result.meta.classColor] ?? colors.muted },
              ]} />
            </View>
            <View style={styles.resultInterpPill}>
              <Text style={styles.resultInterpText}>{result.interpretation}</Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultMetaGrid}>
              <View style={styles.resultMetaCell}>
                <Text style={styles.resultMetaLabel}>STATIC</Text>
                <Text style={styles.resultMetaValue}>{result.meta.staticScore} / {STATIC_MAX}</Text>
              </View>
              <View style={styles.resultMetaCell}>
                <Text style={styles.resultMetaLabel}>DYNAMIC</Text>
                <Text style={styles.resultMetaValue}>{result.meta.dynamicScore} / {DYNAMIC_MAX}</Text>
              </View>
              <View style={styles.resultMetaCell}>
                <Text style={styles.resultMetaLabel}>COORDINATION</Text>
                <Text style={styles.resultMetaValue}>{result.meta.coordinationScore} / {COORD_MAX}</Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
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
  sectionLabel: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  resultCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  resultMicroLabel: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    letterSpacing: 1,
  },
  resultValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  resultValue: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.actionBlue,
  },
  resultUnit: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  resultColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: spacing.xs,
    alignSelf: 'center',
  },
  resultInterpPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  resultInterpText: {
    fontSize: typography.sizeSm,
    color: colors.ink,
  },
  resultDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  resultMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  resultMetaCell: {
    minWidth: '30%',
    flex: 1,
    gap: spacing.xs,
  },
  resultMetaLabel: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    letterSpacing: 1,
  },
  resultMetaValue: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
});

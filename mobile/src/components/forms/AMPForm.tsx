import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore — JS clinical module, no type declarations
import { calcAMP } from '@clinical/amp';
import { getPatient } from '../../supabase/patients';
import type { Patient } from '../../types/domain';
import { Screen } from '../ui/Screen';
import { Card } from '../ui/Card';
import { NavyHeader } from '../ui/NavyHeader';
import { PatientAvatar } from '../ui/PatientAvatar';
import { NumericClinicalInput } from './NumericClinicalInput';
import { ThreeBarMotif } from '../ui/ThreeBarMotif';
import { colors, spacing, typography, radii } from '../../theme/tokens';

const PRO_MAX = 47;
const NOPRO_MAX = 43;

type AmpMode = 'pro' | 'nopro';

interface AMPResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { kLevel: string; classColor: 'green' | 'amber' | 'red' };
}

const COLOR_MAP: Record<string, string> = {
  green: colors.success,
  amber: '#a05c00',
  red:   colors.coral,
};

const MODES: Array<{ key: AmpMode; title: string; sub: string; max: number }> = [
  { key: 'pro',   title: 'AMPPRO',   sub: 'With prosthesis',    max: PRO_MAX   },
  { key: 'nopro', title: 'AMPnoPRO', sub: 'Without prosthesis', max: NOPRO_MAX },
];

function computeResult(mode: AmpMode, scoreInput: string): AMPResult | null {
  const raw = scoreInput.trim();
  if (!raw) return null;
  const score = parseInt(raw, 10);
  if (isNaN(score) || score < 0) return null;
  const max = mode === 'pro' ? PRO_MAX : NOPRO_MAX;
  if (score > max) return null;
  return calcAMP({ mode, score }) as AMPResult | null;
}

export function AMPForm({ patientId }: { patientId: string }) {
  const insets = useSafeAreaInsets();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [mode, setMode] = useState<AmpMode>('pro');
  const [scoreInput, setScoreInput] = useState('');
  const [result, setResult] = useState<AMPResult | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);

  useEffect(() => {
    getPatient(patientId).then(p => setPatient(p)).catch(() => null);
  }, [patientId]);

  function handleModeChange(next: AmpMode) {
    if (next === mode) return;
    setMode(next);
    setScoreInput('');
    setResult(null);
    setScoreError(null);
  }

  function handleScoreChange(text: string) {
    setScoreInput(text);
    setScoreError(null);
    setResult(computeResult(mode, text));
  }

  function handleScoreBlur() {
    const raw = scoreInput.trim();
    if (!raw) return;
    const score = parseInt(raw, 10);
    const max = mode === 'pro' ? PRO_MAX : NOPRO_MAX;
    if (isNaN(score) || score < 0 || score > max) {
      setScoreError(`Enter a score between 0 and ${max}`);
      setResult(null);
    }
  }

  const currentMax = mode === 'pro' ? PRO_MAX : NOPRO_MAX;
  const modeLabel = mode === 'pro' ? 'AMPPRO' : 'AMPnoPRO';

  return (
    <Screen padded={false} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        mode="nav"
        leftLabel="‹"
        onLeft={() => router.back()}
        title="Amputee Mobility Predictor"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
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
          <Text style={styles.cardHeading}>Mode</Text>
          <Text style={styles.fieldLabel}>SELECT VERSION</Text>
          <View style={styles.modeRow}>
            {MODES.map(({ key, title, sub, max }) => {
              const isSelected = mode === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => handleModeChange(key)}
                  style={({ pressed }) => [
                    styles.modeTile,
                    isSelected && styles.modeTileSelected,
                    pressed && styles.modeTilePressed,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${title} — ${sub}`}
                >
                  <Text style={[styles.modeTileTitle, isSelected && styles.modeTileTitleSelected]}>
                    {title}
                  </Text>
                  <Text style={[styles.modeTileSub, isSelected && styles.modeTileSubSelected]}>
                    {sub}
                  </Text>
                  <Text style={[styles.modeTileMax, isSelected && styles.modeTileMaxSelected]}>
                    /{max} max
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card>
          <Text style={styles.cardHeading}>Score</Text>
          <NumericClinicalInput
            label={`TOTAL SCORE (0 – ${currentMax})`}
            value={scoreInput}
            onChangeText={handleScoreChange}
            onBlur={handleScoreBlur}
            unit={`/${currentMax}`}
            error={scoreError ?? undefined}
          />
        </Card>

        {result !== null ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultMicroLabel}>{modeLabel} RESULT</Text>
              <ThreeBarMotif size="sm" tone="soft" />
            </View>
            <View style={styles.resultValueRow}>
              <View style={[styles.kLevelBadge, { backgroundColor: COLOR_MAP[result.meta.classColor] ?? colors.muted }]}>
                <Text style={styles.kLevelBadgeText}>{result.meta.kLevel}</Text>
              </View>
              <Text style={styles.resultScore}>{result.primaryValue}</Text>
              <Text style={styles.resultUnit}>/{currentMax}</Text>
              <View style={[styles.colorDot, { backgroundColor: COLOR_MAP[result.meta.classColor] ?? colors.muted }]} />
            </View>
            <View style={styles.interpPill}>
              <Text style={styles.interpText}>{result.interpretation}</Text>
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
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
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
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
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
  cardHeading: {
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
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeTile: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'center',
  },
  modeTileSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  modeTilePressed: {
    opacity: 0.65,
  },
  modeTileTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: colors.muted,
    letterSpacing: typography.trackingWide,
  },
  modeTileTitleSelected: {
    color: colors.primary,
  },
  modeTileSub: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    textAlign: 'center',
  },
  modeTileSubSelected: {
    color: colors.actionBlue,
  },
  modeTileMax: {
    fontSize: typography.sizeXs,
    color: colors.muted,
    fontWeight: typography.weightMedium,
    marginTop: spacing.xs,
  },
  modeTileMaxSelected: {
    color: colors.primary,
    fontWeight: typography.weightSemibold,
  },
  resultCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resultMicroLabel: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
  },
  resultValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  kLevelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    minWidth: 40,
    alignItems: 'center',
  },
  kLevelBadgeText: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  resultScore: {
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.actionBlue,
  },
  resultUnit: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: spacing.xs,
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
});

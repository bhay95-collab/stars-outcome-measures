import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { PatientAvatar } from '../ui/PatientAvatar';
import type { Patient } from '../../types/domain';
import { colors, spacing, typography } from '../../theme/tokens';

interface AssessmentPatientCardProps {
  patient: Patient | null;
}

export function AssessmentPatientCard({ patient }: AssessmentPatientCardProps) {
  return (
    <Card style={styles.patientCard}>
      <PatientAvatar name={patient?.initials ?? '?'} size="sm" />
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{patient?.initials ?? '...'}</Text>
        {patient?.condition ? (
          <Text style={styles.patientSub} numberOfLines={1}>{patient.condition}</Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
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
});

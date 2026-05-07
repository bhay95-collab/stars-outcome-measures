import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../../src/auth/AuthProvider';
import { listPatients } from '../../../src/supabase/patients';
import type { Patient } from '../../../src/types/domain';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { colors, spacing, typography } from '../../../src/theme/tokens';

const PATIENT_AVATAR_SIZE = 44;

function PatientCard({ patient }: { patient: Patient }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/patients/${patient.id}`)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Open patient ${patient.initials}`}
    >
      <Card style={styles.patientCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{patient.initials}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.initials}>{patient.initials}</Text>
          {patient.condition ? (
            <Text style={styles.condition} numberOfLines={1}>
              {patient.condition}
            </Text>
          ) : null}
        </View>
        <Text style={styles.chevron}>›</Text>
      </Card>
    </TouchableOpacity>
  );
}

export default function PatientsScreen() {
  const { signOut } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPatients()
      .then(setPatients)
      .catch(() => setError('Unable to load patients.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        <TouchableOpacity
          onPress={signOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : patients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No patients found.</Text>
          <Text style={styles.emptyHint}>
            Patients you add in the web app will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {patients.map(p => (
            <PatientCard key={p.id} patient={p} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  signOutText: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  errorText: {
    fontSize: typography.sizeMd,
    color: colors.coral,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizeMd,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  emptyHint: {
    fontSize: typography.sizeSm,
    color: colors.subtle,
    textAlign: 'center',
  },
  list: {
    gap: spacing.sm,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: PATIENT_AVATAR_SIZE,
    height: PATIENT_AVATAR_SIZE,
    borderRadius: PATIENT_AVATAR_SIZE / 2,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  cardBody: {
    flex: 1,
  },
  initials: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  condition: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  chevron: {
    fontSize: typography.sizeLg,
    color: colors.subtle,
  },
});

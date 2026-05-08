import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../../src/auth/AuthProvider';
import { listPatients } from '../../../src/supabase/patients';
import type { Patient } from '../../../src/types/domain';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { NavyHeader } from '../../../src/components/ui/NavyHeader';
import { PatientAvatar } from '../../../src/components/ui/PatientAvatar';
import { colors, fonts, spacing, typography } from '../../../src/theme/tokens';

function formatDOB(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function PatientCard({ patient }: { patient: Patient }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/patients/${patient.id}`)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Open patient ${patient.initials}`}
    >
      <Card style={styles.patientCard}>
        <PatientAvatar name={patient.initials} size="sm" />
        <View style={styles.cardBody}>
          <Text style={styles.name}>{patient.initials}</Text>
          {patient.dob ? (
            <Text style={styles.dob}>{formatDOB(patient.dob)}</Text>
          ) : null}
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

  return (
    <Screen padded={false} style={styles.navyBg} rootBackground={colors.primary} safeEdges={['top', 'left', 'right']}>
      <NavyHeader mode="brand" rightLabel="Sign out" onRight={signOut} />

      <View style={styles.panel}>
        <Text style={styles.heading}>Patient Directory</Text>
        <Text style={styles.subtitle}>Manage and monitor patient progress.</Text>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {patients.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No patients found.</Text>
                <Text style={styles.emptyHint}>
                  Patients you add in the web app will appear here.
                </Text>
              </View>
            ) : (
              patients.map(p => <PatientCard key={p.id} patient={p} />)
            )}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  navyBg: {
    backgroundColor: colors.primary,
  },
  panel: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: spacing.lg,
    overflow: 'hidden',
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  scroll: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardBody: {
    flex: 1,
  },
  name: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  dob: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    marginTop: spacing.xs,
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
  errorText: {
    fontSize: typography.sizeMd,
    color: colors.coral,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyContainer: {
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
});

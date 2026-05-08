import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView,
  Image, Modal, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { User } from '@supabase/supabase-js';
import { useAuth } from '../../../src/auth/AuthProvider';
import { supabase } from '../../../src/supabase/client';
import { listPatients } from '../../../src/supabase/patients';
import type { Patient } from '../../../src/types/domain';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { NavyHeader } from '../../../src/components/ui/NavyHeader';
import { PatientAvatar } from '../../../src/components/ui/PatientAvatar';
import { colors, fonts, spacing, typography, radii } from '../../../src/theme/tokens';

function getUserInitials(user: User): string {
  const name: string = user.user_metadata?.full_name ?? user.user_metadata?.name ?? '';
  if (name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (user.email?.[0] ?? '?').toUpperCase();
}

function getUserDisplayName(user: User): string {
  return user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? '';
}

function UserAvatarButton({ user, avatarUrl, onPress }: { user: User; avatarUrl: string | null; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.avatarBtn, pressed && styles.avatarBtnPressed]}
      accessibilityRole="button"
      accessibilityLabel="Open user settings"
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitials}>{getUserInitials(user)}</Text>
        </View>
      )}
    </Pressable>
  );
}

function SettingsSheet({
  visible,
  user,
  avatarUrl,
  onDismiss,
  onSignOut,
}: {
  visible: boolean;
  user: User;
  avatarUrl: string | null;
  onDismiss: () => void;
  onSignOut: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetUser}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.sheetAvatar} />
          ) : (
            <View style={styles.sheetAvatarFallback}>
              <Text style={styles.sheetAvatarInitials}>{getUserInitials(user)}</Text>
            </View>
          )}
          <View style={styles.sheetUserInfo}>
            <Text style={styles.sheetName} numberOfLines={1}>
              {getUserDisplayName(user)}
            </Text>
            {user.email ? (
              <Text style={styles.sheetEmail} numberOfLines={1}>{user.email}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.sheetDivider} />

        <Pressable
          onPress={onSignOut}
          style={({ pressed }) => [styles.signOutBtn, pressed && styles.signOutBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

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
  const { user, signOut } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    listPatients()
      .then(setPatients)
      .catch(() => setError('Unable to load patients.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.avatar_url) setProfileAvatarUrl(data.avatar_url);
      });
  }, [user?.id]);

  const resolvedAvatarUrl: string | null =
    profileAvatarUrl ?? user?.user_metadata?.avatar_url ?? null;

  async function handleSignOut() {
    setSettingsVisible(false);
    await signOut();
  }

  return (
    <Screen padded={false} style={styles.navyBg} rootBackground={colors.primary} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        mode="brand"
        rightElement={
          user ? (
            <UserAvatarButton user={user} avatarUrl={resolvedAvatarUrl} onPress={() => setSettingsVisible(true)} />
          ) : null
        }
      />

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

      {user ? (
        <SettingsSheet
          visible={settingsVisible}
          user={user}
          avatarUrl={resolvedAvatarUrl}
          onDismiss={() => setSettingsVisible(false)}
          onSignOut={handleSignOut}
        />
      ) : null}
    </Screen>
  );
}

const AVATAR_SIZE = 36;

const styles = StyleSheet.create({
  navyBg: {
    backgroundColor: colors.primary,
  },
  // User avatar button (header)
  avatarBtn: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  avatarBtnPressed: {
    opacity: 0.75,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
    color: '#FFFFFF',
  },
  // Settings sheet
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  sheetUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sheetAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  sheetAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetAvatarInitials: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.primary,
  },
  sheetUserInfo: {
    flex: 1,
  },
  sheetName: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  sheetEmail: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  signOutBtn: {
    height: 48,
    borderRadius: radii.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutBtnPressed: {
    opacity: 0.7,
  },
  signOutText: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightMedium,
    color: colors.ink,
  },
  // Patient directory
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

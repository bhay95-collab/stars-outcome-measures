import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Image, Modal, Pressable, TextInput as RNTextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { User } from '@supabase/supabase-js';
import { useAuth } from '../../../src/auth/AuthProvider';
import { supabase } from '../../../src/supabase/client';
import { createPatient, listPatients } from '../../../src/supabase/patients';
import type { Patient } from '../../../src/types/domain';
import { Screen } from '../../../src/components/ui/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { NavyHeader } from '../../../src/components/ui/NavyHeader';
import { PatientAvatar } from '../../../src/components/ui/PatientAvatar';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { ThreeBarMotif } from '../../../src/components/ui/ThreeBarMotif';
import { TextInput as ClinicalTextInput } from '../../../src/components/ui/TextInput';
import { colors, fonts, spacing, typography, radii } from '../../../src/theme/tokens';

type PatientGender = 'M' | 'F' | 'Other';

const GENDER_OPTIONS: { value: PatientGender; label: string }[] = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

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

function getPatientClinicalLabel(patient: Patient): string | null {
  return patient.diagnosis ?? patient.condition ?? null;
}

function PatientCard({ patient }: { patient: Patient }) {
  const clinicalLabel = getPatientClinicalLabel(patient);

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
          <View style={styles.patientMetaRow}>
            {patient.dob ? (
              <Text style={styles.dob}>{formatDOB(patient.dob)}</Text>
            ) : null}
            {clinicalLabel ? (
              <View style={styles.conditionPill}>
                <Text style={styles.condition} numberOfLines={1}>
                  {clinicalLabel}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Card>
    </TouchableOpacity>
  );
}

function isDOBValid(dob: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
}

function CreatePatientSheet({
  visible,
  onDismiss,
  onCreated,
}: {
  visible: boolean;
  onDismiss: () => void;
  onCreated: () => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastInitial, setLastInitial] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<PatientGender | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function resetForm() {
    setFirstName('');
    setLastInitial('');
    setDob('');
    setGender(null);
    setDiagnosis('');
    setError(null);
  }

  function handleDismiss() {
    if (isSaving) return;
    resetForm();
    onDismiss();
  }

  function handleLastInitialChange(value: string) {
    setError(null);
    setLastInitial(value.replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase());
  }

  async function handleCreate() {
    const trimmedFirstName = firstName.trim();
    const trimmedLastInitial = lastInitial.trim().toUpperCase();

    if (!trimmedFirstName) {
      setError('First name is required.');
      return;
    }
    if (!/^[A-Z]$/.test(trimmedLastInitial)) {
      setError('Last initial is required.');
      return;
    }
    if (!dob.trim()) {
      setError('Date of birth is required.');
      return;
    }
    if (!isDOBValid(dob.trim())) {
      setError('Enter a valid date of birth that is not in the future.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await createPatient({
        firstName: trimmedFirstName,
        lastInitial: trimmedLastInitial,
        dob: dob.trim(),
        gender,
        diagnosis,
      });
      resetForm();
      await onCreated();
    } catch {
      setError('Unable to create patient. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.backdrop} onPress={handleDismiss} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetKeyboard}
      >
        <View style={[styles.sheet, styles.createSheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.sheetHandle} />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.createSheetContent}
          >
            <View>
              <Text style={styles.sheetKicker}>NEW PATIENT</Text>
              <Text style={styles.createTitle}>Patient details</Text>
            </View>

            <ClinicalTextInput
              label="First name"
              value={firstName}
              onChangeText={(value) => {
                setError(null);
                setFirstName(value);
              }}
              placeholder="e.g. Benjamin"
              autoCapitalize="words"
              autoComplete="name"
            />
            <ClinicalTextInput
              label="Last initial"
              value={lastInitial}
              onChangeText={handleLastInitialChange}
              placeholder="e.g. H"
              autoCapitalize="characters"
            />
            <ClinicalTextInput
              label="Date of birth"
              value={dob}
              onChangeText={(value) => {
                setError(null);
                setDob(value);
              }}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
            />

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.segmentRow}>
                {GENDER_OPTIONS.map(option => {
                  const selected = gender === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setError(null);
                        setGender(selected ? null : option.value);
                      }}
                      style={({ pressed }) => [
                        styles.segmentButton,
                        selected && styles.segmentButtonSelected,
                        pressed && styles.segmentButtonPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Gender ${option.label}`}
                    >
                      <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <ClinicalTextInput
              label="Diagnosis"
              value={diagnosis}
              onChangeText={(value) => {
                setError(null);
                setDiagnosis(value);
              }}
              placeholder="Optional"
              autoCapitalize="words"
            />

            {error ? <Text style={styles.createError}>{error}</Text> : null}

            <View style={styles.createActions}>
              <Button
                label="Create patient"
                onPress={handleCreate}
                loading={isSaving}
              />
              <Button
                label="Cancel"
                onPress={handleDismiss}
                variant="secondary"
                disabled={isSaving}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function PatientsScreen() {
  const { user, signOut } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [createPatientVisible, setCreatePatientVisible] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  async function refreshPatients() {
    setError(null);
    const nextPatients = await listPatients();
    setPatients(nextPatients);
  }

  useEffect(() => {
    setIsLoading(true);
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

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return patients;

    return patients.filter(patient => {
      const clinicalLabel = getPatientClinicalLabel(patient);
      const searchable = [
        patient.initials,
        clinicalLabel ?? '',
        patient.dob ?? '',
        patient.dob ? formatDOB(patient.dob) : '',
      ].join(' ').toLowerCase();
      return searchable.includes(query);
    });
  }, [patients, searchQuery]);

  async function handleSignOut() {
    setSettingsVisible(false);
    await signOut();
  }

  async function handlePatientCreated() {
    await refreshPatients();
    setCreatePatientVisible(false);
  }

  return (
    <Screen padded={false} style={styles.navyBg} rootBackground={colors.primaryDark} safeEdges={['top', 'left', 'right']}>
      <NavyHeader
        mode="brand"
        rightElement={
          user ? (
            <UserAvatarButton user={user} avatarUrl={resolvedAvatarUrl} onPress={() => setSettingsVisible(true)} />
          ) : null
        }
      />

      <View style={styles.panel}>
        <View style={styles.overview}>
          <View style={styles.overviewHeader}>
            <View style={styles.overviewCopy}>
              <Text style={styles.heading}>Patient Directory</Text>
              <Text style={styles.subtitle}>Manage and monitor patient progress.</Text>
            </View>
            <ThreeBarMotif size="md" tone="soft" />
          </View>
          <View style={styles.searchRow}>
            <RNTextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search patients"
              placeholderTextColor={colors.subtle}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              style={styles.searchInput}
              accessibilityLabel="Search patients"
            />
          </View>
          <View style={styles.createButtonRow}>
            <Button
              label="New Patient"
              onPress={() => setCreatePatientVisible(true)}
              variant="secondary"
            />
          </View>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <LoadingState label="Loading patients" />
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
              <EmptyState
                title="No patients found"
                hint="Create a patient to start recording mobile assessments."
              />
            ) : filteredPatients.length === 0 ? (
              <EmptyState
                title="No matching patients"
                hint="Try searching by initials, condition, or date of birth."
              />
            ) : (
              filteredPatients.map(p => <PatientCard key={p.id} patient={p} />)
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
      <CreatePatientSheet
        visible={createPatientVisible}
        onDismiss={() => setCreatePatientVisible(false)}
        onCreated={handlePatientCreated}
      />
    </Screen>
  );
}

const AVATAR_SIZE = 36;

const styles = StyleSheet.create({
  navyBg: {
    backgroundColor: colors.primaryDark,
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
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sheetKeyboard: {
    justifyContent: 'flex-end',
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
  createSheet: {
    maxHeight: '88%',
  },
  createSheetContent: {
    gap: spacing.sm,
  },
  sheetKicker: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
    letterSpacing: typography.trackingWide,
  },
  createTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  fieldGroup: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  segmentButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  segmentButtonPressed: {
    opacity: 0.75,
  },
  segmentText: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.muted,
  },
  segmentTextSelected: {
    color: colors.primary,
    fontWeight: typography.weightBold,
  },
  createError: {
    fontSize: typography.sizeSm,
    color: colors.coral,
  },
  createActions: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  // Patient directory
  panel: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingTop: spacing.md,
    overflow: 'hidden',
  },
  overview: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  overviewCopy: {
    flex: 1,
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: 20,
  },
  searchRow: {
    marginTop: spacing.md,
  },
  createButtonRow: {
    marginTop: spacing.md,
  },
  searchInput: {
    minHeight: 48,
    backgroundColor: colors.panel,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.ink,
    fontSize: typography.sizeMd,
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
    paddingVertical: spacing.md,
  },
  cardBody: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  dob: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  patientMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  conditionPill: {
    maxWidth: '72%',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
  },
  condition: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
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
});

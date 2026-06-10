import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONDITION_OPTIONS } from '@clinical/constants';
import { updatePatient } from '../../supabase/patients';
import type { Patient, PatientGender } from '../../types/domain';
import { formatDOBInput, parseDOBInput, isoToDisplayDOB, dobYearFromISO } from '../../utils/dob';
import { TextInput } from '../ui/TextInput';
import { Button } from '../ui/Button';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const GENDER_OPTIONS: { value: PatientGender; label: string }[] = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const DIAGNOSIS_OPTIONS = CONDITION_OPTIONS as readonly string[];

interface PatientEditSheetProps {
  visible: boolean;
  patient: Patient;
  onUpdated: (patient: Patient) => void;
  onDismiss: () => void;
}

export function PatientEditSheet({ visible, patient, onUpdated, onDismiss }: PatientEditSheetProps) {
  const insets = useSafeAreaInsets();
  const [initials, setInitials] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<PatientGender | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [diagnosisOpen, setDiagnosisOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setInitials(patient.initials ?? '');
      setDob(isoToDisplayDOB(patient.dob));
      setGender((patient.gender as PatientGender | null) ?? null);
      setDiagnosis(patient.diagnosis ?? '');
      setDiagnosisOpen(false);
      setError(null);
    }
  }, [visible, patient.id]);

  function handleDismiss() {
    if (isSaving) return;
    onDismiss();
  }

  async function handleSave() {
    const trimmedInitials = initials.trim().replace(/\s+/g, ' ');
    if (!trimmedInitials) {
      setError('Patient label / initials is required.');
      return;
    }

    let isoDOB: string | null = null;
    if (dob.trim()) {
      isoDOB = parseDOBInput(dob.trim());
      if (!isoDOB) {
        setError('Enter a valid date of birth in DD/MM/YYYY format that is not in the future.');
        return;
      }
    }

    setIsSaving(true);
    setError(null);
    setDiagnosisOpen(false);

    try {
      const updated = await updatePatient(patient.id, {
        initials: trimmedInitials,
        dob: isoDOB,
        dob_year: dobYearFromISO(isoDOB),
        gender,
        diagnosis: diagnosis || null,
      });
      onUpdated(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update patient. Please try again.');
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
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={handleDismiss} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
          pointerEvents="box-none"
        >
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.sheetHandle} />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              <View>
                <Text style={styles.kicker}>EDIT PATIENT</Text>
                <Text style={styles.title}>Update details</Text>
                <Text style={styles.helper}>
                  Demographics and diagnosis drive pathway recommendations, predicted values, and MCID context.
                </Text>
              </View>

              <TextInput
                label="Patient label / initials *"
                value={initials}
                onChangeText={(value) => {
                  setError(null);
                  setInitials(value);
                }}
                placeholder="e.g. Benjamin H. or BH"
                autoCapitalize="words"
                accessibilityLabel="Patient label or initials"
              />

              <TextInput
                label="Date of birth"
                value={dob}
                onChangeText={(value) => {
                  setError(null);
                  setDob(formatDOBInput(value));
                }}
                placeholder="DD/MM/YYYY"
                keyboardType="numeric"
                accessibilityLabel="Date of birth"
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
                        accessibilityState={{ selected }}
                      >
                        <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Diagnosis</Text>
                <Pressable
                  onPress={() => {
                    setError(null);
                    setDiagnosisOpen(open => !open);
                  }}
                  style={({ pressed }) => [
                    styles.dropdownButton,
                    diagnosisOpen && styles.dropdownButtonOpen,
                    pressed && styles.dropdownButtonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Select diagnosis"
                >
                  <Text
                    style={[styles.dropdownText, !diagnosis && styles.dropdownPlaceholder]}
                    numberOfLines={1}
                  >
                    {diagnosis || 'Select diagnosis'}
                  </Text>
                  <Text style={styles.dropdownChevron}>{diagnosisOpen ? '⌃' : '⌄'}</Text>
                </Pressable>
                {diagnosisOpen ? (
                  <View style={styles.dropdownMenu}>
                    <ScrollView
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      style={styles.dropdownScroll}
                    >
                      {DIAGNOSIS_OPTIONS.map(option => {
                        const selected = diagnosis === option;
                        return (
                          <Pressable
                            key={option}
                            onPress={() => {
                              setDiagnosis(option);
                              setDiagnosisOpen(false);
                              setError(null);
                            }}
                            style={({ pressed }) => [
                              styles.dropdownOption,
                              selected && styles.dropdownOptionSelected,
                              pressed && styles.dropdownOptionPressed,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`Diagnosis ${option}`}
                          >
                            <Text style={[styles.dropdownOptionText, selected && styles.dropdownOptionTextSelected]}>
                              {option}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                    {diagnosis ? (
                      <Pressable
                        onPress={() => {
                          setDiagnosis('');
                          setDiagnosisOpen(false);
                          setError(null);
                        }}
                        style={({ pressed }) => [styles.clearButton, pressed && styles.dropdownOptionPressed]}
                        accessibilityRole="button"
                        accessibilityLabel="Clear diagnosis selection"
                      >
                        <Text style={styles.clearButtonText}>Clear selection</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>

              {error ? (
                <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>
              ) : null}

              <View style={styles.actions}>
                <Button
                  label="Save changes"
                  onPress={handleSave}
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 43, 54, 0.45)',
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingTop: spacing.sm,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  kicker: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  helper: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: 20,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segmentButton: {
    flex: 1,
    height: 44,
    borderRadius: radii.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: typography.weightSemibold,
    color: colors.muted,
  },
  segmentTextSelected: {
    color: colors.primary,
  },
  dropdownButton: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
  },
  dropdownButtonOpen: {
    borderColor: colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownButtonPressed: {
    opacity: 0.75,
  },
  dropdownText: {
    flex: 1,
    fontSize: typography.sizeMd,
    color: colors.ink,
  },
  dropdownPlaceholder: {
    color: colors.subtle,
  },
  dropdownChevron: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    marginLeft: spacing.sm,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.primary,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  dropdownOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownOptionSelected: {
    backgroundColor: colors.primarySoft,
  },
  dropdownOptionPressed: {
    opacity: 0.7,
  },
  dropdownOptionText: {
    fontSize: typography.sizeSm,
    color: colors.ink,
  },
  dropdownOptionTextSelected: {
    fontWeight: typography.weightSemibold,
    color: colors.primary,
  },
  clearButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: typography.sizeSm,
    color: colors.coral,
    fontWeight: typography.weightSemibold,
  },
  errorText: {
    fontSize: typography.sizeSm,
    color: colors.coral,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface NumericClinicalInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  unit?: string;
  error?: string;
  editable?: boolean;
}

export function NumericClinicalInput({
  label,
  value,
  onChangeText,
  onBlur,
  unit,
  error,
  editable = true,
}: NumericClinicalInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            focused && styles.inputFocused,
            !!error && styles.inputError,
            !editable && styles.inputDisabled,
          ]}
          value={value}
          onChangeText={onChangeText}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onFocus={() => setFocused(true)}
          keyboardType="decimal-pad"
          textAlign="center"
          editable={editable}
          placeholder="—"
          placeholderTextColor={colors.subtle}
        />
        {unit ? (
          <View style={styles.unitWrapper} pointerEvents="none">
            <Text style={styles.unit}>{unit}</Text>
          </View>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightSemibold,
    letterSpacing: typography.trackingWide,
    marginBottom: spacing.sm,
  },
  inputRow: {
    position: 'relative',
  },
  input: {
    height: 72,
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.panel,
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: colors.actionBlue,
  },
  inputError: {
    borderColor: colors.coral,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  unitWrapper: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  unit: {
    fontSize: typography.sizeSm,
    color: colors.muted,
  },
  error: {
    fontSize: typography.sizeSm,
    color: colors.coral,
    marginTop: spacing.xs,
  },
});

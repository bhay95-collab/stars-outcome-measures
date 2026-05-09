import React from 'react';
import { StyleSheet, TextInput as RNTextInput, View, Text } from 'react-native';
import { colors, radii, typography, spacing } from '../../theme/tokens';

interface TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'email-address';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  textContentType?: string;
  error?: string;
  editable?: boolean;
  accessibilityLabel?: string;
  rightElement?: React.ReactNode;
}

export function TextInput({
  value,
  onChangeText,
  label,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize,
  autoComplete,
  textContentType,
  error,
  editable = true,
  accessibilityLabel,
  rightElement,
}: TextInputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputRow}>
        <RNTextInput
          style={[
            styles.input,
            rightElement ? styles.inputWithRight : null,
            !editable ? styles.inputDisabled : null,
            error ? styles.inputError : null,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.subtle}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete as any}
          textContentType={textContentType as any}
          editable={editable}
          accessibilityLabel={accessibilityLabel ?? label}
        />
        {rightElement ? (
          <View style={styles.rightElement}>{rightElement}</View>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  inputRow: {
    position: 'relative',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizeMd,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  inputWithRight: {
    paddingRight: 56,
  },
  inputDisabled: {
    backgroundColor: colors.surfaceSoft,
    color: colors.muted,
  },
  inputError: {
    borderColor: colors.coral,
  },
  rightElement: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.sizeXs,
    color: colors.coral,
    marginTop: spacing.xs,
  },
});

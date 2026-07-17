import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '../../../theme/tokens';

export type ChoiceChipValue = number | string;

export interface ChoiceChipOption {
  value: ChoiceChipValue;
  label?: string;
  displayLabel?: string;
}

interface ChoiceChipRowProps {
  options: ChoiceChipOption[];
  selected: ChoiceChipValue | null;
  onSelect: (value: ChoiceChipValue) => void;
  label?: string;
  wrap?: boolean;
}

export function ChoiceChipRow({
  options,
  selected,
  onSelect,
  label,
  wrap = false,
}: ChoiceChipRowProps) {
  return (
    <View
      style={[styles.row, wrap && styles.rowWrap]}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
    >
      {options.map(opt => {
        const isSelected = selected === opt.value;
        const display = opt.displayLabel ?? String(opt.value);
        const accessibilityLabel = opt.label ? `${display} - ${opt.label}` : display;
        return (
          <View key={String(opt.value)} style={wrap ? styles.chipWrapperWrap : styles.chipWrapper}>
            <Pressable
              onPress={() => onSelect(opt.value)}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={accessibilityLabel}
            >
              <Text style={[styles.chipValue, isSelected && styles.chipValueSelected]}>
                {display}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  rowWrap: {
    flexWrap: 'wrap',
  },
  chipWrapper: {
    flex: 1,
  },
  chipWrapperWrap: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chip: {
    minWidth: 44,
    minHeight: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surfaceMuted,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPressed: { opacity: 0.7 },
  chipValue: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: colors.ink,
    textAlign: 'center',
  },
  chipValueSelected: { color: '#FFFFFF' },
});

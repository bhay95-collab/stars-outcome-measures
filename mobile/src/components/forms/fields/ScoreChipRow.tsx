import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '../../../theme/tokens';

export interface ChipOption {
  value: number;
  label?: string;
}

interface ScoreChipRowProps {
  options: ChipOption[];
  selected: number | null;
  onSelect: (value: number) => void;
}

export function ScoreChipRow({ options, selected, onSelect }: ScoreChipRowProps) {
  const hasLabels = options.some(o => o.label);
  return (
    <View style={styles.row}>
      {options.map(opt => {
        const isSelected = selected === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={({ pressed }) => [
              styles.chip,
              hasLabels && styles.chipTall,
              isSelected && styles.chipSelected,
              pressed && styles.chipPressed,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={opt.label ? `${opt.value} — ${opt.label}` : String(opt.value)}
          >
            <Text style={[styles.chipValue, isSelected && styles.chipValueSelected]}>
              {opt.value}
            </Text>
            {opt.label ? (
              <Text
                style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}
                numberOfLines={2}
              >
                {opt.label}
              </Text>
            ) : null}
          </Pressable>
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
  chip: {
    flex: 1,
    minWidth: 32,
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTall: {
    paddingVertical: spacing.sm,
    minHeight: 52,
    justifyContent: 'flex-start',
    gap: spacing.xs,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPressed: { opacity: 0.7 },
  chipValue: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
    color: colors.ink,
    textAlign: 'center',
  },
  chipValueSelected: { color: '#FFFFFF' },
  chipLabel: {
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 13,
  },
  chipLabelSelected: { color: 'rgba(255,255,255,0.85)' },
});

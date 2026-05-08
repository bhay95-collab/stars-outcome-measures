import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '../../theme/tokens';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function SegmentedControl({ options, selectedIndex, onSelect }: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {options.map((option, idx) => {
        const isActive = idx === selectedIndex;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(idx)}
            style={[styles.segment, isActive && styles.segmentActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={option}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    gap: 2,
  },
  segment: {
    flex: 1,
    minHeight: 36,
    borderRadius: radii.button - 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.muted,
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: typography.weightSemibold,
  },
});

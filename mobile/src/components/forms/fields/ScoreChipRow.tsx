import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors, spacing, typography, radii, animation } from '../../../theme/tokens';

export interface ChipOption {
  value: number;
  label?: string;
}

interface ScoreChipRowProps {
  options: ChipOption[];
  selected: number | null;
  onSelect: (value: number) => void;
  label?: string;
}

interface ChipEntranceProps {
  index: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

function ChipEntrance({ index, children, style }: ChipEntranceProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    scale.value = withDelay(index * 30, withSpring(1, animation.spring));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.chipWrapper, style, animStyle]}>
      {children}
    </Animated.View>
  );
}

export function ScoreChipRow({ options, selected, onSelect, label }: ScoreChipRowProps) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((opt, idx) => {
        const isSelected = selected === opt.value;
        return (
          <ChipEntrance key={opt.value} index={idx}>
            <Pressable
              onPress={() => onSelect(opt.value)}
              style={({ pressed }) => [
                styles.chip,
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
            </Pressable>
          </ChipEntrance>
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
  chipWrapper: {
    flex: 1,
  },
  chip: {
    flex: 1,
    minWidth: 32,
    minHeight: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
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

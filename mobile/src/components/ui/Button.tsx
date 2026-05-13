import React from 'react';
import { StyleSheet, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors, radii, typography, spacing, animation } from '../../theme/tokens';
import { ThreeBarLoading } from './ThreeBarMotif';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}

const variantContainerStyles = {
  primary:   { backgroundColor: colors.actionBlue },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.actionBlue },
  ghost:     { backgroundColor: 'transparent' },
} as const;

const variantLabelStyles = {
  primary:   { color: colors.surface },
  secondary: { color: colors.actionBlue },
  ghost:     { color: colors.muted },
} as const;

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const loadingTone = variant === 'primary' ? 'inverse' : 'brand';
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    if (!reducedMotion) {
      scale.value = withSpring(0.97, animation.spring);
    }
  }

  function handlePressOut() {
    if (!reducedMotion) {
      scale.value = withSpring(1, animation.spring);
    }
  }

  return (
    <AnimatedPressable
      style={[styles.base, variantContainerStyles[variant], isDisabled && styles.disabled, animatedStyle]}
      onPress={isDisabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ThreeBarLoading tone={loadingTone} size="sm" />
      ) : (
        <Text style={[styles.label, variantLabelStyles[variant]]}>{label}</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: radii.button,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
  },
});

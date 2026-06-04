import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors, spacing, typography, animation } from '../../theme/tokens';

interface EmptyStateProps {
  title: string;
  hint?: string;
}

export function EmptyState({ title, hint }: EmptyStateProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withTiming(1, { duration: animation.durationBase });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <View style={styles.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.iconLine} />
        <View style={[styles.iconLine, styles.iconLineShort]} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  icon: {
    gap: 6,
    marginBottom: spacing.xs,
  },
  iconLine: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.border,
  },
  iconLineShort: {
    width: 20,
  },
  title: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: colors.ink,
    textAlign: 'center',
  },
  hint: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

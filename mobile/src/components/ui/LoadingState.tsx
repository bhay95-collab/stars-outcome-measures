import React, { useEffect } from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors, spacing, typography } from '../../theme/tokens';

interface LoadingStateProps {
  label?: string;
  tone?: 'brand' | 'inverse';
}

interface SkeletonLineProps {
  width: DimensionValue;
  height?: number;
  delay?: number;
  inverse?: boolean;
}

function SkeletonLine({ width, height = 13, delay = 0, inverse = false }: SkeletonLineProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 0.5 : 0.3);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.85, { duration: 700 }),
          withTiming(0.3, { duration: 700 })
        ),
        -1,
        false
      )
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.skeletonLine,
        { width, height },
        inverse && styles.skeletonLineInverse,
        animStyle,
      ]}
    />
  );
}

export function LoadingState({ label = 'Loading', tone = 'brand' }: LoadingStateProps) {
  const isInverse = tone === 'inverse';

  return (
    <View style={styles.container} accessibilityRole="progressbar">
      <View style={styles.skeletonGroup}>
        <SkeletonLine width="70%" height={14} delay={0} inverse={isInverse} />
        <SkeletonLine width="50%" height={12} delay={80} inverse={isInverse} />
        <SkeletonLine width="85%" height={12} delay={160} inverse={isInverse} />
      </View>
      <Text style={[styles.label, isInverse && styles.labelInverse]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  skeletonGroup: {
    width: '100%',
    maxWidth: 200,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  skeletonLine: {
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  skeletonLineInverse: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  label: {
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
    color: colors.muted,
  },
  labelInverse: {
    color: 'rgba(255,255,255,0.78)',
  },
});

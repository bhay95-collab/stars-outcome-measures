import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../../theme/tokens';

type MotifSize = 'sm' | 'md' | 'lg';
type MotifTone = 'brand' | 'inverse' | 'soft';

interface ThreeBarMotifProps {
  size?: MotifSize;
  tone?: MotifTone;
  animated?: boolean;
}

const SIZE_MAP = {
  sm: { width: 8, gap: 5, heights: [16, 26, 38] },
  md: { width: 12, gap: 7, heights: [22, 36, 52] },
  lg: { width: 16, gap: 9, heights: [30, 50, 72] },
} as const;

const TONE_MAP = {
  brand: [colors.primaryDark, colors.primary, colors.secondary],
  inverse: ['#FFFFFF', colors.secondarySoft, colors.secondary],
  soft: [colors.primary, colors.secondary, '#B9D8F3'],
} as const;

export function ThreeBarMotif({
  size = 'md',
  tone = 'brand',
  animated = false,
}: ThreeBarMotifProps) {
  const dimensions = SIZE_MAP[size];
  const palette = TONE_MAP[tone];
  const values = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!animated) return undefined;

    const animation = Animated.loop(
      Animated.parallel(
        values.map((value, index) => (
          Animated.sequence([
            Animated.delay(index * 140),
            Animated.timing(value, {
              toValue: 1,
              duration: 360,
              useNativeDriver: true,
            }),
            Animated.timing(value, {
              toValue: 0,
              duration: 420,
              useNativeDriver: true,
            }),
            Animated.delay((2 - index) * 140),
          ])
        )),
      ),
    );

    animation.start();
    return () => animation.stop();
  }, [animated, values]);

  return (
    <View
      style={[
        styles.motif,
        {
          height: dimensions.heights[2],
          gap: dimensions.gap,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {dimensions.heights.map((height, index) => {
        const baseStyle = [
          styles.bar,
          {
            width: dimensions.width,
            height,
            borderRadius: Math.min(radii.md, dimensions.width / 2 + 2),
            backgroundColor: palette[index],
          },
        ];

        if (!animated) {
          return <View key={index} style={baseStyle} />;
        }

        const scaleY = values[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0.52, 1],
        });
        const opacity = values[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0.55, 1],
        });

        return (
          <Animated.View
            key={index}
            style={[
              baseStyle,
              {
                opacity,
                transform: [{ scaleY }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export function ThreeBarLoading({
  size = 'sm',
  tone = 'brand',
}: Omit<ThreeBarMotifProps, 'animated'>) {
  return (
    <View style={styles.loadingWrap} accessibilityRole="progressbar">
      <ThreeBarMotif size={size} tone={tone} animated />
    </View>
  );
}

const styles = StyleSheet.create({
  motif: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bar: {
    overflow: 'hidden',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
});

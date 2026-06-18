import React from 'react';
import { StyleSheet, Text, TextStyle, StyleProp } from 'react-native';
import { colors, fonts, typography } from '../../theme/tokens';

type WordmarkSize = 'sm' | 'md' | 'lg';
type WordmarkTone = 'dark' | 'light';

interface LogoWordmarkProps {
  size?: WordmarkSize;
  tone?: WordmarkTone;
  style?: StyleProp<TextStyle>;
}

const SIZE_MAP = {
  sm: { fontSize: typography.sizeMd, lineHeight: 21 },
  md: { fontSize: typography.sizeXl, lineHeight: 29 },
  lg: { fontSize: typography.size2xl, lineHeight: 36 },
} as const;

export function LogoWordmark({
  size = 'md',
  tone = 'dark',
  style,
}: LogoWordmarkProps) {
  const resolved = SIZE_MAP[size];
  const mainColor = tone === 'light' ? colors.surface : colors.primary;

  return (
    <Text
      style={[
        styles.wordmark,
        resolved,
        style,
      ]}
      accessibilityLabel="RehabMetrics IQ"
    >
      <Text style={{ color: mainColor }}>RehabMetrics </Text>
      <Text style={styles.iq}>IQ</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    fontFamily: fonts.serif,
    fontWeight: typography.weightSemibold,
    letterSpacing: 0,
  },
  iq: {
    color: '#6FBDFF',
  },
});

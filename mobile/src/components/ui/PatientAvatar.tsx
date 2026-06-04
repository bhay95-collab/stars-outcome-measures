import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../theme/tokens';

interface PatientAvatarProps {
  name: string;
  size?: 'sm' | 'md';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZES = {
  sm: { diameter: 44, fontSize: typography.sizeSm },
  md: { diameter: 56, fontSize: typography.sizeMd },
} as const;

export function PatientAvatar({ name, size = 'md' }: PatientAvatarProps) {
  const { diameter, fontSize } = SIZES[size];
  return (
    <View
      style={[
        styles.circle,
        { width: diameter, height: diameter, borderRadius: diameter / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.muted,
    fontWeight: typography.weightBold,
    textTransform: 'uppercase',
  },
});

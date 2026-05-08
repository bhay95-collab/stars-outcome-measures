import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

const squareLogo = require('../../../assets/SquareLogo.png');

interface NavyHeaderProps {
  mode?: 'brand' | 'nav';
  title?: string;
  leftLabel?: string;
  onLeft?: () => void;
  rightLabel?: string;
  onRight?: () => void;
  rightElement?: React.ReactNode;
}

function BrandHeader({
  rightLabel,
  onRight,
  rightElement,
}: Pick<NavyHeaderProps, 'rightLabel' | 'onRight' | 'rightElement'>) {
  return (
    <View style={styles.container}>
      <View style={styles.brandLeft}>
        <Image source={squareLogo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brandText}>
          <Text style={styles.brandMain}>RehabMetrics </Text>
          <Text style={styles.brandIQ}>IQ</Text>
        </Text>
      </View>
      <View style={styles.brandRight}>
        {rightElement ?? (rightLabel && onRight ? (
          <Pressable
            onPress={onRight}
            style={styles.action}
            accessibilityRole="button"
            accessibilityLabel={rightLabel}
          >
            <Text style={styles.actionText}>{rightLabel}</Text>
          </Pressable>
        ) : null)}
      </View>
    </View>
  );
}

function NavHeader({
  title,
  leftLabel,
  onLeft,
  rightLabel,
  onRight,
  rightElement,
}: Omit<NavyHeaderProps, 'mode'>) {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {leftLabel && onLeft ? (
          <Pressable
            onPress={onLeft}
            style={styles.action}
            accessibilityRole="button"
            accessibilityLabel={leftLabel}
          >
            <Text style={styles.actionText}>{leftLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.titleSpacer} />
      )}

      <View style={[styles.side, styles.sideRight]}>
        {rightElement ?? (rightLabel && onRight ? (
          <Pressable
            onPress={onRight}
            style={styles.action}
            accessibilityRole="button"
            accessibilityLabel={rightLabel}
          >
            <Text style={styles.actionText}>{rightLabel}</Text>
          </Pressable>
        ) : null)}
      </View>
    </View>
  );
}

export function NavyHeader({
  mode = 'nav',
  title,
  leftLabel,
  onLeft,
  rightLabel,
  onRight,
  rightElement,
}: NavyHeaderProps) {
  if (mode === 'brand') {
    return <BrandHeader rightLabel={rightLabel} onRight={onRight} rightElement={rightElement} />;
  }
  return (
    <NavHeader
      title={title}
      leftLabel={leftLabel}
      onLeft={onLeft}
      rightLabel={rightLabel}
      onRight={onRight}
      rightElement={rightElement}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  // Brand mode
  brandLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  brandText: {
    lineHeight: 20,
  },
  brandMain: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: '#FFFFFF',
  },
  brandIQ: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightMedium,
    color: 'rgba(255,255,255,0.65)',
  },
  brandRight: {
    alignItems: 'flex-end',
  },
  // Nav mode
  side: {
    width: 80,
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  action: {
    minHeight: 44,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: typography.sizeSm,
    color: '#FFFFFF',
    fontWeight: typography.weightMedium,
    opacity: 0.9,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    color: '#FFFFFF',
  },
  titleSpacer: {
    flex: 1,
  },
});

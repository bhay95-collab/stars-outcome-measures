import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography } from '../../theme/tokens';
import { LogoWordmark } from './LogoWordmark';
import { MeasureInstructionsButton } from './MeasureInstructionsButton';

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

function HeaderLogo({ title }: { title?: string }) {
  return (
    <View style={styles.headerLogo} pointerEvents="none">
      <View style={styles.headerLogoRow}>
        <Image source={squareLogo} style={styles.logo} resizeMode="contain" />
        <LogoWordmark size="sm" tone="light" />
      </View>
      {title ? (
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

function BrandHeader({
  rightLabel,
  onRight,
  rightElement,
}: Pick<NavyHeaderProps, 'rightLabel' | 'onRight' | 'rightElement'>) {
  return (
    <View style={styles.container}>
      <View style={styles.side} />
      <HeaderLogo />
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

function NavHeader({
  title,
  leftLabel,
  onLeft,
  rightLabel,
  onRight,
  rightElement,
}: Omit<NavyHeaderProps, 'mode'>) {
  const params = useLocalSearchParams<{ measureId?: string | string[] }>();
  const measureId = Array.isArray(params.measureId) ? params.measureId[0] : params.measureId;
  const inferredRightElement = measureId ? <MeasureInstructionsButton measureId={measureId} /> : null;
  const resolvedRightElement = rightElement ?? inferredRightElement;

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

      <HeaderLogo title={title} />

      <View style={[styles.side, styles.sideRight]}>
        {resolvedRightElement ?? (rightLabel && onRight ? (
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
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  headerLogo: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  logo: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  headerTitle: {
    width: '100%',
    marginTop: 2,
    textAlign: 'center',
    fontSize: typography.sizeXs,
    fontWeight: typography.weightMedium,
    color: 'rgba(255,255,255,0.72)',
  },
  side: {
    width: 88,
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  action: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: typography.size2xl,
    color: '#FFFFFF',
    fontWeight: typography.weightRegular,
    opacity: 0.9,
  },
});

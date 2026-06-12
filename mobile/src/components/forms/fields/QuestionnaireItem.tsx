import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../../theme/tokens';

interface QuestionnaireItemProps {
  /** Zero-based item index; displayed as index + 1. */
  index: number;
  text: string;
  scored: boolean;
  /** Draw a divider beneath this item (omit on the last item in a card). */
  showDivider?: boolean;
  /** Optional node shown at the end of the prompt row in place of the scored tick. */
  trailing?: React.ReactNode;
  /** The response control — e.g. a ScoreChipRow — rendered full width below the prompt. */
  children: React.ReactNode;
}

/**
 * One questionnaire question: numbered badge + prompt text + scored tick, with
 * its response control on a full-width row beneath. Centralises the spacing and
 * divider treatment so every measure reads identically.
 */
export function QuestionnaireItem({
  index,
  text,
  scored,
  showDivider = false,
  trailing,
  children,
}: QuestionnaireItemProps) {
  return (
    <View style={[styles.item, showDivider && styles.itemDivider]}>
      <View style={styles.header}>
        <View style={[styles.badge, scored && styles.badgeScored]}>
          <Text style={[styles.num, scored && styles.numScored]}>{index + 1}</Text>
        </View>
        <Text style={styles.text}>{text}</Text>
        {trailing !== undefined ? trailing : scored ? <Text style={styles.check}>✓</Text> : null}
      </View>
      <View style={styles.control}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { paddingVertical: spacing.md },
  itemDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeScored: { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
  num: { fontSize: typography.sizeXs, fontWeight: typography.weightBold, color: colors.muted },
  numScored: { color: colors.primary },
  text: { flex: 1, fontSize: typography.sizeSm, color: colors.ink, lineHeight: 20 },
  check: { fontSize: typography.sizeSm, color: colors.primary },
  control: { marginTop: spacing.sm },
});

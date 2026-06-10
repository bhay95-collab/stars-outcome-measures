import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  getMeasureInstructions,
  sharedSafety,
  type MeasureInstructionSection,
} from '../../clinical/measureInstructions';
import { colors, radii, spacing, typography } from '../../theme/tokens';

interface MeasureInstructionsButtonProps {
  measureId?: string | string[] | null;
}

function InstructionSection({ section }: { section: MeasureInstructionSection }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.body ? <Text style={styles.body}>{section.body}</Text> : null}
      {section.bullets?.map((bullet, index) => (
        <View key={`${section.title}-bullet-${index}`} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>-</Text>
          <Text style={styles.bulletText}>{bullet}</Text>
        </View>
      ))}
      {section.items?.map((item, index) => (
        <View key={`${section.title}-item-${index}`} style={styles.itemRow}>
          <Text style={styles.itemLabel}>{item.label}</Text>
          {item.detail ? <Text style={styles.itemDetail}>{item.detail}</Text> : null}
        </View>
      ))}
    </View>
  );
}

export function MeasureInstructionsButton({ measureId }: MeasureInstructionsButtonProps) {
  const [visible, setVisible] = useState(false);
  const instructions = getMeasureInstructions(measureId);

  if (!instructions) return null;

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        accessibilityRole="button"
        accessibilityLabel={`${instructions.title} instructions`}
      >
        <Text style={styles.triggerText}>Guide</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
          <View
            style={styles.sheet}
            accessibilityViewIsModal
            accessibilityLabel={`${instructions.title} instructions`}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.titleBlock}>
                <Text style={styles.kicker}>Outcome Measure Guide</Text>
                <Text style={styles.title}>{instructions.title}</Text>
                <Text style={styles.subtitle}>{instructions.subtitle}</Text>
              </View>
              <Pressable
                onPress={() => setVisible(false)}
                style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                accessibilityRole="button"
                accessibilityLabel="Close instructions"
              >
                <Text style={styles.closeText}>x</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator
            >
              {instructions.sections.map(section => (
                <InstructionSection key={section.title} section={section} />
              ))}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Clinical use</Text>
                {sharedSafety.map((bullet, index) => (
                  <View key={`shared-safety-${index}`} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>-</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 34,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerPressed: {
    opacity: 0.72,
  },
  triggerText: {
    color: '#FFFFFF',
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28,43,54,0.58)',
  },
  sheet: {
    maxHeight: '84%',
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    fontSize: typography.sizeXs,
    color: colors.primary,
    fontWeight: typography.weightBold,
    letterSpacing: typography.trackingWide,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: spacing.xs,
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.ink,
    lineHeight: 28,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeButtonPressed: {
    opacity: 0.65,
  },
  closeText: {
    fontSize: typography.sizeXl,
    lineHeight: 24,
    color: colors.primary,
    fontWeight: typography.weightRegular,
  },
  scroll: {
    backgroundColor: colors.surface,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.sizeMd,
    fontWeight: typography.weightBold,
    color: colors.ink,
  },
  body: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 12,
    color: colors.primary,
    fontSize: typography.sizeMd,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    color: colors.muted,
    fontSize: typography.sizeSm,
    lineHeight: 20,
  },
  itemRow: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  itemLabel: {
    color: colors.ink,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightBold,
  },
  itemDetail: {
    color: colors.muted,
    fontSize: typography.sizeSm,
    lineHeight: 20,
  },
});

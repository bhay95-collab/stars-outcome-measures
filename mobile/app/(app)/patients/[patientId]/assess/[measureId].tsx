import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MEASURES } from '../../../../../src/clinical/adapter';
import { Screen } from '../../../../../src/components/ui/Screen';
import { Card } from '../../../../../src/components/ui/Card';
import { colors, spacing, typography } from '../../../../../src/theme/tokens';

const HIMAT_ID = 'HiMAT';

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function AssessStubScreen() {
  const params = useLocalSearchParams<{ patientId: string; measureId: string }>();
  const measureId = Array.isArray(params.measureId) ? params.measureId[0] : params.measureId;

  const measure = MEASURES[measureId];

  return (
    <Screen>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      {measure ? (
        <>
          <Text style={styles.measureName}>{measure.name}</Text>
          <Text style={styles.measureCategory}>{capitalise(measure.category)}</Text>

          <Card style={styles.messageCard}>
            <Text style={styles.messageText}>
              {measureId === HIMAT_ID
                ? 'HiMAT is not yet available on mobile.'
                : 'Assessment form coming soon.'}
            </Text>
          </Card>
        </>
      ) : (
        <Card style={styles.messageCard}>
          <Text style={styles.messageText}>Measure not found.</Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.sizeSm,
    color: colors.primary,
    fontWeight: typography.weightMedium,
  },
  measureName: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  measureCategory: {
    fontSize: typography.sizeSm,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  messageCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  messageText: {
    fontSize: typography.sizeMd,
    color: colors.muted,
    textAlign: 'center',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MEASURES } from '../../../../../src/clinical/adapter';
import { Screen } from '../../../../../src/components/ui/Screen';
import { Card } from '../../../../../src/components/ui/Card';
import { NavyHeader } from '../../../../../src/components/ui/NavyHeader';
import { colors, spacing, typography } from '../../../../../src/theme/tokens';

const HIMAT_ID = 'HiMAT';

export default function AssessStubScreen() {
  const params = useLocalSearchParams<{ patientId: string; measureId: string }>();
  const measureId = Array.isArray(params.measureId) ? params.measureId[0] : params.measureId;

  const measure = MEASURES[measureId];

  return (
    <Screen padded={false}>
      <NavyHeader leftLabel="← Back" onLeft={() => router.back()} />
      <View style={styles.content}>
        {measure ? (
          <>
            <Text style={styles.measureName}>{measure.name}</Text>
            <Text style={styles.measureCategory}>{measure.category.toUpperCase()}</Text>
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
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.md,
  },
  measureName: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  measureCategory: {
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
    color: colors.muted,
    letterSpacing: 1,
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

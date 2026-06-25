import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { PurchasesPackage } from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/auth/AuthProvider';
import {
  getSubscriptionPackages,
  hasProEntitlement,
  isPurchaseCancellation,
  purchaseSubscription,
  restoreSubscriptions,
  syncAppStoreSubscription,
} from '../src/billing/revenuecat';
import { AccountSettingsSheet } from '../src/components/account/AccountSettingsSheet';
import { LogoWordmark } from '../src/components/ui/LogoWordmark';
import { LoadingState } from '../src/components/ui/LoadingState';
import { colors, radii, spacing, typography } from '../src/theme/tokens';

type PlanId = 'annual' | 'monthly';

export default function SubscribeScreen() {
  const insets = useSafeAreaInsets();
  const { session, user, isLoading } = useAuth();
  const [packages, setPackages] = useState<{
    monthly: PurchasesPackage | null;
    annual: PurchasesPackage | null;
  }>({ monthly: null, annual: null });
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual');
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [workingAction, setWorkingAction] = useState<'purchase' | 'restore' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);

  useEffect(() => {
    if (!user || Platform.OS !== 'ios') {
      setIsLoadingPlans(false);
      return;
    }

    let active = true;
    getSubscriptionPackages(user.id)
      .then(result => {
        if (active) setPackages(result);
      })
      .catch(() => {
        if (active) setError('App Store subscription options could not be loaded. Please try again.');
      })
      .finally(() => {
        if (active) setIsLoadingPlans(false);
      });

    return () => { active = false; };
  }, [user?.id]);

  const selectedPackage = packages[selectedPlan];
  const planRows = useMemo(() => ([
    {
      id: 'annual' as const,
      title: 'Annual',
      detail: 'Best value for ongoing clinical use',
      price: packages.annual?.product.priceString ?? null,
      period: 'per year',
      badge: 'Save compared with monthly',
    },
    {
      id: 'monthly' as const,
      title: 'Monthly',
      detail: 'Flexible month-to-month access',
      price: packages.monthly?.product.priceString ?? null,
      period: 'per month',
      badge: null,
    },
  ]), [packages]);

  if (isLoading) return <LoadingState label="Loading subscription options" />;
  if (!session || !user) return <Redirect href="/sign-in" />;

  const accessToken = session.access_token;

  async function finishEntitlement(customerInfo: Awaited<ReturnType<typeof restoreSubscriptions>>) {
    if (!hasProEntitlement(customerInfo)) {
      throw new Error('No active RehabMetrics IQ subscription was found for this Apple ID.');
    }
    await syncAppStoreSubscription(accessToken);
    router.replace('/(app)/patients');
  }

  async function handlePurchase() {
    if (!selectedPackage) {
      setError('This subscription option is not available yet. Please try again shortly.');
      return;
    }
    setWorkingAction('purchase');
    setError(null);
    try {
      const customerInfo = await purchaseSubscription(selectedPackage);
      await finishEntitlement(customerInfo);
    } catch (purchaseError) {
      if (!isPurchaseCancellation(purchaseError)) {
        setError(purchaseError instanceof Error
          ? purchaseError.message
          : 'The purchase could not be completed.');
      }
    } finally {
      setWorkingAction(null);
    }
  }

  async function handleRestore() {
    setWorkingAction('restore');
    setError(null);
    try {
      const customerInfo = await restoreSubscriptions();
      await finishEntitlement(customerInfo);
    } catch (restoreError) {
      setError(restoreError instanceof Error
        ? restoreError.message
        : 'Purchases could not be restored.');
    } finally {
      setWorkingAction(null);
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <LogoWordmark size="sm" tone="light" />
        <Pressable
          onPress={() => setSettingsVisible(true)}
          style={styles.accountButton}
          accessibilityRole="button"
          accessibilityLabel="Open account settings"
        >
          <Text style={styles.accountButtonText}>Account</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>CONTINUE YOUR ACCESS</Text>
          <Text style={styles.heading}>Keep your clinical workspace active.</Text>
          <Text style={styles.body}>
            Your patients and assessment history are ready when you return. Choose a plan or restore a previous App Store purchase.
          </Text>
        </View>

        {Platform.OS !== 'ios' ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Subscription required</Text>
            <Text style={styles.noticeText}>
              This account does not currently have an active trial or subscription.
            </Text>
          </View>
        ) : isLoadingPlans ? (
          <LoadingState label="Loading App Store prices" />
        ) : (
          <>
            <View style={styles.planList} accessibilityRole="radiogroup" accessibilityLabel="Subscription plan">
              {planRows.map(plan => {
                const selected = selectedPlan === plan.id;
                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => setSelectedPlan(plan.id)}
                    style={({ pressed }) => [
                      styles.planRow,
                      selected && styles.planRowSelected,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={plan.price ? `${plan.title}, ${plan.price} ${plan.period}` : plan.title}
                  >
                    <View style={styles.radioOuter}>
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <View style={styles.planCopy}>
                      <View style={styles.planTitleRow}>
                        <Text style={styles.planTitle}>{plan.title}</Text>
                        {plan.badge ? <Text style={styles.badge}>{plan.badge}</Text> : null}
                      </View>
                      <Text style={styles.planDetail}>{plan.detail}</Text>
                    </View>
                    <View style={styles.priceCopy}>
                      {plan.price ? <Text style={styles.price}>{plan.price}</Text> : null}
                      <Text style={styles.period}>{plan.period}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}

            <Pressable
              onPress={handlePurchase}
              disabled={workingAction !== null}
              style={({ pressed }) => [
                styles.primaryButton,
                (pressed || workingAction !== null) && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Subscribe with ${selectedPlan} plan`}
            >
              <Text style={styles.primaryButtonText}>
                {workingAction === 'purchase' ? 'Completing purchase...' : `Subscribe ${selectedPlan === 'annual' ? 'annually' : 'monthly'}`}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleRestore}
              disabled={workingAction !== null}
              style={styles.restoreButton}
              accessibilityRole="button"
              accessibilityLabel="Restore purchases"
            >
              <Text style={styles.restoreText}>
                {workingAction === 'restore' ? 'Restoring purchases...' : 'Restore purchases'}
              </Text>
            </Pressable>

            <Text style={styles.renewal}>
              Payment is charged to your Apple ID. The subscription renews automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel it in App Store account settings.
            </Text>
            <View style={styles.legalRow}>
              <Text
                style={styles.legalLink}
                onPress={() => WebBrowser.openBrowserAsync('https://www.rehabmetricsiq.com/terms')}
              >
                Terms of Service
              </Text>
              <Text style={styles.legalSeparator}>•</Text>
              <Text
                style={styles.legalLink}
                onPress={() => WebBrowser.openBrowserAsync('https://www.rehabmetricsiq.com/privacy')}
              >
                Privacy Policy
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <AccountSettingsSheet
        visible={settingsVisible}
        avatarUrl={user.user_metadata?.avatar_url ?? null}
        onDismiss={() => setSettingsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
  },
  header: {
    minHeight: 68,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  accountButtonText: {
    color: colors.surface,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  intro: {
    gap: spacing.sm,
    maxWidth: 620,
  },
  eyebrow: {
    color: colors.actionBlue,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightBold,
    letterSpacing: typography.trackingWide,
  },
  heading: {
    color: colors.ink,
    fontSize: typography.size2xl,
    fontWeight: typography.weightBold,
    lineHeight: 35,
  },
  body: {
    color: colors.muted,
    fontSize: typography.sizeMd,
    lineHeight: 23,
  },
  planList: {
    gap: spacing.sm,
  },
  planRow: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.md,
  },
  planRowSelected: {
    borderColor: colors.actionBlue,
    backgroundColor: colors.primarySoft,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.actionBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.actionBlue,
  },
  planCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  planTitle: {
    color: colors.ink,
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
  },
  badge: {
    color: colors.success,
    fontSize: typography.sizeXs,
    fontWeight: typography.weightSemibold,
  },
  planDetail: {
    color: colors.muted,
    fontSize: typography.sizeSm,
  },
  priceCopy: {
    alignItems: 'flex-end',
  },
  price: {
    color: colors.ink,
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
  },
  period: {
    color: colors.muted,
    fontSize: typography.sizeXs,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: radii.button,
    backgroundColor: colors.actionBlue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
  },
  restoreButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreText: {
    color: colors.actionBlue,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
  },
  renewal: {
    color: colors.muted,
    fontSize: typography.sizeXs,
    lineHeight: 18,
    textAlign: 'center',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  legalLink: {
    color: colors.actionBlue,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightMedium,
  },
  legalSeparator: {
    color: colors.subtle,
  },
  notice: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  noticeTitle: {
    color: colors.ink,
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
  },
  noticeText: {
    color: colors.muted,
    fontSize: typography.sizeMd,
    lineHeight: 22,
  },
  error: {
    color: colors.coral,
    fontSize: typography.sizeSm,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.68,
  },
});

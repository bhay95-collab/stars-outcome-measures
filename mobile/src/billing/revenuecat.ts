import { Platform } from 'react-native';
import Purchases, {
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import { apiRequest } from '../api/client';

export const REVENUECAT_ENTITLEMENT_ID = 'pro';
export const MONTHLY_PRODUCT_ID = 'com.rehabmetricsiq.app.subscription.pro.monthly';
export const ANNUAL_PRODUCT_ID = 'com.rehabmetricsiq.app.subscription.pro.annual';

let configured = false;
let identifiedUserId: string | null = null;

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  if (!key) throw new Error('App Store purchases are not configured.');
  return key;
}

export async function identifyPurchasesUser(userId: string): Promise<void> {
  if (Platform.OS !== 'ios') return;

  if (!configured) {
    Purchases.configure({ apiKey: getApiKey(), appUserID: userId });
    configured = true;
    identifiedUserId = userId;
    return;
  }

  if (identifiedUserId !== userId) {
    await Purchases.logIn(userId);
    identifiedUserId = userId;
  }
}

export async function logOutPurchases(): Promise<void> {
  if (Platform.OS !== 'ios' || !configured || !identifiedUserId) return;
  try {
    await Purchases.logOut();
  } finally {
    identifiedUserId = null;
  }
}

export async function getSubscriptionPackages(userId: string): Promise<{
  monthly: PurchasesPackage | null;
  annual: PurchasesPackage | null;
}> {
  await identifyPurchasesUser(userId);
  const offerings = await Purchases.getOfferings();
  const packages = offerings.current?.availablePackages ?? [];

  return {
    monthly: packages.find(item =>
      item.product.identifier === MONTHLY_PRODUCT_ID
      || item.packageType === PACKAGE_TYPE.MONTHLY,
    ) ?? null,
    annual: packages.find(item =>
      item.product.identifier === ANNUAL_PRODUCT_ID
      || item.packageType === PACKAGE_TYPE.ANNUAL,
    ) ?? null,
  };
}

export function hasProEntitlement(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]?.isActive === true;
}

export async function purchaseSubscription(aPackage: PurchasesPackage): Promise<CustomerInfo> {
  const result = await Purchases.purchasePackage(aPackage);
  return result.customerInfo;
}

export async function restoreSubscriptions(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export function isPurchaseCancellation(error: unknown): boolean {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';
  return code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

export async function syncAppStoreSubscription(accessToken: string): Promise<void> {
  await apiRequest('/api/subscriptions/revenuecat-sync', {
    method: 'POST',
    accessToken,
  });
}

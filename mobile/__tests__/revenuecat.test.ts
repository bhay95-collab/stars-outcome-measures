import { Platform } from 'react-native';
import Purchases, { PACKAGE_TYPE } from 'react-native-purchases';
import { apiRequest } from '../src/api/client';
import {
  ANNUAL_PRODUCT_ID,
  getSubscriptionPackages,
  hasProEntitlement,
  MONTHLY_PRODUCT_ID,
  purchaseSubscription,
  restoreSubscriptions,
  syncAppStoreSubscription,
} from '../src/billing/revenuecat';

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
  },
  PACKAGE_TYPE: {
    MONTHLY: 'MONTHLY',
    ANNUAL: 'ANNUAL',
  },
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: '1',
  },
}))
jest.mock('../src/api/client', () => ({
  apiRequest: jest.fn(),
}))

describe('RevenueCat mobile billing', () => {
  const monthlyPackage = {
    packageType: PACKAGE_TYPE.MONTHLY,
    product: { identifier: MONTHLY_PRODUCT_ID, priceString: 'A$29.00' },
  }
  const annualPackage = {
    packageType: PACKAGE_TYPE.ANNUAL,
    product: { identifier: ANNUAL_PRODUCT_ID, priceString: 'A$250.00' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' })
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = 'appl_test'
    ;(Purchases.getOfferings as jest.Mock).mockResolvedValue({
      current: { availablePackages: [annualPackage, monthlyPackage] },
    })
  })

  it('uses the active App Store Connect product identifiers', () => {
    expect(MONTHLY_PRODUCT_ID).toBe('com.rehabmetricsiq.app.subscription.pro.monthly')
    expect(ANNUAL_PRODUCT_ID).toBe('com.rehabmetricsiq.app.subscription.pro.annual')
  })

  it('maps the configured monthly and annual packages by product identifier', async () => {
    const result = await getSubscriptionPackages('user-1')

    expect(Purchases.configure).toHaveBeenCalledWith({
      apiKey: 'appl_test',
      appUserID: 'user-1',
    })
    expect(result).toEqual({
      monthly: monthlyPackage,
      annual: annualPackage,
    })
  })

  it('returns customer info for purchase and restore operations', async () => {
    const customerInfo = {
      entitlements: {
        active: {
          pro: { isActive: true },
        },
      },
    }
    ;(Purchases.purchasePackage as jest.Mock).mockResolvedValue({ customerInfo })
    ;(Purchases.restorePurchases as jest.Mock).mockResolvedValue(customerInfo)

    await expect(purchaseSubscription(annualPackage as never)).resolves.toBe(customerInfo)
    await expect(restoreSubscriptions()).resolves.toBe(customerInfo)
    expect(hasProEntitlement(customerInfo as never)).toBe(true)
  })

  it('asks the server to verify the App Store entitlement after purchase', async () => {
    ;(apiRequest as jest.Mock).mockResolvedValue({ ok: true })

    await syncAppStoreSubscription('access-token')

    expect(apiRequest).toHaveBeenCalledWith('/api/subscriptions/revenuecat-sync', {
      method: 'POST',
      accessToken: 'access-token',
    })
  })
})

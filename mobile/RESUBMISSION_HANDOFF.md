# RehabMetrics IQ App Store Resubmission Handoff

Updated: July 18, 2026

This is the step-by-step runbook for completing the Apple resubmission work. Follow it in order. Do not create the final App Store build until the Apple, RevenueCat, Supabase, Vercel, and EAS configuration sections are complete.

## Current State

Already completed:

- [x] App changes for native Sign in with Apple
- [x] Native email account creation
- [x] RevenueCat purchase and restore integration
- [x] Combined trial, Stripe, and App Store access checks
- [x] In-app account deletion and Apple token revocation support
- [x] Supabase migration `20260610090000_add_app_store_subscriptions.sql`
- [x] iOS bundle identifier and Sign in with Apple Expo configuration
- [x] EAS project and App Store Connect application identifiers
- [x] RevenueCat account created
- [x] `useMountedRef` hook — all 26 form components + PatientEditSheet guarded against post-unmount setState
- [x] Supabase session migrated from AsyncStorage to `LargeSecureStore` (iOS Keychain, chunked JWTs)
- [x] Subscription screen prices — hardcoded AUD fallbacks removed; prices come from StoreKit only
- [x] App Privacy configured: Purchases → Used for App Functionality + Linked to User Identity (RevenueCat)
- [x] App description updated: ISNCSCI removed (web-only), AUD prices removed, auto-renewal disclosure added
- [x] `legacy-peer-deps=true` in `.npmrc` — resolves duplicate react-native EAS Metro bundling failure
- [x] Production build 19 created and uploaded to App Store Connect
- [x] Apple org account conversion (Guideline 5.1.1(ix)) — confirmed by Ben, account now enrolled as an organization
- [x] Guideline 1.4.1 citations — all 40 mobile-supported measures cite a source (`mobile/src/clinical/measureInstructions.ts`, commit `ce3420c`); `/clinical-use` web page brought to matching coverage (44 of 45 registry measures — BIVI intentionally omitted pending a verified peer-reviewed source, see commit 13fe37a)
- [x] Production build 21 created and uploaded to App Store Connect (commit `10d0306`, includes the citations fix)
- [x] Production build 22 created and uploaded to App Store Connect (commit `332f52a`, includes the `/clinical-use` web citation fix; Apple Team confirmed as "Benjamin Robert Hay (Company/Organization)" in the build credentials output, corroborating the org account conversion)
- [x] Build 22 submitted for App Review on July 18, 2026, addressing Guideline 1.4.1, 5.1.1(ix), and 3.1.2(c) from rejection `a2cda48f-32c3-4135-b255-b087f9e63617`. Reply text used is recorded in `APP_STORE_RESUBMISSION.md`.

Still required:

- [ ] Await Apple's review decision on the build 22 submission.
- [ ] If accepted: complete any outstanding physical-device/TestFlight QA (Phase 13), screenshots (Phase 14), and subscription attachment (Phase 16) that weren't finished before this submission.
- [ ] If rejected again: address the new findings and repeat the build → submit cycle.

## Permanent Identifiers

Use these values exactly. Product identifiers cannot be reused after creation, even if a product is deleted.

| Item | Value |
| --- | --- |
| App name | `RehabMetrics IQ` |
| Bundle ID | `com.rehabmetricsiq.app` |
| Apple Team ID | `U3KB3BY59J` |
| App Store Connect app ID | `6774467740` |
| Expo owner | `benhay95` |
| Expo project slug | `rehabmetrics-iq` |
| Expo project ID | `7012551f-e4e4-4c63-8657-c3e51880c233` |
| App version | `1.0` |
| Minimum build | `19` |
| RevenueCat entitlement | `pro` |
| RevenueCat offering | `default` |
| Subscription group | `RehabMetrics IQ Pro` |
| Monthly product | `com.rehabmetricsiq.app.subscription.pro.monthly` |
| Annual product | `com.rehabmetricsiq.app.subscription.pro.annual` |
| Production API URL | `https://www.rehabmetricsiq.com` |
| RevenueCat webhook URL | `https://www.rehabmetricsiq.com/api/webhooks/revenuecat` |

## Credential Safety

You will encounter three different Apple `.p8` private keys. Keep them clearly named because they are not interchangeable.

| Key | Created in | Used in |
| --- | --- | --- |
| Sign in with Apple private key | Apple Developer, Certificates, Identifiers & Profiles | Vercel `APPLE_PRIVATE_KEY` |
| In-App Purchase key | App Store Connect, Users and Access, Integrations | RevenueCat Apple app settings |
| App Store Connect API key | App Store Connect, Users and Access, Integrations | RevenueCat Apple app settings |

For every `.p8` key:

- Download it immediately. Apple generally permits only one download.
- Store it in a password manager or encrypted secure storage.
- Record its Key ID beside the file.
- Never add it to this repository.
- Never put it in an `EXPO_PUBLIC_` variable.
- Revoke and replace it immediately if it is exposed.

## Phase 1: Check Apple Business Setup

RevenueCat and StoreKit product testing can fail when Apple business setup is incomplete.

1. Open [App Store Connect](https://appstoreconnect.apple.com/).
2. Open **Business**.
3. Open **Agreements**.
4. Confirm the latest **Paid Applications Agreement** is active.
5. Open **Tax** and complete every required form.
6. Open **Banking** and confirm the bank account status is clear or active.
7. Resolve any banner requesting updated business or compliance information.

Do not continue until:

- [ ] The Paid Applications Agreement is active
- [ ] Tax information is complete
- [ ] Banking information is accepted

Official reference: [RevenueCat iOS product setup](https://www.revenuecat.com/docs/getting-started/entitlements/ios-products)

## Phase 2: Create the App Store Subscriptions

### 2.1 Create the subscription group

1. In App Store Connect, open **My Apps**.
2. Select **RehabMetrics IQ**.
3. In the sidebar under **Monetization**, select **Subscriptions**.
4. Click the add button beside Subscription Groups.
5. Enter the reference name:

```text
RehabMetrics IQ Pro
```

6. Click **Create**.
7. Open the group and add an English (Australia) localization.
8. Use this group display name:

```text
RehabMetrics IQ Pro
```

9. Select `RehabMetrics IQ` as the app name when prompted.

### 2.2 Create the monthly subscription

Inside the `RehabMetrics IQ Pro` subscription group:

1. Click the add button to create a subscription.
2. Enter the reference name:

```text
RehabMetrics IQ Pro Monthly
```

3. Enter this Product ID exactly:

```text
com.rehabmetricsiq.app.subscription.pro.monthly
```

4. Set the duration to **1 Month**.
5. Add English (Australia) localization:

```text
Display name: RehabMetrics IQ Pro
Description: Full access to RehabMetrics IQ clinical tools and patient outcome measures.
```

6. Set availability to every country or region where the app will be available.
7. Set the Australian price to the nearest available Apple price point to **A$29 per month**.
8. Allow Apple to calculate equivalent prices for other storefronts unless there is a specific business reason to override them.
9. Leave introductory offers and free trials empty.
10. Leave Family Sharing off unless you intentionally want one Apple family to share a clinical subscription.
11. Use the app's default tax category unless your accountant has provided a different classification.
12. Save the subscription.

### 2.3 Create the annual subscription

Inside the same subscription group:

1. Click the add button to create another subscription.
2. Enter the reference name:

```text
RehabMetrics IQ Pro Annual
```

3. Enter this Product ID exactly:

```text
com.rehabmetricsiq.app.subscription.pro.annual
```

4. Set the duration to **1 Year**.
5. Use the same English (Australia) localization:

```text
Display name: RehabMetrics IQ Pro
Description: Full access to RehabMetrics IQ clinical tools and patient outcome measures.
```

6. Set the Australian price to the nearest available Apple price point to **A$250 per year**.
7. Set the same country and region availability as the monthly product.
8. Leave introductory offers and free trials empty.
9. Save the subscription.

### 2.4 Set both products to the same subscription level

The monthly and annual subscriptions provide identical access. They differ only in duration and price.

1. Open the subscription group's level arrangement.
2. Place both subscriptions at the same level.
3. Save the arrangement.

### 2.5 Understand the temporary status

The subscriptions may show **Missing Metadata** until the review screenshot and all required fields are supplied. That is expected at this stage.

Do not continue until:

- [ ] The group is named `RehabMetrics IQ Pro`
- [ ] The monthly Product ID is exact
- [ ] The annual Product ID is exact
- [ ] Both products have duration, price, localization, and availability
- [ ] Both products are at the same subscription level
- [ ] Neither product has an App Store introductory trial

Official references:

- [Offer auto-renewable subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions)
- [RevenueCat iOS product setup](https://www.revenuecat.com/docs/getting-started/entitlements/ios-products)

## Phase 3: Configure Sign in with Apple

The app uses native Apple authentication. Supabase receives the Apple identity token directly. A Services ID and six-month Supabase OAuth secret are not required for this native-only implementation.

The server still needs a Sign in with Apple private key so it can revoke Apple authorization when an Apple user deletes their account.

### 3.1 Enable the capability on the App ID

1. Open [Apple Developer Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list).
2. Select **Identifiers**.
3. Filter for App IDs.
4. Open `com.rehabmetricsiq.app`.
5. Confirm **Sign in with Apple** is enabled.
6. If Apple shows configuration options, make this the primary App ID.
7. Save the App ID.

### 3.2 Create the Sign in with Apple private key

1. In Certificates, Identifiers & Profiles, open **Keys**.
2. Click the add button.
3. Name the key:

```text
RehabMetrics IQ Sign in with Apple
```

4. Enable **Sign in with Apple**.
5. Click **Configure** beside Sign in with Apple.
6. Select the primary App ID `com.rehabmetricsiq.app`.
7. Register the key.
8. Record the displayed Key ID.
9. Download the `.p8` file immediately.
10. Store it securely with a name that identifies it as the Sign in with Apple key.

Record these values in your secure credential record:

```text
APPLE_TEAM_ID=U3KB3BY59J
APPLE_KEY_ID=<Sign in with Apple Key ID>
APPLE_CLIENT_ID=com.rehabmetricsiq.app
APPLE_PRIVATE_KEY=<complete contents of the Sign in with Apple .p8 file>
```

Do not upload this key to RevenueCat. It belongs in Vercel later.

### 3.3 Configure Apple private email relay

This is required if RehabMetrics IQ sends email to users who selected **Hide My Email**.

1. In Apple Developer, open **Certificates, Identifiers & Profiles**.
2. Open **More**, **Services**, or the private email relay configuration shown for Sign in with Apple.
3. Register the production sending domain used by your email provider.
4. Register the exact sender address or addresses used by RehabMetrics IQ.
5. Confirm the domain's SPF and DKIM records are valid in the email provider.

Use the real Resend sending domain and sender configured for the production website. Do not enter a placeholder domain.

Official references:

- [Create a Sign in with Apple private key](https://developer.apple.com/help/account/capabilities/create-a-sign-in-with-apple-private-key)
- [Configure private email relay](https://developer.apple.com/help/account/capabilities/configure-private-email-relay-service)
- [Supabase Login with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)

## Phase 4: Enable Apple in Supabase

1. Open the [Supabase dashboard](https://supabase.com/dashboard/).
2. Select the production RehabMetrics IQ project.
3. Open **Authentication**.
4. Open **Providers** or **Sign In / Providers**.
5. Open **Apple**.
6. Enable the Apple provider.
7. Add this value to **Client IDs**:

```text
com.rehabmetricsiq.app
```

8. Save the provider.

For this native implementation:

- Do not create a Services ID solely for the iOS app.
- Do not configure web OAuth settings solely for the iOS app.
- Do not use `host.exp.Exponent` for the production build.
- Add another Client ID only if a future development build uses a different bundle identifier.

### 4.1 Verify redirect URLs

In Supabase:

1. Open **Authentication**.
2. Open **URL Configuration**.
3. Confirm the redirect allow list includes:

```text
rehabmetricsiq://auth/callback
rehabmetricsiq://sign-in?verified=1
```

The first URL is used by mobile Google authentication. The second is used by mobile email verification.

Do not continue until:

- [ ] Apple is enabled in Supabase
- [ ] `com.rehabmetricsiq.app` is in Apple Client IDs
- [ ] Both mobile redirect URLs are allowed

## Phase 5: Create Apple Commerce Keys for RevenueCat

These keys are created in App Store Connect, not the Apple Developer Keys page.

### 5.1 Create the In-App Purchase key

This key is required by the installed RevenueCat React Native SDK.

1. Open [App Store Connect](https://appstoreconnect.apple.com/).
2. Open **Users and Access**.
3. Open **Integrations**.
4. Open **In-App Purchase**.
5. Select **Generate In-App Purchase Key** or click the add button under active keys.
6. Name it:

```text
RevenueCat In-App Purchase
```

7. Generate the key.
8. Record the Key ID.
9. Record the Issuer ID shown on the page.
10. Download the `.p8` file immediately.
11. Store it securely as the In-App Purchase key.

### 5.2 Create the App Store Connect API key

This key lets RevenueCat import products and pricing directly from App Store Connect.

1. Stay in **Users and Access**, **Integrations**.
2. Open **App Store Connect API**.
3. Create a team API key.
4. Name it:

```text
RevenueCat App Store Connect
```

5. Give it the **App Manager** role.
6. Generate the key.
7. Record its Key ID and the Issuer ID.
8. Download its `.p8` file immediately.
9. Open **Payments and Financial Reports** and record the Vendor Number displayed near the top of the page.

Do not continue until:

- [ ] The In-App Purchase `.p8`, Key ID, and Issuer ID are stored securely
- [ ] The App Store Connect API `.p8`, Key ID, Issuer ID, and Vendor Number are stored securely

Official references:

- [RevenueCat In-App Purchase key configuration](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration)
- [RevenueCat App Store Connect API key configuration](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/app-store-connect-api-key-configuration)

## Phase 6: Configure RevenueCat

Open the [RevenueCat dashboard](https://app.revenuecat.com/).

### 6.1 Create or select the project

1. Create a project named `RehabMetrics IQ`, or open the project created during account setup.
2. Do not use RevenueCat Test Store products for the production App Store build.

### 6.2 Add the Apple App Store app

1. In the project sidebar, open **Apps**.
2. Add an app.
3. Select **Apple App Store**.
4. Enter:

```text
App name: RehabMetrics IQ
Bundle ID: com.rehabmetricsiq.app
```

5. Save the app.

### 6.3 Upload the In-App Purchase key

1. Open the newly created Apple app in RevenueCat.
2. Open **In-app purchase key configuration**.
3. Upload the In-App Purchase `.p8` created in Phase 5.1.
4. Enter that key's Key ID.
5. Enter the App Store Connect Issuer ID.
6. Save.
7. Run RevenueCat's credential validation.
8. Confirm RevenueCat reports valid credentials.

### 6.4 Upload the App Store Connect API key

1. In the same RevenueCat app, open **App Store Connect API**.
2. Upload the App Store Connect API `.p8` created in Phase 5.2.
3. Enter its Key ID.
4. Enter the Issuer ID.
5. Enter the Vendor Number.
6. Save.
7. Confirm RevenueCat reports valid credentials.

### 6.5 Import the App Store products

Apple may take up to an hour to make new product metadata available in sandbox and external services.

1. In RevenueCat, open **Product catalog**, then **Products**.
2. Select the Apple App Store tab.
3. Click **Import products**.
4. Import:

```text
com.rehabmetricsiq.app.subscription.pro.monthly
com.rehabmetricsiq.app.subscription.pro.annual
```

5. If import is temporarily empty, wait up to one hour, confirm the Apple credentials are valid, and try again.
6. Do not create production substitutes in RevenueCat Test Store.

### 6.6 Create the entitlement

1. Open **Product catalog**, then **Entitlements**.
2. Create an entitlement.
3. Enter this identifier exactly:

```text
pro
```

4. Use the description:

```text
Full RehabMetrics IQ clinical workspace access
```

5. Attach both Apple products to the `pro` entitlement.
6. Save.

### 6.7 Create the offering and packages

1. Open **Product catalog**, then **Offerings**.
2. Create an offering with this identifier:

```text
default
```

3. Add a monthly package.
4. Attach `com.rehabmetricsiq.app.subscription.pro.monthly` to the monthly package.
5. Add an annual package.
6. Attach `com.rehabmetricsiq.app.subscription.pro.annual` to the annual package.
7. Make `default` the current offering.
8. Confirm both packages appear under the offering.

The app accepts either the product identifier or RevenueCat's standard monthly and annual package type, but the exact product attachment must still be correct.

### 6.8 Set purchase transfer behavior

1. Open **Project settings**.
2. Open **General**.
3. Find **Restore behavior** or **Transfer behavior**.
4. Select:

```text
Transfer to new App User ID
```

5. Save.

This permits a legitimate restore after reinstall or account recovery while limiting one identified RehabMetrics IQ account at a time to the Apple purchase.

### 6.9 Obtain the iOS public SDK key

1. Open **Project settings**, then **API keys**, or open the Apple app's settings.
2. Find the Apple platform-specific public SDK key.
3. Confirm it belongs to the Apple app and normally begins with `appl_`.
4. Store it as:

```text
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=<Apple public SDK key>
```

Do not use:

- A RevenueCat Test Store key
- A RevenueCat secret key
- An Android public key

### 6.10 Create the RevenueCat server secret key

1. Open **Project settings**, then **API keys**.
2. Under secret API keys, click **New secret API key**.
3. Name it:

```text
RehabMetrics IQ Vercel
```

4. Give it access to read customer and subscription status. If the dashboard offers only project-wide server access, use that option.
5. Create and securely store the key. It should begin with `sk_`.
6. This value will become:

```text
REVENUECAT_SECRET_API_KEY=<RevenueCat secret key>
```

Never put this key in the mobile app or an `EXPO_PUBLIC_` variable.

Official references:

- [Connect Apps and Web Providers](https://www.revenuecat.com/docs/projects/connect-a-store)
- [Configure products, entitlements, and offerings](https://www.revenuecat.com/docs/projects/configuring-products)
- [RevenueCat API keys](https://www.revenuecat.com/docs/projects/authentication)
- [RevenueCat restore behavior](https://www.revenuecat.com/docs/projects/restore-behavior)

## Phase 7: Configure RevenueCat Webhooks

The server-side subscription row must be updated after renewals, cancellations, billing failures, transfers, and expiration. The app's combined access checks rely on this row.

RevenueCat currently documents webhooks as a Pro integration. If the dashboard asks you to enable or upgrade to Pro, complete that step before resubmission.

### 7.1 Generate the webhook authorization value

Run this command locally:

```sh
openssl rand -hex 32
```

Take the generated value and prefix it with `Bearer `.

The final value must have this form:

```text
Bearer <generated 64-character value>
```

Store the complete value securely. The identical complete value must be entered in RevenueCat and Vercel.

### 7.2 Add the webhook in RevenueCat

1. In RevenueCat, open **Integrations**.
2. Select **Webhooks**.
3. Select **Add new configuration**.
4. Name it:

```text
RehabMetrics IQ Production
```

5. Set the URL:

```text
https://www.rehabmetricsiq.com/api/webhooks/revenuecat
```

6. Set the Authorization header to the complete `Bearer` value from Phase 7.1.
7. Select both production and sandbox events.
8. Select the RehabMetrics IQ Apple app, or all apps if that is the only app in the project.
9. Send all subscription lifecycle event types.
10. Save.

### 7.3 Configure Apple server notifications to RevenueCat

1. Open the Apple app in RevenueCat.
2. Find **Apple Server to Server notification settings**.
3. Prefer RevenueCat's **Apply in App Store Connect** action.
4. If applying manually, copy RevenueCat's complete Apple Server Notification URL.
5. In App Store Connect, open **My Apps**, **RehabMetrics IQ**, **App Information**.
6. Find **App Store Server Notifications**.
7. Paste the RevenueCat URL into both the production and sandbox URL fields.
8. Select Version 2 notifications.
9. Save.

Do not enter the RehabMetrics IQ Vercel webhook URL into Apple's server notification fields. Apple notifies RevenueCat; RevenueCat then notifies the RehabMetrics IQ webhook.

Official references:

- [RevenueCat webhooks](https://www.revenuecat.com/docs/integrations/webhooks)
- [Apple server notifications with RevenueCat](https://www.revenuecat.com/docs/platform-resources/server-notifications/apple-server-notifications)

## Phase 8: Configure Vercel and Deploy the Server

Select the Vercel project whose production domain is `www.rehabmetricsiq.com`.

### 8.1 Add the new production variables

1. Open the project in [Vercel](https://vercel.com/dashboard).
2. Open **Settings**.
3. Open **Environment Variables**.
4. Add each variable below to **Production**.
5. Also add them to **Preview** if preview deployments will be used for testing.

```text
REVENUECAT_SECRET_API_KEY=<RevenueCat sk_ server key>
REVENUECAT_WEBHOOK_AUTHORIZATION=<complete Bearer webhook value>
APPLE_TEAM_ID=U3KB3BY59J
APPLE_KEY_ID=<Sign in with Apple Key ID>
APPLE_CLIENT_ID=com.rehabmetricsiq.app
APPLE_PRIVATE_KEY=<complete Sign in with Apple private key>
```

For `APPLE_PRIVATE_KEY`, either paste the complete multiline `.p8` value or store it as one line with literal `\n` between the original lines. The server supports both formats.

Confirm these existing server variables are still present:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
STRIPE_SECRET_KEY
RESEND_API_KEY
FOLLOWUP_EMAIL_FROM
```

Do not replace the existing Supabase or Stripe values.

### 8.2 Deploy the current code

The resubmission implementation is currently in the local working tree. It must be committed and pushed before Vercel can deploy it through the connected Git repository.

Before committing:

```sh
git status --short
git diff --check
```

Review the changed and untracked files in the IDE Source Control view. Stage the resubmission implementation and this handoff. Do not stage unrelated personal files.

Commit with a clear message such as:

```text
Implement App Store authentication billing and account deletion
```

Push the `main` branch to `origin`, then watch the Vercel deployment until it reports **Ready**.

Environment-variable changes apply only to a new deployment. If Vercel did not deploy after the variables were added, manually redeploy the latest production deployment.

### 8.3 Verify the deployed routes

Open these pages in a browser:

```text
https://www.rehabmetricsiq.com/privacy
https://www.rehabmetricsiq.com/terms
https://www.rehabmetricsiq.com/data-deletion
```

Confirm the revised Apple, RevenueCat, Apple billing, and in-app deletion text is live.

Run:

```sh
curl -i https://www.rehabmetricsiq.com/api/subscriptions/revenuecat-sync
curl -i https://www.rehabmetricsiq.com/api/webhooks/revenuecat
```

Both routes should return HTTP `405` for a GET request. That confirms the new API routes are deployed.

In RevenueCat, send a test webhook. Confirm:

- [ ] RevenueCat reports HTTP `200`
- [ ] The webhook configuration shows successful delivery
- [ ] Vercel logs do not show `Invalid webhook authorization`
- [ ] Vercel logs do not show missing RevenueCat credentials

Official reference: [Vercel environment variables](https://vercel.com/docs/environment-variables)

## Phase 9: Configure EAS Environment Variables

The production build must contain the Apple app's RevenueCat public SDK key. A local `.env.local` file is not automatically uploaded to EAS.

Open the [Expo project](https://expo.dev/accounts/benhay95/projects/rehabmetrics-iq), then open **Environment variables**.

### 9.1 Production environment

Add or verify these values in the EAS **production** environment:

```text
EXPO_PUBLIC_SUPABASE_URL=<production Supabase URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<production Supabase anon key>
EXPO_PUBLIC_API_URL=https://www.rehabmetricsiq.com
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=<RevenueCat Apple public SDK key>
EXPO_PUBLIC_SENTRY_DSN=<existing mobile Sentry DSN>
```

### 9.2 Preview environment

Add the same values to the EAS **preview** environment if an internal preview build will be used.

### 9.3 Visibility

The `EXPO_PUBLIC_` values are embedded in the application bundle and are public by design. Plain text or sensitive dashboard visibility is acceptable, but neither option turns them into server secrets.

Never add these to EAS:

```text
SUPABASE_SERVICE_ROLE_KEY
REVENUECAT_SECRET_API_KEY
REVENUECAT_WEBHOOK_AUTHORIZATION
APPLE_PRIVATE_KEY
STRIPE_SECRET_KEY
```

Verify the EAS variables:

```sh
cd mobile
eas env:list --environment production
eas env:list --environment preview
```

Do not continue until the production environment includes the Apple platform-specific RevenueCat public key.

Official reference: [EAS environment variables](https://docs.expo.dev/eas/environment-variables/)

## Phase 10: Complete Automated Validation

Run these commands before spending an EAS production build:

```sh
cd /Users/benjaminhay/stars-outcome-measures
npm test -- --runInBand
npm run build
cd mobile
npm ci --include=dev
npm run typecheck
npm run test:app
npm run test:clinical
npm run expo:config
npx expo-doctor
cd ..
git diff --check
```

Required result:

- [ ] Root tests pass
- [ ] Next.js production build passes
- [ ] Mobile type checking passes
- [ ] Mobile app tests pass
- [ ] Clinical tests pass
- [ ] Expo config shows `usesAppleSignIn: true`
- [ ] Expo config shows bundle ID `com.rehabmetricsiq.app`
- [ ] Expo Doctor passes
- [ ] `git diff --check` prints no errors

If `npm ci --include=dev` changes `mobile/package-lock.json`, stop and inspect the change before building.

## Phase 11: Create Test Accounts

Keep the two kinds of test identity separate:

- The RehabMetrics IQ login identifies the Supabase and RevenueCat App User ID.
- The Sandbox Apple Account identifies the App Store purchaser.

They do not need to use the same email address.

### 11.1 Create a Sandbox Apple Account

1. In App Store Connect, open **Users and Access**.
2. Open **Sandbox**.
3. Create a test account.
4. Use an email address that has never been used as an Apple Account.
5. Select Australia as the storefront.
6. Store the test credentials securely.

Create a second Sandbox Apple Account if you want clean, independent monthly and annual purchase tests.

### 11.2 Create the active reviewer account

1. Use the mobile native signup screen or the production website.
2. Register a dedicated reviewer email.
3. Confirm its email.
4. Sign in once and verify the clinical workspace opens.
5. Do not purchase an App Store subscription on this account.
6. Keep its 14-day trial active through the review period.

### 11.3 Create the expired-trial reviewer account

1. Register and confirm a second dedicated reviewer email.
2. In the Supabase SQL editor, expire only that test account:

```sql
update public.profiles
set trial_end_date = now() - interval '1 day'
where email = 'REPLACE_WITH_EXPIRED_REVIEWER_EMAIL';
```

3. Confirm it has no Stripe or App Store subscription:

```sql
select user_id, status, current_period_end
from public.subscriptions
where user_id = (
  select id
  from public.profiles
  where email = 'REPLACE_WITH_EXPIRED_REVIEWER_EMAIL'
);

select user_id, status, expiration_at
from public.app_store_subscriptions
where user_id = (
  select id
  from public.profiles
  where email = 'REPLACE_WITH_EXPIRED_REVIEWER_EMAIL'
);
```

4. Sign in and confirm the subscription screen opens automatically.

Do not use a real customer's account for either reviewer account.

## Phase 12: Build and Upload to TestFlight

Use a production EAS build for the final end-to-end test. TestFlight builds automatically use Apple's sandbox purchase environment.

From the mobile directory:

```sh
cd /Users/benjaminhay/stars-outcome-measures/mobile
eas build --profile production --platform ios
```

Build 19 is the current production build. If a new build is required, increment is automatic.

When the build succeeds:

```sh
eas submit --platform ios --profile production --latest
```

Then:

1. Open App Store Connect.
2. Open **My Apps**, **RehabMetrics IQ**, **TestFlight**.
3. Wait for Apple processing to complete.
4. Resolve export compliance if Apple asks. The Expo configuration states that the app does not use non-exempt encryption.
5. Add the build to an internal testing group.
6. Install the build from TestFlight on a physical iPhone.
7. Install it on a physical iPad, including an iPad Air 11-inch when available.

Official reference: [Testing subscriptions in TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testing-subscriptions-and-in-app-purchases-in-testflight)

## Phase 13: Physical-Device QA

Record the build number, device, iOS version, tester, result, and evidence for every test.

### 13.1 Authentication

- [ ] Email login succeeds
- [ ] Invalid email/password shows a safe error
- [ ] Native email account creation sends a verification email
- [ ] Email verification returns to the app and permits login
- [ ] Google login succeeds
- [ ] Cancelling Google login returns safely
- [ ] Sign in with Apple appears with prominence equal to Google
- [ ] Apple login with shared email succeeds
- [ ] Apple login with Hide My Email succeeds
- [ ] The Apple user's first-login name is retained
- [ ] Cancelling Apple login returns safely
- [ ] A new Google or Apple account receives one 14-day trial
- [ ] Signing out returns to the login screen

Apple normally supplies name and email only on the first authorization. Use a fresh Apple test identity or revoke the app under Apple Account settings before repeating a first-login test.

### 13.2 Subscription screen

Using the expired-trial account:

- [ ] The app opens the native subscription screen
- [ ] Monthly price comes from StoreKit
- [ ] Annual price comes from StoreKit
- [ ] The monthly product is selectable
- [ ] The annual product is selectable
- [ ] Renewal disclosure is visible
- [ ] Terms opens the production Terms page
- [ ] Privacy opens the production Privacy page
- [ ] Restore Purchases is visible
- [ ] There is no Stripe checkout link
- [ ] There is no instruction to purchase on the website
- [ ] The Account button opens account settings

### 13.3 Purchase

Use a Sandbox Apple Account and a dedicated Supabase test account:

- [ ] Complete a monthly sandbox purchase
- [ ] The workspace opens immediately
- [ ] RevenueCat shows the customer under the Supabase UUID
- [ ] RevenueCat shows entitlement `pro` as active
- [ ] The Supabase row uses the monthly Product ID
- [ ] The Supabase row has `environment = 'sandbox'`
- [ ] Web login for the same Supabase account grants access
- [ ] Server-backed follow-up features grant access

Repeat with a clean test account for the annual product:

- [ ] Complete an annual sandbox purchase
- [ ] RevenueCat shows entitlement `pro`
- [ ] Supabase uses the annual Product ID
- [ ] The workspace opens

Check the latest database records:

```sql
select
  user_id,
  product_identifier,
  status,
  is_active,
  expiration_at,
  original_transaction_id,
  environment,
  updated_at
from public.app_store_subscriptions
order by updated_at desc;
```

### 13.4 Restore

1. Purchase using a dedicated test setup.
2. Sign out of RehabMetrics IQ.
3. Reinstall the TestFlight app.
4. Sign into the intended RehabMetrics IQ account.
5. Open the subscription screen.
6. Select **Restore purchases**.

Confirm:

- [ ] Restore reports an active purchase
- [ ] The intended account receives access
- [ ] RevenueCat's App User ID is the Supabase UUID
- [ ] The server sync updates Supabase
- [ ] The workspace opens

### 13.5 Renewal, cancellation, and billing states

TestFlight renewals are accelerated. Apple currently renews TestFlight subscriptions daily up to six times.

- [ ] A renewal creates a successful RevenueCat webhook
- [ ] `expiration_at` advances in Supabase after renewal
- [ ] Cancelling auto-renewal changes RevenueCat state
- [ ] The Supabase status becomes `cancelled` while paid time remains active
- [ ] Access remains available until `expiration_at`
- [ ] Access ends after expiration
- [ ] A simulated billing issue produces a webhook
- [ ] The Supabase status becomes `billing_issue` while the entitlement remains active
- [ ] Restore works after reinstall

Use the Sandbox Apple Account controls to simulate billing failure and other scenarios.

### 13.6 Existing Stripe access

Using an existing Stripe test customer:

- [ ] An active Stripe subscription opens the iOS workspace
- [ ] The account is not forced to buy again through Apple
- [ ] The same account opens the web workspace
- [ ] Stripe checkout remains available only on the web

### 13.7 Account deletion

Test separate disposable accounts. Deletion is irreversible and the retained email hash prevents another free trial for the same email.

Email account:

- [ ] Account opens from Patient Directory
- [ ] Delete account shows the first explanation
- [ ] Continue shows the final confirmation
- [ ] Permanent deletion completes
- [ ] The app returns to sign-in
- [ ] The account can no longer sign in

Google account:

- [ ] The same two-step deletion succeeds
- [ ] The account can no longer sign in

Apple account:

- [ ] Deletion warns that Apple billing must be managed separately
- [ ] The Apple subscription-management link opens
- [ ] Deletion requests Apple reauthentication
- [ ] Cancelling reauthentication cancels deletion
- [ ] Completing reauthentication deletes the account
- [ ] The app returns to sign-in
- [ ] Apple authorization has been revoked

Data verification:

- [ ] Supabase Auth user is removed
- [ ] Profile is removed
- [ ] Patients are removed
- [ ] Assessments are removed
- [ ] Follow-up records are removed
- [ ] Stripe subscription row is removed
- [ ] App Store subscription row is removed
- [ ] Avatar files are removed
- [ ] Only the irreversible deleted-account email hash remains

### 13.8 Clinical regression smoke test

- [ ] Create a fictional patient
- [ ] Confirm DOB conversion and display
- [ ] Refresh the patient directory
- [ ] Open the patient workspace
- [ ] Save one assessment
- [ ] Confirm assessment history refreshes
- [ ] Confirm User A cannot read User B's data
- [ ] Confirm a malformed patient route fails safely
- [ ] Confirm no raw provider, JSON, token, schema, or database errors appear

## Phase 14: Capture Reviewer Evidence

### 14.1 Record account deletion

Use a physical iPhone or iPad and record:

1. Launch RehabMetrics IQ.
2. Sign in.
3. Open the Patient Directory.
4. Open **Account**.
5. Select **Delete account**.
6. Show the first explanation.
7. Continue to the final confirmation.
8. Confirm permanent deletion.
9. Show the return to the sign-in screen.

Upload the video to an HTTPS URL that:

- Requires no login
- Requires no access request
- Does not expire during review
- Plays in Safari

Test the link in a private Safari window.

### 14.2 Capture App Store listing screenshots

Use only fictional clinical data.

Recommended screenshot subjects:

1. Patient Directory
2. Patient clinical workspace
3. Outcome measure selection
4. Assessment entry or results
5. Subscription screen
6. Login screen, at most once

Accepted portrait sizes include:

```text
6.9-inch iPhone: 1260 x 2736, 1290 x 2796, or 1320 x 2868
13-inch iPad: 2064 x 2752 or 2048 x 2732
```

The iPad set is required because the app supports iPad.

Do not make the listing screenshot set primarily authentication screens.

Official reference: [Apple screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)

### 14.3 Capture subscription review screenshots

Each subscription requires Review Information.

1. Capture a clear screenshot of the native RehabMetrics IQ subscription screen.
2. Make sure both monthly and annual choices are visible.
3. Make sure the restore action and renewal disclosure are visible when possible.
4. Upload the screenshot to the monthly subscription's Review Information.
5. Upload it to the annual subscription's Review Information.
6. Add review notes stating:

```text
Sign in with the expired-trial review account to open the native subscription screen. Monthly and annual subscriptions are displayed using localized StoreKit pricing. Restore Purchases is available on the same screen.
```

## Phase 15: Final App Store Connect Metadata

### 15.1 Complete subscription metadata

Open both subscriptions and confirm:

- [ ] Reference name
- [ ] Product ID
- [ ] Duration
- [ ] Price
- [ ] Availability
- [ ] Localization
- [ ] Review screenshot
- [ ] Review notes
- [ ] Tax category
- [ ] No introductory offer

Both subscriptions must reach **Ready to Submit**.

### 15.2 Update App Privacy

Open **App Privacy** for RehabMetrics IQ and edit the existing answers rather than replacing them wholesale.

At minimum, account for the new billing integration:

- Add **Purchases**, **Purchase History**
- State that purchase history is linked to the user's account
- Use **App Functionality** as the purpose
- Confirm **Identifiers**, **User ID** is disclosed as linked to the user for app functionality
- Keep existing account, clinical, diagnostics, and contact-data disclosures that still apply
- Do not declare payment-card information because Apple processes the App Store payment
- Do not declare advertising tracking
- Do not declare IDFA collection unless another installed SDK actually uses it

Review RevenueCat as a third-party processor in the privacy answers. Make sure the public Privacy Policy already deployed from this repository remains the URL in App Store Connect.

### 15.3 Update the app description if needed

The App Store description should disclose the auto-renewing subscription terms. Include:

- Monthly and annual availability
- That payment is charged to the Apple Account
- That subscriptions renew automatically unless cancelled
- Where users can manage or cancel subscriptions
- Privacy Policy URL
- Terms of Service URL

Do not advertise an Apple introductory trial because none is configured.

### 15.4 Add reviewer accounts

In **App Review Information**, enter:

- The active-trial reviewer email and password
- The expired-trial reviewer email and password
- A note explaining which account opens the workspace and which opens the subscription screen
- The deletion recording URL
- Clear navigation paths for Apple login, purchase, restore, and deletion

Test both credentials immediately before submission.

## Phase 16: Attach the Subscriptions to Version 1.0

These are the app's first App Store subscriptions, so Apple requires them to be submitted with the new app version.

1. Open **My Apps**, **RehabMetrics IQ**.
2. Open iOS version `1.0`.
3. Select the uploaded build `11` or later.
4. Select build `19` (or the latest uploaded build).
5. Scroll to **In-App Purchases and Subscriptions**.
6. Click **Select In-App Purchases or Subscriptions**.
7. Select both:

```text
com.rehabmetricsiq.app.subscription.pro.monthly
com.rehabmetricsiq.app.subscription.pro.annual
```

8. Click **Done**.
9. Confirm both products are visibly attached to version `1.0`.

Do not submit either first subscription separately from the app version.

Official reference: [Submit an In-App Purchase](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase/)

## Phase 17: Final Acceptance Gate

Do not click **Add for Review** until every item is true.

Configuration:

- [ ] Supabase migration is applied
- [ ] Apple agreements, tax, and banking are complete
- [ ] Apple capability is enabled for `com.rehabmetricsiq.app`
- [ ] Supabase Apple provider contains `com.rehabmetricsiq.app`
- [ ] Sign in with Apple private key is configured in Vercel
- [ ] RevenueCat Apple credentials validate
- [ ] RevenueCat `pro` entitlement contains both products
- [ ] RevenueCat `default` offering contains monthly and annual packages
- [ ] RevenueCat restore behavior transfers to the new App User ID
- [ ] RevenueCat webhook returns HTTP `200`
- [ ] Apple server notifications point to RevenueCat
- [ ] Vercel production deployment is live
- [ ] EAS production uses the Apple RevenueCat public key

QA:

- [ ] Apple shared-email login passes
- [ ] Apple Hide My Email login passes
- [ ] Native signup and verification pass
- [ ] Monthly sandbox purchase passes
- [ ] Annual sandbox purchase passes
- [ ] Restore passes
- [ ] Renewal updates Supabase
- [ ] Cancellation and expiration behavior pass
- [ ] Existing Stripe access passes
- [ ] Email account deletion passes
- [ ] Google account deletion passes
- [ ] Apple account deletion and token revocation pass
- [ ] iPhone physical-device QA passes
- [ ] iPad physical-device QA passes
- [ ] Clinical regression smoke test passes

Submission:

- [ ] Both subscriptions are Ready to Submit
- [ ] Both subscriptions are attached to version `1.0`
- [ ] Build `19` (or later) is selected
- [ ] Revised iPhone screenshots are uploaded
- [ ] Revised iPad screenshots are uploaded
- [ ] App Privacy is updated
- [ ] Active reviewer account works
- [ ] Expired-trial reviewer account works
- [ ] Deletion video works without authentication
- [ ] Review notes contain all navigation paths

## Phase 18: Submit and Reply to Review

Use the prepared response in [APP_STORE_RESUBMISSION.md](./APP_STORE_RESUBMISSION.md).

Before pasting it:

1. Replace the deletion recording placeholder with the final URL.
2. Replace both demo-account placeholders with working credentials.
3. Confirm the selected build number.
4. Confirm both subscriptions remain attached.
5. Add the version to App Review.
6. Reply to the previous rejection message with the completed response.

The reply must explicitly identify:

- Sign in with Apple: login screen, **Continue with Apple**
- In-App Purchase: sign in with the expired-trial account
- Restore: subscription screen, **Restore purchases**
- Deletion: **Account**, **Delete account**, **Continue**, **Delete account permanently**
- Deletion recording URL
- Active account credentials
- Expired-trial account credentials

## Troubleshooting

### Subscription choices do not load

Check, in this order:

1. EAS uses the Apple `appl_` public SDK key.
2. The build was created after the EAS variable was added.
3. The `default` offering is current.
4. Both packages are attached to real Apple products.
5. Apple agreements, tax, and banking are complete.
6. Product IDs match the code exactly.
7. Apple product metadata has had up to one hour to propagate.

### Purchase succeeds but the workspace stays locked

Check:

1. RevenueCat customer App User ID is a Supabase UUID.
2. Entitlement `pro` is active.
3. `REVENUECAT_SECRET_API_KEY` exists in the deployed Vercel production environment.
4. `/api/subscriptions/revenuecat-sync` is deployed.
5. Vercel logs show no RevenueCat subscriber lookup error.
6. `app_store_subscriptions` contains the user's row.

### Renewal does not update Supabase

Check:

1. Apple server notification URL points to RevenueCat.
2. RevenueCat received the Apple notification.
3. RevenueCat delivered a webhook.
4. The webhook Authorization value exactly matches Vercel.
5. The webhook includes the Supabase UUID as `app_user_id`.
6. Vercel logs show no foreign-key or RevenueCat API error.

### RevenueCat webhook returns 401

The complete authorization strings differ. Compare:

```text
RevenueCat webhook Authorization header
Vercel REVENUECAT_WEBHOOK_AUTHORIZATION
```

Both must include the same `Bearer ` prefix and token.

### Apple login fails

Check:

1. The Apple capability is enabled on `com.rehabmetricsiq.app`.
2. The EAS signing profile includes Sign in with Apple.
3. Supabase Apple provider is enabled.
4. Supabase Apple Client IDs contains `com.rehabmetricsiq.app`.
5. The installed build uses the production bundle identifier.

### Apple account deletion fails

Check:

1. Vercel has `APPLE_TEAM_ID=U3KB3BY59J`.
2. `APPLE_KEY_ID` belongs to the Sign in with Apple key.
3. `APPLE_CLIENT_ID=com.rehabmetricsiq.app`.
4. `APPLE_PRIVATE_KEY` is the complete Sign in with Apple `.p8`.
5. The key is active and associated with the correct primary App ID.
6. The user completed Apple reauthentication immediately before deletion.
7. Vercel logs show the Apple token exchange or revocation response.

### A reviewer cannot reach the subscription screen

Check:

1. The review account's `trial_end_date` is in the past.
2. It has no active Stripe row.
3. It has no active App Store row.
4. The reviewer account email is confirmed.
5. The credentials were tested in the submitted build.

## Official Reference Index

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple account deletion guidance](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- [Apple auto-renewable subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions)
- [Apple first In-App Purchase submission](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase/)
- [Apple Sandbox accounts](https://developer.apple.com/help/app-store-connect/test-in-app-purchases/create-a-sandbox-apple-account/)
- [Apple TestFlight subscription testing](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testing-subscriptions-and-in-app-purchases-in-testflight)
- [Apple screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)
- [Supabase Login with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [RevenueCat Apple store connection](https://www.revenuecat.com/docs/projects/connect-a-store)
- [RevenueCat product configuration](https://www.revenuecat.com/docs/projects/configuring-products)
- [RevenueCat In-App Purchase key](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration)
- [RevenueCat App Store Connect API key](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/app-store-connect-api-key-configuration)
- [RevenueCat API keys](https://www.revenuecat.com/docs/projects/authentication)
- [RevenueCat restore behavior](https://www.revenuecat.com/docs/projects/restore-behavior)
- [RevenueCat webhooks](https://www.revenuecat.com/docs/integrations/webhooks)
- [RevenueCat Apple server notifications](https://www.revenuecat.com/docs/platform-resources/server-notifications/apple-server-notifications)
- [RevenueCat launch checklist](https://www.revenuecat.com/docs/test-and-launch/launch-checklist)
- [Expo EAS environment variables](https://docs.expo.dev/eas/environment-variables/)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)

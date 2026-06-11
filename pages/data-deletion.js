import LogoWordmark from '../components/LogoWordmark'

export default function DataDeletion() {
  return (
    <>
      <style jsx>{pageStyles}</style>
      <div className="page">
        <div className="content">
          <div className="nav">
            <LogoWordmark href="/" className="wordmark" size="sm" />
          </div>

          <h1 className="title">Data Deletion</h1>
          <p className="meta">Last updated: June 2026</p>

          <p className="intro">
            You have the right to delete your data from RehabMetrics IQ at any time. This page explains
            your options for removing patient records, your account, and all associated data.
          </p>

          <h2>Delete Individual Patient Records</h2>
          <p>
            You can delete individual patient records and their associated assessments from the{' '}
            <strong>RehabMetrics IQ web app</strong> at rehabmetricsiq.com:
          </p>
          <ol>
            <li>Log in to your account at rehabmetricsiq.com.</li>
            <li>Select the patient from the sidebar.</li>
            <li>Click the <strong>Delete patient</strong> button next to their name.</li>
            <li>Confirm the deletion. This permanently removes the patient and all of their assessments.</li>
          </ol>
          <p>Individual assessment entries can also be deleted from within a patient&apos;s record in the web app.</p>
          <p>
            If you use the RehabMetrics IQ mobile app, patient records are shared with your web account.
            Deleting a patient via the web app removes their data across all platforms.
          </p>

          <h2>Delete Your Account and All Data</h2>
          <p>
            You can permanently delete your account and all associated data directly from the RehabMetrics IQ
            mobile app:
          </p>
          <ol>
            <li>Sign in to the mobile app.</li>
            <li>Open <strong>Account</strong> from the patient directory or subscription screen.</li>
            <li>Select <strong>Delete account</strong>.</li>
            <li>Review the billing notice and continue to the final confirmation.</li>
            <li>Select <strong>Delete account permanently</strong>.</li>
          </ol>
          <p>
            If you cannot access the app, contact{' '}
            <a href="mailto:Support@RehabMetricsIQ.com?subject=Account%20Deletion%20Help">
              Support@RehabMetricsIQ.com
            </a>{' '}
            for assistance.
          </p>

          <h2>What Gets Deleted</h2>
          <p>When your account is deleted, we permanently remove:</p>
          <ul>
            <li>Your account credentials and profile.</li>
            <li>All patient records you have created.</li>
            <li>All clinical assessment data and scores.</li>
            <li>Your RehabMetrics IQ subscription entitlement records.</li>
          </ul>
          <p>
            Deletion is irreversible. Active account and clinical data is removed immediately. Encrypted backups
            may take up to 30 days to age out. Stripe, Apple, and RevenueCat may retain transaction records where
            required for billing, fraud prevention, tax, or legal obligations.
          </p>

          <h2>Google Sign-In Users</h2>
          <p>
            If you signed in using Google, deleting your RehabMetrics IQ account does not affect your Google account.
            You can revoke RehabMetrics IQ&apos;s access to your Google account at any time via{' '}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
              Google Account Permissions
            </a>.
          </p>

          <h2>Sign in with Apple and App Store Subscriptions</h2>
          <p>
            If you use Sign in with Apple, the deletion flow asks you to authenticate with Apple again so
            RehabMetrics IQ can revoke its Apple login authorization. Deleting your RehabMetrics IQ account
            does not cancel an App Store subscription.
          </p>
          <p>
            Cancel an Apple subscription before or after deletion through{' '}
            <a href="https://apps.apple.com/account/subscriptions" target="_blank" rel="noreferrer">
              Apple subscription settings
            </a>{' '}
            to prevent future renewals.
          </p>

          <h2>Questions</h2>
          <p>
            If you have questions about data deletion or your rights under applicable privacy law, contact us at{' '}
            <a href="mailto:Support@RehabMetricsIQ.com">Support@RehabMetricsIQ.com</a>.
          </p>

          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/">Back to home</a>
          </div>
        </div>
      </div>
    </>
  )
}

const pageStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --color-primary:      #236499;
    --color-ink:          #1F2933;
    --color-muted:        #5F6B7A;
    --color-subtle:       #8A96A3;
    --color-surface:      #FFFFFF;
    --color-surface-soft: #F7FAFC;
    --color-border:       #D8E2EC;
    --color-primary-soft: #EAF3FB;
  }

  body { font-family: 'Inter', sans-serif; background: var(--color-surface-soft); }

  .page { min-height: 100vh; padding: 48px 24px 80px; }

  .content {
    max-width: 720px;
    margin: 0 auto;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 48px 56px;
  }

  .nav { margin-bottom: 40px; }

  .wordmark { text-decoration: none; }

  .title {
    font-family: 'Source Serif 4', serif;
    font-size: 32px;
    font-weight: 600;
    color: var(--color-ink);
    line-height: 1.2;
    margin-bottom: 8px;
  }

  .meta {
    font-size: 13px;
    color: var(--color-subtle);
    margin-bottom: 32px;
  }

  .intro {
    font-size: 16px;
    color: var(--color-muted);
    line-height: 1.7;
    margin-bottom: 40px;
    padding-bottom: 32px;
    border-bottom: 1px solid var(--color-border);
  }

  h2 {
    font-family: 'Source Serif 4', serif;
    font-size: 20px;
    font-weight: 600;
    color: var(--color-ink);
    margin-top: 36px;
    margin-bottom: 12px;
  }

  p {
    font-size: 15px;
    color: var(--color-muted);
    line-height: 1.7;
    margin-bottom: 14px;
  }

  ol { margin: 0 0 14px 20px; }
  ul { margin: 0 0 14px 20px; }

  li {
    font-size: 15px;
    color: var(--color-muted);
    line-height: 1.7;
    margin-bottom: 6px;
  }

  strong { color: var(--color-ink); font-weight: 500; }

  a { color: var(--color-primary); text-decoration: none; }
  a:hover { text-decoration: underline; }

  .contact-box {
    background: var(--color-primary-soft);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 24px 28px;
    margin: 20px 0 28px;
  }

  .contact-label {
    font-size: 13px;
    color: var(--color-subtle);
    margin-bottom: 6px;
  }

  .contact-email {
    display: block;
    font-size: 17px;
    font-weight: 600;
    color: var(--color-primary);
    margin-bottom: 14px;
  }

  .contact-note {
    font-size: 14px;
    color: var(--color-muted);
    margin-bottom: 0;
  }

  .footer-links {
    display: flex;
    gap: 24px;
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid var(--color-border);
    font-size: 13px;
  }

  @media (max-width: 640px) {
    .content { padding: 32px 24px; }
    .title { font-size: 26px; }
    .footer-links { flex-direction: column; gap: 12px; }
  }
`

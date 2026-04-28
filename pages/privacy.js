export default function Privacy() {
  return (
    <>
      <style jsx>{pageStyles}</style>
      <div className="page">
        <div className="content">
          <div className="nav">
            <a href="/" className="wordmark">RehabMetrics <span className="wordmark-iq">IQ</span></a>
          </div>

          <h1 className="title">Privacy Policy</h1>
          <p className="meta">Last updated: April 2026</p>

          <p className="intro">
            RehabMetrics IQ (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed to protecting the privacy of our users.
            This policy explains what information we collect, how we use it, and your rights in relation to it.
          </p>

          <h2>1. Information We Collect</h2>
          <p>When you use RehabMetrics IQ, we collect the following information:</p>
          <ul>
            <li><strong>Account information:</strong> Your email address and encrypted password when you register, or your Google account details if you sign in with Google.</li>
            <li><strong>Patient data you enter:</strong> Patient initials (no full names), date of birth, diagnosis category, and clinical outcome measure scores and inputs.</li>
            <li><strong>Usage data:</strong> Basic information about how you interact with the service to help us improve the product.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use your information solely to provide and improve the RehabMetrics IQ service:</p>
          <ul>
            <li>To authenticate your account and maintain your session.</li>
            <li>To store and display the clinical data you enter.</li>
            <li>To manage your subscription and trial period.</li>
            <li>To respond to support requests.</li>
          </ul>
          <p>We do not sell your data. We do not share your data with third parties except as required to operate the service or as required by law.</p>

          <h2>3. Data Storage</h2>
          <p>
            Your data is stored securely using <strong>Supabase</strong>, a managed cloud database platform.
            Data is encrypted in transit (TLS) and at rest. Access is restricted to authenticated users.
          </p>

          <h2>4. Clinical Disclaimer</h2>
          <p>
            RehabMetrics IQ is a documentation and scoring tool for qualified clinicians. It is not a medical device
            and does not provide clinical diagnoses or treatment recommendations. All clinical decisions remain
            the sole responsibility of the treating clinician.
          </p>
          <p>
            We recommend that you do not enter patient full names, Medicare numbers, or other personally
            identifiable health information beyond what is needed for your clinical workflow.
          </p>

          <h2>5. Data Retention</h2>
          <p>
            Your account data and patient records are retained for as long as your account is active.
            If you close your account or request deletion, your data will be permanently removed within 30 days.
            See our <a href="/data-deletion">Data Deletion</a> page for instructions.
          </p>

          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the data we hold about you.</li>
            <li>Correct inaccurate data.</li>
            <li>Request deletion of your data.</li>
            <li>Export your data in a portable format — contact us to request this.</li>
          </ul>

          <h2>7. Cookies and Session Storage</h2>
          <p>
            We use a secure cookie to maintain your login session. This cookie expires after 30 days of inactivity.
            We do not use tracking cookies or third-party advertising cookies.
          </p>

          <h2>8. Contact</h2>
          <p>
            For privacy-related questions or to exercise your rights, contact us at{' '}
            <a href="mailto:Support@RehabMetricsIQ.com">Support@RehabMetricsIQ.com</a>.
          </p>

          <div className="footer-links">
            <a href="/terms">Terms of Service</a>
            <a href="/data-deletion">Data Deletion</a>
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

  .wordmark {
    font-family: 'Source Serif 4', serif;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-primary);
    text-decoration: none;
  }

  .wordmark-iq { font-style: italic; font-weight: 300; }

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

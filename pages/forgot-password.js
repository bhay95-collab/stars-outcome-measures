import Head from 'next/head'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import LogoWordmark from '../components/LogoWordmark'
import ThreeBarMotif from '../components/ThreeBarMotif'

export async function getServerSideProps() { return { props: {} } }

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/reset-password`
      : 'https://www.rehabmetricsiq.com/reset-password'

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })

    if (resetError) {
      setError('Something went wrong. Please check your connection and try again.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Reset your password | RehabMetrics IQ</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="icon" href="/SquareLogo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:wght@600;700&display=swap" rel="stylesheet" />
      </Head>
      <style jsx>{pageStyles}</style>
      <main className="page">
        <div className="card">
          <LogoWordmark size="md" spaceAfter />

          {sent ? (
            <div className="sent-state">
              <div className="sent-icon" aria-hidden="true">✉️</div>
              <h1 className="heading">Check your inbox</h1>
              <p className="subtext">
                If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
                It expires in 1 hour.
              </p>
              <p className="subtext" style={{ marginTop: 8 }}>
                Didn&apos;t receive it? Check your spam folder, or{' '}
                <button className="inline-link" onClick={() => setSent(false)}>try again</button>.
              </p>
              <a href="/login" className="btn" style={{ marginTop: 24, display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                Back to log in
              </a>
            </div>
          ) : (
            <>
              <h1 className="heading">Reset your password</h1>
              <p className="subtext">
                Enter the email address for your account and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@clinic.com"
                    autoFocus
                  />
                </div>

                {error && <p className="error">{error}</p>}

                <button type="submit" className="btn" disabled={loading}>
                  {loading ? (
                    <span className="button-loading">
                      <ThreeBarMotif size="xs" tone="light" loading label="Sending reset link" />
                      Sending…
                    </span>
                  ) : 'Send reset link'}
                </button>
              </form>

              <p className="footer">
                <a href="/login">← Back to log in</a>
              </p>
            </>
          )}
        </div>
      </main>
    </>
  )
}

const pageStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --color-primary:      #236499;
    --color-primary-dark: #17496F;
    --color-primary-soft: #EAF3FB;
    --color-ink:          #1F2933;
    --color-muted:        #5F6B7A;
    --color-subtle:       #8A96A3;
    --color-surface:      #FFFFFF;
    --color-surface-soft: #F7FAFC;
    --color-border:       #D8E2EC;
    --shadow-md:          0 18px 42px rgba(21,34,56,0.12);
  }

  body { font-family: 'Inter', sans-serif; }

  .page {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 32px;
    background: var(--color-surface-soft);
  }

  .card {
    width: min(100%, 440px);
    padding: 48px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 18px;
    box-shadow: var(--shadow-md);
  }

  .card .logo-wordmark {
    margin-bottom: 32px;
  }

  .heading {
    font-family: 'Source Serif 4', serif;
    font-size: 26px;
    font-weight: 700;
    color: var(--color-ink);
    line-height: 1.2;
    margin-bottom: 8px;
  }

  .subtext {
    font-size: 14px;
    color: var(--color-muted);
    line-height: 1.5;
    margin-bottom: 24px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  label {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-ink);
  }

  input {
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    color: var(--color-ink);
    background: var(--color-surface-soft);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 10px 14px;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
  }

  input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(35,100,153,0.12); }
  input::placeholder { color: var(--color-subtle); }

  .error {
    font-size: 13px;
    color: #b91c1c;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  .btn {
    width: 100%;
    background: var(--color-primary);
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: 12px 24px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 8px;
    box-shadow: 0 10px 22px rgba(35,100,153,0.24);
    transition: background 0.18s, transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s, opacity 0.15s;
  }

  .btn:hover { background: var(--color-primary-dark); transform: translateY(-1px); box-shadow: 0 14px 28px rgba(35,100,153,0.34); }
  .btn:active { transform: translateY(0); }
  .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .button-loading {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
  }

  .footer {
    font-size: 13px;
    color: var(--color-muted);
    text-align: center;
    margin-top: 24px;
  }

  .footer a {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 500;
  }

  .footer a:hover { text-decoration: underline; }

  .sent-state {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .sent-icon {
    font-size: 36px;
    margin-bottom: 12px;
  }

  .inline-link {
    background: none;
    border: none;
    padding: 0;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: var(--color-primary);
    font-weight: 500;
    cursor: pointer;
    text-decoration: underline;
  }

  @media (max-width: 520px) {
    .page { padding: 16px; }
    .card { padding: 32px 24px; }
  }
`

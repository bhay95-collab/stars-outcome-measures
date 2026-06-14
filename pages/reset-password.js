import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import LogoWordmark from '../components/LogoWordmark'
import ThreeBarMotif from '../components/ThreeBarMotif'

export async function getServerSideProps() { return { props: {} } }

const MIN_PASSWORD_LENGTH = 8
const RECOVERY_WAIT_MS = 6000

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    const timeout = setTimeout(() => {
      setExpired(true)
    }, RECOVERY_WAIT_MS)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  // If recovery session fires after the timeout started, clear the expired flag
  useEffect(() => {
    if (ready) setExpired(false)
  }, [ready])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message || 'Failed to update password. The link may have expired.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.replace('/app'), 2000)
  }

  return (
    <>
      <Head>
        <title>Set new password | RehabMetrics IQ</title>
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

          {success ? (
            <div className="state-message">
              <h1 className="heading">Password updated</h1>
              <p className="subtext">Your password has been changed. Redirecting you to the app…</p>
              <ThreeBarMotif size="sm" loading label="Redirecting" />
            </div>
          ) : expired && !ready ? (
            <div className="state-message">
              <h1 className="heading">Link expired or invalid</h1>
              <p className="subtext">
                This password reset link has expired or has already been used. Reset links are valid for 1 hour.
              </p>
              <a href="/forgot-password" className="btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 8 }}>
                Request a new link
              </a>
              <p className="footer">
                <a href="/login">← Back to log in</a>
              </p>
            </div>
          ) : !ready ? (
            <div className="state-message loading-state">
              <ThreeBarMotif size="sm" loading label="Verifying reset link" />
              <p className="subtext" style={{ marginTop: 16 }}>Verifying your reset link…</p>
            </div>
          ) : (
            <>
              <h1 className="heading">Set new password</h1>
              <p className="subtext">Choose a strong password for your account.</p>

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="password">New password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                    autoFocus
                  />
                </div>

                <div className="field">
                  <label htmlFor="confirm-password">Confirm new password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter your new password"
                  />
                </div>

                {error && <p className="error">{error}</p>}

                <button type="submit" className="btn" disabled={loading}>
                  {loading ? (
                    <span className="button-loading">
                      <ThreeBarMotif size="xs" tone="light" loading label="Saving new password" />
                      Saving…
                    </span>
                  ) : 'Set new password'}
                </button>
              </form>
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

  .state-message {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .loading-state {
    align-items: center;
    text-align: center;
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

  @media (max-width: 520px) {
    .page { padding: 16px; }
    .card { padding: 32px 24px; }
  }
`

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getAppRedirectUrl, supabase } from '../lib/supabase'
import LogoWordmark from '../components/LogoWordmark'

export async function getServerSideProps() { return { props: {} } }

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) router.replace('/app')
    })
  }, [router])

  async function signInWithGoogle() {
    setGoogleLoading(true)
    setError('')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getAppRedirectUrl() }
    })
    if (oauthError) {
      setError(oauthError.message)
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Block emails that previously deleted their account from claiming a new trial
    try {
      const checkRes = await fetch('/api/check-deleted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const checkData = await checkRes.json()
      if (checkData.blocked) {
        setError('An account with this email has been permanently deleted and is not eligible for a new free trial.')
        setLoading(false)
        return
      }
    } catch {
      // If the check fails, allow signup to proceed rather than blocking legitimate users
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: getAppRedirectUrl() }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/app')
    } else {
      setEmailSent(true)
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <>
        <style jsx>{pageStyles}</style>
        <div className="page">
          <div className="card">
            <LogoWordmark size="md" spaceAfter />
            <h1 className="heading">Check your email</h1>
            <p className="subtext">
              We sent a confirmation link to <strong>{email}</strong>.
              Click it to activate your account and start your 14-day trial.
            </p>
            <a href="/login" className="btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '24px' }}>
              Go to log in
            </a>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style jsx>{pageStyles}</style>
      <div className="page">
        <div className="card">
          <LogoWordmark size="md" spaceAfter />
          <h1 className="heading">Create your account</h1>
          <p className="subtext">Start your 14-day free trial — no credit card required.</p>

          <button type="button" className="btn-google" onClick={signInWithGoogle} disabled={googleLoading || loading}>
            <GoogleIcon />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div className="divider"><span>or</span></div>

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
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
                placeholder="Minimum 6 characters"
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="footer">
            Already have an account? <a href="/login">Log in</a>
          </p>
        </div>
      </div>
    </>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
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
    --shadow-md:          0 6px 16px rgba(31,41,51,0.08);
  }

  body { font-family: 'Inter', sans-serif; }

  .page {
    min-height: 100vh;
    background: var(--color-surface-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
  }

  .card {
    width: 100%;
    max-width: 420px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 40px;
    box-shadow: var(--shadow-md);
  }

  .heading {
    font-family: 'Source Serif 4', serif;
    font-size: 26px;
    font-weight: 600;
    color: var(--color-ink);
    line-height: 1.2;
    margin-bottom: 8px;
  }

  .subtext {
    font-size: 14px;
    color: var(--color-muted);
    line-height: 1.5;
    margin-bottom: 28px;
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
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 10px 14px;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
  }

  input:focus { border-color: var(--color-primary); }

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
    transition: opacity 0.15s;
  }

  .btn:hover { opacity: 0.9; }
  .btn:disabled { opacity: 0.6; cursor: not-allowed; }

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

  .btn-google {
    width: 100%;
    background: var(--color-surface);
    color: var(--color-ink);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 12px 24px;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: background 0.15s;
    margin-bottom: 4px;
  }

  .btn-google:hover { background: var(--color-surface-soft); }
  .btn-google:disabled { opacity: 0.6; cursor: not-allowed; }

  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 16px 0;
    color: var(--color-subtle);
    font-size: 13px;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }
`

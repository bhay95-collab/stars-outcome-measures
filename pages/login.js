import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export async function getServerSideProps() { return { props: {} } }

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push('/app')
  }

  return (
    <>
      <style jsx>{pageStyles}</style>
      <div className="page">
        <div className="card">
          <div className="wordmark">RehabMetrics <span className="wordmark-iq">IQ</span></div>
          <h1 className="heading">Welcome back</h1>
          <p className="subtext">Log in to your RehabMetrics IQ account.</p>

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
                autoComplete="current-password"
                placeholder="Your password"
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="footer">
            Don&apos;t have an account? <a href="/signup">Start your free trial</a>
          </p>
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

  .wordmark {
    font-family: 'Source Serif 4', serif;
    font-size: 20px;
    font-weight: 600;
    color: var(--color-primary);
    margin-bottom: 28px;
  }

  .wordmark-iq { font-style: italic; font-weight: 300; }

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
`

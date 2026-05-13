import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getAppRedirectUrl, supabase } from '../lib/supabase'
import LogoWordmark from '../components/LogoWordmark'
import ThreeBarMotif from '../components/ThreeBarMotif'

export async function getServerSideProps() { return { props: {} } }

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

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
      <Head>
        <title>Log in | RehabMetrics IQ</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="icon" href="/SquareLogo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:wght@600;700&display=swap" rel="stylesheet" />
      </Head>
      <style jsx>{pageStyles}</style>
      <main className="page">
        <section className="login-shell">
          <div className="login-visual">
            <video
              className="login-visual__video"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="/assets/videos/login-poster.jpg"
              aria-hidden="true"
            >
              <source src="/assets/videos/login-loop.mp4" type="video/mp4" />
            </video>
            <div className="login-visual__content">
              <LogoWordmark size="lg" showMark={false} />
              <p className="eyebrow">CLINICAL OUTCOMES WORKSPACE</p>
              <h1>Progress data with the clinical context still attached.</h1>
              <div className="login-visual__metrics" aria-label="Example outcome indicators">
                <div><strong>23</strong><span>Measures for gait, balance, endurance, independence and symptoms.</span></div>
                <div><strong>MCID</strong><span>Meaningful change context beside patient trends and reports.</span></div>
                <div><strong>Context</strong><span>Diagnosis-aware interpretation for measures clinicians already use.</span></div>
              </div>
            </div>
          </div>

          <div className="card">
            <LogoWordmark size="md" spaceAfter />
            <h2 className="heading">Welcome back</h2>
            <p className="subtext">Log in to your RehabMetrics IQ account.</p>

            <button type="button" className="btn-google" onClick={signInWithGoogle} disabled={googleLoading || loading}>
              <GoogleIcon />
              {googleLoading ? (
                <span className="button-loading">
                  <ThreeBarMotif size="xs" loading label="Redirecting to Google" />
                  Redirecting…
                </span>
              ) : 'Continue with Google'}
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
                  autoComplete="current-password"
                  placeholder="Your password"
                />
              </div>

              {error && <p className="error">{error}</p>}

              <button type="submit" className="btn" disabled={loading}>
                {loading ? (
                  <span className="button-loading">
                    <ThreeBarMotif size="xs" tone="light" loading label="Logging in" />
                    Logging in…
                  </span>
                ) : 'Log in'}
              </button>
            </form>

            <p className="footer">
              Don&apos;t have an account? <a href="/signup">Start your free trial</a>
            </p>
          </div>
        </section>
      </main>
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
    --color-primary-dark: #17496F;
    --color-primary-soft: #EAF3FB;
    --color-secondary:    #7FB3E6;
    --color-secondary-soft: #DCEEFF;
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
    background:
      linear-gradient(135deg, rgba(234,243,251,0.92), rgba(247,250,252,0.98)),
      linear-gradient(135deg, #f7fbff 0%, #eaf1f8 100%);
  }

  .login-shell {
    width: min(100%, 1040px);
    min-height: min(680px, calc(100vh - 64px));
    display: grid;
    grid-template-columns: minmax(0, 1.12fr) minmax(380px, 0.82fr);
    overflow: hidden;
    border: 1px solid rgba(216,226,236,0.95);
    border-radius: 24px;
    background: rgba(255,255,255,0.74);
    box-shadow: var(--shadow-md);
    backdrop-filter: blur(18px);
  }

  .login-visual {
    position: relative;
    min-height: 560px;
    isolation: isolate;
    overflow: hidden;
    background: #17496F;
  }

  .login-visual__video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transform: scale(1.12);
    z-index: 0;
  }

  .login-visual::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background:
      linear-gradient(90deg, rgba(9, 19, 32, 0.68), rgba(9, 19, 32, 0.26) 56%, rgba(9, 19, 32, 0.08)),
      linear-gradient(180deg, rgba(9, 19, 32, 0.18), rgba(9, 19, 32, 0.1) 42%, rgba(9, 19, 32, 0.54));
  }

  .login-visual::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.09), transparent 38%),
      repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 92px);
  }

  @media (prefers-reduced-motion: reduce) {
    .login-visual__video { display: none; }
  }

  .login-visual__content {
    position: relative;
    z-index: 3;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 46px;
    color: #fff;
  }

  .login-visual__content .logo-wordmark {
    margin-bottom: auto;
    color: #fff;
    text-shadow: 0 2px 18px rgba(0,0,0,0.3);
  }

  .login-visual__content .logo-wordmark__iq {
    color: var(--color-secondary);
  }

  .eyebrow {
    margin-bottom: 12px;
    color: rgba(255,255,255,0.76);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.4px;
    text-shadow: 0 2px 14px rgba(0,0,0,0.28);
  }

  .login-visual h1 {
    max-width: 520px;
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: clamp(34px, 4vw, 54px);
    font-weight: 700;
    line-height: 1.04;
    text-shadow: 0 2px 22px rgba(0,0,0,0.32);
  }

  .login-visual__metrics {
    width: min(100%, 520px);
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 28px;
  }

  .login-visual__metrics > div {
    min-height: 94px;
    padding: 16px;
    border: 1px solid rgba(255,255,255,0.24);
    border-radius: 16px;
    background: rgba(8,18,30,0.34);
    box-shadow: inset 0 1px rgba(255,255,255,0.16);
    backdrop-filter: blur(12px);
  }

  .login-visual__metrics strong {
    display: block;
    font-size: clamp(22px, 2.4vw, 28px);
    font-weight: 800;
    line-height: 1;
    letter-spacing: 0;
  }

  .login-visual__metrics span {
    display: block;
    margin-top: 8px;
    color: rgba(255,255,255,0.74);
    font-size: 12px;
    font-weight: 700;
  }

  .button-loading {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
  }

  .card {
    width: 100%;
    align-self: center;
    max-width: none;
    padding: 46px;
    background: rgba(255,255,255,0.9);
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
    background: var(--color-surface-soft);
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
    box-shadow: 0 10px 22px rgba(35,100,153,0.24);
    transition: background 0.15s, opacity 0.15s;
  }

  .btn:hover { background: var(--color-primary-dark); }
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

  @media (max-width: 860px) {
    .page {
      padding: 18px;
    }

    .login-shell {
      grid-template-columns: 1fr;
      min-height: auto;
    }

    .login-visual {
      min-height: 320px;
    }

    .login-visual__content,
    .card {
      padding: 30px;
    }

    .login-visual__metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .login-visual__metrics > div:last-child {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 520px) {
    .login-visual__metrics {
      grid-template-columns: 1fr;
    }
  }
`

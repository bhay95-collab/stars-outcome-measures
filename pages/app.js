import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export async function getServerSideProps() { return { props: {} } }

export default function App() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data: { user: currentUser } }) => {
        if (!currentUser) {
          router.replace('/login')
        } else {
          setUser(currentUser)
          setChecking(false)
        }
      })
      .catch(() => router.replace('/login'))
  }, [router])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (checking) {
    return (
      <>
        <style jsx>{pageStyles}</style>
        <div className="loading-page" />
      </>
    )
  }

  return (
    <>
      <style jsx>{pageStyles}</style>
      <div className="page">
        <header className="header">
          <div className="header-inner">
            <div className="wordmark">RehabMetrics <span className="wordmark-iq">IQ</span></div>
            <button className="signout-btn" onClick={handleSignOut}>Sign out</button>
          </div>
        </header>

        <main className="main">
          <div className="welcome-card">
            <p className="trial-label">14-day free trial</p>
            <h1 className="heading">Welcome to RehabMetrics IQ</h1>
            <p className="subtext">
              You&apos;re signed in as <strong>{user.email}</strong>.
              Your dashboard is coming soon.
            </p>
          </div>
        </main>
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

  .loading-page {
    min-height: 100vh;
    background: var(--color-surface-soft);
  }

  .page {
    min-height: 100vh;
    background: var(--color-surface-soft);
  }

  .header {
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    padding: 0 32px;
  }

  .header-inner {
    max-width: 1100px;
    margin: 0 auto;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .wordmark {
    font-family: 'Source Serif 4', serif;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-primary);
  }

  .wordmark-iq { font-style: italic; font-weight: 300; }

  .signout-btn {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-muted);
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 6px 14px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }

  .signout-btn:hover {
    color: var(--color-ink);
    border-color: var(--color-muted);
  }

  .main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 60px 32px;
  }

  .welcome-card {
    max-width: 560px;
  }

  .trial-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--color-subtle);
    margin-bottom: 12px;
  }

  .heading {
    font-family: 'Source Serif 4', serif;
    font-size: 36px;
    font-weight: 600;
    color: var(--color-ink);
    line-height: 1.2;
    margin-bottom: 16px;
  }

  .subtext {
    font-size: 16px;
    color: var(--color-muted);
    line-height: 1.6;
    font-weight: 300;
  }
`

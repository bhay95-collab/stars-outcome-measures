import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import LogoWordmark from '../components/LogoWordmark'
import { REFERENCE_CARD_FILENAME } from '../lib/clinical/referenceCard'

const ROLES = ['Physiotherapist', 'Student', 'Other allied health', 'Other']

const HIGHLIGHTS = [
  '24 outcome measures used in neurological, stroke, SCI, amputee, and reconditioning rehab',
  'MCID values where established in literature (10MWT, TUG, BBS, 6MWT, FGA, FSS, ABC and more)',
  'Population-specific nuance — e.g. 0.06 m/s stroke vs 0.10 m/s TBI on the 10MWT',
  'Grouped by performance, independence, and patient-reported domains',
  'Built for clinical use — fits on one printable A4 page',
]

export default function ReferenceCard() {
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [role, setRole]     = useState('Physiotherapist')
  const [busy, setBusy]     = useState(false)
  const [error, setError]   = useState('')
  const [done, setDone]     = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/reference-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role }),
      })
      if (!res.ok) {
        const message = await res.json().catch(() => ({}))
        throw new Error(message?.error || 'Could not generate the reference card.')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = REFERENCE_CARD_FILENAME
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1500)
      setDone(true)
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Head>
        <title>Free Outcome Measures Reference Card | RehabMetrics IQ</title>
        <meta name="description" content="Free, one-page reference card for rehabilitation physiotherapists. MCID, MDC, and clinical cut-offs for 24 outcome measures including 10MWT, TUG, BBS, 6MWT, FGA, FSS and more." />
        <meta name="robots" content="index,follow" />
      </Head>
      <style jsx>{pageStyles}</style>
      <div className="page">
        <div className="shell">
          <header className="topbar">
            <LogoWordmark href="/" size="sm" />
            <Link href="/" className="backlink">Back to home</Link>
          </header>

          <div className="layout">
            <section className="pitch">
              <p className="eyebrow">FREE DOWNLOAD</p>
              <h1>The rehab outcome measure cut-offs you keep meaning to print out.</h1>
              <p className="lead">
                MCID, MDC, and clinical cut-offs for 24 common rehabilitation outcome measures —
                one printable A4 page, grouped by domain, with population-specific nuance.
                Built by RehabMetrics IQ from the same registry that powers our clinical app.
              </p>

              <ul className="bullets">
                {HIGHLIGHTS.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <p className="micro">
                No spam. We&apos;ll email you the card and may occasionally share product updates.
                Unsubscribe any time.
              </p>
            </section>

            <section className="card">
              {done ? (
                <div className="done">
                  <h2>Your download is starting.</h2>
                  <p>
                    The PDF should appear in your downloads now. If it didn&apos;t,
                    <button type="button" className="linkbtn" onClick={submit}>request it again</button>.
                  </p>
                  <p className="micro" style={{ marginTop: 24 }}>
                    Want to try the full app? <Link href="/signup">Start a free trial</Link> —
                    14 days, no credit card.
                  </p>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <h2>Send me the reference card</h2>

                  <label className="field">
                    <span>Your name</span>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      autoComplete="name"
                      required
                      maxLength={120}
                    />
                  </label>

                  <label className="field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      maxLength={254}
                    />
                  </label>

                  <label className="field">
                    <span>I work as a</span>
                    <select value={role} onChange={e => setRole(e.target.value)}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </label>

                  {error && <p className="error" role="alert">{error}</p>}

                  <button type="submit" className="primary" disabled={busy}>
                    {busy ? 'Preparing your PDF…' : 'Send me the reference card'}
                  </button>

                  <p className="micro" style={{ marginTop: 16 }}>
                    By submitting you agree to our <Link href="/privacy">Privacy Policy</Link>.
                  </p>
                </form>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  )
}

const pageStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #173d68;
    --navy-dark: #102947;
    --ink: #152238;
    --muted: #566271;
    --subtle: #8a96a3;
    --surface: #ffffff;
    --soft: #eef3f8;
    --line: #d7e0e8;
    --mint: #77c7bd;
    --danger: #b42318;
    --shadow: 0 18px 36px rgba(23, 38, 59, 0.12);
  }

  body { font-family: 'Inter', system-ui, sans-serif; background: var(--soft); color: var(--ink); }

  .page { min-height: 100vh; padding: 32px 24px 64px; }

  .shell { max-width: 1100px; margin: 0 auto; }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 40px;
  }
  .backlink {
    font-size: 13px;
    color: var(--muted);
    text-decoration: none;
  }
  .backlink:hover { color: var(--navy); }

  .layout {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 48px;
    align-items: start;
  }

  .pitch .eyebrow {
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--navy);
    font-weight: 600;
    margin-bottom: 16px;
  }
  .pitch h1 {
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: 36px;
    line-height: 1.15;
    color: var(--navy-dark);
    margin-bottom: 18px;
    font-weight: 600;
  }
  .pitch .lead {
    font-size: 16px;
    line-height: 1.6;
    color: var(--muted);
    margin-bottom: 24px;
  }
  .bullets {
    list-style: none;
    margin: 0 0 24px;
  }
  .bullets li {
    position: relative;
    padding-left: 22px;
    margin-bottom: 10px;
    font-size: 14px;
    color: var(--ink);
    line-height: 1.55;
  }
  .bullets li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 9px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--mint);
  }
  .micro {
    font-size: 12px;
    color: var(--subtle);
    line-height: 1.5;
  }
  .micro a { color: var(--navy); }

  .card {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 32px;
    box-shadow: var(--shadow);
  }
  .card h2 {
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: 22px;
    color: var(--navy-dark);
    margin-bottom: 20px;
    font-weight: 600;
  }
  .field {
    display: block;
    margin-bottom: 14px;
  }
  .field span {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--ink);
    margin-bottom: 6px;
  }
  .field input, .field select {
    width: 100%;
    height: 42px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: #fff;
    font: inherit;
    color: var(--ink);
    outline: none;
    transition: border-color 0.15s;
  }
  .field input:focus, .field select:focus {
    border-color: var(--navy);
    box-shadow: 0 0 0 3px rgba(23,61,104,0.12);
  }
  .field select { appearance: none; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%23566271' d='M6 8 0 2l1.4-1.4L6 5.2 10.6.6 12 2z'/></svg>"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }

  .primary {
    width: 100%;
    height: 46px;
    margin-top: 8px;
    background: var(--navy);
    color: #fff;
    border: none;
    border-radius: 10px;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .primary:hover:not(:disabled) { background: var(--navy-dark); }
  .primary:disabled { opacity: 0.65; cursor: not-allowed; }

  .error {
    color: var(--danger);
    font-size: 13px;
    margin-bottom: 8px;
    padding: 10px 12px;
    background: rgba(180, 35, 24, 0.06);
    border-radius: 8px;
  }

  .done h2 { margin-bottom: 12px; }
  .done p { font-size: 14px; color: var(--muted); line-height: 1.6; }
  .linkbtn {
    background: none;
    border: none;
    padding: 0 0 0 4px;
    color: var(--navy);
    cursor: pointer;
    font: inherit;
    text-decoration: underline;
  }

  @media (max-width: 800px) {
    .layout { grid-template-columns: 1fr; gap: 32px; }
    .pitch h1 { font-size: 28px; }
    .card { padding: 24px; }
  }
`

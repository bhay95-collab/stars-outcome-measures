import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import LogoWordmark from '../components/LogoWordmark'

const CASELOAD_OPTIONS = [
  'Neurological / stroke / TBI',
  'Spinal cord injury',
  'Amputee',
  'Aged care / community / falls',
  'NDIS-funded',
  'Other',
]

const PILOT_TERMS = [
  'Free 90 days of full RehabMetrics IQ access — no card required.',
  'A short call with the founder at week 4 and week 12 to compare notes.',
  'Direct line to suggest changes to the product while you use it.',
  'Optional credit on the launch page if you want to be named.',
]

const WHAT_WE_NEED = [
  'You actually use it on real patients during the 90 days.',
  'You tell us honestly what is broken, slow, or missing.',
  'You let us quote anonymised feedback in marketing (we always check first).',
]

export default function Pilot() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    clinic: '',
    caseload: [],
    message: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleCaseload(item) {
    setForm(prev => {
      const exists = prev.caseload.includes(item)
      const next = exists
        ? prev.caseload.filter(x => x !== item)
        : [...prev.caseload, item]
      return { ...prev, caseload: next }
    })
  }

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/pilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Something went wrong. Please try again.')
      }
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
        <title>Pilot Programme | RehabMetrics IQ</title>
        <meta name="description" content="Apply for the RehabMetrics IQ 90-day pilot. Free full access for rehabilitation physiotherapists willing to use the product on real patients and share honest feedback." />
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
              <p className="eyebrow">PILOT PROGRAMME</p>
              <h1>90 days. Real patients. Honest feedback.</h1>
              <p className="lead">
                We&apos;re looking for a small number of Australian rehabilitation
                physiotherapists to use RehabMetrics IQ on real patients for 90 days,
                tell us where it helps, and tell us where it doesn&apos;t. In return,
                you get the product free and direct influence on what we build next.
              </p>

              <div className="block">
                <h2>What you get</h2>
                <ul className="bullets">
                  {PILOT_TERMS.map(item => <li key={item}>{item}</li>)}
                </ul>
              </div>

              <div className="block">
                <h2>What we ask</h2>
                <ul className="bullets bullets--coral">
                  {WHAT_WE_NEED.map(item => <li key={item}>{item}</li>)}
                </ul>
              </div>

              <p className="micro">
                We read every application personally and respond within two business days.
                Pilot slots are limited — we&apos;re prioritising clinicians in NDIS community,
                inpatient rehab, neuro, SCI, and amputee caseloads.
              </p>
            </section>

            <section className="card">
              {done ? (
                <div className="done">
                  <h2>Thanks — we&apos;ll be in touch.</h2>
                  <p>
                    Your application has been received. We respond personally to every
                    pilot enquiry, normally within two business days.
                  </p>
                  <p className="micro" style={{ marginTop: 20 }}>
                    In the meantime, grab the <Link href="/reference-card">free outcome
                    measures reference card</Link> — same registry that powers the app.
                  </p>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <h2>Apply for the pilot</h2>

                  <label className="field">
                    <span>Your name</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => update('name', e.target.value)}
                      autoComplete="name"
                      required
                      maxLength={120}
                    />
                  </label>

                  <label className="field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      autoComplete="email"
                      required
                      maxLength={254}
                    />
                  </label>

                  <label className="field">
                    <span>Clinic, hospital, or employer</span>
                    <input
                      type="text"
                      value={form.clinic}
                      onChange={e => update('clinic', e.target.value)}
                      autoComplete="organization"
                      required
                      maxLength={200}
                      placeholder="e.g. Brisbane Neuro Physio, RBWH, sole practice"
                    />
                  </label>

                  <fieldset className="field">
                    <span className="legend">Caseload (tick all that apply)</span>
                    <div className="chips">
                      {CASELOAD_OPTIONS.map(opt => {
                        const active = form.caseload.includes(opt)
                        return (
                          <button
                            type="button"
                            key={opt}
                            className="chip"
                            data-active={active ? '' : undefined}
                            onClick={() => toggleCaseload(opt)}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>

                  <label className="field">
                    <span>What would you most want this to help you with? <em>(optional)</em></span>
                    <textarea
                      value={form.message}
                      onChange={e => update('message', e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder="e.g. Faster MCID interpretation for stroke reviews. Better trend reports for NDIS plan managers. Etc."
                    />
                  </label>

                  {error && <p className="error" role="alert">{error}</p>}

                  <button type="submit" className="primary" disabled={busy}>
                    {busy ? 'Submitting…' : 'Submit pilot application'}
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
    --coral: #ee896f;
    --danger: #b42318;
    --shadow: 0 18px 36px rgba(23, 38, 59, 0.12);
  }

  body { font-family: 'Inter', system-ui, sans-serif; background: var(--soft); color: var(--ink); }

  .page { min-height: 100vh; padding: 32px 24px 64px; }
  .shell { max-width: 1100px; margin: 0 auto; }

  .topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; }
  .backlink { font-size: 13px; color: var(--muted); text-decoration: none; }
  .backlink:hover { color: var(--navy); }

  .layout {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 48px;
    align-items: start;
  }

  .pitch .eyebrow {
    font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--navy); font-weight: 600; margin-bottom: 16px;
  }
  .pitch h1 {
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: 36px; line-height: 1.15; font-weight: 600;
    color: var(--navy-dark); margin-bottom: 18px;
  }
  .pitch .lead { font-size: 16px; line-height: 1.6; color: var(--muted); margin-bottom: 24px; }

  .block { margin-bottom: 20px; }
  .block h2 {
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: 16px; color: var(--ink); margin-bottom: 10px; font-weight: 600;
  }
  .bullets { list-style: none; margin: 0; }
  .bullets li {
    position: relative; padding-left: 22px; margin-bottom: 8px;
    font-size: 14px; color: var(--ink); line-height: 1.55;
  }
  .bullets li::before {
    content: ''; position: absolute; left: 0; top: 9px;
    width: 6px; height: 6px; border-radius: 50%; background: var(--mint);
  }
  .bullets--coral li::before { background: var(--coral); }

  .micro { font-size: 12px; color: var(--subtle); line-height: 1.5; }
  .micro a { color: var(--navy); }

  .card {
    background: var(--surface); border: 1px solid var(--line);
    border-radius: 16px; padding: 32px; box-shadow: var(--shadow);
  }
  .card h2 {
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: 22px; color: var(--navy-dark); margin-bottom: 20px; font-weight: 600;
  }

  .field { display: block; margin-bottom: 14px; border: none; padding: 0; }
  .field > span, .field .legend {
    display: block; font-size: 13px; font-weight: 500;
    color: var(--ink); margin-bottom: 6px;
  }
  .field em { font-style: normal; color: var(--subtle); font-weight: 400; }

  .field input, .field textarea {
    width: 100%; padding: 10px 12px;
    border: 1px solid var(--line); border-radius: 8px;
    background: #fff; font: inherit; color: var(--ink);
    outline: none; transition: border-color 0.15s;
  }
  .field input { height: 42px; }
  .field textarea { resize: vertical; min-height: 96px; line-height: 1.5; }
  .field input:focus, .field textarea:focus {
    border-color: var(--navy);
    box-shadow: 0 0 0 3px rgba(23,61,104,0.12);
  }

  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip {
    background: #fff;
    border: 1px solid var(--line);
    color: var(--ink);
    border-radius: 999px;
    padding: 8px 14px;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .chip:hover { border-color: var(--navy); }
  .chip[data-active] {
    background: var(--navy); border-color: var(--navy); color: #fff;
  }

  .primary {
    width: 100%; height: 46px; margin-top: 8px;
    background: var(--navy); color: #fff;
    border: none; border-radius: 10px;
    font: inherit; font-weight: 600; cursor: pointer;
    transition: background 0.15s;
  }
  .primary:hover:not(:disabled) { background: var(--navy-dark); }
  .primary:disabled { opacity: 0.65; cursor: not-allowed; }

  .error {
    color: var(--danger); font-size: 13px;
    margin-bottom: 8px; padding: 10px 12px;
    background: rgba(180, 35, 24, 0.06); border-radius: 8px;
  }

  .done h2 { margin-bottom: 12px; }
  .done p { font-size: 14px; color: var(--muted); line-height: 1.6; }

  @media (max-width: 800px) {
    .layout { grid-template-columns: 1fr; gap: 32px; }
    .pitch h1 { font-size: 28px; }
    .card { padding: 24px; }
  }
`

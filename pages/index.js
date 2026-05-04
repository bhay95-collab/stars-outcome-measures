import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { ArrowRight, Check, ClipboardCheck, FileText, LineChart, Play } from 'lucide-react'
import { supabase } from '../lib/supabase'
import LogoWordmark from '../components/LogoWordmark'

const MEASURES = [
  '10 Metre Walk Test',
  'Timed Up and Go',
  'Berg Balance Scale',
  '6 Minute Walk Test',
  'Functional Gait Assessment',
  'Postural Assessment Scale',
  'Trunk Impairment Scale',
  'High-level Mobility Assessment',
  'Motor Assessment Scale',
  'Barthel Index',
  'SCIM-III',
]

const WORKFLOW = [
  {
    Icon: ClipboardCheck,
    title: 'Automated scoring',
    text: 'Capture standardised measures with embedded calculations and clean interpretation.',
  },
  {
    Icon: LineChart,
    title: 'Progress visibility',
    text: 'Track meaningful change over time with MCID context and patient-level trends.',
  },
  {
    Icon: FileText,
    title: 'Clinical reporting',
    text: 'Produce consistent summaries for documentation, handover, and outcome review.',
  },
]

const FAQS = [
  ['Who is RehabMetrics IQ for?', 'Physiotherapists, OTs, and rehabilitation teams working across inpatient, outpatient, private practice, and community settings.'],
  ['Does it replace clinical judgement?', 'No. It standardises calculations and reporting so clinicians can spend more time interpreting outcomes and planning care.'],
  ['Can I cancel?', 'Yes. The product has a 14-day free trial and no lock-in.'],
]

function getInterpretation(s) {
  if (s < 0.8) return 'Below community ambulation threshold'
  if (s < 1.2) return 'Independent community ambulation'
  return 'Above average community ambulation'
}

function getClassification(s) {
  if (s < 0.4) return 'Household'
  if (s < 0.8) return 'Limited community'
  if (s < 1.2) return 'Community'
  return 'Full community'
}

const MAX_SCALE_SPEED = 1.6
const MCID_STANDARD = 0.10
const MCID_STROKE = 0.06
const PATIENT_AGE = 68
const PREV_TIME = 12.9

function getClassificationColor(s) {
  if (s < 0.4) return 'var(--danger)'
  if (s < 0.8) return 'var(--amber)'
  return 'var(--mint)'
}

export default function Landing() {
  const router = useRouter()
  const [billing, setBilling] = useState('monthly')
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [time, setTime] = useState(8.2)
  const [steps, setSteps] = useState(12)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/app')
    })
  }, [router])

  const speed = time > 0 ? 10 / time : 0
  const cadence = time > 0 ? (steps / time) * 60 : 0
  const predictedSpeed = 1.79 - (0.0073 * PATIENT_AGE)
  const percentPredicted = predictedSpeed > 0 ? (speed / predictedSpeed) * 100 : 0
  const prevSpeed = 10 / PREV_TIME
  const speedChange = speed - prevSpeed
  const percentChange = prevSpeed > 0 ? (speedChange / prevSpeed) * 100 : 0
  const meetsMCID = speedChange >= MCID_STANDARD
  const classificationColor = speed > 0 ? getClassificationColor(speed) : 'var(--navy)'

  const price = billing === 'monthly' ? '2.99' : '24.99'
  const period = billing === 'monthly' ? 'per month' : 'per year'

  return (
    <>
      <Head>
        <title>RehabMetrics IQ | Clinical Outcome Measures</title>
        <meta name="description" content="Clinical outcome measures for physiotherapists. Automated scoring, MCID tracking, and clinical-grade reports." />
        <link rel="icon" href="/SquareLogo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:wght@600;700&display=swap" rel="stylesheet" />
      </Head>

      <style>{styles}</style>

      <header className="site-header">
        <div className="site-header__inner">
          <LogoWordmark href="/" size="lg" />
          <a href="/login">Log in</a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero__scrim" />
          <div className="hero__inner">
            <div className="hero__copy">
              <p className="eyebrow">AUTOMATED SCORING. CLINICAL-GRADE REPORTING.</p>
              <h1>Data-driven outcomes. <span>Better patient care.</span></h1>
              <p className="hero__sub">
                RehabMetrics helps physiotherapists track what matters most with automated scoring, MCID tracking, and clinical-grade reports—so you can focus on your patients.
              </p>
              <div className="hero__actions">
                <a className="primary-btn" href="/signup">Start 14-day free trial</a>
                <button className="text-btn" type="button" onClick={() => setShowDemoModal(true)}>
                  See how it works <ArrowRight size={15} />
                </button>
              </div>
            </div>

            <ProductPreview />
          </div>
        </section>

        <section className="measure-strip" aria-label="Measures included">
          <div className="measure-strip__inner">
            <span>MEASURES INCLUDED</span>
            <div>
              {MEASURES.map(measure => <small key={measure}>{measure}</small>)}
            </div>
          </div>
        </section>

        <section id="workflow" className="section">
          <div className="section-head">
            <p className="eyebrow">CLINICAL WORKFLOW</p>
            <h2>Outcome measures without the spreadsheet drift.</h2>
          </div>
          <div className="workflow-grid">
            {WORKFLOW.map(({ Icon, title, text }) => (
              <article className="soft-card" key={title}>
                <Icon size={22} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="section pricing-section">
          <div className="section-head centered">
            <p className="eyebrow">PRICING</p>
            <h2>Simple access for modern rehab practice.</h2>
            <p>Start with a free trial. No credit card required.</p>
          </div>

          <div className="billing-toggle" aria-label="Billing period">
            <button type="button" data-active={billing === 'monthly' ? '' : undefined} onClick={() => setBilling('monthly')}>Monthly</button>
            <button type="button" data-active={billing === 'yearly' ? '' : undefined} onClick={() => setBilling('yearly')}>Yearly <span>Save 30%</span></button>
          </div>

          <article className="pricing-card">
            <div>
              <span>{billing === 'monthly' ? 'Monthly' : 'Annual'}</span>
              <strong><em>$</em>{price}</strong>
              <p>{period}</p>
            </div>
            <ul>
              {['All outcome measures', 'Unlimited patients', 'MCID tracking', 'PDF export', 'Secure account access'].map(item => (
                <li key={item}><Check size={16} /> {item}</li>
              ))}
            </ul>
            <a href="/signup" className="primary-btn">Start free trial</a>
          </article>
        </section>

        <section className="section faq-section">
          <div className="section-head">
            <p className="eyebrow">FAQ</p>
            <h2>Clear answers before you start.</h2>
          </div>
          <div className="faq-list">
            {FAQS.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} RehabMetrics IQ</span>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/data-deletion">Data Deletion</a>
        <a href="mailto:Support@RehabMetricsIQ.com">Contact</a>
      </footer>

      {showDemoModal && (
        <DemoModal
          cadence={cadence}
          classificationColor={classificationColor}
          meetsMCID={meetsMCID}
          percentChange={percentChange}
          percentPredicted={percentPredicted}
          prevSpeed={prevSpeed}
          setShowDemoModal={setShowDemoModal}
          setSteps={setSteps}
          setTime={setTime}
          speed={speed}
          speedChange={speedChange}
          steps={steps}
          time={time}
        />
      )}
    </>
  )
}

function ProductPreview() {
  const rows = [
    ['10MWT', '10 Metre Walk Test', '0.94 m/s', 'Community', 'green'],
    ['TUG', 'Timed Up and Go', '11.2 sec', 'Mild risk', 'amber'],
    ['BBS', 'Berg Balance Scale', '42/56', 'MCID met', 'blue'],
    ['6MWT', '6 Minute Walk Test', '387 m', 'Community', 'green'],
    ['FGA', 'Functional Gait Assessment', '21/30', 'Low risk', 'green'],
  ]

  return (
    <div className="preview-card" aria-label="RehabMetrics dashboard preview">
      <div className="preview-card__top">
        <strong>RehabMetrics</strong>
        <span>LIVE SCORING</span>
      </div>
      <div className="preview-tabs">
        <span data-active="">Performance</span>
        <span>Questionnaires</span>
        <span>Summary</span>
      </div>
      <div className="preview-list">
        {rows.map(([abbr, name, score, chip, tone]) => (
          <div className="preview-row" key={abbr}>
            <div>
              <strong>{abbr}</strong>
              <small>{name}</small>
            </div>
            <em>{score}</em>
            <span data-tone={tone}>{chip}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DemoModal({
  cadence,
  classificationColor,
  meetsMCID,
  percentChange,
  percentPredicted,
  prevSpeed,
  setShowDemoModal,
  setSteps,
  setTime,
  speed,
  speedChange,
  steps,
  time,
}) {
  return (
    <div className="demo-overlay" onClick={e => { if (e.target === e.currentTarget) setShowDemoModal(false) }}>
      <div className="demo-modal">
        <button className="icon-close" onClick={() => setShowDemoModal(false)} aria-label="Close">×</button>
        <p className="eyebrow">INTERACTIVE DEMO</p>
        <h2>10 Metre Walk Test</h2>
        <div className="demo-patient">
          <span><small>Patient</small>John Smith</span>
          <span><small>Age</small>{PATIENT_AGE}</span>
          <span><small>Diagnosis</small>Stroke</span>
        </div>
        <div className="demo-fields">
          <label>Time (seconds)<input type="number" min="1" step="0.1" value={time} onChange={e => setTime(parseFloat(e.target.value) || 0)} /></label>
          <label>Steps<input type="number" min="1" step="1" value={steps} onChange={e => setSteps(parseInt(e.target.value, 10) || 0)} /></label>
        </div>
        <div className="demo-results">
          <Metric label="Walking speed" value={speed.toFixed(2)} unit="m/s" />
          <Metric label="Predicted" value={speed > 0 ? percentPredicted.toFixed(0) : '-'} unit="%" />
          <Metric label="Cadence" value={cadence.toFixed(0)} unit="/min" />
        </div>
        <div className="scale-track">
          <span style={{ left: `${Math.min((speed / MAX_SCALE_SPEED) * 100, 100)}%`, background: classificationColor }} />
        </div>
        <div className="demo-interpretation">
          <strong style={{ color: classificationColor }}>{speed > 0 ? getClassification(speed) : '-'}</strong>
          <span>{speed > 0 ? getInterpretation(speed) : '-'}</span>
        </div>
        <div className="change-panel">
          <div><small>Previous</small>{prevSpeed.toFixed(2)} m/s</div>
          <div><small>Change</small>{speed > 0 ? `${speedChange >= 0 ? '+' : ''}${speedChange.toFixed(2)} m/s` : '-'}</div>
          <div><small>Percent</small>{speed > 0 ? `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(0)}%` : '-'}</div>
        </div>
        <p className="reference-note">
          {meetsMCID ? 'Change exceeds MCID.' : 'Change does not exceed MCID.'} MCID: {MCID_STANDARD} m/s general / {MCID_STROKE} m/s stroke.
        </p>
      </div>
    </div>
  )
}

function Metric({ label, value, unit }) {
  return (
    <div className="metric">
      <small>{label}</small>
      <strong>{value}<span>{unit}</span></strong>
    </div>
  )
}

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --navy: #173d68;
    --navy-dark: #102947;
    --ink: #172238;
    --muted: #566271;
    --soft: #eef3f8;
    --line: #d7e0e8;
    --mint: #77c7bd;
    --coral: #ee896f;
    --violet: #8c83c8;
    --amber: #c47b43;
    --danger: #b42318;
    --shadow: 0 18px 36px rgba(23, 38, 59, 0.18);
  }
  html { scroll-behavior: smooth; }
  body { background: #f5f8fb; color: var(--ink); font-family: Inter, sans-serif; }
  a { color: inherit; }
  button, input { font: inherit; }

  .site-header {
    position: relative;
    z-index: 10;
    background: rgba(255,255,255,0.96);
    border-bottom: 1px solid rgba(215,224,232,0.72);
  }
  .site-header__inner {
    max-width: 1088px;
    min-height: 72px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .site-header a:not(.logo-wordmark) {
    color: #111827;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
  }

  .hero {
    position: relative;
    min-height: 604px;
    overflow: hidden;
    background-image: url('https://images.pexels.com/photos/20860617/pexels-photo-20860617.jpeg');
    background-size: cover;
    background-position: center;
  }
  .hero__scrim {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(246,236,218,0.94) 0%, rgba(245,233,212,0.78) 44%, rgba(245,233,212,0.25) 74%),
      linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.16));
  }
  .hero__inner {
    position: relative;
    max-width: 1088px;
    min-height: 604px;
    margin: 0 auto;
    padding: 88px 24px 74px;
    display: grid;
    grid-template-columns: 0.92fr 1.08fr;
    gap: 54px;
    align-items: center;
  }
  .eyebrow {
    color: rgba(23,34,56,0.62);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.16em;
  }
  .hero h1 {
    max-width: 560px;
    margin-top: 18px;
    color: #172238;
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: clamp(48px, 6vw, 74px);
    font-weight: 700;
    line-height: 1.05;
  }
  .hero h1 span { color: rgba(23,34,56,0.52); }
  .hero__sub {
    max-width: 520px;
    margin-top: 24px;
    color: rgba(23,34,56,0.74);
    font-size: 18px;
    line-height: 1.55;
  }
  .hero__actions {
    display: flex;
    align-items: center;
    gap: 28px;
    margin-top: 36px;
  }
  .primary-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0 28px;
    border: 0;
    border-radius: 8px;
    background: var(--navy);
    box-shadow: 0 8px 18px rgba(23,61,104,0.32);
    color: #fff;
    cursor: pointer;
    font-weight: 700;
    text-decoration: none;
  }
  .primary-btn:hover { background: var(--navy-dark); }
  .text-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 0;
    background: transparent;
    color: var(--navy-dark);
    cursor: pointer;
    font-weight: 600;
  }

  .preview-card {
    justify-self: end;
    width: min(100%, 516px);
    padding: 28px 24px 30px;
    border: 1px solid rgba(255,255,255,0.56);
    border-radius: 12px;
    background: rgba(255,255,255,0.62);
    box-shadow: var(--shadow);
    backdrop-filter: blur(18px);
  }
  .preview-card__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 24px;
  }
  .preview-card__top strong {
    color: var(--navy);
    font-family: Georgia, serif;
    font-size: 20px;
  }
  .preview-card__top span {
    padding: 4px 8px;
    border: 1px solid rgba(23,61,104,0.16);
    border-radius: 999px;
    background: rgba(238,243,248,0.9);
    color: var(--navy);
    font-size: 10px;
    font-weight: 800;
  }
  .preview-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;
  }
  .preview-tabs span {
    padding: 8px 12px;
    border-radius: 6px;
    color: #445064;
    font-size: 13px;
    font-weight: 500;
  }
  .preview-tabs span[data-active] {
    background: #d8e9fb;
    color: var(--navy);
  }
  .preview-list {
    display: grid;
    gap: 12px;
  }
  .preview-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 14px;
    min-height: 50px;
    padding: 10px 12px;
    border: 1px solid rgba(23,61,104,0.1);
    border-radius: 8px;
    background: rgba(255,255,255,0.76);
    box-shadow: 0 2px 6px rgba(23,38,59,0.08);
  }
  .preview-row strong, .preview-row small { display: block; }
  .preview-row strong {
    color: #111827;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    font-weight: 800;
  }
  .preview-row small {
    margin-top: 2px;
    color: #4e5867;
    font-size: 12px;
  }
  .preview-row em {
    color: #111827;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 16px;
    font-style: normal;
    font-weight: 700;
  }
  .preview-row span {
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
  }
  .preview-row span[data-tone="green"] { background: #e8f4ec; color: #2b6842; }
  .preview-row span[data-tone="amber"] { background: #fff0d9; color: #8a5718; }
  .preview-row span[data-tone="blue"] { background: #e7f0fb; color: var(--navy); }

  .measure-strip {
    position: relative;
    z-index: 2;
    background: #fff;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  .measure-strip__inner {
    max-width: 1088px;
    min-height: 76px;
    margin: 0 auto;
    padding: 14px 24px;
    display: grid;
    grid-template-columns: 150px 1fr;
    align-items: center;
    gap: 10px;
  }
  .measure-strip__inner > span {
    color: #707a88;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.16em;
  }
  .measure-strip__inner div {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 12px;
  }
  .measure-strip small {
    padding: 6px 16px;
    border-radius: 999px;
    background: var(--navy);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12);
    color: #fff;
    font-size: 12px;
  }

  .section {
    max-width: 1088px;
    margin: 0 auto;
    padding: 76px 24px;
  }
  .section-head {
    max-width: 620px;
    margin-bottom: 24px;
  }
  .section-head h2 {
    margin-top: 10px;
    color: var(--ink);
    font-size: clamp(28px, 3vw, 40px);
    line-height: 1.14;
  }
  .section-head > p:not(.eyebrow) {
    margin-top: 10px;
    color: var(--muted);
  }
  .centered {
    text-align: center;
    margin-inline: auto;
  }
  .workflow-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }
  .soft-card, .pricing-card, details {
    border: 1px solid rgba(215,224,232,0.9);
    border-radius: 14px;
    background: rgba(255,255,255,0.9);
    box-shadow: 0 14px 32px rgba(23,38,59,0.08);
  }
  .soft-card {
    padding: 24px;
  }
  .soft-card svg { color: var(--navy); }
  .soft-card h3 { margin-top: 16px; font-size: 18px; }
  .soft-card p { margin-top: 8px; color: var(--muted); line-height: 1.55; }

  .pricing-section {
    display: grid;
    justify-items: center;
  }
  .billing-toggle {
    display: inline-flex;
    gap: 4px;
    padding: 4px;
    margin-bottom: 18px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: #fff;
  }
  .billing-toggle button {
    min-height: 34px;
    padding: 0 16px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    font-weight: 700;
  }
  .billing-toggle button[data-active] {
    background: var(--navy);
    color: #fff;
  }
  .billing-toggle span { font-size: 11px; opacity: 0.8; }
  .pricing-card {
    width: min(100%, 500px);
    padding: 28px;
  }
  .pricing-card span {
    color: var(--navy);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .pricing-card strong {
    display: block;
    margin-top: 8px;
    color: var(--ink);
    font-size: 58px;
    line-height: 1;
  }
  .pricing-card strong em {
    font-size: 22px;
    font-style: normal;
    vertical-align: super;
  }
  .pricing-card p, .pricing-card li {
    color: var(--muted);
  }
  .pricing-card ul {
    display: grid;
    gap: 10px;
    margin: 24px 0;
    list-style: none;
  }
  .pricing-card li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pricing-card li svg { color: var(--mint); }

  .faq-section {
    display: grid;
    grid-template-columns: 0.8fr 1.2fr;
    gap: 28px;
  }
  .faq-list { display: grid; gap: 12px; }
  details { padding: 18px 20px; }
  summary { cursor: pointer; font-weight: 800; }
  details p {
    margin-top: 12px;
    color: var(--muted);
    line-height: 1.55;
  }

  .footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 28px 24px;
    background: var(--ink);
    color: #dce6ef;
    font-size: 13px;
  }
  .footer a { color: #dce6ef; text-decoration: none; }
  .footer a:hover { color: #fff; }

  .demo-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(23,34,56,0.54);
  }
  .demo-modal {
    position: relative;
    width: min(100%, 620px);
    max-height: 90vh;
    overflow: auto;
    padding: 24px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: #fff;
    box-shadow: var(--shadow);
  }
  .icon-close {
    position: absolute;
    top: 14px;
    right: 16px;
    width: 32px;
    height: 32px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: #fff;
    color: var(--muted);
    cursor: pointer;
    font-size: 20px;
  }
  .demo-modal h2 { margin: 6px 0 16px; }
  .demo-patient, .demo-fields, .demo-results, .change-panel {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .demo-patient {
    padding: 12px;
    margin-bottom: 16px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--soft);
  }
  .demo-patient small, .change-panel small, .metric small {
    display: block;
    color: #7a8594;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
  }
  .demo-fields {
    grid-template-columns: repeat(2, 1fr);
    margin-bottom: 14px;
  }
  .demo-fields label {
    display: grid;
    gap: 6px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 700;
  }
  .demo-fields input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    outline: none;
  }
  .metric {
    min-height: 80px;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: 10px;
  }
  .metric strong {
    display: block;
    margin-top: 10px;
    color: var(--navy);
    font-size: 26px;
  }
  .metric span {
    margin-left: 3px;
    color: #7a8594;
    font-size: 12px;
  }
  .scale-track {
    position: relative;
    height: 8px;
    margin: 16px 0;
    border-radius: 999px;
    background: var(--line);
  }
  .scale-track span {
    position: absolute;
    top: -4px;
    width: 12px;
    height: 16px;
    border-radius: 4px;
    transform: translateX(-50%);
  }
  .demo-interpretation {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
    color: var(--muted);
  }
  .change-panel {
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--soft);
  }
  .reference-note {
    margin-top: 12px;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.5;
  }

  @media (max-width: 960px) {
    .hero__inner, .faq-section { grid-template-columns: 1fr; }
    .preview-card { justify-self: start; }
    .workflow-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 700px) {
    .site-header__inner, .hero__inner, .section, .measure-strip__inner { padding-left: 18px; padding-right: 18px; }
    .hero__inner { padding-top: 56px; }
    .hero__actions { align-items: stretch; flex-direction: column; gap: 16px; }
    .measure-strip__inner { grid-template-columns: 1fr; }
    .preview-row { grid-template-columns: 1fr; }
    .demo-patient, .demo-results, .change-panel, .demo-fields { grid-template-columns: 1fr; }
  }
`

import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  FileText,
  LineChart,
  Play,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const MEASURE_GROUPS = [
  ['10MWT', 'TUG', '6MWT', 'FGA', 'BBS', 'HiMAT'],
  ['SCIM-III', 'Barthel', 'PASS', 'TIS', 'MAS', 'AMP'],
  ['HADS', 'PDQ-8', 'RPQ', 'ABC Scale', 'COVS', 'SARA'],
]

const WORKFLOW = [
  {
    Icon: ClipboardCheck,
    title: 'Structured Assessment',
    text: 'Record standardised outcome measures with built-in scoring and interpretation.',
  },
  {
    Icon: LineChart,
    title: 'Progress Tracking',
    text: 'Compare current and previous scores, including MCID context where available.',
  },
  {
    Icon: FileText,
    title: 'Clinical Output',
    text: 'Export concise patient summaries and keep your documentation consistent.',
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
  if (s < 0.4) return 'var(--color-danger)'
  if (s < 0.8) return 'var(--color-amber)'
  return 'var(--color-teal)'
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
  const classificationColor = speed > 0 ? getClassificationColor(speed) : 'var(--color-primary)'

  const price = billing === 'monthly' ? '2.99' : '24.99'
  const period = billing === 'monthly' ? 'per month' : 'per year'

  return (
    <>
      <Head>
        <title>RehabMetrics IQ | Clinical Outcome Measures</title>
        <meta name="description" content="Clinical outcome measures for rehabilitation teams with automated scoring, MCID tracking, and PDF export." />
        <link rel="icon" href="/SquareLogo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <style>{styles}</style>

      <header className="site-header">
        <a href="/" className="brand" aria-label="RehabMetrics IQ home">
          <img src="/SquareLogo.png" alt="" aria-hidden="true" />
          <span>RehabMetrics <strong>IQ</strong></span>
        </a>
        <nav className="nav-links" aria-label="Primary">
          <a href="#measures">Measures</a>
          <a href="#workflow">Workflow</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="header-actions">
          <a href="/login" className="link-btn">Log in</a>
          <a href="/signup" className="primary-btn">Start trial</a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Evidence-based outcome measures</span>
            <h1>Precision outcomes for modern rehabilitation.</h1>
            <p>
              Standardise assessments, automate scoring, and track meaningful change across your rehab caseload.
            </p>
            <div className="hero-actions">
              <a href="/signup" className="primary-btn large">Start 14-day free trial <ArrowRight size={16} /></a>
              <button type="button" className="secondary-btn large" onClick={() => setShowDemoModal(true)}>
                <Play size={16} /> View demo
              </button>
            </div>
          </div>

          <ProductPreview />
        </section>

        <section className="metrics-band" aria-label="Product metrics">
          <Metric label="Outcome measures" value="25+" />
          <Metric label="Automated calculations" value="100%" />
          <Metric label="Trial length" value="14 days" />
          <Metric label="Set-up time" value="< 5 min" />
        </section>

        <section id="measures" className="section">
          <div className="section-head">
            <span className="eyebrow">Supported Measures</span>
            <h2>Built around the assessments rehab teams already use.</h2>
          </div>
          <div className="measure-grid">
            {MEASURE_GROUPS.flatMap((group, groupIndex) =>
              group.map(measure => (
                <div className="measure-cell" key={measure}>
                  <span>{measure}</span>
                  <small>{groupIndex === 0 ? 'Performance' : groupIndex === 1 ? 'Function' : 'Questionnaire'}</small>
                </div>
              ))
            )}
          </div>
        </section>

        <section id="workflow" className="section alt">
          <div className="section-head">
            <span className="eyebrow">Clinical Workflow</span>
            <h2>Less spreadsheet work. More useful outcome data.</h2>
          </div>
          <div className="workflow-grid">
            {WORKFLOW.map(({ Icon, title, text }) => (
              <article className="workflow-card" key={title}>
                <Icon size={22} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="section pricing-section">
          <div className="section-head centered">
            <span className="eyebrow">Pricing</span>
            <h2>Simple pricing for solo clinicians and small teams.</h2>
            <p>Start with a free trial. No credit card required.</p>
          </div>

          <div className="billing-toggle" aria-label="Billing period">
            <button type="button" data-active={billing === 'monthly' ? '' : undefined} onClick={() => setBilling('monthly')}>Monthly</button>
            <button type="button" data-active={billing === 'yearly' ? '' : undefined} onClick={() => setBilling('yearly')}>Yearly <span>Save 30%</span></button>
          </div>

          <article className="pricing-card">
            <div>
              <span className="plan-label">{billing === 'monthly' ? 'Monthly' : 'Annual'}</span>
              <div className="price"><span>$</span>{price}</div>
              <p>{period}</p>
            </div>
            <ul>
              {['All outcome measures', 'Unlimited patients', 'MCID tracking', 'PDF export', 'Secure account access'].map(item => (
                <li key={item}><Check size={16} /> {item}</li>
              ))}
            </ul>
            <a href="/signup" className="primary-btn large">Start free trial</a>
          </article>
        </section>

        <section className="section faq-section">
          <div className="section-head">
            <span className="eyebrow">FAQ</span>
            <h2>Clear answers before you start.</h2>
          </div>
          <div className="faq-list">
            {FAQS.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
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
  return (
    <div className="product-preview" aria-label="RehabMetrics IQ product preview">
      <div className="preview-topbar">
        <div>
          <span className="preview-title">Patient Summary</span>
          <small>JS · Stroke · Last assessment today</small>
        </div>
        <span className="status-chip">Live scoring</span>
      </div>
      <div className="preview-layout">
        <aside>
          {['JS', 'AL', 'MK', 'RT'].map((initials, index) => (
            <div className={index === 0 ? 'preview-patient active' : 'preview-patient'} key={initials}>
              <strong>{initials}</strong>
              <span>{index === 0 ? 'Stroke' : index === 1 ? 'TBI' : index === 2 ? 'SCI' : 'Vestibular'}</span>
            </div>
          ))}
        </aside>
        <div className="preview-main">
          <div className="score-row">
            <Score label="10MWT" value="0.94" unit="m/s" intent="good" />
            <Score label="TUG" value="11.2" unit="sec" intent="amber" />
            <Score label="BBS" value="42" unit="/56" intent="blue" />
          </div>
          <div className="chart-card">
            <div className="chart-head">
              <span>10MWT Progress</span>
              <small>+0.16 m/s from baseline</small>
            </div>
            <div className="bars" aria-hidden="true">
              {[38, 46, 52, 63, 72].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
            </div>
          </div>
          <div className="preview-table">
            {[
              ['FGA', '21/30', 'Low risk'],
              ['6MWT', '387 m', 'Community'],
              ['HADS', '5/21', 'Normal'],
            ].map(row => (
              <div key={row[0]}>
                <span>{row[0]}</span>
                <strong>{row[1]}</strong>
                <em>{row[2]}</em>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function Score({ label, value, unit, intent }) {
  return (
    <div className={`score-card ${intent}`}>
      <span>{label}</span>
      <strong>{value}<small>{unit}</small></strong>
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
        <span className="eyebrow">Interactive Demo</span>
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
          <Score label="Walking speed" value={speed.toFixed(2)} unit="m/s" intent="blue" />
          <Score label="Predicted" value={speed > 0 ? percentPredicted.toFixed(0) : '—'} unit="%" intent="good" />
          <Score label="Cadence" value={cadence.toFixed(0)} unit="/min" intent="amber" />
        </div>
        <div className="scale-track">
          <span style={{ left: `${Math.min((speed / MAX_SCALE_SPEED) * 100, 100)}%`, background: classificationColor }} />
        </div>
        <div className="demo-interpretation">
          <strong style={{ color: classificationColor }}>{speed > 0 ? getClassification(speed) : '—'}</strong>
          <span>{speed > 0 ? getInterpretation(speed) : '—'}</span>
        </div>
        <div className="change-panel">
          <div><small>Previous</small>{prevSpeed.toFixed(2)} m/s</div>
          <div><small>Change</small>{speed > 0 ? `${speedChange >= 0 ? '+' : ''}${speedChange.toFixed(2)} m/s` : '—'}</div>
          <div><small>Percent</small>{speed > 0 ? `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(0)}%` : '—'}</div>
        </div>
        <p className="reference-note">
          {meetsMCID ? 'Change exceeds MCID.' : 'Change does not exceed MCID.'} MCID: {MCID_STANDARD} m/s general · {MCID_STROKE} m/s stroke.
        </p>
      </div>
    </div>
  )
}

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --color-primary: #236499;
    --color-primary-dark: #17496f;
    --color-primary-soft: #e8f1fb;
    --color-teal: #1f8a8a;
    --color-teal-soft: #e1f5f3;
    --color-amber: #a76508;
    --color-amber-soft: #fff4dc;
    --color-danger: #b42318;
    --color-ink: #17212b;
    --color-muted: #526273;
    --color-subtle: #7b8794;
    --color-surface: #ffffff;
    --color-canvas: #f4f7fb;
    --color-panel: #eef4fb;
    --color-border: #d2dce8;
    --shadow: 0 16px 40px rgba(18, 35, 54, 0.12);
    --radius: 8px;
  }
  html { scroll-behavior: smooth; }
  body { font-family: Inter, sans-serif; background: var(--color-canvas); color: var(--color-ink); }
  a { color: inherit; }
  button, input { font: inherit; }

  .site-header {
    position: sticky; top: 0; z-index: 20;
    display: flex; align-items: center; gap: 24px;
    min-height: 64px; padding: 0 32px;
    background: rgba(255,255,255,0.94); border-bottom: 1px solid var(--color-border);
    backdrop-filter: blur(10px);
  }
  .brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; font-weight: 800; }
  .brand img { width: 30px; height: 30px; }
  .brand strong { color: var(--color-teal); }
  .nav-links { display: flex; gap: 20px; margin-left: auto; }
  .nav-links a, .link-btn { color: var(--color-muted); font-size: 14px; font-weight: 600; text-decoration: none; }
  .nav-links a:hover, .link-btn:hover { color: var(--color-primary); }
  .header-actions { display: flex; align-items: center; gap: 10px; }
  .primary-btn, .secondary-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    min-height: 40px; padding: 0 16px; border-radius: var(--radius);
    font-size: 14px; font-weight: 700; text-decoration: none; cursor: pointer;
  }
  .primary-btn { color: #fff; background: var(--color-primary); border: 1px solid var(--color-primary); }
  .primary-btn:hover { background: var(--color-primary-dark); }
  .secondary-btn { color: var(--color-primary); background: #fff; border: 1px solid var(--color-border); }
  .secondary-btn:hover { border-color: var(--color-primary); background: var(--color-primary-soft); }
  .large { min-height: 48px; padding: 0 20px; }

  .hero {
    max-width: 1220px; margin: 0 auto;
    display: grid; grid-template-columns: minmax(320px, 0.86fr) minmax(520px, 1.14fr);
    gap: 32px; align-items: center;
    padding: 52px 32px 28px;
  }
  .eyebrow {
    display: inline-flex; align-items: center; min-height: 24px;
    color: var(--color-teal); font-size: 11px; font-weight: 800;
    letter-spacing: 0.08em; text-transform: uppercase;
  }
  .hero h1 { max-width: 660px; margin-top: 12px; font-size: clamp(38px, 5vw, 66px); line-height: 1.02; letter-spacing: 0; }
  .hero-copy p { max-width: 600px; margin-top: 18px; color: var(--color-muted); font-size: 18px; line-height: 1.6; }
  .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }

  .product-preview {
    min-width: 0; background: var(--color-surface); border: 1px solid var(--color-border);
    border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden;
  }
  .preview-topbar {
    display: flex; justify-content: space-between; gap: 16px; padding: 16px 18px;
    border-bottom: 1px solid var(--color-border); background: #fbfdff;
  }
  .preview-title { display: block; font-weight: 800; }
  .preview-topbar small, .chart-head small { color: var(--color-subtle); font-size: 12px; }
  .status-chip {
    height: 24px; padding: 4px 8px; border-radius: 6px;
    color: #075d56; background: var(--color-teal-soft); border: 1px solid #b8e3dd;
    font-size: 11px; font-weight: 800; text-transform: uppercase;
  }
  .preview-layout { display: grid; grid-template-columns: 150px 1fr; min-height: 430px; }
  .preview-layout aside { background: var(--color-panel); border-right: 1px solid var(--color-border); padding: 12px; }
  .preview-patient {
    display: grid; grid-template-columns: 34px 1fr; align-items: center; gap: 10px;
    padding: 10px 8px; border-left: 3px solid transparent; border-radius: 6px;
  }
  .preview-patient strong {
    display: inline-flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 50%; background: #fff; border: 1px solid var(--color-border);
    color: var(--color-primary); font-size: 12px;
  }
  .preview-patient span { color: var(--color-muted); font-size: 12px; }
  .preview-patient.active { background: #fff; border-left-color: var(--color-primary); }
  .preview-main { padding: 16px; min-width: 0; }
  .score-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .score-card {
    min-height: 92px; padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius); background: #fff;
  }
  .score-card span { display: block; color: var(--color-muted); font-size: 12px; font-weight: 700; }
  .score-card strong { display: block; margin-top: 12px; color: var(--color-primary); font-size: 28px; line-height: 1; font-variant-numeric: tabular-nums; }
  .score-card small { margin-left: 3px; color: var(--color-subtle); font-size: 13px; }
  .score-card.good strong { color: var(--color-teal); }
  .score-card.amber strong { color: var(--color-amber); }
  .chart-card { margin-top: 12px; padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius); }
  .chart-head { display: flex; justify-content: space-between; gap: 12px; color: var(--color-ink); font-size: 13px; font-weight: 800; }
  .bars { display: flex; align-items: end; gap: 12px; height: 150px; padding-top: 18px; }
  .bars span { flex: 1; min-width: 24px; border-radius: 6px 6px 0 0; background: linear-gradient(180deg, var(--color-teal), var(--color-primary)); }
  .preview-table { margin-top: 12px; border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; }
  .preview-table div { display: grid; grid-template-columns: 70px 1fr 1.2fr; gap: 12px; padding: 10px 12px; border-bottom: 1px solid var(--color-border); font-size: 13px; }
  .preview-table div:last-child { border-bottom: 0; }
  .preview-table span { color: var(--color-primary); font-weight: 800; }
  .preview-table em { color: var(--color-muted); font-style: normal; }

  .metrics-band {
    max-width: 1220px; margin: 0 auto 24px; padding: 0 32px;
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  }
  .metrics-band div, .workflow-card, .measure-cell, .pricing-card, details {
    background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius);
  }
  .metrics-band div { padding: 16px; }
  .metrics-band strong { display: block; color: var(--color-primary); font-size: 24px; font-variant-numeric: tabular-nums; }
  .metrics-band span { color: var(--color-muted); font-size: 13px; }

  .section { max-width: 1220px; margin: 0 auto; padding: 68px 32px; }
  .section.alt { max-width: none; background: #fff; border-block: 1px solid var(--color-border); }
  .section.alt > * { max-width: 1156px; margin-inline: auto; }
  .section-head { max-width: 680px; margin-bottom: 24px; }
  .section-head h2 { margin-top: 8px; font-size: clamp(26px, 3vw, 38px); line-height: 1.14; }
  .section-head p { margin-top: 10px; color: var(--color-muted); }
  .centered { text-align: center; margin-inline: auto; }
  .measure-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
  .measure-cell { padding: 12px; min-height: 76px; }
  .measure-cell span { display: block; color: var(--color-primary); font-weight: 800; }
  .measure-cell small { display: block; margin-top: 10px; color: var(--color-muted); font-size: 12px; }
  .workflow-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .workflow-card { padding: 20px; }
  .workflow-card svg { color: var(--color-teal); }
  .workflow-card h3 { margin-top: 14px; font-size: 17px; }
  .workflow-card p { margin-top: 8px; color: var(--color-muted); line-height: 1.6; }

  .pricing-section { display: grid; justify-items: center; }
  .billing-toggle { display: inline-flex; gap: 4px; padding: 4px; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius); margin-bottom: 16px; }
  .billing-toggle button { min-height: 36px; padding: 0 14px; border: 0; border-radius: 6px; background: transparent; color: var(--color-muted); cursor: pointer; font-weight: 700; }
  .billing-toggle button[data-active] { background: var(--color-primary); color: #fff; }
  .billing-toggle span { color: inherit; opacity: 0.8; font-size: 11px; }
  .pricing-card { width: min(100%, 520px); padding: 24px; }
  .plan-label { color: var(--color-teal); font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .price { margin-top: 8px; color: var(--color-ink); font-size: 56px; font-weight: 800; line-height: 1; }
  .price span { font-size: 22px; vertical-align: super; }
  .pricing-card p { color: var(--color-muted); }
  .pricing-card ul { display: grid; gap: 10px; margin: 22px 0; list-style: none; }
  .pricing-card li { display: flex; align-items: center; gap: 8px; color: var(--color-muted); }
  .pricing-card li svg { color: var(--color-teal); }
  .faq-section { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 24px; }
  .faq-list { display: grid; gap: 10px; }
  details { padding: 16px; }
  summary { cursor: pointer; font-weight: 800; }
  details p { margin-top: 10px; color: var(--color-muted); line-height: 1.6; }
  .footer {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 16px;
    padding: 28px 32px; background: var(--color-ink); color: #d8e1ea; font-size: 13px;
  }
  .footer a { color: #d8e1ea; text-decoration: none; }
  .footer a:hover { color: #fff; }

  .demo-overlay { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(23,33,43,0.54); }
  .demo-modal { position: relative; width: min(100%, 620px); max-height: 90vh; overflow: auto; background: #fff; border-radius: var(--radius); border: 1px solid var(--color-border); box-shadow: var(--shadow); padding: 24px; }
  .icon-close { position: absolute; top: 14px; right: 16px; width: 32px; height: 32px; border: 1px solid var(--color-border); border-radius: 6px; background: #fff; cursor: pointer; color: var(--color-muted); font-size: 20px; }
  .demo-modal h2 { margin: 6px 0 16px; }
  .demo-patient, .demo-fields, .demo-results, .change-panel { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .demo-patient { padding: 12px; background: var(--color-canvas); border: 1px solid var(--color-border); border-radius: var(--radius); margin-bottom: 16px; }
  .demo-patient small, .change-panel small { display: block; color: var(--color-subtle); font-size: 11px; font-weight: 800; text-transform: uppercase; }
  .demo-fields { grid-template-columns: repeat(2, 1fr); margin-bottom: 14px; }
  .demo-fields label { display: grid; gap: 6px; color: var(--color-muted); font-size: 13px; font-weight: 700; }
  .demo-fields input { width: 100%; border: 1px solid var(--color-border); border-radius: var(--radius); padding: 10px 12px; outline: none; }
  .demo-fields input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(35,100,153,0.12); }
  .scale-track { position: relative; height: 8px; margin: 16px 0; background: var(--color-border); border-radius: 999px; }
  .scale-track span { position: absolute; top: -4px; width: 12px; height: 16px; border-radius: 4px; transform: translateX(-50%); }
  .demo-interpretation { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 12px; color: var(--color-muted); }
  .change-panel { padding: 12px; background: var(--color-canvas); border-radius: var(--radius); border: 1px solid var(--color-border); }
  .reference-note { margin-top: 12px; color: var(--color-muted); font-size: 13px; line-height: 1.5; }

  @media (max-width: 980px) {
    .hero, .faq-section { grid-template-columns: 1fr; }
    .product-preview { order: -1; }
    .measure-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 720px) {
    .site-header { padding: 12px 16px; flex-wrap: wrap; }
    .nav-links { order: 3; width: 100%; justify-content: space-between; margin-left: 0; }
    .header-actions { margin-left: auto; }
    .hero, .section, .metrics-band { padding-left: 16px; padding-right: 16px; }
    .preview-layout { grid-template-columns: 1fr; }
    .preview-layout aside { display: none; }
    .score-row, .workflow-grid, .metrics-band, .demo-patient, .demo-results, .change-panel { grid-template-columns: 1fr; }
    .measure-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 480px) {
    .hero h1 { font-size: 36px; }
    .hero-actions, .header-actions { width: 100%; }
    .primary-btn, .secondary-btn { width: 100%; }
    .measure-grid, .demo-fields { grid-template-columns: 1fr; }
  }
`

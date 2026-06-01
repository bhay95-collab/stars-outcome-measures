import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Accessibility, ArrowRight, Check, ChevronDown, ClipboardCheck, FileText, LineChart, Route, Smartphone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { hasSupabaseAuthErrorUrl, isSupabaseAuthCallbackUrl } from '../lib/auth-routing'
import AuthGateway from '../components/AuthGateway'
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
    text: 'Capture physiotherapy-focused outcome measures with embedded calculations and clean interpretation.',
  },
  {
    Icon: LineChart,
    title: 'Progress visibility',
    text: 'Track meaningful change over time with Minimally Clinically Important Difference context and patient-level trends.',
  },
  {
    Icon: FileText,
    title: 'Clinical reporting',
    text: 'Produce consistent summaries for documentation, handover, and outcome review.',
  },
]

const CAPABILITIES = [
  {
    Icon: Route,
    title: 'Smart Rehab Pathway',
    text: 'Uses diagnosis and saved assessments to recommend baseline measures, flag reassessments that are due, and show pathway coverage for each patient.',
  },
  {
    Icon: Accessibility,
    title: 'Wheelchair prescription support',
    text: 'A structured workspace for seating and mobility reasoning, measurements, posture and function notes, environmental constraints, trial planning, and supplier briefs.',
  },
  {
    Icon: Smartphone,
    title: 'Phone app coming soon',
    text: 'A mobile companion is in development for faster bedside, gym, ward, and community assessment capture while the full web app remains available now.',
  },
  {
    Icon: FileText,
    title: 'Reports patients can understand',
    text: 'Plain-language summaries, clinical interpretation, trend views, and PDF reporting help turn scores into useful communication.',
  },
]

const FAQS = [
  ['Will this fit the patients I see every week?', 'RehabMetrics IQ is built for physiotherapists and physiotherapy-led rehabilitation teams working across neurological, amputee, reconditioning, cardiorespiratory, community, inpatient, outpatient, and private practice caseloads. The measure library is focused on gait, balance, endurance, mobility, independence, fatigue, symptoms, and neurological recovery.'],
  ['What do I get from the first assessment?', 'You get automated scoring, interpretation, a clean baseline, and a patient dashboard that starts tracking change over time. When a diagnosis is recorded, the pathway guidance also shows which recommended baseline measures are still missing.'],
  ['How does this help beyond calculating a score?', 'The value is in the clinical layer around the score: trend views, Minimally Clinically Important Difference context, pathway coverage, reassessment prompts, plain-language summaries, and reports that make progress easier to explain.'],
  ['Will it make documentation faster?', 'Yes. The aim is to remove spreadsheet work, duplicated calculations, and manually rewritten outcome summaries. You can move from recorded measures to patient-friendly summaries, clinical interpretation, and report exports with much less admin.'],
  ['How much setup is required?', 'Very little. Add a patient, record a diagnosis if you have one, and start entering measures. The product is designed to become useful from the first baseline rather than requiring a long configuration project.'],
  ['Can I rely on it for clinical decisions?', 'Use it as a clinical decision-support and documentation tool, not as a replacement for clinical judgement. RehabMetrics IQ standardises calculations and highlights patterns, but diagnosis, risk management, and treatment planning stay with the clinician.'],
  ['What if it does not fit my workflow?', 'Start with the 14-day free trial and test it with real patients. After the trial, choose monthly or annual access, and cancel without lock-in if it is not the right fit.'],
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
const CANONICAL_HOME = 'https://www.rehabmetricsiq.com/'
const AUTH_CALLBACK_BOOTSTRAP_SCRIPT = `
try {
  var url = new URL(window.location.href);
  var hash = new URLSearchParams((url.hash || '').replace(/^#/, ''));
  var search = url.searchParams;
  if (
    search.has('code') ||
    search.has('error') ||
    search.has('error_code') ||
    search.has('error_description') ||
    hash.has('access_token') ||
    hash.has('refresh_token') ||
    hash.has('error') ||
    hash.has('error_code') ||
    hash.has('error_description')
  ) {
    document.documentElement.setAttribute('data-auth-callback', 'true');
  }
} catch (error) {}
`

export async function getServerSideProps({ resolvedUrl = '/' } = {}) {
  return {
    props: {
      initialAuthCallback: isSupabaseAuthCallbackUrl(resolvedUrl),
    },
  }
}

function getClassificationColor(s) {
  if (s < 0.4) return 'var(--danger)'
  if (s < 0.8) return 'var(--amber)'
  return 'var(--mint)'
}

export default function Landing({ initialAuthCallback = false }) {
  const router = useRouter()
  const [authGatewayVisible, setAuthGatewayVisible] = useState(initialAuthCallback)
  const [billing, setBilling] = useState('monthly')
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [time, setTime] = useState(8.2)
  const [steps, setSteps] = useState(12)

  useEffect(() => {
    const currentUrl = window.location.href
    const isAuthCallback = isSupabaseAuthCallbackUrl(currentUrl)
    if (isAuthCallback) {
      document.documentElement.setAttribute('data-auth-callback', 'true')
      setAuthGatewayVisible(true)
    } else {
      document.documentElement.removeAttribute('data-auth-callback')
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setAuthGatewayVisible(true)
        router.replace('/app')
        return
      }

      if (isAuthCallback && hasSupabaseAuthErrorUrl(currentUrl)) {
        router.replace('/login')
      }
    }).catch(() => {
      if (isAuthCallback) router.replace('/login')
    })
  }, [router])

  useEffect(() => {
    if (authGatewayVisible) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [authGatewayVisible])

  const speed = time > 0 ? 10 / time : 0
  const cadence = time > 0 ? (steps / time) * 60 : 0
  const predictedSpeed = 1.79 - (0.0073 * PATIENT_AGE)
  const percentPredicted = predictedSpeed > 0 ? (speed / predictedSpeed) * 100 : 0
  const prevSpeed = 10 / PREV_TIME
  const speedChange = speed - prevSpeed
  const percentChange = prevSpeed > 0 ? (speedChange / prevSpeed) * 100 : 0
  const meetsMCID = speedChange >= MCID_STANDARD
  const classificationColor = speed > 0 ? getClassificationColor(speed) : 'var(--navy)'

  const price = billing === 'monthly' ? '29' : '250'
  const period = billing === 'monthly' ? 'per month' : 'per year'

  return (
    <>
      <Head>
        <title>RehabMetrics IQ | Clinical Outcome Measures</title>
        <meta name="description" content="You scored the test. Now what does it mean? RehabMetrics IQ turns rehabilitation outcome measures into clinical interpretation, MCID-aware progress, and reports your team, GP, and funder can actually use." />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={CANONICAL_HOME} />
        <meta property="og:url" content={CANONICAL_HOME} />
        <meta property="og:title" content="RehabMetrics IQ | Clinical Outcome Measures" />
        <meta property="og:description" content="You scored the test. Now what does it mean? RehabMetrics IQ turns rehabilitation outcome measures into clinical interpretation, MCID-aware progress, and reports your team, GP, and funder can actually use." />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/SquareLogo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:wght@600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: AUTH_CALLBACK_BOOTSTRAP_SCRIPT }} />
      </Head>

      <style>{styles}</style>

      <AuthGateway
        active={authGatewayVisible}
        landingGateway
        title="Opening RehabMetrics IQ"
        message="Checking your secure session."
      />

      <div className="landing-frame" data-auth-hidden={authGatewayVisible ? 'true' : undefined}>
        <header className="site-header">
          <div className="site-header__inner">
            <LogoWordmark href="/" size="xl" />
            <a href="/login">Log in</a>
          </div>
        </header>

        <main>
          <section className="hero">
            <video
              className="hero__video"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="/assets/landing-hero-physio.jpg"
              aria-hidden="true"
            >
              <source src="/assets/videos/hero-loop.mp4" type="video/mp4" />
            </video>
            <div className="hero__focus-blur" />
            <div className="hero__scrim" />
            <div className="hero__inner">
              <div className="hero__copy">
                <p className="eyebrow">FOR REHABILITATION PHYSIOTHERAPISTS</p>
                <h1>You scored the test. <span>Now what does it mean?</span></h1>
                <p className="hero__sub">
                  RehabMetrics IQ turns rehabilitation outcome measures into clinical interpretation, MCID-aware progress, and reports your team, GP, and funder can actually use.
                </p>
                <div className="hero__actions">
                  <a className="primary-btn" href="/signup">Start 14-day free trial</a>
                  <button className="text-btn" type="button" onClick={() => setShowDemoModal(true)}>
                    See how it works <ArrowRight size={15} />
                  </button>
                </div>
                <div className="hero__proof" aria-label="Included product capabilities">
                  <span>Physiotherapy-focused measures</span>
                  <span>Smart Rehab Pathways</span>
                  <span>Wheelchair prescription support</span>
                  <span>Phone app coming soon</span>
                </div>
              </div>

              <ProductPreview />
            </div>
          </section>

          <section className="measure-strip" aria-label="Measures included">
            <div className="measure-strip__inner">
              <span>PHYSIO-FOCUSED MEASURES</span>
              <div>
                {MEASURES.map(measure => <small key={measure}>{measure}</small>)}
              </div>
            </div>
          </section>

          <section id="workflow" className="section">
            <div className="workflow-layout">
              <div>
                <div className="section-head reveal">
                  <p className="eyebrow">CLINICAL WORKFLOW</p>
                  <h2>Outcome measures without the spreadsheet drift.</h2>
                  <p>Built around the physiotherapy problems clinicians repeatedly measure: gait speed, balance, endurance, neurological recovery, independence, symptoms, and meaningful change over time.</p>
                </div>
                <div className="workflow-grid">
                  {WORKFLOW.map(({ Icon, title, text }, index) => (
                    <article className="soft-card reveal" key={title} style={{ '--reveal-delay': `${index * 0.1}s` }}>
                      <Icon size={22} />
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </article>
                  ))}
                </div>
              </div>
              <figure className="image-panel image-panel--workflow reveal">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  poster="/assets/videos/workflow-poster.jpg"
                  aria-hidden="true"
                >
                  <source src="/assets/videos/workflow-loop.mp4" type="video/mp4" />
                </video>
              </figure>
            </div>
          </section>

        <section className="clinical-band">
          <div className="clinical-band__inner">
            <figure className="image-panel image-panel--wide reveal">
              <img
                src="https://images.pexels.com/photos/6111595/pexels-photo-6111595.jpeg?auto=compress&cs=tinysrgb&w=1400"
                alt="Amputee patient using a prosthetic leg during rehabilitation therapy"
              />
            </figure>
            <div className="clinical-band__copy reveal" style={{ '--reveal-delay': '0.12s' }}>
              <p className="eyebrow">DESIGNED FOR REHAB TEAMS</p>
              <h2>Clinical data that still feels human.</h2>
              <p>
                RehabMetrics IQ keeps the interface quiet and structured, while giving clinicians enough context to discuss progress clearly with patients and care teams.
              </p>
            </div>
          </div>
        </section>

        <section className="section capability-section">
          <div className="section-head centered reveal">
            <p className="eyebrow">WHAT IS INCLUDED</p>
            <h2>More than a score calculator.</h2>
            <p>RehabMetrics IQ connects measurement, pathway planning, prescription reasoning, and reporting in one clinical workspace.</p>
          </div>
          <div className="capability-grid">
            {CAPABILITIES.map(({ Icon, title, text }, index) => (
              <article className="capability-card reveal" key={title} style={{ '--reveal-delay': `${index * 0.08}s` }}>
                <Icon size={22} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <MobileAppShowcase />

        <section id="pricing" className="section pricing-section">
          <div className="section-head centered reveal">
            <p className="eyebrow">PRICING</p>
            <h2>Simple access for modern rehab practice.</h2>
            <p>Start with a free trial. No credit card required.</p>
          </div>

          <div className="pricing-layout">
            <figure className="image-panel image-panel--pricing reveal">
              <img
                src="https://images.pexels.com/photos/20860624/pexels-photo-20860624.jpeg?auto=compress&cs=tinysrgb&w=1000"
                alt="Physiotherapist guiding a patient through a rehabilitation exercise"
              />
            </figure>
            <div className="pricing-controls">
              <div className="billing-toggle" aria-label="Billing period">
                <button type="button" data-active={billing === 'monthly' ? '' : undefined} onClick={() => setBilling('monthly')}>Monthly</button>
                <button type="button" data-active={billing === 'yearly' ? '' : undefined} onClick={() => setBilling('yearly')}>Yearly <span>Save over 3 months</span></button>
              </div>

              <article className="pricing-card reveal" style={{ '--reveal-delay': '0.1s' }}>
                <div>
                  <span>{billing === 'monthly' ? 'Monthly' : 'Annual'}</span>
                  <strong><em>A$</em>{price}</strong>
                  <p>{period}</p>
                </div>
                <ul>
                  {[
                    'Physiotherapy-focused outcome measure library',
                    'Unlimited patients',
                    'Smart Rehab Pathway recommendations',
                    'Wheelchair prescription workspace',
                    'Minimally Clinically Important Difference tracking',
                    'Clinical report and PDF export',
                    'Phone app companion coming soon',
                    'Secure account access',
                  ].map(item => (
                    <li key={item}><Check size={16} /> {item}</li>
                  ))}
                </ul>
                <a href="/signup" className="primary-btn">Start free trial</a>
              </article>
            </div>
          </div>
        </section>

        <section className="section faq-section">
          <div className="section-head reveal">
            <p className="eyebrow">FAQ</p>
            <h2>Clear answers before you start.</h2>
            <figure className="image-panel image-panel--faq">
              <img
                src="https://images.pexels.com/photos/6111593/pexels-photo-6111593.jpeg?auto=compress&cs=tinysrgb&w=900"
                alt="Therapist assisting a prosthetic leg rehabilitation session"
              />
            </figure>
          </div>
          <div className="faq-list">
            {FAQS.map(([question, answer], index) => (
              <FaqItem key={question} question={question} answer={answer} revealDelay={`${index * 0.06}s`} />
            ))}
            <div className="faq-cta">
              <div>
                <strong>Ready to test it with real patients?</strong>
                <p>Start the trial, add a patient, and record a baseline measure. You will know quickly whether it fits your clinical workflow.</p>
              </div>
              <a className="primary-btn" href="/signup">Start free trial</a>
            </div>
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
      </div>
    </>
  )
}

function FaqItem({ question, answer, revealDelay }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="faq-reveal reveal" style={{ '--reveal-delay': revealDelay }}>
      <div className={`faq-item${open ? ' faq-item--open' : ''}`}>
        <button className="faq-question" type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}>
          {question}
          <ChevronDown size={18} className="faq-chevron" />
        </button>
        <div className="faq-body" aria-hidden={!open}>
          <div className="faq-body__inner">
            <p>{answer}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MobileAppShowcase() {
  return (
    <section className="mobile-showcase" aria-label="Mobile app coming soon">
      <div className="mobile-showcase__inner">
        <div className="mobile-showcase__copy reveal">
          <p className="eyebrow">MOBILE APP COMING SOON</p>
          <h2>Your measures should be with you, not back at the desk.</h2>
          <p>
            The phone app is being built for the way rehab clinicians actually work: moving between the gym, ward, clinic room, and community visit. Find the patient, open the right measure, follow the guide, and record the result while the assessment is still fresh.
          </p>
          <p>
            The web app remains the main reporting workspace. Mobile is the fast capture layer that keeps assessments, pathway prompts, timers, and patient records close to hand.
          </p>
          <div className="mobile-showcase__points">
            <span><Check size={15} /> Search patients and start an assessment quickly</span>
            <span><Check size={15} /> See missing baseline and repeat measures from the Smart Rehab Pathway</span>
            <span><Check size={15} /> Use built-in measure guides, timers, and score entry screens</span>
          </div>
        </div>

        <div className="phone-gallery reveal" style={{ '--reveal-delay': '0.14s' }} aria-hidden="true">
          <PhonePreview variant="directory" />
          <PhonePreview variant="pathway" />
          <PhonePreview variant="measure" />
        </div>
      </div>
    </section>
  )
}

function PhonePreview({ variant }) {
  return (
    <div className={`phone-preview phone-preview--${variant}`}>
      <div className="phone-preview__status">
        <span>21:28</span>
        <i />
      </div>
      <div className="phone-preview__nav">
        {variant === 'directory' ? <strong>RehabMetrics <em>IQ</em></strong> : <b>‹</b>}
        {variant === 'measure' && <span>Timed Up and Go</span>}
        {variant === 'measure' && <small>Guide</small>}
      </div>
      <div className="phone-preview__sheet">
        {variant === 'directory' && (
          <>
            <div className="phone-hero">
              <div>
                <h3>Patient Directory</h3>
                <p>Manage and monitor patient progress.</p>
              </div>
              <MiniBars />
            </div>
            <div className="phone-search">Search patients</div>
            {['Patient A.', 'Patient B.', 'Patient C.', 'Patient D.'].map((name, index) => (
              <div className="phone-row" key={name}>
                <span>{name.split(' ').map(part => part[0]).join('')}</span>
                <div>
                  <strong>{name}</strong>
                  <small>{['14/03/1978', '22/07/1986', '09/11/1991', '31/01/1969'][index]}</small>
                </div>
                <em>›</em>
              </div>
            ))}
          </>
        )}

        {variant === 'pathway' && (
          <>
            <div className="phone-patient">
              <span>PD</span>
              <strong>Patient D.</strong>
            </div>
            <div className="phone-pathway">
              <div>
                <small>SMART REHAB PATHWAY</small>
                <strong>8 baseline measures remaining</strong>
              </div>
              <b>11%</b>
              <div className="phone-progress"><i /></div>
              <p>Suggested measures, missing baselines, and reassessments that are ready to repeat.</p>
            </div>
            {['Record TUG', 'Record FAC', 'Record 6MWT'].map(item => (
              <div className="phone-action" key={item}>
                <strong>{item}</strong>
                <span>Recommended for this pathway.</span>
              </div>
            ))}
          </>
        )}

        {variant === 'measure' && (
          <>
            <div className="phone-patient">
              <span>PD</span>
              <strong>Patient D.</strong>
            </div>
            <div className="phone-measure">
              <h3>Trial 1</h3>
              <div className="phone-tabs"><span>TUG</span><span>TUG Fast</span><span>TUG Dual</span></div>
              <small>STOPWATCH</small>
              <strong>0.0 <em>sec</em></strong>
              <div className="phone-start">Start</div>
              <label>TIME (SECONDS)</label>
              <div className="phone-input">— <span>sec</span></div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MiniBars() {
  return (
    <div className="mini-bars">
      <i />
      <i />
      <i />
    </div>
  )
}

function ProductPreview() {
  const rows = [
    ['10MWT', '10 Metre Walk Test', '0.94 m/s', 'Community', 'green'],
    ['TUG', 'Timed Up and Go', '11.2 sec', 'Mild risk', 'amber'],
    ['BBS', 'Berg Balance Scale', '42/56', 'Minimally Clinically Important Difference met', 'blue'],
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
          <span><small>Patient</small>Example Patient</span>
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
          {meetsMCID ? 'Change exceeds the Minimally Clinically Important Difference.' : 'Change does not exceed the Minimally Clinically Important Difference.'} Minimally Clinically Important Difference: {MCID_STANDARD} m/s general / {MCID_STROKE} m/s stroke.
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
  html:not([data-auth-callback="true"]) [data-landing-auth-gateway]:not([data-active="true"]) { display: none; }
  html[data-auth-callback="true"] .landing-frame,
  .landing-frame[data-auth-hidden="true"] { display: none; }
  :root {
    --navy: #236499;
    --navy-dark: #17496F;
    --ink: #172238;
    --muted: #566271;
    --soft: #eef3f8;
    --line: #d7e0e8;
    --mint: #7FB3E6;
    --coral: #ee896f;
    --violet: #8c83c8;
    --amber: #c47b43;
    --danger: #b42318;
    --shadow: 0 18px 36px rgba(23, 38, 59, 0.18);
    --surface: #fbfdff;
    --surface-raised: #f6f9fc;
    --surface-muted: #eef4f8;
    --line-strong: #c3d0dc;
    --shadow-card: 0 1px 2px rgba(23,38,59,0.06), 0 10px 24px rgba(23,38,59,0.045);
  }
  html { scroll-behavior: smooth; }
  body { background: #f5f8fb; color: var(--ink); font-family: Inter, sans-serif; }
  a { color: inherit; }
  button, input { font: inherit; }

  @keyframes reveal-up {
    from { opacity: 0; transform: translateY(22px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slide-up-scale {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to { opacity: 1; transform: none; }
  }
  @media (prefers-reduced-motion: no-preference) {
    .reveal { opacity: 0; }
    .reveal.is-visible {
      animation: reveal-up 0.64s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: var(--reveal-delay, 0s);
    }
  }

  .site-header {
    position: relative;
    z-index: 10;
    background: rgba(255,255,255,0.96);
    border-bottom: 1px solid rgba(215,224,232,0.72);
  }
  .site-header__inner {
    max-width: 1088px;
    min-height: 104px;
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
    background-color: #f2ede5;
  }
  .hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('/assets/landing-hero-physio.jpg');
    background-size: cover;
    background-position: 62% center;
    filter: saturate(0.92) sepia(0.06) brightness(1.04) contrast(0.95);
    transform: scale(1.01);
  }
  .hero__video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 62% center;
    filter: saturate(0.92) sepia(0.06) brightness(1.04) contrast(0.95);
    transform: scale(1.01);
  }
  @media (prefers-reduced-motion: reduce) {
    .hero__video { display: none; }
  }
  .hero__focus-blur {
    position: absolute;
    inset: 0 auto 0 0;
    width: 60%;
    background:
      linear-gradient(90deg, rgba(234,243,251,0.76) 0%, rgba(247,250,252,0.58) 52%, rgba(247,250,252,0) 100%);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    mask-image: linear-gradient(90deg, #000 0%, #000 48%, rgba(0,0,0,0) 100%);
    -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 48%, rgba(0,0,0,0) 100%);
  }
  .hero__scrim {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(247,250,252,0.82) 0%, rgba(234,243,251,0.48) 44%, rgba(255,255,255,0.08) 76%),
      linear-gradient(180deg, rgba(255,255,255,0.08), rgba(23,73,111,0.08));
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
    color: #6f7783;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.16em;
  }
  .hero h1 {
    max-width: 560px;
    margin-top: 18px;
    color: var(--navy-dark);
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: clamp(48px, 6vw, 74px);
    font-weight: 700;
    line-height: 1.05;
  }
  .hero h1 span { color: var(--navy); }
  .hero__sub {
    max-width: 520px;
    margin-top: 24px;
    color: #4d5563;
    font-size: 18px;
    line-height: 1.55;
  }
  .hero__actions {
    display: flex;
    align-items: center;
    gap: 28px;
    margin-top: 36px;
  }

  .hero__proof {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    max-width: 560px;
    margin-top: 26px;
  }

  .hero__proof span {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 0 12px;
    border: 1px solid rgba(35,100,153,0.18);
    border-radius: 999px;
    background: rgba(255,255,255,0.58);
    color: var(--navy-dark);
    font-size: 12px;
    font-weight: 800;
    backdrop-filter: blur(10px);
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
    transition: background 0.18s, transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s;
  }
  .primary-btn:hover { background: var(--navy-dark); transform: translateY(-2px); box-shadow: 0 14px 28px rgba(23,61,104,0.42); }
  .primary-btn:active { transform: translateY(0); box-shadow: 0 6px 14px rgba(23,61,104,0.26); }
  .text-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 0;
    background: transparent;
    color: var(--navy-dark);
    cursor: pointer;
    font-weight: 600;
    transition: gap 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .text-btn:hover { gap: 10px; }

  .preview-card {
    justify-self: end;
    width: min(100%, 516px);
    padding: 28px 24px 30px;
    border: 1px solid rgba(195,208,220,0.86);
    border-radius: 10px;
    background: rgba(251,253,255,0.9);
    box-shadow: 0 18px 38px rgba(23,38,59,0.14);
    backdrop-filter: blur(12px);
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
    max-width: 170px;
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.15;
    text-align: center;
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
    grid-template-columns: 190px 1fr;
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

  .workflow-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 34px;
    align-items: stretch;
  }

  .image-panel {
    position: relative;
    overflow: hidden;
    min-height: 280px;
    border: 1px solid rgba(215,224,232,0.9);
    border-radius: 18px;
    background: #dfe8f1;
    box-shadow: 0 18px 42px rgba(23,38,59,0.12);
  }

  .image-panel::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(246,236,218,0.12), rgba(245,233,212,0.03) 48%, rgba(23,61,104,0.06)),
      linear-gradient(180deg, rgba(255,255,255,0), rgba(23,34,56,0.08));
    pointer-events: none;
  }

  .image-panel img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
  .image-panel video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    object-position: center;
    transform: scale(1.1);
  }

  .image-panel--workflow {
    min-height: 100%;
    background-image: url('/assets/videos/workflow-poster.jpg');
    background-size: cover;
    background-position: center;
  }
  @media (prefers-reduced-motion: reduce) {
    .image-panel--workflow video { display: none; }
  }

  .image-panel--wide {
    min-height: 360px;
  }

  .clinical-band {
    border-top: 1px solid rgba(215,224,232,0.72);
    border-bottom: 1px solid rgba(215,224,232,0.72);
    background: var(--surface-muted);
  }

  .clinical-band__inner {
    max-width: 1088px;
    margin: 0 auto;
    padding: 76px 24px;
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
    gap: 38px;
    align-items: center;
  }

  .clinical-band__copy h2 {
    margin-top: 10px;
    color: var(--ink);
    font-size: clamp(30px, 3vw, 44px);
    line-height: 1.08;
  }

  .clinical-band__copy p:not(.eyebrow) {
    margin-top: 16px;
    color: var(--muted);
    font-size: 17px;
    line-height: 1.65;
  }

  .soft-card, .pricing-card, .capability-card, details {
    border: 1px solid var(--line-strong);
    border-radius: 10px;
    background: var(--surface);
    box-shadow: var(--shadow-card);
  }
  .soft-card {
    padding: 24px;
  }
  .soft-card > svg,
  .capability-card > svg {
    display: block;
    width: 22px;
    height: 22px;
    padding: 8px;
    border: 1px solid #d4e0ea;
    border-radius: 8px;
    background: var(--surface-muted);
    color: var(--navy-dark);
    box-sizing: content-box;
  }
  .soft-card h3 { margin-top: 16px; font-size: 18px; }
  .soft-card p { margin-top: 8px; color: var(--muted); line-height: 1.55; }

  .capability-section {
    padding-top: 70px;
  }

  .capability-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
  }

  .capability-card {
    min-height: 236px;
    padding: 24px;
    background: var(--surface);
  }

  .capability-card:nth-child(even) {
    background: var(--surface-raised);
  }

  .capability-card h3 {
    margin-top: 16px;
    color: var(--ink);
    font-size: 18px;
    line-height: 1.2;
  }

  .capability-card p {
    margin-top: 10px;
    color: var(--muted);
    font-size: 14px;
    line-height: 1.6;
  }

  .mobile-showcase {
    overflow: hidden;
    border-top: 1px solid rgba(215,224,232,0.72);
    border-bottom: 1px solid rgba(215,224,232,0.72);
    background: var(--navy-dark);
  }

  .mobile-showcase__inner {
    max-width: 1180px;
    margin: 0 auto;
    padding: 88px 24px;
    display: grid;
    grid-template-columns: minmax(320px, 0.86fr) minmax(540px, 1.14fr);
    gap: 56px;
    align-items: center;
  }

  .mobile-showcase__copy .eyebrow {
    color: rgba(220,238,255,0.82);
  }

  .mobile-showcase h2 {
    max-width: 520px;
    margin-top: 12px;
    color: #fff;
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: clamp(34px, 4vw, 54px);
    line-height: 1.06;
  }

  .mobile-showcase__copy > p:not(.eyebrow) {
    max-width: 520px;
    margin-top: 18px;
    color: rgba(234,243,251,0.86);
    font-size: 16px;
    line-height: 1.65;
  }

  .mobile-showcase__points {
    display: grid;
    gap: 10px;
    margin-top: 24px;
  }

  .mobile-showcase__points span {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    color: #fff;
    font-size: 14px;
    font-weight: 800;
  }

  .mobile-showcase__points svg {
    color: var(--mint);
  }

  .phone-gallery {
    min-height: 670px;
    position: relative;
    margin-right: -10px;
  }

  .phone-preview {
    position: absolute;
    top: 92px;
    width: 250px;
    height: 542px;
    overflow: hidden;
    border: 1px solid rgba(220,238,255,0.2);
    border-radius: 40px;
    background: #17496F;
    box-shadow: 0 28px 68px rgba(0,0,0,0.34);
  }

  .phone-preview--pathway {
    top: 0;
    left: 50%;
    width: 292px;
    height: 634px;
    transform: translateX(-50%);
    z-index: 3;
  }

  .phone-preview--directory {
    left: 0;
    z-index: 2;
  }

  .phone-preview--measure {
    right: 0;
    z-index: 2;
  }

  .phone-preview__status {
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    color: #fff;
    font-size: 11px;
    font-weight: 800;
  }

  .phone-preview__status i {
    width: 48px;
    height: 12px;
    border-radius: 999px;
    background: #050608;
  }

  .phone-preview__nav {
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0 22px;
    color: #fff;
  }

  .phone-preview__nav strong {
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: 14px;
    line-height: 1;
  }

  .phone-preview__nav em {
    color: #9BC7F2;
    font-style: normal;
  }

  .phone-preview__nav b {
    font-size: 28px;
    line-height: 1;
  }

  .phone-preview__nav span {
    flex: 1;
    color: #fff;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.15;
    text-align: center;
  }

  .phone-preview__nav small {
    min-height: 32px;
    display: inline-flex;
    align-items: center;
    padding: 0 12px;
    border: 1px solid rgba(220,238,255,0.42);
    border-radius: 10px;
    color: #fff;
    font-size: 11px;
    font-weight: 800;
  }

  .phone-preview__sheet {
    position: absolute;
    inset: 86px 0 0;
    overflow: hidden;
    padding: 22px;
    border-top-left-radius: 34px;
    border-top-right-radius: 34px;
    background: #f1f7fc;
  }

  .phone-hero,
  .phone-patient,
  .phone-measure,
  .phone-pathway,
  .phone-row,
  .phone-action {
    border: 1px solid #d7e7f5;
    background: #fff;
  }

  .phone-hero {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 16px;
    min-height: 124px;
    padding: 20px;
    border-radius: 20px;
  }

  .phone-hero h3 {
    color: #0A1B33;
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: 28px;
    line-height: 0.96;
  }

  .phone-hero p {
    margin-top: 10px;
    color: #62728b;
    font-size: 13px;
    line-height: 1.35;
  }

  .mini-bars {
    height: 54px;
    display: inline-grid;
    grid-template-columns: repeat(3, 13px);
    align-items: end;
    gap: 6px;
  }

  .mini-bars i {
    display: block;
    border-radius: 5px;
  }
  .mini-bars i:nth-child(1) { height: 26px; background: #0D5C95; }
  .mini-bars i:nth-child(2) { height: 40px; background: #4A9DE8; }
  .mini-bars i:nth-child(3) { height: 54px; background: #9BC7F2; }

  .phone-search {
    min-height: 54px;
    margin: 16px 0;
    display: flex;
    align-items: center;
    padding: 0 18px;
    border: 1px solid #d7e7f5;
    border-radius: 16px;
    background: #f8fbfe;
    color: #8a96a3;
    font-size: 16px;
  }

  .phone-row {
    min-height: 72px;
    display: grid;
    grid-template-columns: 44px 1fr auto;
    align-items: center;
    gap: 14px;
    margin-top: 12px;
    padding: 12px 14px;
    border-radius: 18px;
  }

  .phone-row span,
  .phone-patient span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #eaf3fb;
    color: var(--navy);
    font-weight: 800;
  }

  .phone-row span {
    width: 44px;
    height: 44px;
    font-size: 13px;
  }

  .phone-row strong,
  .phone-patient strong,
  .phone-action strong {
    display: block;
    color: #0A1B33;
    font-size: 15px;
    line-height: 1.2;
  }

  .phone-row small,
  .phone-action span {
    display: block;
    margin-top: 5px;
    color: #667891;
    font-size: 12px;
  }

  .phone-row em {
    color: #8a96a3;
    font-size: 24px;
    font-style: normal;
  }

  .phone-patient {
    min-height: 96px;
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 18px;
    border-radius: 20px;
  }

  .phone-patient span {
    width: 58px;
    height: 58px;
    font-size: 16px;
  }

  .phone-pathway {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 14px;
    margin-top: 18px;
    padding: 18px;
    border-radius: 20px;
  }

  .phone-pathway small,
  .phone-measure small,
  .phone-measure label {
    color: var(--navy);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0;
  }

  .phone-pathway strong {
    display: block;
    margin-top: 8px;
    color: #0A1B33;
    font-size: 20px;
    line-height: 1.12;
  }

  .phone-pathway b {
    color: var(--navy);
    font-size: 28px;
    line-height: 1;
  }

  .phone-progress {
    grid-column: 1 / -1;
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: #dceeff;
  }

  .phone-progress i {
    display: block;
    width: 20%;
    height: 100%;
    background: var(--navy);
  }

  .phone-pathway p {
    grid-column: 1 / -1;
    margin: 0;
    padding: 14px;
    border-radius: 12px;
    background: #eaf3fb;
    color: #27364a;
    font-size: 12px;
    line-height: 1.45;
  }

  .phone-action {
    margin-top: 14px;
    padding: 14px 0;
    border-width: 1px 0 0;
    background: transparent;
  }

  .phone-measure {
    margin-top: 18px;
    padding: 18px;
    border-radius: 20px;
  }

  .phone-measure h3 {
    color: #0A1B33;
    font-size: 24px;
  }

  .phone-tabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    margin: 22px 0;
    padding: 5px;
    border-radius: 16px;
    background: #eaf3fb;
    border: 1px solid #d7e7f5;
  }

  .phone-tabs span {
    min-height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    color: #62728b;
    font-size: 12px;
    font-weight: 800;
  }

  .phone-tabs span:first-child {
    background: var(--navy);
    color: #fff;
  }

  .phone-measure > strong {
    display: block;
    margin: 32px 0 22px;
    color: #0A1B33;
    font-size: 58px;
    line-height: 1;
    text-align: center;
  }

  .phone-measure > strong em {
    color: #667891;
    font-size: 20px;
    font-style: normal;
  }

  .phone-start {
    min-height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: var(--navy);
    color: #fff;
    font-size: 18px;
    font-weight: 800;
  }

  .phone-measure label {
    display: block;
    margin-top: 24px;
  }

  .phone-input {
    position: relative;
    min-height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 12px;
    border: 1px solid #d7e7f5;
    border-radius: 16px;
    background: #f8fbfe;
    color: #8a96a3;
    font-size: 30px;
    font-weight: 800;
  }

  .phone-input span {
    position: absolute;
    right: 26px;
    color: #667891;
    font-size: 15px;
    font-weight: 700;
  }

  .pricing-section {
    display: grid;
    justify-items: center;
  }

  .pricing-layout {
    width: min(100%, 860px);
    display: grid;
    grid-template-columns: minmax(260px, 0.8fr) minmax(300px, 1fr);
    gap: 24px;
    align-items: stretch;
  }

  .pricing-controls {
    display: grid;
    justify-items: center;
    align-content: start;
  }

  .image-panel--pricing {
    min-height: 430px;
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
    transition: background 0.22s, color 0.22s;
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

  .image-panel--faq {
    min-height: 220px;
    margin-top: 24px;
  }

  .faq-list { display: grid; gap: 12px; }
  .faq-item {
    border: 1px solid var(--line-strong);
    border-radius: 10px;
    background: var(--surface);
    box-shadow: var(--shadow-card);
    overflow: hidden;
  }
  .faq-question {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px;
    border: 0;
    background: transparent;
    color: var(--ink);
    cursor: pointer;
    font-size: 15px;
    font-weight: 800;
    text-align: left;
  }
  .faq-question:hover { color: var(--navy); }
  .faq-chevron {
    flex: 0 0 18px;
    color: var(--navy);
    transition: transform 0.34s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .faq-item--open .faq-chevron { transform: rotate(180deg); }
  .faq-body {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.38s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .faq-item--open .faq-body { grid-template-rows: 1fr; }
  .faq-body__inner { overflow: hidden; }
  .faq-body__inner > p {
    padding: 0 20px 18px;
    color: var(--muted);
    line-height: 1.55;
  }

  .faq-cta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 22px;
    border: 1px solid #b8cad9;
    border-radius: 10px;
    background: var(--surface-raised);
    box-shadow: var(--shadow-card);
  }

  .faq-cta strong {
    color: var(--ink);
    font-size: 18px;
  }

  .faq-cta p {
    max-width: 520px;
    margin-top: 6px;
    color: var(--muted);
    line-height: 1.55;
  }

  .faq-cta .primary-btn {
    flex: 0 0 auto;
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
    animation: fade-in 0.22s ease;
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
    animation: slide-up-scale 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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
    .hero__inner,
    .workflow-layout,
    .clinical-band__inner,
    .mobile-showcase__inner,
    .pricing-layout,
    .faq-section { grid-template-columns: 1fr; }
    .preview-card { justify-self: start; }
    .workflow-grid,
    .capability-grid { grid-template-columns: 1fr; }
    .image-panel--workflow,
    .image-panel--pricing {
      min-height: 320px;
    }
    .phone-gallery {
      width: min(100%, 620px);
      min-height: 660px;
      margin: 10px auto 0;
    }
    .phone-preview--pathway,
    .phone-preview--directory,
    .phone-preview--measure {
      transform: none;
    }
    .phone-preview--pathway {
      left: 50%;
      transform: translateX(-50%);
    }
  }
  @media (max-width: 700px) {
    .site-header__inner, .hero__inner, .section, .measure-strip__inner { padding-left: 18px; padding-right: 18px; }
    .site-header__inner { min-height: 84px; }
    .hero__inner { padding-top: 56px; }
    .hero__actions { align-items: stretch; flex-direction: column; gap: 16px; }
    .mobile-showcase__inner { padding: 58px 18px; }
    .phone-gallery {
      display: flex;
      overflow-x: auto;
      width: auto;
      min-height: auto;
      margin: 0 -18px;
      padding: 4px 18px 18px;
      gap: 16px;
      scroll-snap-type: x mandatory;
    }
    .phone-preview {
      position: relative;
      inset: auto;
      width: 268px;
      height: 582px;
      flex: 0 0 268px;
      scroll-snap-align: center;
    }
    .phone-preview--pathway,
    .phone-preview--directory,
    .phone-preview--measure {
      left: auto;
      right: auto;
      top: auto;
      transform: none;
    }
    .faq-cta { align-items: stretch; flex-direction: column; }
    .measure-strip__inner { grid-template-columns: 1fr; }
    .preview-row { grid-template-columns: 1fr; }
    .demo-patient, .demo-results, .change-panel, .demo-fields { grid-template-columns: 1fr; }
  }
`

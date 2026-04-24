import Head from 'next/head'
import { useState } from 'react'
import { ClipboardCheck, LineChart, Users, FileText, Target, Database } from 'lucide-react'

const WHY_CARDS = [
  {
    Icon: ClipboardCheck,
    iconBg: '#EFF6FF', iconColor: '#2563EB',
    heading: 'Physio Outcome Measures. Simplified.',
    body: 'Capture and score physiotherapy and rehabilitation outcome measures without spreadsheets. Standardised, fast, and clinically reliable.',
  },
  {
    Icon: LineChart,
    iconBg: '#F0FDFA', iconColor: '#0D9488',
    heading: 'Track Rehab Progress Over Time',
    body: 'Monitor patient outcomes across sessions and clearly see how rehabilitation is progressing over time.',
  },
  {
    Icon: Users,
    iconBg: '#F1F5F9', iconColor: '#475569',
    heading: 'Built for Physiotherapy & Rehab Teams',
    body: 'Designed for physios, OTs and multidisciplinary rehab teams across inpatient, outpatient and community settings.',
  },
  {
    Icon: FileText,
    iconBg: '#FFFBEB', iconColor: '#D97706',
    heading: 'Reduce Documentation Burden',
    body: 'Eliminate manual scoring and duplicate entry. Capture outcome measures once and use them everywhere.',
  },
  {
    Icon: Target,
    iconBg: '#EEF2FF', iconColor: '#4F46E5',
    heading: 'Improve Clinical Decision-Making',
    body: 'Use structured outcome data to guide better clinical decisions and support outcome-based care.',
  },
  {
    Icon: Database,
    iconBg: '#F1F5F9', iconColor: '#334155',
    heading: 'Consistent, Reliable Outcome Data',
    body: 'Ensure outcome measures are recorded consistently across clinicians, improving accuracy and data quality.',
  },
]

export default function Landing() {
  const [billing, setBilling] = useState('monthly')

  const price = billing === 'monthly' ? '2.99' : '24.99'
  const period = billing === 'monthly' ? 'per month' : 'per year · $2.08/mo'
  const planName = billing === 'monthly' ? 'Monthly' : 'Annual'

  return (
    <>
      <Head>
        <title>RehabMetrics IQ — Outcome Measures, Simplified</title>
        <meta name="description" content="Clinical outcome measures for physiotherapists. Automated scoring, MCID tracking, and PDF export." />
        <link rel="icon" href="/SquareLogo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,300;0,600;0,700;1,300&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --color-primary:      #236499;
          --color-primary-dark: #17496F;
          --color-primary-soft: #EAF3FB;
          --color-secondary:    #7FB3E6;
          --color-ink:          #1F2933;
          --color-muted:        #5F6B7A;
          --color-subtle:       #8A96A3;
          --color-surface:      #FFFFFF;
          --color-surface-soft: #F7FAFC;
          --color-border:       #D8E2EC;
          --shadow-sm:          0 1px 2px rgba(31,41,51,0.06);
          --shadow-md:          0 6px 16px rgba(31,41,51,0.08);
        }
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', sans-serif; background: var(--color-surface-soft); color: var(--color-ink); }

        nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--color-border);
          padding: 0 32px;
        }
        .nav-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          height: 68px;
        }
        .logo {
          font-family: 'Source Serif 4', serif;
          font-size: 34px; font-weight: 400;
          text-decoration: none;
          letter-spacing: -0.3px;
          display: flex; align-items: center; gap: 10px;
        }
        .logo-img { height: 32px; width: 32px; object-fit: contain; }
        .logo-wordmark-rehab { font-weight: 700; color: #236499; }
        .logo-wordmark-iq    { font-weight: 600; color: #7FB3E6; }
        .nav-cta {
          background: var(--color-primary); color: #fff;
          padding: 9px 22px; border-radius: 10px;
          font-size: 14px; font-weight: 600;
          text-decoration: none;
          transition: background 0.15s;
        }
        .nav-cta:hover { background: var(--color-primary-dark); }

        /* HERO */
        .hero-section {
          position: relative;
          background-image: url('https://images.pexels.com/photos/20860617/pexels-photo-20860617.jpeg');
          background-size: cover;
          background-position: center center;
        }
        .hero-overlay {
          background: rgba(244,243,240,0.88);
          padding: 100px 32px 80px;
        }
        .hero {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 60px; align-items: center;
        }
        .hero-eyebrow {
          font-size: 11px; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: var(--color-primary); margin-bottom: 16px;
        }
        .hero-title {
          font-family: 'Source Serif 4', serif;
          font-size: clamp(42px, 5vw, 64px);
          font-weight: 600; line-height: 1.1;
          letter-spacing: -1px; color: var(--color-ink);
          margin-bottom: 20px;
        }
        .hero-title em { font-style: italic; font-weight: 300; color: var(--color-primary); }
        .hero-sub {
          font-size: 17px; color: var(--color-muted);
          line-height: 1.65; margin-bottom: 36px;
          font-weight: 300;
        }
        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .btn-primary {
          background: var(--color-primary); color: #fff;
          padding: 13px 28px; border-radius: 10px;
          font-size: 15px; font-weight: 600;
          text-decoration: none; display: inline-block;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: var(--color-primary-dark); }
        .btn-secondary {
          color: var(--color-primary); font-size: 14px;
          font-weight: 500; text-decoration: none;
          padding: 13px 20px;
        }
        .btn-secondary:hover { text-decoration: underline; }

        /* MOCK UI */
        .hero-visual {
          background: rgba(255,255,255,0.96);
          border: 1px solid var(--color-border);
          border-radius: 16px; padding: 24px;
          box-shadow: 0 8px 40px rgba(35,100,153,0.12), 0 2px 8px rgba(0,0,0,0.08);
        }
        .mock-header {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 16px; padding-bottom: 14px;
          border-bottom: 1px solid var(--color-border);
        }
        .mock-logo { font-family: 'Source Serif 4', serif; font-size: 18px; font-weight: 600; color: var(--color-primary); }
        .mock-badge {
          font-size: 10px; font-weight: 600; padding: 2px 8px;
          background: var(--color-primary-soft); color: var(--color-primary);
          border-radius: 99px; border: 1px solid #b8d9ef; margin-left: auto;
        }
        .mock-tabs { display: flex; gap: 4px; margin-bottom: 14px; }
        .mock-tab {
          font-size: 11px; font-weight: 600; padding: 5px 12px;
          border-radius: 6px; background: transparent; color: var(--color-subtle);
        }
        .mock-tab.active { background: var(--color-primary-soft); color: var(--color-primary); }
        .mock-measure {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px; border-radius: 8px; margin-bottom: 6px;
          border: 1px solid var(--color-border);
        }
        .mock-measure-label { font-size: 12px; font-weight: 600; font-family: monospace; color: var(--color-ink); }
        .mock-measure-name { font-size: 11px; color: var(--color-subtle); }
        .mock-chip { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 99px; border: 1px solid; }
        .chip-g { background: #e8f4ef; color: #2d6a4f; border-color: #b7dfc9; }
        .chip-a { background: #fef5e7; color: #a05c00; border-color: #e8b84b; }
        .chip-b { background: var(--color-primary-soft); color: var(--color-primary); border-color: #b8d9ef; }
        .mock-score { font-family: monospace; font-size: 14px; font-weight: 500; color: var(--color-primary); }

        /* MEASURES STRIP */
        .measures-strip {
          background: var(--color-surface);
          border-top: 1px solid var(--color-border);
          border-bottom: 1px solid var(--color-border);
          padding: 20px 32px;
        }
        .measures-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }
        .strip-label {
          font-size: 11px; font-weight: 700; letter-spacing: 1px;
          text-transform: uppercase; color: var(--color-subtle);
          margin-right: 8px; white-space: nowrap;
        }
        .measure-pill {
          font-size: 12px; font-weight: 500; padding: 5px 14px;
          background: var(--color-primary-soft); color: var(--color-primary);
          border: 1px solid #b8d9ef; border-radius: 99px;
        }

        /* FEATURES */
        .features {
          position: relative;
          background-image: url('https://images.pexels.com/photos/8346659/pexels-photo-8346659.jpeg');
          background-size: cover;
          background-position: center center;
          background-attachment: fixed;
        }
        .features-overlay {
          background: rgba(244,243,240,0.82);
          padding: 80px 32px;
        }
        .features-inner { max-width: 1100px; margin: 0 auto; }
        .section-label {
          font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
          text-transform: uppercase; color: var(--color-primary); margin-bottom: 14px;
        }
        .section-title {
          font-family: 'Source Serif 4', serif; font-size: 44px;
          font-weight: 600; letter-spacing: -0.5px;
          margin-bottom: 48px; line-height: 1.2;
        }
        .why-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 40px;
        }
        .why-card {
          background: #ffffff;
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 24px;
          box-shadow: none;
          transition: box-shadow 0.2s ease;
        }
        .why-card:hover { box-shadow: var(--shadow-md); }
        .why-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 10px;
          margin-bottom: 16px;
        }
        .why-card h3 {
          font-family: 'Source Serif 4', serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--color-ink);
          margin-bottom: 8px;
        }
        .why-card p {
          font-size: 15px;
          color: var(--color-muted);
          line-height: 1.6;
        }

        /* PRICING */
        .pricing {
          background: var(--color-surface);
          border-top: 1px solid var(--color-border);
          border-bottom: 1px solid var(--color-border);
          padding: 80px 32px;
        }
        .pricing-inner { max-width: 500px; margin: 0 auto; text-align: center; }
        .billing-toggle {
          display: inline-flex; background: var(--color-surface-soft);
          border: 1px solid var(--color-border); border-radius: 99px;
          padding: 4px; margin-bottom: 40px; gap: 4px;
        }
        .toggle-btn {
          padding: 8px 22px; border-radius: 99px; border: none;
          font-family: 'Inter', sans-serif; font-size: 13px;
          font-weight: 500; cursor: pointer; transition: all 0.15s;
          background: transparent; color: var(--color-muted);
        }
        .toggle-btn.active { background: var(--color-primary); color: #fff; font-weight: 600; }
        .save-badge {
          font-size: 10px; font-weight: 700; padding: 2px 7px;
          background: #e8f4ef; color: #2d6a4f; border: 1px solid #b7dfc9;
          border-radius: 99px; margin-left: 6px;
        }
        .pricing-card-single {
          border: 1px solid var(--color-border); border-radius: 16px;
          padding: 40px; background: var(--color-primary);
          color: #fff; text-align: left; position: relative;
        }
        .plan-name { font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; opacity: 0.7; margin-bottom: 12px; }
        .plan-price { font-family: 'Source Serif 4', serif; font-size: 56px; font-weight: 600; letter-spacing: -1px; line-height: 1; }
        .plan-price span { font-size: 20px; font-weight: 400; opacity: 0.7; }
        .plan-period { font-size: 13px; opacity: 0.6; margin-top: 4px; margin-bottom: 28px; }
        .plan-features { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
        .plan-features li { font-size: 15px; display: flex; align-items: center; gap: 8px; }
        .plan-features li::before { content: '✓'; font-weight: 700; }
        .plan-btn-dark {
          display: block; text-align: center; padding: 14px;
          border-radius: 10px; font-size: 15px; font-weight: 600;
          text-decoration: none; background: #fff; color: var(--color-primary);
          transition: background 0.15s;
        }
        .plan-btn-dark:hover { background: #f0f7fc; }
        .annual-note {
          margin-top: 16px; text-align: center;
          font-size: 13px; color: var(--color-subtle);
        }

        /* TESTIMONIALS */
        .social {
          position: relative;
          background-image: url('https://images.pexels.com/photos/7289770/pexels-photo-7289770.jpeg');
          background-size: cover;
          background-position: center center;
          background-attachment: fixed;
        }
        .social-overlay {
          background: rgba(244,243,240,0.82);
          padding: 80px 32px;
        }
        .social-inner { max-width: 1100px; margin: 0 auto; }
        .testimonials { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 48px; }
        .testimonial {
          background: rgba(255,255,255,0.95); border: 1px solid var(--color-border);
          border-radius: 12px; padding: 24px;
        }
        .testimonial-text { font-size: 14px; line-height: 1.7; color: var(--color-muted); margin-bottom: 16px; font-weight: 300; font-style: italic; }
        .testimonial-author { font-size: 13px; font-weight: 600; color: var(--color-ink); }
        .testimonial-role { font-size: 12px; color: var(--color-subtle); }

        /* CTA */
        .cta-section {
          background: var(--color-primary); color: #fff;
          text-align: center; padding: 80px 32px;
        }
        .cta-title { font-family: 'Source Serif 4', serif; font-size: 42px; font-weight: 600; letter-spacing: -0.5px; margin-bottom: 16px; line-height: 1.15; }
        .cta-title em { font-style: italic; font-weight: 300; }
        .cta-sub { font-size: 16px; opacity: 0.8; margin-bottom: 36px; font-weight: 300; }
        .cta-btn {
          background: #fff; color: var(--color-primary);
          padding: 14px 36px; border-radius: 10px;
          font-size: 15px; font-weight: 700;
          text-decoration: none; display: inline-block;
          transition: background 0.15s;
        }
        .cta-btn:hover { background: #f0f7fc; }

        footer {
          background: var(--color-ink); color: var(--color-subtle);
          padding: 32px; text-align: center; font-size: 13px;
        }
        footer a { color: var(--color-subtle); text-decoration: none; margin: 0 12px; }
        footer a:hover { color: #fff; }

        @media (max-width: 900px) {
          .why-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .hero { grid-template-columns: 1fr; padding: 60px 20px 48px; }
          .hero-visual { display: none; }
          .testimonials { grid-template-columns: 1fr; }
          .features { background-attachment: scroll; }
          .social { background-attachment: scroll; }
        }
        @media (max-width: 560px) {
          .why-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <nav>
        <div className="nav-inner">
          <a href="/" className="logo">
            <img src="/SquareLogo.png" alt="RehabMetrics IQ" className="logo-img" />
            <span className="logo-wordmark-rehab">RehabMetrics</span>
            <span className="logo-wordmark-iq"> IQ</span>
          </a>
          <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
            <a href="/login" style={{fontSize:'14px',color:'var(--color-muted)',textDecoration:'none',fontWeight:500}}>Log in</a>
            <a href="/signup" className="nav-cta">Start free trial</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-overlay">
          <div className="hero">
            <div>
              <div className="hero-eyebrow">Built for Physiotherapists</div>
              <h1 className="hero-title">Outcome measures, <em>simplified</em></h1>
              <p className="hero-sub">Stop calculating by hand. RehabMetrics automates scoring, tracks MCID, and exports clinical-grade reports — so you spend more time with patients.</p>
              <div className="hero-actions">
                <a href="/signup" className="btn-primary">Start 14-day free trial</a>
                <a href="#features" className="btn-secondary">See how it works →</a>
              </div>
            </div>
            <div className="hero-visual">
              <div className="mock-header">
                <span className="mock-logo">RehabMetrics</span>
                <span className="mock-badge">LIVE SCORING</span>
              </div>
              <div className="mock-tabs">
                <span className="mock-tab active">Performance</span>
                <span className="mock-tab">Questionnaires</span>
                <span className="mock-tab">Summary</span>
              </div>
              {[
                {abbr:'10MWT',name:'10 Metre Walk Test',score:'0.94 m/s',chip:'Community',cls:'chip-g'},
                {abbr:'TUG',name:'Timed Up and Go',score:'11.2 sec',chip:'Mild risk',cls:'chip-a'},
                {abbr:'BBS',name:'Berg Balance Scale',score:'42/56',chip:'MCID met',cls:'chip-b'},
                {abbr:'6MWT',name:'6 Minute Walk Test',score:'387 m',chip:'Community',cls:'chip-g'},
                {abbr:'FGA',name:'Functional Gait Assessment',score:'21/30',chip:'Low risk',cls:'chip-g'},
              ].map(m => (
                <div className="mock-measure" key={m.abbr}>
                  <div>
                    <div className="mock-measure-label">{m.abbr}</div>
                    <div className="mock-measure-name">{m.name}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span className="mock-score">{m.score}</span>
                    <span className={`mock-chip ${m.cls}`}>{m.chip}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MEASURES STRIP */}
      <div className="measures-strip">
        <div className="measures-inner">
          <span className="strip-label">Measures included</span>
          {[
            '10 Metre Walk Test','Timed Up and Go','Berg Balance Scale','6 Minute Walk Test',
            'Functional Gait Assessment','Postural Assessment Scale','Trunk Impairment Scale',
            'High-level Mobility Assessment','Motor Assessment Scale','Barthel Index',
            'SCIM-III','Functional Ambulation Category','Amputee Mobility Predictor',
            'HADS','PDQ-8','Rivermead Post-Concussion','ABC Scale'
          ].map(m => (
            <span key={m} className="measure-pill">{m}</span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="features-overlay">
          <div className="features-inner">
            <div className="section-label">Why RehabMetrics</div>
            <h2 className="section-title">Everything you need.<br/>Nothing you don't.</h2>
            <div className="why-grid">
              {WHY_CARDS.map(({ Icon, iconBg, iconColor, heading, body }) => (
                <div key={heading} className="why-card">
                  <div className="why-icon-wrap" style={{ background: iconBg }}>
                    <Icon size={22} color={iconColor} strokeWidth={1.75} />
                  </div>
                  <h3>{heading}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div className="pricing-inner">
          <div className="section-label">Pricing</div>
          <h2 className="section-title" style={{marginBottom:'12px',fontSize:'36px'}}>Simple, honest pricing</h2>
          <p style={{color:'var(--color-muted)',marginBottom:'32px',fontWeight:300}}>14-day free trial. No credit card required.</p>
          <div className="billing-toggle">
            <button className={`toggle-btn ${billing==='monthly'?'active':''}`} onClick={()=>setBilling('monthly')}>Monthly</button>
            <button className={`toggle-btn ${billing==='yearly'?'active':''}`} onClick={()=>setBilling('yearly')}>
              Yearly <span className="save-badge">Save 30%</span>
            </button>
          </div>
          <div className="pricing-card-single">
            <div className="plan-name">{planName}</div>
            <div className="plan-price"><span>$</span>{price}</div>
            <div className="plan-period">{period}</div>
            <ul className="plan-features">
              <li>All outcome measures</li>
              <li>Unlimited patients</li>
              <li>PDF export</li>
              <li>MCID tracking</li>
              {billing==='yearly' && <li>30% saving vs monthly</li>}
              {billing==='yearly' && <li>Early access to new measures</li>}
            </ul>
            <a href="/signup" className="plan-btn-dark">Start free trial</a>
          </div>
          <p className="annual-note">Cancel anytime. No lock-in.</p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="social">
        <div className="social-overlay">
          <div className="social-inner">
            <div className="section-label">Built for clinicians</div>
            <h2 className="section-title">Trusted by physios in the clinic</h2>
            <div className="testimonials">
              {[
                {text:'"Finally a tool that does the maths for me. I use it every patient session — it\'s become part of my standard workflow."',author:'Sarah M.',role:'Senior Physiotherapist · Inpatient Rehab'},
                {text:'"The MCID tracking is exactly what I needed. I can show patients their progress objectively, which is incredibly motivating."',author:'James T.',role:'Physiotherapist · Neuro Rehab'},
                {text:'"Clean, fast, and clinically accurate. The PDF export saves me 10 minutes per patient on documentation."',author:'Priya K.',role:'Physiotherapy Team Lead'},
              ].map(t => (
                <div className="testimonial" key={t.author}>
                  <p className="testimonial-text">{t.text}</p>
                  <div className="testimonial-author">{t.author}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2 className="cta-title">Ready to simplify your <em>outcome measures?</em></h2>
        <p className="cta-sub">Join physiotherapists using RehabMetrics to save time and improve clinical documentation.</p>
        <a href="/signup" className="cta-btn">Start your free 14-day trial</a>
      </section>

      <footer>
        <div style={{marginBottom:'12px'}}>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="mailto:hello@rehabmetrics.io">Contact</a>
        </div>
        <div>© {new Date().getFullYear()} RehabMetrics. All rights reserved.</div>
      </footer>
    </>
  )
}

import Head from 'next/head'
import { useState } from 'react'

export default function Landing() {
  const [billing, setBilling] = useState('monthly')

  const price = billing === 'monthly' ? '2.99' : '24.99'
  const period = billing === 'monthly' ? 'per month' : 'per year · $2.08/mo'
  const planName = billing === 'monthly' ? 'Monthly' : 'Annual'

  return (
    <>
      <Head>
        <title>RehabMetrics — Outcome Measures, Simplified</title>
        <meta name="description" content="Clinical outcome measures for physiotherapists. Automated scoring, MCID tracking, and PDF export." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,600;1,300&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --accent: #236499;
          --accent-light: #e8f2f9;
          --accent-mid: #4a9fd4;
          --accent-dark: #1a4e77;
          --bg: #f4f3f0;
          --surface: #ffffff;
          --border: #e2e0db;
          --text: #1a1917;
          --text-2: #5c5a56;
          --text-3: #9b9891;
        }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); }

        nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--border);
          padding: 0 32px;
        }
        .nav-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          height: 68px;
        }
        .logo {
          font-family: 'Fraunces', serif;
          font-size: 34px; font-weight: 600;
          color: var(--accent); text-decoration: none;
          letter-spacing: -0.3px;
        }
        .logo span { font-style: italic; font-weight: 300; }
        .nav-cta {
          background: var(--accent); color: #fff;
          padding: 9px 22px; border-radius: 8px;
          font-size: 14px; font-weight: 600;
          text-decoration: none;
          transition: background 0.15s;
        }
        .nav-cta:hover { background: var(--accent-dark); }

        /* HERO */
        .hero-section {
          position: relative;
          background-image: url('https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1800&q=85&fit=crop&crop=center');
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
          color: var(--accent); margin-bottom: 16px;
        }
        .hero-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(42px, 5vw, 64px);
          font-weight: 600; line-height: 1.1;
          letter-spacing: -1px; color: var(--text);
          margin-bottom: 20px;
        }
        .hero-title em { font-style: italic; font-weight: 300; color: var(--accent); }
        .hero-sub {
          font-size: 17px; color: var(--text-2);
          line-height: 1.65; margin-bottom: 36px;
          font-weight: 300;
        }
        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .btn-primary {
          background: var(--accent); color: #fff;
          padding: 13px 28px; border-radius: 8px;
          font-size: 15px; font-weight: 600;
          text-decoration: none; display: inline-block;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: var(--accent-dark); }
        .btn-secondary {
          color: var(--accent); font-size: 14px;
          font-weight: 500; text-decoration: none;
          padding: 13px 20px;
        }
        .btn-secondary:hover { text-decoration: underline; }

        /* MOCK UI */
        .hero-visual {
          background: rgba(255,255,255,0.96);
          border: 1px solid var(--border);
          border-radius: 16px; padding: 24px;
          box-shadow: 0 8px 40px rgba(35,100,153,0.12), 0 2px 8px rgba(0,0,0,0.08);
        }
        .mock-header {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 16px; padding-bottom: 14px;
          border-bottom: 1px solid var(--border);
        }
        .mock-logo { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 600; color: var(--accent); }
        .mock-badge {
          font-size: 10px; font-weight: 600; padding: 2px 8px;
          background: var(--accent-light); color: var(--accent);
          border-radius: 99px; border: 1px solid #b8d9ef; margin-left: auto;
        }
        .mock-tabs { display: flex; gap: 4px; margin-bottom: 14px; }
        .mock-tab {
          font-size: 11px; font-weight: 600; padding: 5px 12px;
          border-radius: 6px; background: transparent; color: var(--text-3);
        }
        .mock-tab.active { background: var(--accent-light); color: var(--accent); }
        .mock-measure {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px; border-radius: 8px; margin-bottom: 6px;
          border: 1px solid var(--border);
        }
        .mock-measure-label { font-size: 12px; font-weight: 600; font-family: 'DM Mono', monospace; color: var(--text); }
        .mock-measure-name { font-size: 11px; color: var(--text-3); }
        .mock-chip { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 99px; border: 1px solid; }
        .chip-g { background: #e8f4ef; color: #2d6a4f; border-color: #b7dfc9; }
        .chip-a { background: #fef5e7; color: #a05c00; border-color: #e8b84b; }
        .chip-b { background: var(--accent-light); color: var(--accent); border-color: #b8d9ef; }
        .mock-score { font-family: 'DM Mono', monospace; font-size: 14px; font-weight: 500; color: var(--accent); }

        /* MEASURES STRIP */
        .measures-strip {
          background: var(--surface);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 20px 32px;
        }
        .measures-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }
        .strip-label {
          font-size: 11px; font-weight: 700; letter-spacing: 1px;
          text-transform: uppercase; color: var(--text-3);
          margin-right: 8px; white-space: nowrap;
        }
        .measure-pill {
          font-size: 12px; font-weight: 500; padding: 5px 14px;
          background: var(--accent-light); color: var(--accent);
          border: 1px solid #b8d9ef; border-radius: 99px;
        }

        /* FEATURES */
        .features {
          position: relative;
          background-image: url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1800&q=85&fit=crop&crop=center');
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
          text-transform: uppercase; color: var(--accent); margin-bottom: 14px;
        }
        .section-title {
          font-family: 'Fraunces', serif; font-size: 44px;
          font-weight: 600; letter-spacing: -0.5px;
          margin-bottom: 48px; line-height: 1.2;
        }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
        .feature-card {
          background: rgba(255,255,255,0.95); border: 1px solid var(--border);
          border-radius: 12px; padding: 28px;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .feature-card:hover { box-shadow: 0 8px 32px rgba(35,100,153,0.12); transform: translateY(-2px); }
        .feature-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: var(--accent-light); color: var(--accent);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; margin-bottom: 16px;
        }
        .feature-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
        .feature-desc { font-size: 14px; color: var(--text-2); line-height: 1.6; font-weight: 300; }

        /* PRICING */
        .pricing {
          background: var(--surface);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 80px 32px;
        }
        .pricing-inner { max-width: 500px; margin: 0 auto; text-align: center; }
        .billing-toggle {
          display: inline-flex; background: var(--bg);
          border: 1px solid var(--border); border-radius: 99px;
          padding: 4px; margin-bottom: 40px; gap: 4px;
        }
        .toggle-btn {
          padding: 8px 22px; border-radius: 99px; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 13px;
          font-weight: 500; cursor: pointer; transition: all 0.15s;
          background: transparent; color: var(--text-2);
        }
        .toggle-btn.active { background: var(--accent); color: #fff; font-weight: 600; }
        .save-badge {
          font-size: 10px; font-weight: 700; padding: 2px 7px;
          background: #e8f4ef; color: #2d6a4f; border: 1px solid #b7dfc9;
          border-radius: 99px; margin-left: 6px;
        }
        .pricing-card-single {
          border: 1px solid var(--border); border-radius: 16px;
          padding: 40px; background: var(--accent);
          color: #fff; text-align: left; position: relative;
        }
        .plan-name { font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; opacity: 0.7; margin-bottom: 12px; }
        .plan-price { font-family: 'Fraunces', serif; font-size: 56px; font-weight: 600; letter-spacing: -1px; line-height: 1; }
        .plan-price span { font-size: 20px; font-weight: 400; opacity: 0.7; }
        .plan-period { font-size: 13px; opacity: 0.6; margin-top: 4px; margin-bottom: 28px; }
        .plan-features { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
        .plan-features li { font-size: 15px; display: flex; align-items: center; gap: 8px; }
        .plan-features li::before { content: '✓'; font-weight: 700; }
        .plan-btn-dark {
          display: block; text-align: center; padding: 14px;
          border-radius: 8px; font-size: 15px; font-weight: 600;
          text-decoration: none; background: #fff; color: var(--accent);
          transition: background 0.15s;
        }
        .plan-btn-dark:hover { background: #f0f7fc; }
        .annual-note {
          margin-top: 16px; text-align: center;
          font-size: 13px; color: var(--text-3);
        }

        /* TESTIMONIALS */
        .social {
          position: relative;
          background-image: url('https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1800&q=85&fit=crop&crop=center');
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
          background: rgba(255,255,255,0.95); border: 1px solid var(--border);
          border-radius: 12px; padding: 24px;
        }
        .testimonial-text { font-size: 14px; line-height: 1.7; color: var(--text-2); margin-bottom: 16px; font-weight: 300; font-style: italic; }
        .testimonial-author { font-size: 13px; font-weight: 600; color: var(--text); }
        .testimonial-role { font-size: 12px; color: var(--text-3); }

        /* CTA */
        .cta-section {
          background: var(--accent); color: #fff;
          text-align: center; padding: 80px 32px;
        }
        .cta-title { font-family: 'Fraunces', serif; font-size: 42px; font-weight: 600; letter-spacing: -0.5px; margin-bottom: 16px; line-height: 1.15; }
        .cta-title em { font-style: italic; font-weight: 300; }
        .cta-sub { font-size: 16px; opacity: 0.8; margin-bottom: 36px; font-weight: 300; }
        .cta-btn {
          background: #fff; color: var(--accent);
          padding: 14px 36px; border-radius: 8px;
          font-size: 15px; font-weight: 700;
          text-decoration: none; display: inline-block;
          transition: background 0.15s;
        }
        .cta-btn:hover { background: #f0f7fc; }

        footer {
          background: var(--text); color: var(--text-3);
          padding: 32px; text-align: center; font-size: 13px;
        }
        footer a { color: var(--text-3); text-decoration: none; margin: 0 12px; }
        footer a:hover { color: #fff; }

        @media (max-width: 768px) {
          .hero { grid-template-columns: 1fr; padding: 60px 20px 48px; }
          .hero-visual { display: none; }
          .features-grid { grid-template-columns: 1fr; }
          .testimonials { grid-template-columns: 1fr; }
          .features { background-attachment: scroll; }
          .social { background-attachment: scroll; }
        }
      `}</style>

      <nav>
        <div className="nav-inner">
          <a href="/" className="logo">Rehab<span>Metrics</span></a>
          <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
            <a href="/login" style={{fontSize:'14px',color:'var(--text-2)',textDecoration:'none',fontWeight:500}}>Log in</a>
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
            <div className="features-grid">
              {[
                {icon:'⚡',title:'Instant automated scoring',desc:'Enter raw data. Scores, interpretations, and benchmarks calculate instantly — no formulas, no spreadsheets.'},
                {icon:'📊',title:'MCID tracking built in',desc:'Track change over time against Minimal Clinically Important Difference thresholds for every measure.'},
                {icon:'📄',title:'One-click PDF export',desc:'Generate clean, clinical-grade PDF reports formatted for medical records and referrals.'},
                {icon:'🔒',title:'Patient data stays yours',desc:'Secure storage with row-level security. Your patients, your data — no sharing, no selling.'},
                {icon:'📱',title:'Works anywhere',desc:'Browser-based. No app to install. Works on desktop, tablet, or any device on the ward.'},
                {icon:'🩺',title:'Evidence-based references',desc:'Every measure includes MCID, MDC, normative data, and citation — right where you need it.'},
              ].map(f => (
                <div className="feature-card" key={f.title}>
                  <div className="feature-icon">{f.icon}</div>
                  <div className="feature-title">{f.title}</div>
                  <p className="feature-desc">{f.desc}</p>
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
          <p style={{color:'var(--text-2)',marginBottom:'32px',fontWeight:300}}>14-day free trial. No credit card required.</p>
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

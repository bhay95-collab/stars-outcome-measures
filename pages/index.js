import Head from 'next/head'
import { useState } from 'react'
import { ClipboardCheck, LineChart, Users, FileText, Target, Database } from 'lucide-react'

const WHY_CARDS = [
  {
    Icon: ClipboardCheck,
    iconBg: 'var(--color-primary-soft)', iconColor: 'var(--color-primary)',
    heading: 'Physio Outcome Measures. Simplified.',
    body: 'Capture and score physiotherapy and rehabilitation outcome measures without spreadsheets. Standardised, fast, and clinically reliable.',
  },
  {
    Icon: LineChart,
    iconBg: 'var(--color-primary-soft)', iconColor: 'var(--color-secondary)',
    heading: 'Track Rehab Progress Over Time',
    body: 'Monitor patient outcomes across sessions and clearly see how rehabilitation is progressing over time.',
  },
  {
    Icon: Users,
    iconBg: 'var(--color-surface-soft)', iconColor: 'var(--color-muted)',
    heading: 'Built for Physiotherapy & Rehab Teams',
    body: 'Designed for physios, OTs and multidisciplinary rehab teams across inpatient, outpatient and community settings.',
  },
  {
    Icon: FileText,
    iconBg: 'var(--color-primary-soft)', iconColor: 'var(--color-primary)',
    heading: 'Reduce Documentation Burden',
    body: 'Eliminate manual scoring and duplicate entry. Capture outcome measures once and use them everywhere.',
  },
  {
    Icon: Target,
    iconBg: 'var(--color-primary-soft)', iconColor: 'var(--color-secondary)',
    heading: 'Improve Clinical Decision-Making',
    body: 'Use structured outcome data to guide better clinical decisions and support outcome-based care.',
  },
  {
    Icon: Database,
    iconBg: 'var(--color-surface-soft)', iconColor: 'var(--color-muted)',
    heading: 'Consistent, Reliable Outcome Data',
    body: 'Ensure outcome measures are recorded consistently across clinicians, improving accuracy and data quality.',
  },
]

function getAgeNorm(age) {
  if (age < 40) return 1.42
  if (age < 60) return 1.31
  if (age < 70) return 1.22
  if (age < 80) return 1.09
  return 0.94
}

function getClassification(s) {
  if (s < 0.4) return { label: 'Household Ambulator', key: 'household' }
  if (s < 0.8) return { label: 'Limited Community',   key: 'limited'   }
  return         { label: 'Community Ambulator',  key: 'community' }
}

export default function Landing() {
  const [billing, setBilling] = useState('monthly')
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [demoStep, setDemoStep] = useState('input')
  const [time, setTime] = useState(8.2)
  const [steps, setSteps] = useState(12)
  const [patientName, setPatientName] = useState('')
  const [patientAge,  setPatientAge]  = useState(68)
  const [testDate,    setTestDate]    = useState(() => new Date().toISOString().slice(0, 10))
  const [prevSpeed,   setPrevSpeed]   = useState(0.72)

  const speed        = time > 0 ? 10 / time : 0
  const cadence      = time > 0 ? (steps / time) * 60 : 0
  const ageNorm      = getAgeNorm(patientAge)
  const normPct      = ageNorm > 0 ? Math.round((speed / ageNorm) * 100) : 0
  const speedChange  = speed - prevSpeed
  const mcidMet      = Math.abs(speedChange) >= 0.1
  const classification = getClassification(speed)

  const price = billing === 'monthly' ? '2.99' : '24.99'
  const period = billing === 'monthly' ? 'per month' : 'per year · $2.08/mo'
  const planName = billing === 'monthly' ? 'Monthly' : 'Annual'

  function closeDemoModal() {
    setShowDemoModal(false)
    setDemoStep('input')
  }

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
          --radius-sm:          6px;
          --radius-md:          10px;
          --radius-lg:          16px;
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
          display: flex; align-items: center; gap: 8px;
        }
        .logo-img { height: 32px; width: 32px; object-fit: contain; }
        .logo-wordmark-rehab { font-weight: 700; color: var(--color-primary); }
        .logo-wordmark-iq    { font-weight: 600; color: var(--color-secondary); }
        .nav-cta {
          background: var(--color-primary); color: var(--color-surface);
          padding: 12px 20px; border-radius: 10px;
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
          background: rgba(247,250,252,0.88);
          padding: 100px 32px 80px;
        }
        .hero {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 60px; align-items: center;
        }
        .hero-eyebrow {
          font-size: 11px; font-weight: 500;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: var(--color-subtle); margin-bottom: 12px;
        }
        .hero-title {
          font-family: 'Source Serif 4', serif;
          font-size: clamp(42px, 5vw, 64px);
          font-weight: 600; line-height: 1.15;
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
          background: var(--color-primary); color: var(--color-surface);
          padding: 12px 28px; border-radius: 10px;
          font-size: 15px; font-weight: 600;
          text-decoration: none; display: inline-block;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: var(--color-primary-dark); }
        .btn-secondary {
          color: var(--color-primary); font-size: 14px;
          font-weight: 500; text-decoration: none;
          padding: 12px 20px;
          background: none; border: none; cursor: pointer;
          font-family: 'Inter', sans-serif;
        }
        .btn-secondary:hover { text-decoration: underline; }

        /* MOCK UI */
        .hero-visual {
          background: rgba(255,255,255,0.96);
          border: 1px solid var(--color-border);
          border-radius: 16px; padding: 24px;
          box-shadow: var(--shadow-md);
        }
        .mock-header {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 16px; padding-bottom: 12px;
          border-bottom: 1px solid var(--color-border);
        }
        .mock-logo { font-family: 'Source Serif 4', serif; font-size: 18px; font-weight: 600; color: var(--color-primary); }
        .mock-badge {
          font-size: 10px; font-weight: 600; padding: 2px 8px;
          background: var(--color-primary-soft); color: var(--color-primary);
          border-radius: 99px; border: 1px solid var(--color-border); margin-left: auto;
        }
        .mock-tabs { display: flex; gap: 4px; margin-bottom: 14px; }
        .mock-tab {
          font-size: 11px; font-weight: 600; padding: 4px 12px;
          border-radius: 6px; background: transparent; color: var(--color-subtle);
        }
        .mock-tab.active { background: var(--color-primary-soft); color: var(--color-primary); }
        .mock-measure {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px; border-radius: var(--radius-md); margin-bottom: 8px;
          background: var(--color-surface-soft);
          transition: background 0.15s;
        }
        .mock-measure:hover { background: var(--color-primary-soft); }
        .mock-measure-label { font-size: 12px; font-weight: 600; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--color-ink); }
        .mock-measure-name { font-size: 11px; color: var(--color-subtle); }
        .mock-chip { font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 99px; border: 1px solid; }
        .chip-g { background: #e8f4ef; color: #2d6a4f; border-color: #b7dfc9; }
        .chip-a { background: #fef5e7; color: #a05c00; border-color: #e8b84b; }
        .chip-b { background: var(--color-primary-soft); color: var(--color-primary); border-color: var(--color-border); }
        .mock-score { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; font-weight: 500; color: var(--color-primary); }

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
          font-size: 12px; font-weight: 500; padding: 4px 16px;
          background: var(--color-primary-soft); color: var(--color-primary);
          border: 1px solid var(--color-border); border-radius: 99px;
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
          background: rgba(247,250,252,0.82);
          padding: 80px 32px;
        }
        .features-inner { max-width: 1100px; margin: 0 auto; }
        .section-label {
          font-size: 11px; font-weight: 500; letter-spacing: 1.5px;
          text-transform: uppercase; color: var(--color-subtle); margin-bottom: 12px;
        }
        .section-title {
          font-family: 'Source Serif 4', serif; font-size: 36px;
          font-weight: 600; letter-spacing: -0.5px;
          margin-bottom: 48px; line-height: 1.2; color: var(--color-ink);
        }
        .why-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .why-card {
          background: var(--color-surface);
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
          padding: 8px 20px; border-radius: 99px; border: none;
          font-family: 'Inter', sans-serif; font-size: 13px;
          font-weight: 500; cursor: pointer; transition: all 0.15s;
          background: transparent; color: var(--color-muted);
        }
        .toggle-btn.active { background: var(--color-primary); color: var(--color-surface); font-weight: 600; }
        .save-badge {
          font-size: 10px; font-weight: 700; padding: 2px 8px;
          background: #e8f4ef; color: #2d6a4f; border: 1px solid #b7dfc9;
          border-radius: 99px; margin-left: 8px;
        }
        .pricing-card-single {
          border: 1px solid var(--color-border); border-radius: 16px;
          padding: 40px; background: var(--color-primary);
          color: var(--color-surface); text-align: left; position: relative;
        }
        .plan-name { font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; opacity: 0.7; margin-bottom: 12px; }
        .plan-price { font-family: 'Source Serif 4', serif; font-size: 56px; font-weight: 600; letter-spacing: -1px; line-height: 1; }
        .plan-price span { font-size: 20px; font-weight: 400; opacity: 0.7; }
        .plan-period { font-size: 13px; opacity: 0.6; margin-top: 4px; margin-bottom: 28px; }
        .plan-features { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
        .plan-features li { font-size: 15px; display: flex; align-items: center; gap: 8px; }
        .plan-features li::before { content: '✓'; font-weight: 700; }
        .plan-btn-dark {
          display: block; text-align: center; padding: 12px;
          border-radius: 10px; font-size: 15px; font-weight: 600;
          text-decoration: none; background: var(--color-surface); color: var(--color-primary);
          transition: background 0.15s;
        }
        .plan-btn-dark:hover { background: var(--color-primary-soft); }
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
          background: rgba(247,250,252,0.82);
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
          background: var(--color-primary); color: var(--color-surface);
          text-align: center; padding: 80px 32px;
        }
        .cta-title { font-family: 'Source Serif 4', serif; font-size: 42px; font-weight: 600; letter-spacing: -0.5px; margin-bottom: 16px; line-height: 1.15; }
        .cta-title em { font-style: italic; font-weight: 300; }
        .cta-sub { font-size: 16px; opacity: 0.8; margin-bottom: 36px; font-weight: 300; }
        .cta-btn {
          background: var(--color-surface); color: var(--color-primary);
          padding: 12px 36px; border-radius: 10px;
          font-size: 15px; font-weight: 600;
          text-decoration: none; display: inline-block;
          transition: background 0.15s;
        }
        .cta-btn:hover { background: var(--color-primary-soft); }

        footer {
          background: var(--color-ink); color: var(--color-subtle);
          padding: 32px; text-align: center; font-size: 13px;
        }
        footer a { color: var(--color-subtle); text-decoration: none; margin: 0 12px; }
        footer a:hover { color: var(--color-surface); }

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

        /* DEMO MODAL */
        .demo-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(31,41,51,0.4);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        .demo-modal {
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          padding: 32px;
          width: 100%; max-width: 580px;
          box-shadow: var(--shadow-md);
          position: relative;
          max-height: 90vh; overflow-y: auto;
        }
        .demo-close {
          position: absolute; top: 16px; right: 20px;
          background: none; border: none; cursor: pointer;
          font-size: 22px; color: var(--color-muted); line-height: 1;
          padding: 4px;
        }
        .demo-close:hover { color: var(--color-ink); }
        .demo-title {
          font-family: 'Source Serif 4', serif;
          font-size: 22px; font-weight: 600;
          color: var(--color-ink); margin-bottom: 6px;
        }
        .demo-sub {
          font-size: 14px; color: var(--color-muted);
          font-weight: 300; margin-bottom: 24px; line-height: 1.5;
        }
        .demo-field { margin-bottom: 16px; }
        .demo-label {
          display: block; font-size: 12px; font-weight: 600;
          color: var(--color-muted); margin-bottom: 6px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .demo-input {
          width: 100%; height: 44px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 0 12px; font-size: 15px;
          font-family: 'Inter', sans-serif;
          color: var(--color-ink); background: var(--color-surface);
          outline: none;
        }
        .demo-input:focus { border-color: var(--color-primary); }
        .demo-live {
          background: var(--color-surface-soft);
          border-radius: var(--radius-sm);
          padding: 14px 16px;
          display: flex; gap: 32px;
          margin-bottom: 24px;
        }
        .demo-live-item { flex: 1; }
        .demo-live-label { font-size: 11px; font-weight: 600; color: var(--color-subtle); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        .demo-live-value { font-size: 22px; font-weight: 600; color: var(--color-primary); font-family: 'Source Serif 4', serif; }
        .demo-live-unit { font-size: 12px; color: var(--color-muted); font-weight: 400; }
        .demo-btn {
          width: 100%; height: 44px;
          background: var(--color-primary); color: var(--color-surface);
          border: none; border-radius: var(--radius-sm);
          font-size: 15px; font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
        }
        .demo-btn:hover { background: var(--color-primary-dark); }
        .demo-back {
          background: none; border: none; cursor: pointer;
          font-size: 13px; color: var(--color-muted);
          font-family: 'Inter', sans-serif;
          padding: 0; margin-top: 16px; display: block;
        }
        .demo-back:hover { color: var(--color-ink); text-decoration: underline; }

        /* Patient grid */
        .demo-patient-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 12px; margin-bottom: 4px;
        }

        /* Zone visual */
        .demo-zone-wrap { margin-bottom: 12px; }
        .demo-zone-track {
          position: relative; display: flex;
          height: 28px; border-radius: var(--radius-sm); overflow: hidden;
          margin-bottom: 4px;
        }
        .demo-zone-seg {
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 600; color: rgba(0,0,0,0.45);
          text-transform: uppercase; letter-spacing: 0.4px;
        }
        .zone-household { flex: 2; background: #f3ece6; }
        .zone-limited   { flex: 2; background: #fef5e7; }
        .zone-community { flex: 6; background: #e8f4ef; }
        .demo-zone-marker {
          position: absolute; top: 50%; transform: translate(-50%, -50%);
          width: 14px; height: 14px; border-radius: 50%;
          background: var(--color-primary);
          border: 2px solid var(--color-surface);
          box-shadow: 0 0 0 1px var(--color-primary);
        }
        .demo-zone-legend {
          display: flex; justify-content: space-between;
          font-size: 10px; color: var(--color-subtle); margin-bottom: 8px;
        }
        .demo-classification {
          font-family: 'Source Serif 4', serif;
          font-size: 20px; font-weight: 600;
          color: var(--color-ink); margin-bottom: 20px; text-align: center;
        }

        /* Norm / compare rows */
        .demo-norm-row, .demo-compare-row {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 12px; margin-bottom: 16px;
        }
        .demo-norm-item, .demo-compare-item {
          background: var(--color-surface-soft);
          border-radius: var(--radius-sm); padding: 12px;
        }
        .demo-norm-label {
          font-size: 11px; font-weight: 600; color: var(--color-subtle);
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
        }
        .demo-norm-value {
          font-size: 20px; font-weight: 600;
          font-family: 'Source Serif 4', serif; color: var(--color-ink);
        }
        .demo-norm-value span { font-size: 12px; font-weight: 400; color: var(--color-muted); }
        .demo-change { color: var(--color-primary); }
        .demo-mcid-badge {
          display: inline-block; font-size: 13px; font-weight: 600;
          padding: 4px 10px; border-radius: 99px; margin-top: 4px;
        }
        .mcid-met { background: #e8f4ef; color: #2d6a4f; }
        .mcid-not { background: var(--color-surface); color: var(--color-muted); border: 1px solid var(--color-border); }

        /* Clinical interpretation block */
        .demo-interp-block {
          background: var(--color-primary-soft);
          border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px;
        }
        .demo-interp-label {
          font-size: 11px; font-weight: 700; letter-spacing: 1px;
          text-transform: uppercase; color: var(--color-primary); margin-bottom: 12px;
        }
        .demo-interp-row {
          display: flex; justify-content: space-between; gap: 16px;
          padding: 6px 0; border-bottom: 1px solid var(--color-border);
        }
        .demo-interp-row:last-child { border-bottom: none; }
        .demo-interp-key { font-size: 13px; font-weight: 500; color: var(--color-muted); flex-shrink: 0; }
        .demo-interp-val { font-size: 13px; color: var(--color-ink); text-align: right; }
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
              <div className="hero-eyebrow">Automated scoring. Clinical-grade reporting.</div>
              <h1 className="hero-title">Data-driven outcomes. Better patient care.</h1>
              <p className="hero-sub">RehabMetrics helps physiotherapists track what matters most with automated scoring, MCID tracking, and clinical-grade reports—so you can focus on your patients.</p>
              <div className="hero-actions">
                <a href="/signup" className="btn-primary">Start 14-day free trial</a>
                <button className="btn-secondary" onClick={() => setShowDemoModal(true)}>See how it works →</button>
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
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
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
            <h2 className="section-title">Outcome measures, simplified.</h2>
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
          <h2 className="section-title" style={{marginBottom:'12px'}}>Clear pricing. No surprises.</h2>
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
          <a href="mailto:Support@RehabMetricsIQ.com">Contact</a>
        </div>
        <div>© {new Date().getFullYear()} RehabMetrics. All rights reserved.</div>
      </footer>

      {showDemoModal && (
        <div className="demo-overlay" onClick={e => { if (e.target === e.currentTarget) closeDemoModal() }}>
          <div className="demo-modal">
            <button className="demo-close" onClick={closeDemoModal} aria-label="Close">×</button>

            <div className="demo-title">10 Metre Walk Test</div>
            <p className="demo-sub">Enter a single trial to see how RehabMetrics calculates outcomes.</p>

            {demoStep === 'input' && (
              <>
                <div className="demo-patient-grid">
                  <div className="demo-field">
                    <label className="demo-label" htmlFor="demo-name">Patient name</label>
                    <input
                      id="demo-name"
                      type="text"
                      className="demo-input"
                      value={patientName}
                      onChange={e => setPatientName(e.target.value)}
                    />
                  </div>
                  <div className="demo-field">
                    <label className="demo-label" htmlFor="demo-age">Age</label>
                    <input
                      id="demo-age"
                      type="number"
                      min="18"
                      max="120"
                      className="demo-input"
                      value={patientAge}
                      onChange={e => setPatientAge(parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                  <div className="demo-field">
                    <label className="demo-label" htmlFor="demo-date">Date</label>
                    <input
                      id="demo-date"
                      type="date"
                      className="demo-input"
                      value={testDate}
                      onChange={e => setTestDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="demo-field">
                  <label className="demo-label" htmlFor="demo-time">Time (seconds)</label>
                  <input
                    id="demo-time"
                    type="number"
                    min="1"
                    step="0.1"
                    className="demo-input"
                    value={time}
                    onChange={e => setTime(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="demo-field">
                  <label className="demo-label" htmlFor="demo-steps">Steps</label>
                  <input
                    id="demo-steps"
                    type="number"
                    min="1"
                    step="1"
                    className="demo-input"
                    value={steps}
                    onChange={e => setSteps(parseInt(e.target.value, 10) || 0)}
                  />
                </div>

                <div className="demo-live">
                  <div className="demo-live-item">
                    <div className="demo-live-label">Walking speed</div>
                    <div className="demo-live-value">
                      {speed.toFixed(2)} <span className="demo-live-unit">m/s</span>
                    </div>
                  </div>
                  <div className="demo-live-item">
                    <div className="demo-live-label">Cadence</div>
                    <div className="demo-live-value">
                      {cadence.toFixed(2)} <span className="demo-live-unit">steps/min</span>
                    </div>
                  </div>
                </div>

                <button className="demo-btn" onClick={() => setDemoStep('summary')}>View Summary</button>
              </>
            )}

            {demoStep === 'summary' && (
              <>
                <div className="demo-zone-wrap">
                  <div className="demo-zone-track">
                    <div className="demo-zone-seg zone-household">Household</div>
                    <div className="demo-zone-seg zone-limited">Limited</div>
                    <div className="demo-zone-seg zone-community">Community</div>
                    <div className="demo-zone-marker" style={{ left: `${Math.min(speed / 2, 1) * 100}%` }} />
                  </div>
                  <div className="demo-zone-legend">
                    <span>0 m/s</span><span>0.4</span><span>0.8</span><span>2.0 m/s</span>
                  </div>
                </div>
                <p className="demo-classification">{classification.label}</p>

                <div className="demo-norm-row">
                  <div className="demo-norm-item">
                    <div className="demo-norm-label">Walking speed</div>
                    <div className="demo-norm-value">{speed.toFixed(2)} <span>m/s</span></div>
                  </div>
                  <div className="demo-norm-item">
                    <div className="demo-norm-label">Age-matched norm</div>
                    <div className="demo-norm-value">{ageNorm.toFixed(2)} <span>m/s</span></div>
                  </div>
                  <div className="demo-norm-item">
                    <div className="demo-norm-label">% of norm</div>
                    <div className="demo-norm-value">{normPct}<span>%</span></div>
                  </div>
                </div>

                <div className="demo-compare-row">
                  <div className="demo-compare-item">
                    <div className="demo-norm-label">Previous</div>
                    <div className="demo-norm-value">{prevSpeed.toFixed(2)} <span>m/s</span></div>
                  </div>
                  <div className="demo-compare-item">
                    <div className="demo-norm-label">Change</div>
                    <div className="demo-norm-value demo-change">
                      {speedChange >= 0 ? '+' : ''}{speedChange.toFixed(2)} <span>m/s</span>
                    </div>
                  </div>
                  <div className="demo-compare-item">
                    <div className="demo-norm-label">MCID (≥0.1 m/s)</div>
                    <div className={`demo-mcid-badge ${mcidMet ? 'mcid-met' : 'mcid-not'}`}>
                      {mcidMet ? 'Met' : 'Not met'}
                    </div>
                  </div>
                </div>

                <div className="demo-interp-block">
                  <div className="demo-interp-label">Clinical Interpretation</div>
                  <div className="demo-interp-row">
                    <span className="demo-interp-key">Classification</span>
                    <span className="demo-interp-val">{classification.label}</span>
                  </div>
                  <div className="demo-interp-row">
                    <span className="demo-interp-key">Norm comparison</span>
                    <span className="demo-interp-val">{normPct}% of age-matched norm ({ageNorm.toFixed(2)} m/s)</span>
                  </div>
                  <div className="demo-interp-row">
                    <span className="demo-interp-key">Change over time</span>
                    <span className="demo-interp-val">
                      {speedChange >= 0 ? '+' : ''}{speedChange.toFixed(2)} m/s from previous test
                    </span>
                  </div>
                  <div className="demo-interp-row">
                    <span className="demo-interp-key">MCID status</span>
                    <span className="demo-interp-val">
                      {mcidMet
                        ? 'Clinically meaningful improvement detected'
                        : 'Change does not reach minimal clinically important difference'}
                    </span>
                  </div>
                </div>

                <button className="demo-back" onClick={() => setDemoStep('input')}>← Back to inputs</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

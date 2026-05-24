import { useState } from 'react'
import { supabase } from '../lib/supabase'
import LogoWordmark from './LogoWordmark'
import ThreeBarMotif from './ThreeBarMotif'

const PLAN_OPTIONS = {
  annual: {
    id: 'annual',
    label: 'Annual',
    price: '$24.99',
    period: 'per year',
    detail: '$2.08 per month',
    badge: 'Best value',
    cta: 'Continue with annual plan',
  },
  monthly: {
    id: 'monthly',
    label: 'Monthly',
    price: '$2.99',
    period: 'per month',
    detail: 'Flexible month-to-month access',
    badge: null,
    cta: 'Continue with monthly plan',
  },
}

const VISUAL_METRICS = [
  ['23', 'Outcome measures for gait, balance, endurance, independence and symptoms.'],
  ['MCID', 'Meaningful-change context beside patient trends and reports.'],
  ['Reports', 'Clinical summaries ready for documentation and patient conversations.'],
]

export default function SubscriptionWall({ user, subscription, onSignOut }) {
  const [checkoutLoading, setCheckoutLoading] = useState(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('annual')

  async function handleSubscribe(plan) {
    setCheckoutLoading(plan)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setCheckoutLoading(null)
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true)
    setError('')
    try {
      const res = await fetch('/api/customer-portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to open billing portal')
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setPortalLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    setError('')
    try {
      const res = await fetch('/api/delete-account', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Deletion failed')
      }
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (err) {
      setError(err.message)
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const isPastDue = subscription?.status === 'past_due'
  const hasBilling = !!subscription?.stripe_customer_id
  const billingFirst = isPastDue && hasBilling
  const selectedPlanMeta = PLAN_OPTIONS[selectedPlan]
  const isWorking = !!checkoutLoading || portalLoading || deleting
  const userEmail = user?.email || 'Signed-in account'
  const heading = billingFirst
    ? 'Update your billing to restore access'
    : 'Your free trial has ended'
  const description = billingFirst
    ? 'Your last payment did not go through. Update your billing details in Stripe to continue using RehabMetrics IQ.'
    : hasBilling
      ? 'Choose a plan to continue, or manage your existing billing details if you need to review your account.'
      : 'Choose a plan to continue using RehabMetrics IQ with your patient records, pathway guidance, and reports ready where you left them.'

  return (
    <>
      {showDeleteConfirm && (
        <div className="subscription-modal" aria-modal="true" role="dialog" aria-labelledby="delete-account-title">
          <div className="subscription-modal__content">
            <header>
              <h2 id="delete-account-title">Delete account</h2>
              <button aria-label="Close" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </header>
            <form onSubmit={e => { e.preventDefault(); handleDeleteAccount() }}>
              <p>
                This will permanently delete your account, all patient records, and all assessment data.
                This cannot be undone, and this email will not be eligible for a new free trial.
              </p>
              {error && <p className="wall-error" role="alert">{error}</p>}
              <div>
                <button type="button" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button type="submit" disabled={deleting} data-danger="">
                  {deleting ? 'Deleting…' : 'Delete my account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="subscription-page">
        <section className="subscription-shell" aria-labelledby="subscription-wall-heading">
          <aside className="subscription-visual" aria-label="RehabMetrics IQ clinical outcomes workspace">
            <video
              className="subscription-visual__video"
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
            <div className="subscription-visual__content">
              <LogoWordmark size="lg" showMark={false} />
              <p className="subscription-eyebrow">CLINICAL OUTCOMES WORKSPACE</p>
              <h2>Keep patient progress data connected to clinical context.</h2>
              <div className="subscription-metrics" aria-label="Product capabilities">
                {VISUAL_METRICS.map(([value, label]) => (
                  <div key={value}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="subscription-panel">
            <div className="subscription-panel__brand">
              <LogoWordmark size="md" spaceAfter />
            </div>

            <p className="subscription-eyebrow subscription-eyebrow--panel">
              {billingFirst ? 'Payment issue' : 'Subscription required'}
            </p>
            <h1 id="subscription-wall-heading">{heading}</h1>
            <p className="subscription-copy">{description}</p>

            <div className="account-strip" title={userEmail}>
              <span>{userEmail.charAt(0).toUpperCase()}</span>
              <div>
                <small>Signed in as</small>
                <strong>{userEmail}</strong>
              </div>
            </div>

            {billingFirst && (
              <div className="billing-alert">
                <strong>Payment issue</strong>
                <span>Update your payment method to restore access without creating a new subscription.</span>
              </div>
            )}

            {error && !showDeleteConfirm && <p className="wall-error" role="alert">{error}</p>}

            {billingFirst ? (
              <button
                type="button"
                className="primary-action"
                onClick={handleManageBilling}
                disabled={isWorking}
              >
                {portalLoading ? (
                  <span className="button-loading">
                    <ThreeBarMotif size="xs" tone="light" loading label="Opening billing portal" />
                    Opening billing…
                  </span>
                ) : 'Update billing details'}
              </button>
            ) : (
              <>
                <fieldset className="plan-selector" aria-label="Subscription plan">
                  <legend>Choose a plan</legend>
                  {Object.values(PLAN_OPTIONS).map(plan => (
                    <button
                      key={plan.id}
                      type="button"
                      className="plan-option"
                      data-selected={selectedPlan === plan.id ? '' : undefined}
                      onClick={() => setSelectedPlan(plan.id)}
                      aria-pressed={selectedPlan === plan.id}
                    >
                      <span>
                        <strong>{plan.label}</strong>
                        {plan.badge && <em>{plan.badge}</em>}
                      </span>
                      <span>
                        <b>{plan.price}</b>
                        <small>{plan.period}</small>
                      </span>
                      <small>{plan.detail}</small>
                    </button>
                  ))}
                </fieldset>

                <button
                  type="button"
                  className="primary-action"
                  onClick={() => handleSubscribe(selectedPlan)}
                  disabled={isWorking}
                >
                  {checkoutLoading ? (
                    <span className="button-loading">
                      <ThreeBarMotif size="xs" tone="light" loading label="Redirecting to checkout" />
                      Redirecting…
                    </span>
                  ) : selectedPlanMeta.cta}
                </button>

                {hasBilling && (
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={handleManageBilling}
                    disabled={isWorking}
                  >
                    {portalLoading ? (
                      <span className="button-loading">
                        <ThreeBarMotif size="xs" loading label="Opening billing portal" />
                        Opening billing…
                      </span>
                    ) : 'Manage billing'}
                  </button>
                )}
              </>
            )}

            <div className="support-actions">
              <button type="button" onClick={onSignOut}>Sign out</button>
              <button type="button" data-danger="" onClick={() => setShowDeleteConfirm(true)}>
                Delete my account
              </button>
            </div>
          </section>
        </section>
      </main>

      <style>{styles}</style>
    </>
  )
}

const styles = `
  .subscription-page {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 32px;
    background: #f7fafc;
  }

  .subscription-shell {
    width: min(100%, 1080px);
    min-height: min(700px, calc(100dvh - 64px));
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(390px, 0.88fr);
    overflow: hidden;
    border: 1px solid rgba(216,226,236,0.95);
    border-radius: 18px;
    background: #ffffff;
    box-shadow: 0 18px 42px rgba(21,34,56,0.12);
  }

  .subscription-visual {
    position: relative;
    min-height: 560px;
    isolation: isolate;
    overflow: hidden;
    background: #17496f;
  }

  .subscription-visual__video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transform: scale(1.12);
    z-index: 0;
  }

  .subscription-visual::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background:
      linear-gradient(90deg, rgba(9,19,32,0.72), rgba(9,19,32,0.28) 56%, rgba(9,19,32,0.08)),
      linear-gradient(180deg, rgba(9,19,32,0.22), rgba(9,19,32,0.1) 42%, rgba(9,19,32,0.58));
  }

  .subscription-visual__content {
    position: relative;
    z-index: 3;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 46px;
    color: #ffffff;
  }

  .subscription-visual__content :global(.logo-wordmark) {
    margin-bottom: auto;
    color: #ffffff;
    text-shadow: 0 2px 18px rgba(0,0,0,0.3);
  }

  .subscription-visual__content :global(.logo-wordmark__iq) {
    color: #7fb3e6;
  }

  .subscription-eyebrow {
    margin: 0 0 12px;
    color: rgba(255,255,255,0.76);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    text-shadow: 0 2px 14px rgba(0,0,0,0.28);
  }

  .subscription-eyebrow--panel {
    color: #8a96a3;
    text-shadow: none;
  }

  .subscription-visual h2 {
    max-width: 540px;
    margin: 0;
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: clamp(34px, 4vw, 54px);
    font-weight: 700;
    line-height: 1.04;
    text-wrap: balance;
    text-shadow: 0 2px 22px rgba(0,0,0,0.32);
  }

  .subscription-metrics {
    width: min(100%, 540px);
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 28px;
  }

  .subscription-metrics > div {
    min-height: 104px;
    padding: 16px;
    border: 1px solid rgba(255,255,255,0.24);
    border-radius: 10px;
    background: rgba(8,18,30,0.58);
    box-shadow: inset 0 1px rgba(255,255,255,0.16);
  }

  .subscription-metrics strong {
    display: block;
    font-size: clamp(20px, 2.2vw, 28px);
    font-weight: 800;
    line-height: 1;
  }

  .subscription-metrics span {
    display: block;
    margin-top: 8px;
    color: rgba(255,255,255,0.74);
    font-size: 12px;
    font-weight: 700;
    line-height: 1.35;
  }

  .subscription-panel {
    width: 100%;
    align-self: center;
    padding: 46px;
    background: #ffffff;
  }

  .subscription-panel__brand {
    margin-bottom: 32px;
  }

  .subscription-panel__brand :global(.logo-wordmark) {
    max-width: 100%;
  }

  .subscription-panel h1 {
    margin: 0;
    color: #1f2933;
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: 31px;
    font-weight: 700;
    line-height: 1.14;
    text-wrap: balance;
  }

  .subscription-copy {
    max-width: 42rem;
    margin: 12px 0 0;
    color: #5f6b7a;
    font-size: 14px;
    line-height: 1.6;
  }

  .account-strip {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 24px 0;
    padding: 12px;
    border: 1px solid #d8e2ec;
    border-radius: 10px;
    background: #f7fafc;
  }

  .account-strip > span {
    width: 38px;
    height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    border-radius: 10px;
    background: #eaf3fb;
    color: #17496f;
    font-size: 14px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .account-strip div {
    min-width: 0;
  }

  .account-strip small {
    display: block;
    color: #8a96a3;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .account-strip strong {
    display: block;
    min-width: 0;
    margin-top: 2px;
    overflow: hidden;
    color: #1f2933;
    font-size: 14px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .billing-alert,
  .wall-error {
    margin: 0 0 16px;
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 13px;
    line-height: 1.45;
  }

  .billing-alert {
    display: grid;
    gap: 3px;
    border: 1px solid #f5d49a;
    background: #fff6e8;
    color: #7a4a0f;
  }

  .billing-alert strong {
    font-size: 13px;
    font-weight: 800;
  }

  .wall-error {
    border: 1px solid #f0b8a2;
    background: #fdf0ec;
    color: #b5451b;
    font-weight: 600;
  }

  .plan-selector {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin: 0 0 16px;
    padding: 0;
    border: 0;
  }

  .plan-selector legend {
    grid-column: 1 / -1;
    margin-bottom: 8px;
    color: #1f2933;
    font-size: 13px;
    font-weight: 700;
  }

  .plan-option {
    min-width: 0;
    min-height: 162px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: space-between;
    gap: 14px;
    padding: 16px;
    border: 1px solid #d8e2ec;
    border-radius: 10px;
    background: #fbfdff;
    color: #1f2933;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.18s, background 0.18s, box-shadow 0.18s, transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .plan-option:hover {
    transform: translateY(-1px);
    border-color: rgba(35,100,153,0.36);
    box-shadow: 0 8px 18px rgba(21,34,56,0.09);
  }

  .plan-option:focus-visible,
  .primary-action:focus-visible,
  .secondary-action:focus-visible,
  .support-actions button:focus-visible,
  .subscription-modal button:focus-visible {
    outline: 3px solid rgba(35,100,153,0.2);
    outline-offset: 2px;
  }

  .plan-option[data-selected] {
    border-color: #236499;
    background: #eaf3fb;
    box-shadow: 0 0 0 3px rgba(35,100,153,0.1);
  }

  .plan-option span:first-child {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .plan-option strong {
    font-size: 15px;
    font-weight: 800;
  }

  .plan-option em {
    border-radius: 999px;
    background: #236499;
    color: #ffffff;
    font-size: 10px;
    font-style: normal;
    font-weight: 800;
    padding: 4px 8px;
    white-space: nowrap;
  }

  .plan-option b {
    display: block;
    color: #17212b;
    font-size: 30px;
    line-height: 1;
  }

  .plan-option small {
    display: block;
    color: #5f6b7a;
    font-size: 12px;
    line-height: 1.4;
  }

  .primary-action,
  .secondary-action {
    width: 100%;
    min-height: 46px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    transition: background 0.18s, border-color 0.18s, color 0.18s, transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s, opacity 0.15s;
  }

  .primary-action {
    border: 0;
    background: #236499;
    box-shadow: 0 10px 22px rgba(35,100,153,0.24);
    color: #ffffff;
    font-weight: 700;
  }

  .primary-action:hover {
    background: #17496f;
    transform: translateY(-1px);
    box-shadow: 0 14px 28px rgba(35,100,153,0.34);
  }

  .primary-action:active,
  .secondary-action:active,
  .plan-option:active {
    transform: translateY(0);
  }

  .primary-action:disabled,
  .secondary-action:disabled {
    opacity: 0.62;
    cursor: not-allowed;
    transform: none;
  }

  .secondary-action {
    margin-top: 10px;
    border: 1px solid #d8e2ec;
    background: #ffffff;
    color: #236499;
    font-weight: 700;
  }

  .secondary-action:hover {
    border-color: rgba(35,100,153,0.36);
    background: #f7fafc;
    transform: translateY(-1px);
  }

  .button-loading {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
  }

  .support-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
    margin-top: 24px;
    padding-top: 18px;
    border-top: 1px solid #d8e2ec;
  }

  .support-actions button {
    border: 0;
    background: transparent;
    color: #5f6b7a;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
  }

  .support-actions button:hover {
    color: #236499;
    text-decoration: underline;
  }

  .support-actions button[data-danger] {
    color: #b5451b;
  }

  .subscription-modal {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(15,23,32,0.45);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }

  .subscription-modal__content {
    width: min(100%, 520px);
    overflow: hidden;
    border: 1px solid #d8e2ec;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 20px 48px rgba(31,41,51,0.14);
  }

  .subscription-modal__content header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 26px;
    border-bottom: 1px solid #d8e2ec;
    background: #f7fafc;
  }

  .subscription-modal__content h2 {
    margin: 0;
    color: #1f2933;
    font-size: 18px;
    font-weight: 800;
  }

  .subscription-modal__content header button {
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #8a96a3;
    cursor: pointer;
    font-size: 24px;
    line-height: 1;
    padding: 2px 8px;
  }

  .subscription-modal__content header button:hover {
    background: #d8e2ec;
    color: #1f2933;
  }

  .subscription-modal__content form {
    padding: 24px 26px 26px;
  }

  .subscription-modal__content p {
    margin: 0;
    color: #5f6b7a;
    font-size: 14px;
    line-height: 1.6;
  }

  .subscription-modal__content form > div:last-child {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px solid #d8e2ec;
  }

  .subscription-modal__content form button {
    min-height: 38px;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 700;
    padding: 0 18px;
  }

  .subscription-modal__content form button[type="button"] {
    border: 1px solid #d8e2ec;
    background: #ffffff;
    color: #5f6b7a;
  }

  .subscription-modal__content form button[type="submit"] {
    border: 0;
    background: #236499;
    color: #ffffff;
  }

  .subscription-modal__content form button[data-danger] {
    background: #b5451b;
  }

  .subscription-modal__content form button:disabled {
    opacity: 0.58;
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: no-preference) {
    .subscription-shell {
      animation: subscription-shell-appear 0.52s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .subscription-metrics > div:nth-child(1) {
      animation: subscription-metric-appear 0.5s 0.1s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .subscription-metrics > div:nth-child(2) {
      animation: subscription-metric-appear 0.5s 0.18s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .subscription-metrics > div:nth-child(3) {
      animation: subscription-metric-appear 0.5s 0.26s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .subscription-modal {
      animation: subscription-backdrop-in 0.2s ease;
    }

    .subscription-modal__content {
      animation: subscription-modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .subscription-visual__video {
      display: none;
    }
  }

  @media (max-width: 900px) {
    .subscription-page {
      padding: 18px;
      place-items: start center;
    }

    .subscription-shell {
      grid-template-columns: 1fr;
      min-height: auto;
    }

    .subscription-visual {
      min-height: 330px;
    }

    .subscription-visual__content,
    .subscription-panel {
      padding: 30px;
    }

    .subscription-metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .subscription-metrics > div:last-child {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 560px) {
    .subscription-page {
      padding: 12px;
    }

    .subscription-shell {
      border-radius: 14px;
    }

    .subscription-visual {
      min-height: 360px;
    }

    .subscription-visual__content,
    .subscription-panel {
      padding: 24px;
    }

    .subscription-metrics,
    .plan-selector {
      grid-template-columns: 1fr;
    }

    .subscription-metrics > div:last-child {
      grid-column: auto;
    }

    .plan-option {
      min-height: 132px;
    }

    .support-actions {
      justify-content: flex-start;
    }

    .subscription-modal__content form > div:last-child {
      display: grid;
    }
  }

  @keyframes subscription-shell-appear {
    from { opacity: 0; transform: translateY(16px) scale(0.99); }
    to { opacity: 1; transform: none; }
  }

  @keyframes subscription-metric-appear {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: none; }
  }

  @keyframes subscription-backdrop-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes subscription-modal-in {
    from { opacity: 0; transform: translateY(14px) scale(0.98); }
    to { opacity: 1; transform: none; }
  }
`

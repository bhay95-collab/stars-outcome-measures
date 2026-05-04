import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SubscriptionWall({ user, subscription, onSignOut }) {
  const [checkoutLoading, setCheckoutLoading] = useState(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

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
  const isWorking = !!checkoutLoading || portalLoading

  return (
    <>
      {showDeleteConfirm && (
        <div className="modal">
          <div className="modal-content">
            <header>
              <span className="section-label">Delete Account</span>
              <button aria-label="Close" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </header>
            <form onSubmit={e => { e.preventDefault(); handleDeleteAccount() }}>
              <p className="subtext">
                This will permanently delete your account, all patient records, and all assessment data.
                This cannot be undone, and this email will not be eligible for a new free trial.
              </p>
              {error && <p className="error">{error}</p>}
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

      <main className="main-center">
        <div className="expired-card">
          <p className="tier-label">Subscription required</p>
          <h1 className="heading">Your free trial has ended</h1>
          <p className="subtext">Choose a plan to continue using RehabMetrics IQ.</p>

          {isPastDue && hasBilling && (
            <div className="info-panel">
              <strong>Payment issue:</strong> Your last payment failed. Update your billing details to restore access.
            </div>
          )}

          {error && !showDeleteConfirm && <p className="error">{error}</p>}

          <div data-plans="">
            <div className="result-box" data-plan-card="">
              <p className="result-label">Monthly</p>
              <p data-plan-price="">$2.99</p>
              <p className="subtext">per month</p>
              <button
                data-subscribe-btn=""
                onClick={() => handleSubscribe('monthly')}
                disabled={isWorking}
              >
                {checkoutLoading === 'monthly' ? 'Redirecting…' : 'Subscribe monthly'}
              </button>
            </div>

            <div className="result-box" data-plan-card="">
              <p className="result-label">Annual — save 31%</p>
              <p data-plan-price="">$24.99</p>
              <p className="subtext">per year ($2.08/mo)</p>
              <button
                data-subscribe-btn=""
                onClick={() => handleSubscribe('annual')}
                disabled={isWorking}
              >
                {checkoutLoading === 'annual' ? 'Redirecting…' : 'Subscribe annually'}
              </button>
            </div>
          </div>

          <div data-wall-links="">
            {hasBilling && (
              <button
                data-wall-link="manage"
                onClick={handleManageBilling}
                disabled={isWorking}
              >
                {portalLoading ? 'Opening…' : 'Manage billing'}
              </button>
            )}
            <button data-wall-link="signout" onClick={onSignOut}>
              Sign out
            </button>
            <button data-wall-link="delete" onClick={() => setShowDeleteConfirm(true)}>
              Delete my account
            </button>
          </div>
        </div>
      </main>
    </>
  )
}

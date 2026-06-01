import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import LogoWordmark from '../../components/LogoWordmark'
import {
  ADHERENCE_OPTIONS,
  FOLLOWUP_QUESTION_CONFIG,
  GLOBAL_STATUS_OPTIONS,
  SYMPTOMS_CHANGE_OPTIONS,
  formatFollowUpDate,
} from '../../lib/followups'

const initialForm = {
  falls_count: 0,
  confidence_score: 5,
  fatigue_score: 5,
  symptoms_change: 'same',
  adherence_level: 'most',
  global_status: 'same',
  concern_text: '',
}

function unavailableCopy(reason) {
  if (reason === 'completed') return 'This check-in has already been submitted.'
  if (reason === 'expired') return 'This check-in link has expired.'
  if (reason === 'cancelled') return 'This check-in link is no longer active.'
  return 'This check-in link is not available.'
}

function SegmentedControl({ label, value, options, onChange }) {
  return (
    <fieldset className="followup-segment">
      <legend>{label}</legend>
      <div>
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export default function PublicFollowUpPage() {
  const router = useRouter()
  const token = router.query.token
  const [state, setState] = useState('loading')
  const [reason, setReason] = useState('')
  const [meta, setMeta] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!router.isReady || !token) return
    let active = true

    async function loadCheckIn() {
      setState('loading')
      setError('')
      try {
        const response = await fetch(`/api/followups/public/${encodeURIComponent(token)}`)
        const data = await response.json()
        if (!active) return
        if (!response.ok || data.state !== 'ready') {
          setState('unavailable')
          setReason(data.reason || 'invalid')
          return
        }
        setMeta(data)
        setState('ready')
      } catch {
        if (!active) return
        setState('unavailable')
        setReason('invalid')
      }
    }

    loadCheckIn()
    return () => {
      active = false
    }
  }, [router.isReady, token])

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/followups/public/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok || data.state !== 'submitted') {
        setError(data.error || unavailableCopy(data.reason))
        if (data.reason) {
          setState('unavailable')
          setReason(data.reason)
        }
        return
      }
      setState('submitted')
    } catch {
      setError('Your check-in could not be submitted. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const questions = meta?.questions ?? FOLLOWUP_QUESTION_CONFIG

  return (
    <>
      <Head>
        <title>Patient Check-In | RehabMetrics IQ</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="icon" href="/SquareLogo.png" />
      </Head>
      <main className="followup-public">
        <section className="followup-public__panel">
          <LogoWordmark size="md" />

          {state === 'loading' && (
            <div className="followup-state" aria-busy="true">
              <h1>Opening check-in</h1>
              <p>Checking that this secure link is active.</p>
            </div>
          )}

          {state === 'unavailable' && (
            <div className="followup-state">
              <h1>Check-in unavailable</h1>
              <p>{unavailableCopy(reason)}</p>
            </div>
          )}

          {state === 'submitted' && (
            <div className="followup-state">
              <h1>Check-in submitted</h1>
              <p>Your responses have been sent securely to your clinician.</p>
            </div>
          )}

          {state === 'ready' && (
            <>
              <header className="followup-public__head">
                <span>Secure patient check-in</span>
                <h1>Weekly follow-up</h1>
                <p>
                  Answer these short questions for your clinician. Do not use this form for urgent concerns or emergencies.
                </p>
                {meta?.expiresAt && <small>Link expires {formatFollowUpDate(meta.expiresAt)}</small>}
              </header>

              <form className="followup-form" onSubmit={handleSubmit}>
                <label>
                  <span>{questions.find(item => item.id === 'falls_count')?.label}</span>
                  <small>{questions.find(item => item.id === 'falls_count')?.help}</small>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={form.falls_count}
                    onChange={event => update('falls_count', event.target.value)}
                  />
                </label>

                <label>
                  <span>{questions.find(item => item.id === 'confidence_score')?.label}: {form.confidence_score}/10</span>
                  <small>{questions.find(item => item.id === 'confidence_score')?.help}</small>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={form.confidence_score}
                    onChange={event => update('confidence_score', Number(event.target.value))}
                  />
                </label>

                <label>
                  <span>{questions.find(item => item.id === 'fatigue_score')?.label}: {form.fatigue_score}/10</span>
                  <small>{questions.find(item => item.id === 'fatigue_score')?.help}</small>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={form.fatigue_score}
                    onChange={event => update('fatigue_score', Number(event.target.value))}
                  />
                </label>

                <SegmentedControl
                  label="Symptoms"
                  value={form.symptoms_change}
                  options={SYMPTOMS_CHANGE_OPTIONS}
                  onChange={value => update('symptoms_change', value)}
                />

                <fieldset className="followup-radio">
                  <legend>Home program</legend>
                  {ADHERENCE_OPTIONS.map(option => (
                    <label key={option.value}>
                      <input
                        type="radio"
                        name="adherence"
                        checked={form.adherence_level === option.value}
                        onChange={() => update('adherence_level', option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </fieldset>

                <SegmentedControl
                  label="Overall status"
                  value={form.global_status}
                  options={GLOBAL_STATUS_OPTIONS}
                  onChange={value => update('global_status', value)}
                />

                <label>
                  <span>Anything you want your clinician to know?</span>
                  <textarea
                    value={form.concern_text}
                    maxLength={1000}
                    rows={4}
                    onChange={event => update('concern_text', event.target.value)}
                    placeholder="Optional"
                  />
                </label>

                {error && <p className="followup-error" role="alert">{error}</p>}

                <button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit check-in'}
                </button>
              </form>
            </>
          )}
        </section>
      </main>
      <style jsx global>{`
        body {
          margin: 0;
          background: #f4f7fb;
          color: #17212b;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .followup-public {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 28px 16px;
        }
        .followup-public__panel {
          width: min(100%, 620px);
          display: grid;
          gap: 24px;
          padding: 26px;
          border: 1px solid #d8e1ea;
          border-radius: 10px;
          background: #fbfdff;
          box-shadow: 0 1px 2px rgba(21,34,56,0.05), 0 8px 20px rgba(21,34,56,0.045);
        }
        .followup-public__head {
          display: grid;
          gap: 8px;
        }
        .followup-public__head span {
          color: #7b8794;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .followup-public__head h1,
        .followup-state h1 {
          margin: 0;
          color: #152238;
          font-size: 30px;
          line-height: 1.05;
        }
        .followup-public__head p,
        .followup-state p,
        .followup-public__head small {
          margin: 0;
          color: #526273;
          font-size: 14px;
          line-height: 1.55;
        }
        .followup-state {
          display: grid;
          gap: 10px;
          min-height: 220px;
          align-content: center;
        }
        .followup-form {
          display: grid;
          gap: 16px;
        }
        .followup-form label,
        .followup-segment,
        .followup-radio {
          display: grid;
          gap: 8px;
          margin: 0;
          padding: 0;
          border: 0;
        }
        .followup-form label span,
        .followup-segment legend,
        .followup-radio legend {
          color: #17212b;
          font-size: 14px;
          font-weight: 800;
        }
        .followup-form label small {
          color: #526273;
          font-size: 12px;
          line-height: 1.4;
        }
        .followup-form input[type="number"],
        .followup-form textarea {
          width: 100%;
          border: 1px solid #d2dce8;
          border-radius: 8px;
          background: #fbfdff;
          color: #17212b;
          font: inherit;
          font-size: 15px;
          padding: 10px 12px;
        }
        .followup-form input[type="range"] {
          width: 100%;
          accent-color: #236499;
        }
        .followup-segment div {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        .followup-segment button {
          min-height: 42px;
          border: 1px solid #d2dce8;
          border-radius: 8px;
          background: #fbfdff;
          color: #526273;
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
        }
        .followup-segment button[aria-pressed="true"] {
          border-color: #236499;
          background: #eaf3fb;
          color: #17496f;
        }
        .followup-radio {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
        }
        .followup-radio legend {
          grid-column: 1 / -1;
        }
        .followup-radio label {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 38px;
          padding: 0 10px;
          border: 1px solid #d2dce8;
          border-radius: 8px;
          background: #f6f9fc;
        }
        .followup-error {
          margin: 0;
          padding: 10px 12px;
          border: 1px solid #f0c4b8;
          border-radius: 8px;
          background: #fff3ef;
          color: #9a3a16;
          font-size: 13px;
          font-weight: 700;
        }
        .followup-form > button {
          min-height: 46px;
          border: 0;
          border-radius: 8px;
          background: #236499;
          color: #fbfdff;
          cursor: pointer;
          font: inherit;
          font-weight: 800;
        }
        .followup-form > button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }
        @media (max-width: 560px) {
          .followup-public__panel {
            padding: 20px;
          }
          .followup-segment div {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}

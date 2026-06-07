import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import LogoWordmark from '../../components/LogoWordmark'
import {
  formatFollowUpDate,
} from '../../lib/followups'
import {
  formatQuestionnaireResult,
  validateFollowUpQuestionnaireAnswers,
} from '../../lib/followupQuestionnaires'

function unavailableCopy(reason) {
  if (reason === 'completed') return 'This check-in has already been submitted.'
  if (reason === 'expired') return 'This check-in link has expired.'
  if (reason === 'cancelled') return 'This check-in link is no longer active.'
  if (reason === 'unsupported') return 'This follow-up link is no longer supported. Please contact your clinician.'
  return 'This check-in link is not available.'
}

function buildInitialItems(questionnaire) {
  return Array(questionnaire?.questions?.length ?? 0).fill('')
}

function QuestionnaireQuestion({ question, value, onChange }) {
  return (
    <label className="followup-question">
      <span className="followup-question__head">
        <strong>{question.index + 1}</strong>
        <span>{question.label}</span>
      </span>
      {question.type === 'number' ? (
        <span className="followup-number-field">
          <input
            type="number"
            inputMode="numeric"
            min={question.min}
            max={question.max}
            step={question.step ?? 1}
            value={value}
            onChange={event => onChange(event.target.value)}
            required
          />
          {question.suffix && <em>{question.suffix}</em>}
        </span>
      ) : (
        <select value={value} onChange={event => onChange(event.target.value)} required>
          <option value="">Choose</option>
          {question.options?.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      )}
    </label>
  )
}

function QuestionnaireForm({ questionnaire, items, onItemChange, preview, error, submitting, onSubmit }) {
  let currentSection = ''

  return (
    <form className="followup-form" onSubmit={onSubmit}>
      <div className="followup-question-list">
        {questionnaire.questions.map(question => {
          const showSection = question.section && question.section !== currentSection
          if (showSection) currentSection = question.section
          return (
            <div key={question.id} className="followup-question-wrap">
              {showSection && <h2>{question.section}</h2>}
              <QuestionnaireQuestion
                question={question}
                value={items[question.index] ?? ''}
                onChange={value => onItemChange(question.index, value)}
              />
            </div>
          )
        })}
      </div>

      <div className="followup-result-preview" data-ready={preview?.results ? '' : undefined}>
        {preview?.results ? (
          <>
            <span>Calculated result</span>
            <strong>{formatQuestionnaireResult(questionnaire.id, preview.results)}</strong>
            <p>{preview.results.interpretation}</p>
          </>
        ) : (
          <p>{preview?.error ?? 'Complete every item to calculate the result.'}</p>
        )}
      </div>

      {error && <p className="followup-error" role="alert">{error}</p>}

      <button type="submit" disabled={submitting || !preview?.results}>
        {submitting ? 'Submitting...' : 'Submit questionnaire'}
      </button>
    </form>
  )
}

export default function PublicFollowUpPage() {
  const router = useRouter()
  const token = router.query.token
  const [state, setState] = useState('loading')
  const [reason, setReason] = useState('')
  const [meta, setMeta] = useState(null)
  const [items, setItems] = useState([])
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
        setItems(buildInitialItems(data.questionnaire))
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

  function updateItem(index, value) {
    setItems(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
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
        body: JSON.stringify({ answers: { items } }),
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

  const questionnaire = meta?.questionnaire
  const preview = questionnaire
    ? validateFollowUpQuestionnaireAnswers(questionnaire.id, { items })
    : null

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
                <span>Secure patient questionnaire</span>
                <h1>{questionnaire?.name ?? 'Follow-up questionnaire'}</h1>
                <p>
                  Complete this questionnaire for your clinician. Do not use this form for urgent concerns or emergencies.
                </p>
                {questionnaire?.instructions && <p>{questionnaire.instructions}</p>}
                {meta?.expiresAt && <small>Link expires {formatFollowUpDate(meta.expiresAt)}</small>}
              </header>

              {questionnaire && (
                <QuestionnaireForm
                  questionnaire={questionnaire}
                  items={items}
                  onItemChange={updateItem}
                  preview={preview}
                  error={error}
                  submitting={submitting}
                  onSubmit={handleSubmit}
                />
              )}
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
        *,
        *::before,
        *::after {
          box-sizing: border-box;
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
          min-width: 0;
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
          overflow-wrap: anywhere;
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
        .followup-question-list {
          display: grid;
          gap: 12px;
        }
        .followup-question-wrap {
          display: grid;
          gap: 8px;
        }
        .followup-question-wrap h2 {
          margin: 10px 0 0;
          color: #17496f;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .followup-question {
          display: grid;
          gap: 10px;
          min-width: 0;
          margin: 0;
          padding: 14px;
          border: 1px solid #d8e1ea;
          border-radius: 8px;
          background: #f6f9fc;
        }
        .followup-question__head {
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr);
          gap: 10px;
          align-items: start;
          min-width: 0;
          color: #17212b;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.45;
        }
        .followup-question__head strong {
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #eaf3fb;
          color: #17496f;
          font-size: 12px;
          font-weight: 900;
        }
        .followup-question__head span {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .followup-number-field {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
          align-items: center;
        }
        .followup-number-field em {
          color: #526273;
          font-size: 13px;
          font-style: normal;
          font-weight: 800;
        }
        .followup-form input[type="number"],
        .followup-form select {
          width: 100%;
          min-width: 0;
          border: 1px solid #d2dce8;
          border-radius: 8px;
          background: #fbfdff;
          color: #17212b;
          font: inherit;
          font-size: 15px;
          padding: 10px 12px;
        }
        .followup-result-preview {
          display: grid;
          gap: 4px;
          padding: 12px 14px;
          border: 1px solid #d8e1ea;
          border-radius: 8px;
          background: #f7fafc;
        }
        .followup-result-preview[data-ready] {
          border-color: #34d399;
          background: #bbf7d0;
        }
        .followup-result-preview span {
          color: #526273;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .followup-result-preview strong {
          color: #17212b;
          font-size: 18px;
          font-weight: 900;
        }
        .followup-result-preview p {
          margin: 0;
          color: #526273;
          font-size: 13px;
          line-height: 1.45;
        }
        .followup-error {
          margin: 0;
          padding: 10px 12px;
          border: 1px solid #f87171;
          border-radius: 8px;
          background: #fecaca;
          color: #991b1b;
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
          .followup-question {
            padding: 12px;
          }
          .followup-question__head {
            grid-template-columns: 26px minmax(0, 1fr);
          }
        }
      `}</style>
    </>
  )
}

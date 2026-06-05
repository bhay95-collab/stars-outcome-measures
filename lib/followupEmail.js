import { formatFollowUpDate } from './followups'
import { getFollowUpQuestionnaire } from './followupQuestionnaires'
import { normalizePatientEmail, validateOptionalPatientEmail } from './patientDetails'

const RESEND_EMAILS_ENDPOINT = 'https://api.resend.com/emails'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function requireEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.FOLLOWUP_EMAIL_FROM
  if (!apiKey || !from) {
    return { error: 'Follow-up email delivery is not configured.' }
  }
  return { apiKey, from }
}

export function normalizeFollowUpRecipientEmail(value) {
  return normalizePatientEmail(value)
}

export function validateFollowUpRecipientEmail(value) {
  return validateOptionalPatientEmail(value)
}

export function buildFollowUpEmail({ to, publicUrl, expiresAt, measureId } = {}) {
  const recipient = normalizeFollowUpRecipientEmail(to)
  const questionnaire = getFollowUpQuestionnaire(measureId)
  const measureName = questionnaire?.name ?? 'questionnaire'
  const expiryLabel = formatFollowUpDate(expiresAt)
  const subject = 'RehabMetrics IQ follow-up questionnaire'

  const text = [
    'Your clinician has sent you a secure RehabMetrics IQ follow-up questionnaire.',
    '',
    `Questionnaire: ${measureName}`,
    `Secure link: ${publicUrl}`,
    `Link expires: ${expiryLabel}`,
    '',
    'Please do not use this form for urgent symptoms, emergencies, or new medical concerns. If you need urgent help, contact your local emergency service or your treating clinician directly.',
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; color: #17212b; line-height: 1.5;">
      <p>Your clinician has sent you a secure RehabMetrics IQ follow-up questionnaire.</p>
      <p><strong>Questionnaire:</strong> ${escapeHtml(measureName)}</p>
      <p><a href="${escapeHtml(publicUrl)}" style="color: #236499;">Open secure questionnaire</a></p>
      <p><strong>Link expires:</strong> ${escapeHtml(expiryLabel)}</p>
      <p style="color: #526273; font-size: 13px;">
        Please do not use this form for urgent symptoms, emergencies, or new medical concerns.
        If you need urgent help, contact your local emergency service or your treating clinician directly.
      </p>
    </div>
  `.trim()

  return {
    to: recipient,
    subject,
    text,
    html,
  }
}

export async function sendFollowUpEmail({ to, publicUrl, expiresAt, measureId, fetchImpl = globalThis.fetch } = {}) {
  const validation = validateFollowUpRecipientEmail(to)
  if (validation.error || !validation.email) {
    return { ok: false, status: 'failed', error: validation.error || 'Patient email is required.' }
  }

  const config = requireEmailConfig()
  if (config.error) return { ok: false, status: 'failed', error: config.error }
  if (typeof fetchImpl !== 'function') return { ok: false, status: 'failed', error: 'Email delivery is unavailable.' }

  const email = buildFollowUpEmail({
    to: validation.email,
    publicUrl,
    expiresAt,
    measureId,
  })

  try {
    const response = await fetchImpl(RESEND_EMAILS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.from,
        to: [validation.email],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    })

    let payload = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    if (!response.ok) {
      return {
        ok: false,
        status: 'failed',
        error: payload?.message || payload?.error || 'Follow-up email could not be sent.',
      }
    }

    return {
      ok: true,
      status: 'sent',
      providerMessageId: payload?.id ?? null,
    }
  } catch (error) {
    return {
      ok: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Follow-up email could not be sent.',
    }
  }
}

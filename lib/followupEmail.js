import { formatFollowUpDate } from './followups'
import { getFollowUpQuestionnaire } from './followupQuestionnaires'
import { normalizePatientEmail, validateOptionalPatientEmail } from './patientDetails'

const RESEND_EMAILS_ENDPOINT = 'https://api.resend.com/emails'
const BRAND_LOGO_PATH = '/assets/brand/v2/mark-256.png'

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

function buildBrandLogoUrl(publicUrl) {
  try {
    return new URL(BRAND_LOGO_PATH, publicUrl).toString()
  } catch {
    return `https://www.rehabmetricsiq.com${BRAND_LOGO_PATH}`
  }
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
  const subject = 'Secure RehabMetrics IQ follow-up questionnaire'
  const logoUrl = buildBrandLogoUrl(publicUrl)
  const preheader = `Open your secure RehabMetrics IQ questionnaire before ${expiryLabel}.`

  const text = [
    'Your follow-up questionnaire is ready.',
    '',
    'Your clinician has sent you a secure RehabMetrics IQ follow-up questionnaire.',
    'No account is required. Use the secure link before it expires.',
    '',
    `Questionnaire: ${measureName}`,
    `Link expires: ${expiryLabel}`,
    `Open secure questionnaire: ${publicUrl}`,
    '',
    'Please do not use this form for urgent symptoms, emergencies, or new medical concerns. If you need urgent help, contact your local emergency service or your treating clinician directly.',
  ].join('\n')

  const html = `
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent; line-height: 1px;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 0; padding: 0; background-color: #f8f8f2;">
      <tr>
        <td align="center" style="padding: 28px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 640px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #1c2b36;">
            <tr>
              <td style="padding: 0 4px 14px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="44" style="width: 44px; padding: 0 12px 0 0;">
                      <img src="${escapeHtml(logoUrl)}" width="44" height="44" alt="" style="display: block; width: 44px; height: 44px; border: 0; border-radius: 10px;" />
                    </td>
                    <td style="padding: 0;">
                      <p style="margin: 0; color: #094b8a; font-size: 18px; line-height: 1.2; font-weight: 800;">RehabMetrics IQ</p>
                      <p style="margin: 3px 0 0; color: #69787a; font-size: 13px; line-height: 1.35;">Secure patient follow-up</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background-color: #ffffff; border: 1px solid #d9dacb; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(28, 43, 54, 0.08);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding: 32px 32px 18px;">
                      <p style="margin: 0 0 10px; color: #1a857f; font-size: 12px; line-height: 1.35; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;">Secure questionnaire</p>
                      <h1 style="margin: 0; color: #1c2b36; font-size: 26px; line-height: 1.18; font-weight: 800;">Your follow-up questionnaire is ready</h1>
                      <p style="margin: 14px 0 0; color: #334b49; font-size: 16px; line-height: 1.55;">
                        Your clinician has sent you a secure RehabMetrics IQ follow-up questionnaire.
                        No account is required; use the secure link before it expires.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 32px 22px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fbfbf7; border: 1px solid #e8e9dc; border-radius: 10px;">
                        <tr>
                          <td style="padding: 18px 18px 8px;">
                            <p style="margin: 0 0 5px; color: #69787a; font-size: 12px; line-height: 1.35; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;">Questionnaire</p>
                            <p style="margin: 0; color: #1c2b36; font-size: 17px; line-height: 1.4; font-weight: 800;">${escapeHtml(measureName)}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 18px 18px;">
                            <p style="margin: 0 0 5px; color: #69787a; font-size: 12px; line-height: 1.35; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;">Link expires</p>
                            <p style="margin: 0; color: #1c2b36; font-size: 16px; line-height: 1.4; font-weight: 700;">${escapeHtml(expiryLabel)}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 32px 28px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="background-color: #094b8a; border-radius: 8px;">
                            <a href="${escapeHtml(publicUrl)}" style="display: inline-block; padding: 13px 18px; color: #fbfbf7; font-size: 15px; line-height: 1.2; font-weight: 800; text-decoration: none;">Open secure questionnaire</a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 16px 0 0; color: #69787a; font-size: 13px; line-height: 1.5;">If the button does not work, copy and paste this secure link into your browser:</p>
                      <p style="margin: 6px 0 0; color: #094b8a; font-size: 13px; line-height: 1.5; word-break: break-all;">
                        <a href="${escapeHtml(publicUrl)}" style="color: #094b8a; text-decoration: underline;">${escapeHtml(publicUrl)}</a>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 32px 32px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f6f6f0; border: 1px solid #e8e9dc; border-radius: 10px;">
                        <tr>
                          <td style="padding: 16px 18px;">
                            <p style="margin: 0 0 6px; color: #334b49; font-size: 13px; line-height: 1.4; font-weight: 800;">Care note</p>
                            <p style="margin: 0; color: #334b49; font-size: 13px; line-height: 1.55;">
                              Please do not use this form for urgent symptoms, emergencies, or new medical concerns.
                              If you need urgent help, contact your local emergency service or your treating clinician directly.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 16px 8px 0; color: #69787a; font-size: 12px; line-height: 1.5;">
                RehabMetrics IQ sends secure follow-up links on behalf of clinicians using the service.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
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
      // ponytail: log provider detail server-side; never surface it to clinician UI
      console.error('Resend delivery failed:', response.status, payload?.message || payload?.error)
      return {
        ok: false,
        status: 'failed',
        error: 'Follow-up email could not be sent.',
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

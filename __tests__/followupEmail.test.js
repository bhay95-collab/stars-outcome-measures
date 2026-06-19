import {
  buildFollowUpEmail,
  normalizeFollowUpRecipientEmail,
  sendFollowUpEmail,
  validateFollowUpRecipientEmail,
} from '../lib/followupEmail'

describe('follow-up email helpers', () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY
    delete process.env.FOLLOWUP_EMAIL_FROM
  })

  it('normalizes and validates optional recipient email addresses', () => {
    expect(normalizeFollowUpRecipientEmail('  PATIENT@Example.COM  ')).toBe('patient@example.com')
    expect(validateFollowUpRecipientEmail('patient@example.com')).toEqual({ email: 'patient@example.com' })
    expect(validateFollowUpRecipientEmail('')).toEqual({ email: null })
    expect(validateFollowUpRecipientEmail('not-an-email')).toEqual({ error: 'Enter a valid patient email address.' })
  })

  it('builds a safe patient email body with only questionnaire delivery details', () => {
    const email = buildFollowUpEmail({
      to: 'Patient@Example.com',
      publicUrl: 'https://app.example.com/followup/secure-token',
      expiresAt: '2026-06-12T00:00:00.000Z',
      measureId: 'ABC',
    })

    expect(email.to).toBe('patient@example.com')
    expect(email.subject).toMatch(/follow-up questionnaire/i)
    expect(email.text).toContain('https://app.example.com/followup/secure-token')
    expect(email.text).toMatch(/Activities-specific Balance Confidence/i)
    expect(email.text).toMatch(/No account is required/i)
    expect(email.text).toMatch(/urgent symptoms/i)
    expect(email.text).not.toMatch(/stroke|1970|diagnosis/i)
    expect(email.html).toContain('RehabMetrics IQ')
    expect(email.html).toContain('Secure patient follow-up')
    expect(email.html).toContain('https://app.example.com/assets/brand/v2/mark-256.png')
    expect(email.html).toContain('Open secure questionnaire')
    expect(email.html).toContain('background-color: #f8f8f2')
    expect(email.html).not.toContain('secure-token" data')
  })

  it('sends through Resend with server-side configuration', async () => {
    process.env.RESEND_API_KEY = 'resend-test-key'
    process.env.FOLLOWUP_EMAIL_FROM = 'RehabMetrics IQ <followups@example.com>'
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'resend-message-1' }),
    })

    const result = await sendFollowUpEmail({
      to: 'PATIENT@EXAMPLE.COM',
      publicUrl: 'https://app.example.com/followup/secure-token',
      expiresAt: '2026-06-12T00:00:00.000Z',
      measureId: 'ABC',
      fetchImpl,
    })

    expect(result).toEqual({
      ok: true,
      status: 'sent',
      providerMessageId: 'resend-message-1',
    })
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer resend-test-key',
          'Content-Type': 'application/json',
        },
      }),
    )
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body)
    expect(body).toEqual(expect.objectContaining({
      from: 'RehabMetrics IQ <followups@example.com>',
      to: ['patient@example.com'],
      subject: expect.stringMatching(/follow-up questionnaire/i),
      html: expect.stringContaining('Open secure questionnaire'),
      text: expect.stringContaining('https://app.example.com/followup/secure-token'),
    }))
  })

  it('returns a generic error when Resend rejects the request', async () => {
    process.env.RESEND_API_KEY = 'resend-test-key'
    process.env.FOLLOWUP_EMAIL_FROM = 'RehabMetrics IQ <followups@example.com>'
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: 'The rehabmetricsiq.com domain is not verified. Please, add and verify your domain on https://resend.com/domains' }),
    })

    const result = await sendFollowUpEmail({
      to: 'patient@example.com',
      publicUrl: 'https://app.example.com/followup/secure-token',
      expiresAt: '2026-06-12T00:00:00.000Z',
      measureId: 'ABC',
      fetchImpl,
    })

    expect(result).toEqual({
      ok: false,
      status: 'failed',
      error: 'Follow-up email could not be sent.',
    })
  })

  it('returns a failed delivery result when Resend is not configured', async () => {
    const fetchImpl = jest.fn()

    const result = await sendFollowUpEmail({
      to: 'patient@example.com',
      publicUrl: 'https://app.example.com/followup/secure-token',
      expiresAt: '2026-06-12T00:00:00.000Z',
      measureId: 'ABC',
      fetchImpl,
    })

    expect(result).toEqual({
      ok: false,
      status: 'failed',
      error: 'Follow-up email delivery is not configured.',
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

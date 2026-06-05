import { getAdminClient, getUserFromRequest } from '../../../../lib/supabase-admin'
import {
  buildPublicFollowUpUrl,
  FOLLOWUP_REQUEST_SELECT,
  userHasActiveAccess,
} from '../../../../lib/followupServer'
import { FOLLOWUP_STATUS, getFollowUpRequestStatus, isValidUuid, shapeFollowUpRecord } from '../../../../lib/followups'
import { createFollowUpToken, hashFollowUpToken } from '../../../../lib/followupTokens'
import { sendFollowUpEmail, validateFollowUpRecipientEmail } from '../../../../lib/followupEmail'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  if (!isValidUuid(id)) return res.status(400).json({ error: 'Valid follow-up id required' })

  const admin = getAdminClient()
  const hasAccess = await userHasActiveAccess(admin, user.id)
  if (!hasAccess) return res.status(403).json({ error: 'Subscription or trial access required' })

  const { data: request, error: lookupError } = await admin
    .from('followup_requests')
    .select(FOLLOWUP_REQUEST_SELECT)
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (lookupError) return res.status(500).json({ error: lookupError.message })
  if (!request) return res.status(404).json({ error: 'Follow-up not found' })
  if (getFollowUpRequestStatus(request) !== FOLLOWUP_STATUS.PENDING) {
    return res.status(409).json({ error: 'Only pending follow-ups can be emailed.' })
  }

  const recipient = validateFollowUpRecipientEmail(request.recipient_email)
  if (recipient.error || !recipient.email) {
    return res.status(400).json({ error: recipient.error || 'This follow-up does not have a recipient email.' })
  }

  const token = createFollowUpToken()
  const publicUrl = buildPublicFollowUpUrl(token, req)
  const attemptedAt = new Date().toISOString()
  const tokenHash = hashFollowUpToken(token)

  const { data: prepared, error: prepareError } = await admin
    .from('followup_requests')
    .update({
      token_hash: tokenHash,
      last_email_attempt_at: attemptedAt,
      email_error: null,
    })
    .eq('id', request.id)
    .eq('user_id', user.id)
    .eq('status', FOLLOWUP_STATUS.PENDING)
    .select(FOLLOWUP_REQUEST_SELECT)
    .maybeSingle()

  if (prepareError) return res.status(500).json({ error: prepareError.message })
  if (!prepared) return res.status(409).json({ error: 'Follow-up could not be updated.' })

  const emailDelivery = await sendFollowUpEmail({
    to: recipient.email,
    publicUrl,
    expiresAt: request.expires_at,
    measureId: request.measure_id,
  })

  const deliveryPatch = emailDelivery.ok
    ? {
        email_status: 'sent',
        sent_at: attemptedAt,
        last_email_attempt_at: attemptedAt,
        email_provider_message_id: emailDelivery.providerMessageId,
        email_error: null,
      }
    : {
        email_status: 'failed',
        sent_at: null,
        last_email_attempt_at: attemptedAt,
        email_provider_message_id: null,
        email_error: emailDelivery.error,
      }

  const { data: updated, error: updateError } = await admin
    .from('followup_requests')
    .update(deliveryPatch)
    .eq('id', request.id)
    .eq('user_id', user.id)
    .eq('status', FOLLOWUP_STATUS.PENDING)
    .select(FOLLOWUP_REQUEST_SELECT)
    .maybeSingle()

  if (updateError) {
    return res.status(500).json({
      error: updateError.message,
      followup: shapeFollowUpRecord(prepared, null),
      publicUrl,
      email: {
        status: emailDelivery.status,
        error: emailDelivery.error ?? null,
        providerMessageId: emailDelivery.providerMessageId ?? null,
      },
    })
  }
  if (!updated) return res.status(409).json({ error: 'Follow-up could not be updated.' })

  return res.status(emailDelivery.ok ? 200 : 502).json({
    followup: shapeFollowUpRecord(updated, null),
    publicUrl,
    email: {
      status: emailDelivery.status,
      error: emailDelivery.error ?? null,
      providerMessageId: emailDelivery.providerMessageId ?? null,
    },
  })
}

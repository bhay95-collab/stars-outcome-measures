import { getAdminClient } from '../../../lib/supabase-admin'
import {
  isRevenueCatWebhookAuthorized,
  revenueCatWebhookUserIds,
  syncRevenueCatSubscription,
} from '../../../lib/revenuecat-server'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!isRevenueCatWebhookAuthorized(req)) {
    return res.status(401).json({ error: 'Invalid webhook authorization' })
  }

  const event = req.body?.event
  if (event?.type === 'TEST') {
    return res.status(200).json({ received: true, test: true })
  }

  const eventId = event?.id
  if (!eventId) return res.status(400).json({ error: 'Missing RevenueCat event id' })

  const admin = getAdminClient()
  const { data: existingEvent, error: eventLookupError } = await admin
    .from('revenuecat_webhook_events')
    .select('event_id')
    .eq('event_id', eventId)
    .maybeSingle()

  if (eventLookupError) return res.status(500).json({ error: 'Webhook state unavailable' })
  if (existingEvent) return res.status(200).json({ received: true, duplicate: true })

  const { error: insertError } = await admin
    .from('revenuecat_webhook_events')
    .insert({ event_id: eventId, event_type: event.type ?? 'UNKNOWN' })
  if (insertError?.code === '23505') {
    return res.status(200).json({ received: true, duplicate: true })
  }
  if (insertError) return res.status(500).json({ error: 'Could not record webhook event' })

  try {
    const userIds = revenueCatWebhookUserIds(event)
    await Promise.all(userIds.map(userId => syncRevenueCatSubscription(admin, userId, {
      originalTransactionId: event.original_transaction_id,
    })))

    const { error: updateError } = await admin
      .from('revenuecat_webhook_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('event_id', eventId)
    if (updateError) throw new Error(updateError.message)

    return res.status(200).json({ received: true })
  } catch (error) {
    await admin
      .from('revenuecat_webhook_events')
      .delete()
      .eq('event_id', eventId)
    console.error('RevenueCat webhook processing failed', {
      eventId,
      message: error.message,
    })
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
}

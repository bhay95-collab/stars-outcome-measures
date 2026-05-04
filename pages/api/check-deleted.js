import crypto from 'crypto'
import { getAdminClient } from '../../lib/supabase-admin'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email } = req.body
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email required' })
  }

  const emailHash = crypto
    .createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex')

  const admin = getAdminClient()
  const { data } = await admin
    .from('deleted_accounts')
    .select('id')
    .eq('email_hash', emailHash)
    .maybeSingle()

  return res.status(200).json({ blocked: !!data })
}

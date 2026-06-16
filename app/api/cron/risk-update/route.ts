import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function isAuthorized(req: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) return true
  return req.headers.get('authorization') === `Bearer ${expected}`
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createAdminClient() as any // eslint-disable-line @typescript-eslint/no-explicit-any
  const { data, error } = await db.rpc('fn_update_student_risk_levels')

  if (error) {
    console.error('[risk-update cron] Error:', error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  const result = data?.[0] ?? { updated_count: 0, log_msg: 'Sin cambios' }
  console.log('[risk-update cron]', result.log_msg)

  return NextResponse.json({ ok: true, ...result })
}

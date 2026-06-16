import { NextResponse } from 'next/server'
import { runAutomationRules } from '@/app/admin/_actions/automations'

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

  const result = await runAutomationRules()

  return NextResponse.json(result, {
    status: result.error ? 500 : 200,
  })
}

export async function POST(req: Request) {
  return GET(req)
}

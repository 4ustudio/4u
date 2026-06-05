import { NextResponse } from 'next/server'
import { runRetentionDailyJob } from '@/app/admin/_actions/retention'

export const dynamic = 'force-dynamic'

function isAuthorized(request: Request) {
  const expected = process.env.RETENTION_CRON_SECRET || process.env.CRON_SECRET
  if (!expected) return true
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${expected}`
}

async function handler(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get('dryRun') === '1' || url.searchParams.get('preview') === '1'

  try {
    const result = await runRetentionDailyJob({ dryRun })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Retention job failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  return handler(request)
}

export async function POST(request: Request) {
  return handler(request)
}

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runRetentionDailyJob } from '@/app/admin/_actions/retention'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://4ustudioacademy.com'

function isAuthorized(req: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) return true
  return req.headers.get('authorization') === `Bearer ${expected}`
}

interface SessionRow {
  id: string
  student_id: string
  scheduled_date: string
  start_time: string
  attendance_confirmation_token: string
  attendance_reminder_sent_at: string | null
  second_reminder_sent_at: string | null
  attendance_status: string
  student: { name: string; email: string | null; phone: string } | null
}

async function handler(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url    = new URL(req.url)
  const dryRun = url.searchParams.get('dryRun') === '1'

  const now       = new Date()
  const todayStr  = now.toISOString().split('T')[0]

  // Fecha de mañana para el primer recordatorio (24h antes)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  // ── Buscar sesiones para primer recordatorio (mañana, sin recordatorio aún) ──
  const { data: firstReminder } = await db()
    .from('class_sessions')
    .select('id, student_id, scheduled_date, start_time, attendance_confirmation_token, attendance_reminder_sent_at, second_reminder_sent_at, attendance_status, student:students(name, email, phone)')
    .eq('scheduled_date', tomorrowStr)
    .is('attendance_reminder_sent_at', null)
    .not('status', 'in', '(cancelled,rescheduled,completed,no_show)')

  // ── Buscar sesiones para segundo recordatorio (hoy, entre ahora y 3h, siguen pending) ──
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  const nowTime           = now.toTimeString().slice(0, 5)           // ej: "13:00"
  const threeHoursTime    = threeHoursFromNow.toTimeString().slice(0, 5) // ej: "16:00"

  const { data: secondReminder } = await db()
    .from('class_sessions')
    .select('id, student_id, scheduled_date, start_time, attendance_confirmation_token, attendance_reminder_sent_at, second_reminder_sent_at, attendance_status, student:students(name, email, phone)')
    .eq('scheduled_date', todayStr)
    .is('second_reminder_sent_at', null)
    .eq('attendance_status', 'pending')
    .gte('start_time', nowTime)         // solo clases que aún no comenzaron
    .lte('start_time', threeHoursTime)  // que comienzan en las próximas 3h
    .not('status', 'in', '(cancelled,rescheduled,completed,no_show)')

  const first:  SessionRow[] = firstReminder  ?? []
  const second: SessionRow[] = secondReminder ?? []

  const results = {
    dryRun,
    first_reminder:  { total: first.length,  processed: 0, errors: 0 },
    second_reminder: { total: second.length, processed: 0, errors: 0 },
    no_response_closed: 0,
  }

  // ── Procesar primer recordatorio ─────────────────────────────────────────────
  for (const session of first) {
    const confirmUrl = `${SITE_URL}/confirmar/${session.attendance_confirmation_token}`
    const studentName = session.student?.name ?? 'Estudiante'
    const timeLabel   = session.start_time.slice(0, 5)
    const dateLabel   = new Date(session.scheduled_date + 'T12:00:00').toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long',
    })

    // TODO: Integrar Resend/email real aquí
    // await sendEmail({ to: session.student?.email, subject: '...', body: '...' })
    // TODO: WhatsApp API — preparado pero no activo
    console.log(`[REMINDER-1] ${studentName} — ${dateLabel} ${timeLabel}hs — ${confirmUrl}`)

    if (!dryRun) {
      const { error } = await db()
        .from('class_sessions')
        .update({ attendance_reminder_sent_at: now.toISOString() })
        .eq('id', session.id)

      if (error) results.first_reminder.errors++
      else results.first_reminder.processed++
    } else {
      results.first_reminder.processed++
    }
  }

  // ── Procesar segundo recordatorio ────────────────────────────────────────────
  for (const session of second) {
    const confirmUrl  = `${SITE_URL}/confirmar/${session.attendance_confirmation_token}`
    const studentName = session.student?.name ?? 'Estudiante'
    const timeLabel   = session.start_time.slice(0, 5)

    // TODO: Integrar Resend/email real aquí
    console.log(`[REMINDER-2] ${studentName} — hoy ${timeLabel}hs — ${confirmUrl}`)

    if (!dryRun) {
      const { error } = await db()
        .from('class_sessions')
        .update({ second_reminder_sent_at: now.toISOString() })
        .eq('id', session.id)

      if (error) results.second_reminder.errors++
      else results.second_reminder.processed++
    } else {
      results.second_reminder.processed++
    }
  }

  // ── Cerrar como no_response las clases de ayer que siguen pending ────────────
  if (!dryRun) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data: closedSessions } = await db()
      .from('class_sessions')
      .update({ attendance_status: 'no_response' })
      .eq('scheduled_date', yesterdayStr)
      .eq('attendance_status', 'pending')
      .not('status', 'in', '(cancelled,rescheduled)')
      .select('id')

    results.no_response_closed = closedSessions?.length ?? 0
  }

  // ── Job de retención diario (fusionado) ──────────────────────────────────────
  let retention: Record<string, unknown> = { skipped: true }
  if (!dryRun) {
    try {
      const r = await runRetentionDailyJob({ dryRun: false })
      retention = {
        studentsReviewed: r.studentsReviewed,
        statusChanges: r.summary.statusChanges,
        alerts: r.summary.alerts,
        tasks: r.summary.tasks,
      }
    } catch (err) {
      retention = { error: err instanceof Error ? err.message : 'retention job failed' }
    }
  }

  return NextResponse.json({ ...results, retention })
}

export async function GET(req: Request) { return handler(req) }
export async function POST(req: Request) { return handler(req) }

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (!token) {
    return NextResponse.redirect(new URL('/confirmar/invalido', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'))
  }

  const { data: session, error } = await db()
    .from('class_sessions')
    .select('id, student_id, scheduled_date, start_time, attendance_status, status')
    .eq('attendance_confirmation_token', token)
    .maybeSingle()

  if (error || !session) {
    return NextResponse.redirect(new URL('/confirmar/invalido', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'))
  }

  // Bloquear sesiones canceladas o no presentadas
  if (['cancelled', 'rescheduled', 'no_show'].includes(session.status)) {
    return NextResponse.redirect(new URL(`/confirmar/expirado?date=${session.scheduled_date}`, process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'))
  }

  // Ventana de gracia para sesiones completadas: permitir confirmar el mismo día
  // (el instructor puede marcar como completada antes de que el alumno confirme)
  if (session.status === 'completed') {
    const today = new Date().toISOString().split('T')[0]
    const sameDay = session.scheduled_date === today
    if (!sameDay || session.attendance_status !== 'pending') {
      return NextResponse.redirect(new URL(`/confirmar/expirado?date=${session.scheduled_date}`, process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'))
    }
  }

  // Ya confirmada previamente
  if (session.attendance_status === 'confirmed') {
    return NextResponse.redirect(new URL(`/confirmar/ok?already=1&date=${session.scheduled_date}&time=${session.start_time}`, process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'))
  }

  const { error: updateError } = await db()
    .from('class_sessions')
    .update({
      attendance_status:       'confirmed',
      attendance_confirmed_at: new Date().toISOString(),
    })
    .eq('id', session.id)

  if (updateError) {
    return NextResponse.redirect(new URL('/confirmar/error', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'))
  }

  // Actualizar last_activity_at en CRM
  await db()
    .from('students')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', session.student_id)

  const params_ = new URLSearchParams({
    date: session.scheduled_date,
    time: session.start_time.slice(0, 5),
  })
  return NextResponse.redirect(new URL(`/confirmar/ok?${params_}`, process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'))
}

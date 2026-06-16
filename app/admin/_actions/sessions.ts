'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createAuthServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ClassSession } from '@/types/admin'
import { safeRecordStudentActivity } from './retention'
import { activity } from '@/lib/activity'
import { parseRole, hasAcademicAccess } from '@/lib/auth/roles'

async function assertAdmin(): Promise<{ error: string } | null> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = parseRole(user?.user_metadata ?? null)
  if (!hasAcademicAccess(role)) return { error: 'No autorizado.' }
  return null
}

// ─── Lectura ────────────────────────────────────────────────

export async function getWeekSessions(weekStart: string): Promise<ClassSession[]> {
  const start = new Date(weekStart)
  const end   = new Date(weekStart)
  end.setDate(end.getDate() + 6)

  const { data, error } = await createAdminClient()
    .from('class_sessions')
    .select(`
      *,
      student:students(name, phone),
      classroom:classrooms(name),
      course:courses(name),
      instructor:instructors(name)
    `)
    .gte('scheduled_date', start.toISOString().split('T')[0])
    .lte('scheduled_date', end.toISOString().split('T')[0])
    .order('scheduled_date')
    .order('start_time')

  if (error) throw new Error(error.message)
  return (data as ClassSession[]) ?? []
}

export async function getBlockedDates(weekStart: string) {
  const start = new Date(weekStart)
  const end   = new Date(weekStart)
  end.setDate(end.getDate() + 6)

  const { data, error } = await createAdminClient()
    .from('blocked_dates')
    .select('*')
    .gte('blocked_date', start.toISOString().split('T')[0])
    .lte('blocked_date', end.toISOString().split('T')[0])

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAvailableSlots(date: string, studentId?: string) {
  const { data, error } = await createAdminClient().rpc('fn_available_slots', {
    p_date:       date,
    p_student_id: studentId ?? null,
  })

  if (error) throw new Error(error.message)
  return data ?? []
}

// ─── Mutaciones ─────────────────────────────────────────────

interface BookInput {
  student_id:    string
  classroom_id:  string
  course_id:     string
  date:          string
  start_time:    string
  instructor_id?: string
  notes?:        string
}

export async function bookSessionAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const authErr = await assertAdmin()
  if (authErr) return authErr

  const input: BookInput = {
    student_id:    formData.get('student_id')   as string,
    classroom_id:  formData.get('classroom_id') as string,
    course_id:     formData.get('course_id')    as string,
    date:          formData.get('date')         as string,
    start_time:    formData.get('start_time')   as string,
    instructor_id: (formData.get('instructor_id') as string | null) || undefined,
    notes:         (formData.get('notes')        as string | null)?.trim() || undefined,
  }

  if (!input.student_id || !input.classroom_id || !input.course_id || !input.date || !input.start_time) {
    return { error: 'Completa todos los campos obligatorios.' }
  }
  if (!input.instructor_id) {
    return { error: 'Debes asignar un instructor a la clase.' }
  }

  const { data: rpcData, error } = await createAdminClient().rpc('fn_book_session', {
    p_student_id:    input.student_id,
    p_classroom_id:  input.classroom_id,
    p_course_id:     input.course_id,
    p_date:          input.date,
    p_start_time:    input.start_time,
    p_instructor_id: input.instructor_id ?? null,
    p_notes:         input.notes ?? null,
  })
  const data = rpcData as { success: boolean; error?: string; session_id?: string } | null

  if (error) return { error: error.message }
  if (!data?.success) return { error: data?.error ?? 'No se pudo crear la clase.' }

  await safeRecordStudentActivity(input.student_id, 'class_booked', 'Clase agendada desde administracion.', {
    course_id: input.course_id,
    scheduled_date: input.date,
    start_time: input.start_time,
  })

  await activity.sessionCreated({
    session_id:     String(data?.session_id ?? ''),
    instructor_name: input.instructor_id ? `Instructor ${input.instructor_id}` : 'Sin asignar',
    scheduled_at:   `${input.date} ${input.start_time}`,
    source:         'admin',
  })

  revalidatePath('/admin/agenda')
  return { success: true }
}

export async function cancelSessionAction(
  _prev: { error?: string; success?: boolean; late?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean; late?: boolean }> {
  const authErr = await assertAdmin()
  if (authErr) return authErr

  const sessionId = formData.get('session_id') as string
  const reason    = (formData.get('reason') as string | null)?.trim() || null

  const { data: session } = await createAdminClient()
    .from('class_sessions')
    .select('student_id, scheduled_date, start_time')
    .eq('id', sessionId)
    .maybeSingle()

  const { data: cancelData, error } = await createAdminClient().rpc('fn_cancel_session', {
    p_session_id: sessionId,
    p_reason:     reason,
  })
  const data = cancelData as { success: boolean; error?: string; late_cancellation?: boolean } | null

  if (error) return { error: error.message }
  if (!data?.success) return { error: data?.error ?? 'No se pudo cancelar la clase.' }

  await safeRecordStudentActivity(session?.student_id, 'class_cancelled', 'Clase cancelada.', {
    session_id: sessionId,
    reason,
    scheduled_date: session?.scheduled_date,
    start_time: session?.start_time,
  })

  await activity.sessionCancelled({
    session_id:   sessionId,
    reason:       reason ?? undefined,
    scheduled_at: session ? `${session.scheduled_date} ${session.start_time}` : undefined,
    source:       'admin',
  })

  revalidatePath('/admin/agenda')
  return { success: true, late: data?.late_cancellation }
}

export async function rescheduleSessionAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const { data: rData, error } = await createAdminClient().rpc('fn_reschedule_session', {
    p_session_id:       formData.get('session_id')       as string,
    p_new_classroom_id: formData.get('new_classroom_id') as string,
    p_new_date:         formData.get('new_date')         as string,
    p_new_start_time:   formData.get('new_start_time')   as string,
  })
  const data = rData as { success: boolean; error?: string } | null

  if (error) return { error: error.message }
  if (!data?.success) return { error: data?.error ?? 'No se pudo reagendar.' }

  revalidatePath('/admin/agenda')
  return { success: true }
}

// ─── Acciones exclusivas del admin (sin restricciones de horario) ────────────

export async function adminUpdateStatusAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const authErr = await assertAdmin()
  if (authErr) return authErr

  const session_id = formData.get('session_id') as string
  const new_status = formData.get('new_status') as string
  const notes      = (formData.get('notes') as string | null)?.trim() || undefined

  if (!session_id || !new_status) return { error: 'Faltan datos.' }

  const { data: session } = await createAdminClient()
    .from('class_sessions')
    .select('student_id, scheduled_date, start_time, course_id')
    .eq('id', session_id)
    .maybeSingle()

  const update: Record<string, unknown> = { status: new_status }
  if (notes !== undefined) update.notes = notes

  const { error } = await createAdminClient()
    .from('class_sessions')
    .update(update as never)
    .eq('id', session_id)

  if (error) return { error: error.message }

  if (new_status === 'completed') {
    await safeRecordStudentActivity(session?.student_id, 'class_completed', 'Clase marcada como completada.', {
      session_id,
      course_id: session?.course_id,
      scheduled_date: session?.scheduled_date,
      start_time: session?.start_time,
    })
    await activity.attendanceConfirmed({ session_id, student_name: `Estudiante`, source: 'admin' })
  }
  if (new_status === 'no_show') {
    await safeRecordStudentActivity(session?.student_id, 'class_no_show', 'Clase marcada como no asistio.', { session_id })
    await activity.attendanceNoShow({ session_id, student_name: `Estudiante`, source: 'admin' })
  }
  if (new_status === 'cancelled') {
    await safeRecordStudentActivity(session?.student_id, 'class_cancelled', 'Clase marcada como cancelada.', { session_id })
    await activity.sessionCancelled({ session_id, source: 'admin' })
  }
  if (new_status === 'rescheduled') {
    await safeRecordStudentActivity(session?.student_id, 'class_rescheduled', 'Clase marcada como reagendada.', { session_id })
    await activity.sessionRescheduled({ session_id, source: 'admin' })
  }

  revalidatePath('/admin/agenda')
  revalidatePath('/admin')
  return { success: true }
}

export async function adminRescheduleAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const authErr = await assertAdmin()
  if (authErr) return authErr

  const session_id      = formData.get('session_id')      as string
  const new_date        = formData.get('new_date')        as string
  const new_start_time  = formData.get('new_start_time')  as string
  const new_classroom_id = formData.get('new_classroom_id') as string
  const new_instructor_id = (formData.get('new_instructor_id') as string | null) || null

  if (!session_id || !new_date || !new_start_time || !new_classroom_id) {
    return { error: 'Completa todos los campos obligatorios.' }
  }

  // Verificar que el salón esté libre en esa fecha/hora (excluyendo la sesión actual)
  const { data: conflict } = await createAdminClient()
    .from('class_sessions')
    .select('id')
    .eq('classroom_id', new_classroom_id)
    .eq('scheduled_date', new_date)
    .eq('start_time', new_start_time + ':00')
    .not('status', 'in', '(cancelled,rescheduled)')
    .neq('id', session_id)
    .limit(1)

  if (conflict && conflict.length > 0) {
    return { error: 'El salón ya está ocupado en esa fecha y hora.' }
  }

  const { error } = await createAdminClient()
    .from('class_sessions')
    .update({
      scheduled_date: new_date,
      start_time:     new_start_time + ':00',
      classroom_id:   new_classroom_id,
      instructor_id:  new_instructor_id,
      status:         'confirmed',
    })
    .eq('id', session_id)

  if (error) return { error: error.message }

  await activity.sessionRescheduled({
    session_id,
    new_time: `${new_date} ${new_start_time}`,
    source:   'admin',
  })

  revalidatePath('/admin/agenda')
  revalidatePath('/admin')
  return { success: true }
}

// ─── Cancelación por instructor (solo si faltan > 24h) ───────────────────────

export async function cancelByInstructorAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const sessionId = formData.get('session_id') as string
  const reason    = (formData.get('reason') as string | null)?.trim() || null

  const { data: session } = await createAdminClient()
    .from('class_sessions')
    .select('student_id, scheduled_date, start_time, status')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) return { error: 'Clase no encontrada.' }
  if (['cancelled', 'rescheduled', 'completed', 'no_show'].includes(session.status)) {
    return { error: 'La clase ya no puede cancelarse.' }
  }

  const classDateTime = new Date(`${session.scheduled_date}T${session.start_time}`)
  const hoursUntil    = (classDateTime.getTime() - Date.now()) / (1000 * 60 * 60)

  if (hoursUntil < 24) {
    return { error: 'No se puede cancelar con menos de 24 horas de anticipación.' }
  }

  const { error } = await createAdminClient()
    .from('class_sessions')
    .update({
      status:              'cancelled',
      cancelled_at:        new Date().toISOString(),
      cancelled_by:        'instructor',
      cancellation_reason: reason,
    })
    .eq('id', sessionId)

  if (error) return { error: error.message }

  await safeRecordStudentActivity(session.student_id, 'class_cancelled', 'Clase cancelada por instructor.', {
    session_id: sessionId,
    reason,
    scheduled_date: session.scheduled_date,
    start_time: session.start_time,
  })

  await activity.sessionCancelled({
    session_id:   sessionId,
    reason:       reason ?? undefined,
    scheduled_at: `${session.scheduled_date} ${session.start_time}`,
    source:       'instructor',
  })

  // TODO: Notificar a estudiante y admin vía email/WhatsApp

  revalidatePath('/admin/agenda')
  return { success: true }
}

// ─── Actualizar attendance_status manualmente (admin) ────────────────────────

export async function updateAttendanceStatusAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session_id       = formData.get('session_id') as string
  const attendance_status = formData.get('attendance_status') as string

  const validStatuses = ['pending', 'confirmed', 'declined', 'rescheduled', 'no_response', 'attended', 'absent', 'no_show']
  if (!validStatuses.includes(attendance_status)) return { error: 'Estado inválido.' }

  const update: Record<string, unknown> = { attendance_status }
  if (attendance_status === 'confirmed') {
    update.attendance_confirmed_at = new Date().toISOString()
  }

  const { error } = await createAdminClient()
    .from('class_sessions')
    .update(update as never)
    .eq('id', session_id)

  if (error) return { error: error.message }

  if (attendance_status === 'confirmed') {
    await activity.attendanceConfirmed({ session_id, student_name: 'Estudiante', source: 'admin' })
  }

  revalidatePath('/admin/agenda')
  return { success: true }
}

export async function restoreCreditAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean; message?: string }> {
  const { data, error } = await createAdminClient().rpc('fn_restore_credit', {
    p_student_id: formData.get('student_id') as string,
    p_year:       Number(formData.get('year')),
    p_month:      Number(formData.get('month')),
    p_reason:     formData.get('reason') as string,
    p_admin_user: formData.get('admin_user') as string,
    p_session_id: (formData.get('session_id') as string | null) || null,
    p_notes:      (formData.get('notes')      as string | null)?.trim() || null,
  })

  const restoreResult = data as { success: boolean; error?: string; message?: string } | null
  if (error) return { error: error.message }
  if (!restoreResult?.success) return { error: restoreResult?.error ?? 'Error al restaurar crédito.' }

  revalidatePath(`/admin/students/${formData.get('student_id')}`)
  return { success: true, message: restoreResult?.message }
}

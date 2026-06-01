'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { ClassSession } from '@/types/admin'

// El cliente admin no tiene tipos de DB generados — cast a any para RPCs y tablas nuevas
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

// ─── Lectura ────────────────────────────────────────────────

export async function getWeekSessions(weekStart: string): Promise<ClassSession[]> {
  const start = new Date(weekStart)
  const end   = new Date(weekStart)
  end.setDate(end.getDate() + 6)

  const { data, error } = await db()
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

  const { data, error } = await db()
    .from('blocked_dates')
    .select('*')
    .gte('blocked_date', start.toISOString().split('T')[0])
    .lte('blocked_date', end.toISOString().split('T')[0])

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAvailableSlots(date: string, studentId?: string) {
  const { data, error } = await db().rpc('fn_available_slots', {
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

  const { data, error } = await db().rpc('fn_book_session', {
    p_student_id:    input.student_id,
    p_classroom_id:  input.classroom_id,
    p_course_id:     input.course_id,
    p_date:          input.date,
    p_start_time:    input.start_time,
    p_instructor_id: input.instructor_id ?? null,
    p_notes:         input.notes ?? null,
  })

  if (error) return { error: error.message }
  if (!data?.success) return { error: data?.error ?? 'No se pudo crear la clase.' }

  revalidatePath('/admin/agenda')
  return { success: true }
}

export async function cancelSessionAction(
  _prev: { error?: string; success?: boolean; late?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean; late?: boolean }> {
  const sessionId = formData.get('session_id') as string
  const reason    = (formData.get('reason') as string | null)?.trim() || null

  const { data, error } = await db().rpc('fn_cancel_session', {
    p_session_id: sessionId,
    p_reason:     reason,
  })

  if (error) return { error: error.message }
  if (!data?.success) return { error: data?.error ?? 'No se pudo cancelar la clase.' }

  revalidatePath('/admin/agenda')
  return { success: true, late: data.late_cancellation }
}

export async function rescheduleSessionAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const { data, error } = await db().rpc('fn_reschedule_session', {
    p_session_id:       formData.get('session_id')       as string,
    p_new_classroom_id: formData.get('new_classroom_id') as string,
    p_new_date:         formData.get('new_date')         as string,
    p_new_start_time:   formData.get('new_start_time')   as string,
  })

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
  const session_id = formData.get('session_id') as string
  const new_status = formData.get('new_status') as string
  const notes      = (formData.get('notes') as string | null)?.trim() || undefined

  if (!session_id || !new_status) return { error: 'Faltan datos.' }

  const update: Record<string, unknown> = { status: new_status }
  if (notes !== undefined) update.notes = notes

  const { error } = await db()
    .from('class_sessions')
    .update(update)
    .eq('id', session_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/agenda')
  revalidatePath('/admin')
  return { success: true }
}

export async function adminRescheduleAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session_id      = formData.get('session_id')      as string
  const new_date        = formData.get('new_date')        as string
  const new_start_time  = formData.get('new_start_time')  as string
  const new_classroom_id = formData.get('new_classroom_id') as string
  const new_instructor_id = (formData.get('new_instructor_id') as string | null) || null

  if (!session_id || !new_date || !new_start_time || !new_classroom_id) {
    return { error: 'Completa todos los campos obligatorios.' }
  }

  // Verificar que el salón esté libre en esa fecha/hora (excluyendo la sesión actual)
  const { data: conflict } = await db()
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

  const { error } = await db()
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

  revalidatePath('/admin/agenda')
  revalidatePath('/admin')
  return { success: true }
}

export async function restoreCreditAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean; message?: string }> {
  const { data, error } = await db().rpc('fn_restore_credit', {
    p_student_id: formData.get('student_id') as string,
    p_year:       Number(formData.get('year')),
    p_month:      Number(formData.get('month')),
    p_reason:     formData.get('reason') as string,
    p_admin_user: formData.get('admin_user') as string,
    p_session_id: (formData.get('session_id') as string | null) || null,
    p_notes:      (formData.get('notes')      as string | null)?.trim() || null,
  })

  if (error) return { error: error.message }
  if (!data?.success) return { error: data?.error ?? 'Error al restaurar crédito.' }

  revalidatePath(`/admin/students/${formData.get('student_id')}`)
  return { success: true, message: data.message }
}

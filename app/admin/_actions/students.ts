'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createAuthServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Student, StudentLifecycleStatus, StudentStatus, StudentType, StudentSchedule, Frequency } from '@/types/admin'
import { safeRecordStudentActivity } from './retention'
import { activity } from '@/lib/activity'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

async function validateKidsAge(studentId: string): Promise<string | null> {
  const { data: student } = await db()
    .from('students')
    .select('birth_date, first_name, last_name')
    .eq('id', studentId)
    .single()

  if (!student?.birth_date) return null

  const age = calculateAge(student.birth_date)
  if (age < 6) {
    return 'La edad mínima para cursos Kids es 6 años.'
  }
  return null
}

// ─── Lectura ────────────────────────────────────────────────

export async function getStudents(): Promise<Student[]> {
  try {
    const supabase = await createAuthServerClient()
    let { data, error } = await supabase
      .from('students')
      .select('*')
      .is('archived_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      const missingArchiveColumn = error.message?.includes('archived_at')
      if (missingArchiveColumn) {
        const retry = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false })
        data = retry.data
        error = retry.error
      }
    }

    if (error) {
      let { data: d2, error: e2 } = await db()
        .from('students')
        .select('*')
        .is('archived_at', null)
        .order('created_at', { ascending: false })
      if (e2?.message?.includes('archived_at')) {
        const retry = await db()
          .from('students')
          .select('*')
          .order('created_at', { ascending: false })
        d2 = retry.data
        e2 = retry.error
      }
      if (e2) throw new Error(e2.message)
      return d2 ?? []
    }
    return data ?? []
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Error cargando estudiantes')
  }
}

export async function getStudent(id: string) {
  const [{ data: student, error }, usageResult] = await Promise.all([
    db().from('students').select('*').eq('id', id).single(),
    db().rpc('fn_monthly_usage', {
      p_student_id: id,
      p_year:  new Date().getFullYear(),
      p_month: new Date().getMonth() + 1,
    }),
  ])

  if (error) throw new Error((error as any).message)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { student, usage: (usageResult as any).data?.[0] ?? null }
}

export async function getLeads() {
  const { data, error } = await db()
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)
  return data ?? []
}

// ─── Horarios fijos ─────────────────────────────────────────

export async function getStudentSchedules(studentId: string): Promise<StudentSchedule[]> {
  const { data, error } = await db()
    .from('student_schedules')
    .select('*, course:courses(name), classroom:classrooms(name), instructor:instructors(name)')
    .eq('student_id', studentId)
    .order('day_of_week')
    .order('start_time')

  if (error) throw new Error(error.message)
  return (data as StudentSchedule[]) ?? []
}

export async function createScheduleAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const student_id   = formData.get('student_id')   as string
  const course_id    = formData.get('course_id')    as string
  const classroom_id = formData.get('classroom_id') as string
  const day_of_week  = Number(formData.get('day_of_week'))
  const start_time   = formData.get('start_time')   as string
  const active_from  = formData.get('active_from')  as string
  const active_until = (formData.get('active_until') as string | null)?.trim() || null
  const instructor_id = (formData.get('instructor_id') as string | null) || null
  const frequency    = (formData.get('frequency') as Frequency) ?? 'weekly'
  const notes        = (formData.get('notes') as string | null)?.trim() || null

  if (!student_id || !course_id || !classroom_id || !day_of_week || !start_time || !active_from) {
    return { error: 'Completa todos los campos obligatorios.' }
  }

  // Validar edad mínima para cursos Kids
  const { data: course } = await db().from('courses').select('category').eq('id', course_id).single()
  if (course?.category === 'kids') {
    const kidError = await validateKidsAge(student_id)
    if (kidError) return { error: kidError }
  }

  const { error } = await db().from('student_schedules').insert({
    student_id,
    course_id,
    classroom_id,
    day_of_week,
    start_time,
    frequency,
    active_from,
    active_until: active_until || null,
    instructor_id: instructor_id || null,
    notes,
  })

  if (error) return { error: error.message }

  revalidatePath(`/admin/students/${student_id}`)
  return { success: true }
}

export async function updateScheduleAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const id           = formData.get('id')           as string
  const student_id   = formData.get('student_id')   as string
  const course_id    = formData.get('course_id')    as string
  const classroom_id = formData.get('classroom_id') as string
  const day_of_week  = Number(formData.get('day_of_week'))
  const start_time   = formData.get('start_time')   as string
  const active_from  = formData.get('active_from')  as string
  const active_until = (formData.get('active_until') as string | null)?.trim() || null
  const instructor_id = (formData.get('instructor_id') as string | null) || null
  const frequency    = (formData.get('frequency') as Frequency) ?? 'weekly'
  const status       = (formData.get('status') as string) ?? 'active'
  const notes        = (formData.get('notes') as string | null)?.trim() || null

  if (!id || !student_id || !course_id || !classroom_id || !day_of_week || !start_time || !active_from) {
    return { error: 'Completa todos los campos obligatorios.' }
  }

  // Validar edad mínima para cursos Kids
  const { data: course } = await db().from('courses').select('category').eq('id', course_id).single()
  if (course?.category === 'kids') {
    const kidError = await validateKidsAge(student_id)
    if (kidError) return { error: kidError }
  }

  const { error } = await db()
    .from('student_schedules')
    .update({
      course_id,
      classroom_id,
      day_of_week,
      start_time,
      frequency,
      active_from,
      active_until: active_until || null,
      instructor_id: instructor_id || null,
      status,
      notes,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/admin/students/${student_id}`)
  return { success: true }
}

export async function deleteScheduleAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const id         = formData.get('id')         as string
  const student_id = formData.get('student_id') as string

  const { error } = await db()
    .from('student_schedules')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/admin/students/${student_id}`)
  return { success: true }
}

export async function generateMonthlyClassesAction(
  _prev: { error?: string; generated?: number; skipped?: number; errors?: string[] },
  formData: FormData
): Promise<{ error?: string; generated?: number; skipped?: number; errors?: string[] }> {
  const student_id = formData.get('student_id') as string
  const year       = Number(formData.get('year'))
  const month      = Number(formData.get('month'))

  if (!student_id || !year || !month) {
    return { error: 'Faltan datos: estudiante, año y mes.' }
  }

  const { data, error } = await db().rpc('fn_generate_monthly_sessions', {
    p_student_id: student_id,
    p_year:       year,
    p_month:      month,
  })

  if (error) return { error: error.message }
  if (!data) return { error: 'No se obtuvo respuesta de la función.' }

  revalidatePath(`/admin/students/${student_id}`)
  return {
    generated: data.generated ?? 0,
    skipped:   data.skipped ?? 0,
    errors:    data.errors ?? [],
  }
}

// ─── Mutaciones ─────────────────────────────────────────────

export async function createStudentAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const first_name   = (formData.get('first_name')   as string)?.trim() || ''
  const last_name    = (formData.get('last_name')    as string)?.trim() || ''
  const name         = `${first_name} ${last_name}`.trim()
  const phone        = (formData.get('phone')        as string).trim()
  const email        = (formData.get('email')        as string | null)?.trim() || null
  const address      = (formData.get('address')      as string | null)?.trim() || null
  const city         = (formData.get('city')         as string | null)?.trim() || null
  const birth_date   = (formData.get('birth_date')   as string | null) || null
  const profession   = (formData.get('profession')   as string | null)?.trim() || null
  const music_genre  = (formData.get('music_genre')  as string | null)?.trim() || null
  const document_type   = (formData.get('document_type')   as string | null) || null
  const document_number = (formData.get('document_number') as string | null)?.trim() || null
  const student_type = (formData.get('student_type') as StudentType) ?? 'new'
  const notes        = (formData.get('notes')        as string | null)?.trim() || null
  const lead_id      = (formData.get('lead_id')      as string | null) || null
  const now          = new Date().toISOString()

  if (!first_name || !phone) {
    return { error: 'Nombre y WhatsApp son obligatorios.' }
  }

  const { data: student, error } = await db()
    .from('students')
    .insert({
      name,
      first_name,
      last_name,
      phone,
      email,
      address,
      city,
      birth_date,
      profession,
      music_genre,
      document_type,
      document_number,
      student_type,
      notes,
      lead_id,
      status: 'active',
      student_status: 'activo',
      student_since: now,
      last_activity_at: now,
      retention_score: 100,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un estudiante con ese email.' }
    return { error: error.message }
  }

  await safeRecordStudentActivity(student?.id, 'enrolled', 'Estudiante creado desde administracion.')
  revalidatePath('/admin/students')
  return { success: true }
}

export async function inviteStudentAction(
  _prev: { error?: string; success?: boolean; resent?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean; resent?: boolean }> {
  const student_id = formData.get('student_id') as string
  if (!student_id) return { error: 'ID de estudiante requerido.' }

  const { data: student } = await db()
    .from('students')
    .select('id, email, user_id, name')
    .eq('id', student_id)
    .single()

  if (!student) return { error: 'Estudiante no encontrado.' }
  if (!student.email) return { error: 'El estudiante no tiene email registrado. Agrega uno primero.' }

  const alreadyInvited = !!student.user_id

  // Invitar o reenviar invitación
  const { data: inviteData, error: inviteError } = await db()
    .auth.admin.inviteUserByEmail(student.email, {
      data: { role: 'student' },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://4ustudioacademy.com'}/auth/callback`,
    })

  if (inviteError) {
    // Si ya existe el usuario, el reenvío puede fallar con "already registered"
    if (inviteError.message?.includes('already registered')) {
      return { success: true, resent: true }
    }
    return { error: inviteError.message }
  }

  // Guardar user_id si es primera invitación
  if (!alreadyInvited && inviteData?.user?.id) {
    await db()
      .from('students')
      .update({ user_id: inviteData.user.id })
      .eq('id', student_id)
  }

  revalidatePath(`/admin/students/${student_id}`)
  return { success: true, resent: alreadyInvited }
}

export async function deleteStudentAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const id = formData.get('id') as string
  if (!id) return { error: 'ID de estudiante requerido.' }

  const client = db()
  const now = new Date().toISOString()
  const reason = (formData.get('archived_reason') as string | null)?.trim() || 'Archivado desde administracion'

  const { error } = await client
    .from('students')
    .update({
      archived_at: now,
      archived_reason: reason,
      student_status: 'exalumno',
      status: 'inactive',
    })
    .eq('id', id)

  if (error) return { error: error.message }

  await safeRecordStudentActivity(id, 'archived', reason)

  revalidatePath('/admin/students')
  revalidatePath('/admin/reactivacion')
  return { success: true }
}

export async function setStudentPasswordAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const student_id = formData.get('student_id') as string
  const password   = (formData.get('password') as string)?.trim()
  const confirm    = (formData.get('confirm')   as string)?.trim()

  if (!student_id || !password) return { error: 'Completa todos los campos.' }
  if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  if (password !== confirm) return { error: 'Las contraseñas no coinciden.' }

  const { data: student, error: fetchErr } = await db()
    .from('students')
    .select('id, email, user_id')
    .eq('id', student_id)
    .single()

  if (fetchErr || !student) return { error: 'Estudiante no encontrado.' }
  if (!student.email) return { error: 'El estudiante no tiene email. Agrégalo primero.' }

  if (student.user_id) {
    const { error } = await db().auth.admin.updateUserById(student.user_id, { password })
    if (error) return { error: error.message }
  } else {
    const { data: newUser, error } = await db().auth.admin.createUser({
      email: student.email,
      password,
      email_confirm: true,
      user_metadata: { role: 'student' },
    })
    if (error) {
      if (error.message?.includes('already registered')) {
        return { error: 'Ya existe una cuenta con ese email. Usa "Invitar" para vincularla.' }
      }
      return { error: error.message }
    }
    const { error: linkErr } = await db()
      .from('students')
      .update({ user_id: newUser.user.id })
      .eq('id', student_id)
    if (linkErr) return { error: 'No se pudo vincular la cuenta al estudiante.' }
  }

  // Persistir contraseña en plain_password para consulta del admin
  await db()
    .from('students')
    .update({ plain_password: password })
    .eq('id', student_id)

  revalidatePath(`/admin/students/${student_id}`)
  return { success: true }
}

export async function updateStudentAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const id = formData.get('id') as string
  const first_name   = (formData.get('first_name')   as string)?.trim() || ''
  const last_name    = (formData.get('last_name')    as string)?.trim() || ''
  const name         = `${first_name} ${last_name}`.trim()
  const phone        = (formData.get('phone')        as string).trim()
  const email        = (formData.get('email')        as string | null)?.trim() || null
  const address      = (formData.get('address')      as string | null)?.trim() || null
  const city         = (formData.get('city')         as string | null)?.trim() || null
  const birth_date   = (formData.get('birth_date')   as string | null) || null
  const profession   = (formData.get('profession')   as string | null)?.trim() || null
  const music_genre  = (formData.get('music_genre')  as string | null)?.trim() || null
  const document_type   = (formData.get('document_type')   as string | null) || null
  const document_number = (formData.get('document_number') as string | null)?.trim() || null
  const status       = (formData.get('status')       as StudentStatus)
  const student_type = (formData.get('student_type') as StudentType)
  const student_status = (formData.get('student_status') as StudentLifecycleStatus | null) || null
  const student_since = (formData.get('student_since') as string | null)?.trim() || null
  const plan_expires_at = (formData.get('plan_expires_at') as string | null)?.trim() || null
  const next_payment_due_at = (formData.get('next_payment_due_at') as string | null)?.trim() || null
  const retention_score_raw = (formData.get('retention_score') as string | null)?.trim()
  const notes        = (formData.get('notes')        as string | null)?.trim() || null

  if (!first_name || !phone) {
    return { error: 'Nombre y WhatsApp son obligatorios.' }
  }

  const update: Record<string, unknown> = {
    name,
    first_name,
    last_name,
    phone,
    email,
    address,
    city,
    birth_date,
    profession,
    music_genre,
    document_type,
    document_number,
    status,
    student_type,
    notes,
  }

  if (student_status) update.student_status = student_status
  if (student_since !== null) update.student_since = student_since || null
  if (plan_expires_at !== null) update.plan_expires_at = plan_expires_at || null
  if (next_payment_due_at !== null) update.next_payment_due_at = next_payment_due_at || null
  if (retention_score_raw) update.retention_score = Math.max(0, Math.min(100, Number(retention_score_raw)))

  const { error } = await db()
    .from('students')
    .update(update)
    .eq('id', id)

  if (error) return { error: error.message }

  await activity.studentProfileUpdated({
    student_id:   id,
    student_name: name,
    source:       'admin',
  })

  revalidatePath('/admin/students')
  revalidatePath(`/admin/students/${id}`)
  return { success: true }
}

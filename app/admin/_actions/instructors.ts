'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { bogotaDateStr } from '@/lib/tz'
import { getAuthUser } from '@/lib/supabase/server'
import { revalidatePath, updateTag } from 'next/cache'
import { resolveRole, hasAcademicAccess } from '@/lib/auth/roles'

async function assertAdmin(): Promise<{ error: string } | null> {
  const { data: { user } } = await getAuthUser()
  const role = resolveRole(user)
  if (!hasAcademicAccess(role)) return { error: 'No autorizado.' }
  return null
}

export async function getInstructors() {
  const authErr = await assertAdmin()
  if (authErr) throw new Error(authErr.error)

  const adminClient = createAdminClient()
  const [{ data, error }, { data: schedules }, { data: sessions }] = await Promise.all([
    adminClient.from('instructors').select('*').order('name'),
    adminClient
      .from('student_schedules')
      .select('instructor_id, student_id')
      .eq('status', 'active'),
    // ponytail: conteo en memoria; si class_sessions crece a miles, mover a una vista
    // agregada en Postgres (COUNT DISTINCT student_id GROUP BY instructor_id).
    adminClient
      .from('class_sessions')
      .select('instructor_id, student_id')
      .neq('status', 'cancelled'),
  ])
  if (error) throw new Error(error.message)

  // Alumnos únicos por instructor: horario fijo activo + alumnos con clases reales
  const byInstructor = new Map<string, Set<string>>()
  for (const s of [...(schedules ?? []), ...(sessions ?? [])]) {
    if (!s.instructor_id || !s.student_id) continue
    const set = byInstructor.get(s.instructor_id) ?? new Set<string>()
    set.add(s.student_id)
    byInstructor.set(s.instructor_id, set)
  }

  return (data ?? []).map(inst => ({
    ...inst,
    students_count: byInstructor.get(inst.id)?.size ?? 0,
  }))
}

/**
 * Alumnos de un instructor: horario fijo activo + historial de clases.
 * Cruza student_schedules (asignación) con class_sessions (lo que realmente pasó),
 * porque un alumno puede tener clases con el instructor sin horario fijo y viceversa.
 */
export async function getInstructorStudents(instructorId: string) {
  const authErr = await assertAdmin()
  if (authErr) throw new Error(authErr.error)

  const adminClient = createAdminClient()
  const today = bogotaDateStr()

  const [{ data: schedules }, { data: sessions }] = await Promise.all([
    adminClient
      .from('student_schedules')
      .select('id, student_id, day_of_week, start_time, status, active_from, active_until, course:courses(name), classroom:classrooms(name)')
      .eq('instructor_id', instructorId)
      .eq('status', 'active')
      .or(`active_until.is.null,active_until.gte.${today}`),
    adminClient
      .from('class_sessions')
      .select('id, student_id, scheduled_date, start_time, status, late_cancellation, course:courses(name), student:students(id, name, phone, email, student_status)')
      .eq('instructor_id', instructorId)
      .order('scheduled_date', { ascending: false }),
  ])

  const allSessions = (sessions ?? []) as any[] // eslint-disable-line @typescript-eslint/no-explicit-any
  const studentIds = new Set<string>([
    ...allSessions.map(s => s.student_id),
    ...(schedules ?? []).map(s => s.student_id),
  ].filter(Boolean))

  // Datos de alumnos que solo tienen horario fijo (aún sin clases registradas)
  const knownStudents = new Map<string, any>() // eslint-disable-line @typescript-eslint/no-explicit-any
  for (const s of allSessions) if (s.student?.id) knownStudents.set(s.student.id, s.student)
  const missing = [...studentIds].filter(id => !knownStudents.has(id))
  if (missing.length > 0) {
    const { data: extra } = await adminClient
      .from('students')
      .select('id, name, phone, email, student_status')
      .in('id', missing)
    for (const st of extra ?? []) knownStudents.set(st.id, st)
  }

  const students = [...studentIds].map(id => {
    const own = allSessions.filter(s => s.student_id === id)
    const completed = own.filter(s => s.status === 'completed')
    const upcoming = own
      .filter(s => s.scheduled_date >= today && (s.status === 'pending' || s.status === 'confirmed'))
      .sort((a, b) => (a.scheduled_date + a.start_time).localeCompare(b.scheduled_date + b.start_time))

    return {
      student: knownStudents.get(id) ?? { id, name: 'Alumno sin datos' },
      schedules: (schedules ?? []).filter(s => s.student_id === id),
      totalSessions: own.length,
      completed: completed.length,
      cancelled: own.filter(s => s.status === 'cancelled').length,
      noShow: own.filter(s => s.status === 'no_show').length,
      lastAttended: completed[0] ?? null,   // sessions vienen ordenadas desc
      nextSession: upcoming[0] ?? null,
      sessions: own.slice(0, 20),
    }
  }).sort((a, b) => a.student.name.localeCompare(b.student.name))

  return {
    students,
    totals: {
      students: students.length,
      withSchedule: students.filter(s => s.schedules.length > 0).length,
      sessions: allSessions.length,
      completed: allSessions.filter(s => s.status === 'completed').length,
      cancelled: allSessions.filter(s => s.status === 'cancelled').length,
      noShow: allSessions.filter(s => s.status === 'no_show').length,
    },
  }
}

export async function createInstructorAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const authErr = await assertAdmin()
  if (authErr) return authErr

  const firstName = (formData.get('first_name') as string)?.trim()
  const lastName  = (formData.get('last_name')  as string)?.trim()
  const email     = (formData.get('email')      as string)?.trim()
  const phone     = (formData.get('phone')      as string)?.trim() || null
  const password  = (formData.get('password')   as string)

  if (!firstName || !email || !password) {
    return { error: 'Nombre, email y contraseña son obligatorios.' }
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const adminClient = createAdminClient()

  // Verificar email no duplicado en instructors
  const { data: existing } = await adminClient
    .from('instructors')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (existing) return { error: 'Ya existe un instructor con ese email.' }

  // Crear usuario auth con role instructor.
  // app_metadata es el rol autoritativo (solo service_role puede escribirlo);
  // user_metadata queda solo para mostrar nombre en UI, nunca se usa para autorizar.
  const { data: authData, error: authError } = await createAdminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'instructor', name: fullName, full_name: fullName },
    app_metadata: { role: 'instructor' },
  })

  if (authError) {
    if (authError.message.toLowerCase().includes('already registered') ||
        authError.message.toLowerCase().includes('already been registered')) {
      return { error: 'Ya existe una cuenta de acceso con ese email.' }
    }
    return { error: authError.message }
  }

  // Insertar en tabla instructors
  const { error: dbError } = await adminClient
    .from('instructors')
    .insert({ name: fullName, email, phone, status: 'active' })

  if (dbError) {
    // Revertir usuario auth si falla el insert
    await createAdminClient().auth.admin.deleteUser(authData.user.id)
    return { error: dbError.message }
  }

  revalidatePath('/admin/instructors')
  revalidatePath('/agendar')
  updateTag('catalog-instructors')
  return { success: true }
}

export async function getInstructorById(id: string) {
  const authErr = await assertAdmin()
  if (authErr) throw new Error(authErr.error)

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('instructors')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)

  const { data: availability } = await adminClient
    .from('instructor_availability')
    .select('day_of_week, start_time, end_time')
    .eq('instructor_id', id)
    .order('day_of_week')
    .order('start_time')

  return { ...data, availability: availability ?? [] }
}

export async function saveAdminInstructorAvailabilityAction(
  instructorId: string,
  slots: Array<{ day_of_week: number; start_time: string; end_time: string }>
): Promise<{ success?: boolean; error?: string }> {
  const authErr = await assertAdmin()
  if (authErr) return authErr

  const adminClient = createAdminClient()
  await adminClient.from('instructor_availability').delete().eq('instructor_id', instructorId)
  if (slots.length > 0) {
    const { error } = await adminClient.from('instructor_availability').insert(
      slots.map(s => ({ ...s, instructor_id: instructorId }))
    )
    if (error) return { error: error.message }
  }
  revalidatePath('/admin/instructors')
  revalidatePath('/agendar')
  return { success: true }
}

export async function updateInstructorAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const authErr = await assertAdmin()
  if (authErr) return authErr

  const id        = (formData.get('id')         as string)?.trim()
  const firstName = (formData.get('first_name') as string)?.trim()
  const lastName  = (formData.get('last_name')  as string)?.trim()
  const email     = (formData.get('email')      as string)?.trim()
  const phone     = (formData.get('phone')      as string)?.trim() || null
  const status    = (formData.get('status')     as string)?.trim()
  const notes     = (formData.get('notes')      as string)?.trim() || null
  const password  = (formData.get('password')   as string)?.trim() || null

  if (!id || !firstName) return { error: 'El nombre es obligatorio.' }

  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const adminClient = createAdminClient()

  // Obtener email actual antes de actualizar
  const { data: current } = await adminClient.from('instructors').select('email').eq('id', id).single()
  const currentEmail = current?.email

  const updatePayload = { name: fullName, phone, status, notes, ...(email && email !== currentEmail ? { email } : {}) }

  const { error: dbError } = await adminClient
    .from('instructors')
    .update(updatePayload)
    .eq('id', id)

  if (dbError) return { error: dbError.message }

  // Actualizar usuario auth si cambió el email o la contraseña
  if ((email && email !== currentEmail) || (password && password.length >= 6)) {
    const { data: users } = await createAdminClient().auth.admin.listUsers()
    const authUser = (users?.users as Array<{ email?: string; id: string }> ?? []).find(u => u.email === currentEmail)
    if (authUser) {
      const authUpdate: { email?: string; password?: string } = {}
      if (email && email !== currentEmail) authUpdate.email = email
      if (password && password.length >= 6) authUpdate.password = password
      await createAdminClient().auth.admin.updateUserById(authUser.id, authUpdate)
    }
  }

  revalidatePath('/admin/instructors')
  revalidatePath('/agendar')
  updateTag('catalog-instructors')
  return { success: true }
}

export async function deleteInstructorAction(
  instructorId: string,
  email: string
): Promise<{ error?: string; success?: boolean }> {
  const authErr = await assertAdmin()
  if (authErr) return authErr

  const adminClient = createAdminClient()

  // Buscar y borrar usuario auth por email
  const { data: users } = await createAdminClient().auth.admin.listUsers()
  const authUser = (users?.users as Array<{ email?: string; id: string }> ?? []).find(u => u.email === email)
  if (authUser) {
    await createAdminClient().auth.admin.deleteUser(authUser.id)
  }

  const { error } = await adminClient
    .from('instructors')
    .delete()
    .eq('id', instructorId)

  if (error) return { error: error.message }

  revalidatePath('/admin/instructors')
  revalidatePath('/agendar')
  updateTag('catalog-instructors')
  return { success: true }
}

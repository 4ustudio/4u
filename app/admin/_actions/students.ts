'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { bogotaNoon, bogotaDateStr } from '@/lib/tz'
import { createAuthServerClient, getAuthUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Student, StudentLifecycleStatus, StudentStatus, StudentType, StudentSchedule, Frequency } from '@/types/admin'
import { safeRecordStudentActivity } from './retention'
import { activity, logActivity } from '@/lib/activity'
import { isBirthdayMonth, getBirthdayBenefitStatus } from '@/lib/students/birthday'
import { resolveRole, hasAcademicAccess } from '@/lib/auth/roles'

async function assertAdmin(): Promise<{ error: string } | null> {
  const { data: { user } } = await getAuthUser()
  const role = resolveRole(user)
  if (!hasAcademicAccess(role)) return { error: 'No autorizado.' }
  return null
}

function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

async function validateKidsAge(studentId: string): Promise<string | null> {
  const { data: student } = await createAdminClient()
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

// Solo las columnas que consume getStudentsDashboard() y StudentsClient.tsx —
// select('*') traía ~30 columnas (incluyendo notes, address, document_number...)
// por cada alumno solo para pintar la lista.
const STUDENT_LIST_COLUMNS = 'id, name, phone, email, city, birth_date, status, student_status, user_id, enrolled_at'

export async function getStudents(): Promise<Student[]> {
  if (await assertAdmin()) throw new Error('No autorizado.')
  try {
    const supabase = await createAuthServerClient()
    let { data, error } = await supabase
      .from('students')
      .select(STUDENT_LIST_COLUMNS)
      .is('archived_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      const missingArchiveColumn = error.message?.includes('archived_at')
      if (missingArchiveColumn) {
        const retry = await supabase
          .from('students')
          .select(STUDENT_LIST_COLUMNS)
          .order('created_at', { ascending: false })
        data = retry.data
        error = retry.error
      }
    }

    if (error) {
      let { data: d2, error: e2 } = await createAdminClient()
        .from('students')
        .select(STUDENT_LIST_COLUMNS)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
      if (e2?.message?.includes('archived_at')) {
        const retry = await createAdminClient()
          .from('students')
          .select(STUDENT_LIST_COLUMNS)
          .order('created_at', { ascending: false })
        d2 = retry.data
        e2 = retry.error
      }
      if (e2) throw new Error(e2.message)
      return attachSchedules((d2 ?? []) as unknown as Student[])
    }
    return attachSchedules((data ?? []) as unknown as Student[])
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Error cargando estudiantes')
  }
}

async function attachSchedules(students: Student[]): Promise<Student[]> {
  if (students.length === 0) return students
  const { data: schedules } = await createAdminClient()
    .from('student_schedules')
    .select('student_id, day_of_week, start_time, active_from, course:courses(name), instructor:instructors(name), classroom:classrooms(name)')
    .eq('status', 'active')
    .in('student_id', students.map(s => s.id))

  const byStudent = new Map<string, NonNullable<Student['schedules']>>()
  for (const raw of (schedules ?? []) as any[]) {
    const list = byStudent.get(raw.student_id) ?? []
    list.push({
      day_of_week:     raw.day_of_week,
      start_time:      raw.start_time,
      active_from:     raw.active_from,
      course_name:     raw.course?.name ?? null,
      instructor_name: raw.instructor?.name ?? null,
      classroom_name:  raw.classroom?.name ?? null,
    })
    byStudent.set(raw.student_id, list)
  }

  return students.map(s => ({ ...s, schedules: byStudent.get(s.id) ?? [] }))
}

// ─── Dashboard de la lista de estudiantes (KPIs + próxima clase + progreso) ──

export interface StudentsKpis {
  total: number
  active: number
  activePct: number
  newThisMonth: number
  newThisMonthPct: number
  classesThisWeek: number
  classesToday: number
  upcoming7d: number
  activeInstructors: number
  avgAttendance30d: number | null
}

export interface StudentListRow extends Student {
  nextClass: { date: string; startTime: string; classroomName: string | null } | null
  progress: { completed: number; total: number } | null
  fallbackClass: { courseName: string | null; instructorName: string | null; classroomName: string | null } | null
  fallbackSchedule: { startDate: string; occurrencesPerWeek: number | null; sessionCount: number } | null
}

function isActiveStudent(s: Student): boolean {
  return s.student_status ? s.student_status === 'activo' : s.status === 'active'
}

function isThisMonthIso(iso: string): boolean {
  const d = new Date(iso), n = new Date()
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
}

export async function getStudentsDashboard(): Promise<{ students: StudentListRow[]; kpis: StudentsKpis }> {
  const students = await getStudents()
  const db = createAdminClient()
  const ids = students.map(s => s.id)
  const today = bogotaNoon()
  const todayStr = bogotaDateStr(today)
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - ((today.getDay() || 7) - 1))
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)
  const in7d = new Date(today); in7d.setDate(today.getDate() + 7)
  const d30ago = new Date(today); d30ago.setDate(today.getDate() - 30)

  const [
    { data: nextSessions },
    { data: latestSessions },
    { count: classesThisWeek },
    { count: classesToday },
    { count: upcoming7d },
    { count: activeInstructors },
    { data: attendanceSessions },
  ] = await Promise.all([
    ids.length > 0
      ? db.from('class_sessions')
          .select('student_id, scheduled_date, start_time, classroom:classrooms(name)')
          .in('student_id', ids)
          .gte('scheduled_date', todayStr)
          .not('status', 'in', '(cancelled,rescheduled)')
          .order('scheduled_date').order('start_time')
      : Promise.resolve({ data: [] as any[] }),
    // Respaldo para "Programa/Clase" y "Profesor" cuando el estudiante no tiene
    // un horario fijo activo — se toma su clase agendada más reciente (pasada o futura).
    ids.length > 0
      ? db.from('class_sessions')
          .select('student_id, course:courses(name), instructor:instructors(name), classroom:classrooms(name), scheduled_date')
          .in('student_id', ids)
          .not('status', 'in', '(cancelled,rescheduled)')
          .order('scheduled_date', { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    db.from('class_sessions').select('id', { count: 'exact', head: true })
      .gte('scheduled_date', weekStart.toISOString().split('T')[0])
      .lte('scheduled_date', weekEnd.toISOString().split('T')[0])
      .not('status', 'in', '(cancelled,rescheduled)'),
    db.from('class_sessions').select('id', { count: 'exact', head: true })
      .eq('scheduled_date', todayStr)
      .not('status', 'in', '(cancelled,rescheduled)'),
    db.from('class_sessions').select('id', { count: 'exact', head: true })
      .gt('scheduled_date', todayStr)
      .lte('scheduled_date', in7d.toISOString().split('T')[0])
      .not('status', 'in', '(cancelled,rescheduled)'),
    db.from('instructors').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('class_sessions').select('status')
      .gte('scheduled_date', d30ago.toISOString().split('T')[0])
      .lte('scheduled_date', todayStr)
      .not('status', 'in', '(cancelled,rescheduled)'),
  ])

  const nextByStudent = new Map<string, { date: string; startTime: string; classroomName: string | null }>()
  for (const raw of (nextSessions ?? []) as any[]) {
    if (nextByStudent.has(raw.student_id)) continue
    nextByStudent.set(raw.student_id, {
      date: raw.scheduled_date,
      startTime: raw.start_time,
      classroomName: raw.classroom?.name ?? null,
    })
  }

  const fallbackByStudent = new Map<string, { courseName: string | null; instructorName: string | null; classroomName: string | null }>()
  for (const raw of (latestSessions ?? []) as any[]) {
    if (fallbackByStudent.has(raw.student_id)) continue
    fallbackByStudent.set(raw.student_id, {
      courseName:     raw.course?.name ?? null,
      instructorName: raw.instructor?.name ?? null,
      classroomName:  raw.classroom?.name ?? null,
    })
  }

  // Sin horario fijo activo → inicio real (primera clase agendada) y frecuencia
  // estimada como clases reales / semanas transcurridas entre la primera y la
  // última (el día de la semana varía porque no hay horario fijo, así que
  // contar días distintos sobreestima la frecuencia — se usa el promedio real).
  // Con una sola clase registrada no hay forma honesta de estimar una cadencia.
  const datesByStudent = new Map<string, Set<string>>()
  for (const raw of (latestSessions ?? []) as any[]) {
    const set = datesByStudent.get(raw.student_id) ?? new Set<string>()
    set.add(raw.scheduled_date)
    datesByStudent.set(raw.student_id, set)
  }
  const fallbackScheduleByStudent = new Map<string, { startDate: string; occurrencesPerWeek: number | null; sessionCount: number }>()
  for (const [studentId, dateSet] of datesByStudent) {
    const dates = [...dateSet].sort()
    const startDate = dates[0]
    const endDate = dates[dates.length - 1]
    const spanDays = (new Date(endDate + 'T12:00:00').getTime() - new Date(startDate + 'T12:00:00').getTime()) / 86400000
    const weeksSpan = spanDays / 7
    const occurrencesPerWeek = weeksSpan > 0 ? Math.max(1, Math.round(dates.length / weeksSpan)) : null
    fallbackScheduleByStudent.set(studentId, { startDate, occurrencesPerWeek, sessionCount: dates.length })
  }

  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const { data: usageRows } = ids.length > 0
    ? await db.rpc('fn_monthly_usage_batch', { p_student_ids: ids, p_year: year, p_month: month })
    : { data: [] as any[] }
  const usageByStudent = new Map<string, { completed: number; total: number }>()
  for (const row of (usageRows ?? []) as any[]) {
    // classes_completed casi nunca se usa (los instructores rara vez marcan asistencia),
    // así que el progreso real del mes se refleja mejor con classes_scheduled (clases ya
    // agendadas de la cuota mensual).
    usageByStudent.set(row.student_id, { completed: Number(row.classes_scheduled ?? 0), total: Number(row.quota_total ?? 0) })
  }

  const active = students.filter(isActiveStudent).length
  const newThisMonth = students.filter(s => isThisMonthIso(s.enrolled_at)).length
  const attended = (attendanceSessions ?? []).filter(s => s.status === 'completed').length
  const attendanceTotal = (attendanceSessions ?? []).length

  const rows: StudentListRow[] = students.map(s => ({
    ...s,
    nextClass:        nextByStudent.get(s.id) ?? null,
    progress:         usageByStudent.get(s.id) ?? null,
    fallbackClass:    fallbackByStudent.get(s.id) ?? null,
    fallbackSchedule: fallbackScheduleByStudent.get(s.id) ?? null,
  }))

  return {
    students: rows,
    kpis: {
      total: students.length,
      active,
      activePct: students.length > 0 ? Math.round((active / students.length) * 100) : 0,
      newThisMonth,
      newThisMonthPct: students.length > 0 ? Math.round((newThisMonth / students.length) * 100) : 0,
      classesThisWeek: classesThisWeek ?? 0,
      classesToday: classesToday ?? 0,
      upcoming7d: upcoming7d ?? 0,
      activeInstructors: activeInstructors ?? 0,
      avgAttendance30d: attendanceTotal > 0 ? Math.round((attended / attendanceTotal) * 100) : null,
    },
  }
}

export async function getStudent(id: string) {
  if (await assertAdmin()) throw new Error('No autorizado.')
  const [{ data: student, error }, usageResult] = await Promise.all([
    createAdminClient().from('students').select('*').eq('id', id).single(),
    createAdminClient().rpc('fn_monthly_usage', {
      p_student_id: id,
      p_year:  new Date().getFullYear(),
      p_month: new Date().getMonth() + 1,
    }),
  ])

  if (error) throw new Error(error.message)
  const usageData = usageResult.data as Array<Record<string, unknown>> | null
  return { student, usage: usageData?.[0] ?? null }
}

export async function getLeads() {
  if (await assertAdmin()) throw new Error('No autorizado.')
  const { data, error } = await createAdminClient()
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)
  return data ?? []
}

// ─── Horarios fijos ─────────────────────────────────────────

export async function getStudentSchedules(studentId: string): Promise<StudentSchedule[]> {
  if (await assertAdmin()) throw new Error('No autorizado.')
  const { data, error } = await createAdminClient()
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
  const authErr = await assertAdmin()
  if (authErr) return authErr

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
  const { data: courseRaw } = await createAdminClient().from('courses').select('name').eq('id', course_id).single()
  const course = courseRaw as { category?: string } | null
  if (course?.category === 'kids') {
    const kidError = await validateKidsAge(student_id)
    if (kidError) return { error: kidError }
  }

  const { error } = await createAdminClient().from('student_schedules').insert({
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
  } as never)

  if (error) return { error: error.message }

  revalidatePath(`/admin/students/${student_id}`)
  return { success: true }
}

export async function updateScheduleAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const authErr = await assertAdmin()
  if (authErr) return authErr

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
  const { data: courseRaw } = await createAdminClient().from('courses').select('name').eq('id', course_id).single()
  const course = courseRaw as { category?: string } | null
  if (course?.category === 'kids') {
    const kidError = await validateKidsAge(student_id)
    if (kidError) return { error: kidError }
  }

  const { error } = await createAdminClient()
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
    } as never)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/admin/students/${student_id}`)
  return { success: true }
}

export async function deleteScheduleAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const authErr = await assertAdmin()
  if (authErr) return authErr

  const id         = formData.get('id')         as string
  const student_id = formData.get('student_id') as string

  const { error } = await createAdminClient()
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
  const authErr = await assertAdmin()
  if (authErr) return { error: authErr.error }

  const student_id = formData.get('student_id') as string
  const year       = Number(formData.get('year'))
  const month      = Number(formData.get('month'))

  if (!student_id || !year || !month) {
    return { error: 'Faltan datos: estudiante, año y mes.' }
  }

  const { data, error } = await createAdminClient().rpc('fn_generate_monthly_sessions', {
    p_student_id: student_id,
    p_year:       year,
    p_month:      month,
  })

  if (error) return { error: error.message }
  if (!data) return { error: 'No se obtuvo respuesta de la función.' }
  const rpcResult = data as { generated?: number; skipped?: number; errors?: string[] }

  revalidatePath(`/admin/students/${student_id}`)
  return {
    generated: rpcResult.generated ?? 0,
    skipped:   rpcResult.skipped ?? 0,
    errors:    rpcResult.errors ?? [],
  }
}

// ─── Mutaciones ─────────────────────────────────────────────

export async function createStudentAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const authErr = await assertAdmin()
  if (authErr) return authErr

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
  const student_type    = (formData.get('student_type') as StudentType) ?? 'new'
  const plan_name       = (formData.get('plan_name')    as string | null)?.trim() || null
  const payment_method  = (formData.get('payment_method') as string | null)?.trim() || null
  const notes           = (formData.get('notes')        as string | null)?.trim() || null
  const lead_id         = (formData.get('lead_id')      as string | null) || null
  const eps             = (formData.get('eps')          as string | null)?.trim() || null
  const emergency_contact_name  = (formData.get('emergency_contact_name')  as string | null)?.trim() || null
  const emergency_contact_phone = (formData.get('emergency_contact_phone') as string | null)?.trim() || null
  const now          = new Date().toISOString()

  if (!first_name || !phone) {
    return { error: 'Nombre y WhatsApp son obligatorios.' }
  }

  const { data: student, error } = await createAdminClient()
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
      plan_name,
      payment_method,
      notes,
      lead_id,
      eps,
      emergency_contact_name,
      emergency_contact_phone,
      status: 'active',
      student_status: student_type === 'new' ? 'lead' : 'activo',
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

  // Solo los prospectos entran al seguimiento de interesados; quien ya está
  // matriculado no debe aparecer como lead nuevo en el pipeline.
  if (student_type === 'new') {
    let student_age = 18
    if (birth_date) {
      const b = new Date(birth_date)
      const t = new Date()
      const calculated = t.getFullYear() - b.getFullYear() - (t < new Date(t.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0)
      if (calculated >= 6 && calculated < 120) student_age = calculated
    }

    const { error: enrollErr } = await createAdminClient().from('enrollments').insert({
      student_name:    name,
      phone,
      email:           email ?? '',
      city,
      music_genre,
      payment_method,
      notes,
      eps,
      emergency_contact_name,
      emergency_contact_phone,
      course_interest: plan_name || 'Por definir',
      level:           'never',
      preferred_time:  'Por definir',
      student_age,
      student_type:    student_age < 18 ? 'child' : 'self',
      source:          'presencial',
      status:          'pending',
      // Vínculo con la ficha ya creada: evita que al "convertir" se duplique el estudiante.
      // converted_at sigue null, así que el prospecto sí aparece en /admin/interesados.
      converted_student_id: student?.id ?? null,
    })
    if (enrollErr) console.error('[createStudentAction] enrollments insert failed:', enrollErr)
  }

  revalidatePath('/admin/students')
  revalidatePath('/admin/leads')
  revalidatePath('/admin/interesados')
  return { success: true }
}

export async function inviteStudentAction(
  _prev: { error?: string; success?: boolean; resent?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean; resent?: boolean }> {
  const authErr = await assertAdmin()
  if (authErr) return authErr

  const student_id = formData.get('student_id') as string
  if (!student_id) return { error: 'ID de estudiante requerido.' }

  const { data: student } = await createAdminClient()
    .from('students')
    .select('id, email, user_id, name')
    .eq('id', student_id)
    .single()

  if (!student) return { error: 'Estudiante no encontrado.' }
  if (!student.email) return { error: 'El estudiante no tiene email registrado. Agrega uno primero.' }

  const alreadyInvited = !!student.user_id

  // Invitar o reenviar invitación
  const { data: inviteData, error: inviteError } = await createAdminClient()
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

  // inviteUserByEmail no acepta app_metadata (solo user_metadata) — el rol
  // autoritativo se fija en una segunda llamada con service_role.
  if (inviteData?.user?.id) {
    await createAdminClient().auth.admin.updateUserById(inviteData.user.id, {
      app_metadata: { role: 'student' },
    })
  }

  // Guardar user_id si es primera invitación
  if (!alreadyInvited && inviteData?.user?.id) {
    await createAdminClient()
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
  const authErr = await assertAdmin()
  if (authErr) return authErr

  const id = formData.get('id') as string
  if (!id) return { error: 'ID de estudiante requerido.' }

  const client = createAdminClient()
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

export async function permanentlyDeleteStudentAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const authErr = await assertAdmin()
  if (authErr) return authErr

  const id = formData.get('id') as string
  if (!id) return { error: 'ID de estudiante requerido.' }

  const client = createAdminClient()
  // Tablas con FK RESTRICT/NO ACTION hacia students: se borran antes (el resto es CASCADE/SET NULL)
  for (const table of [
    'class_sessions', 'payments', 'campaign_messages', 'reactivation_tasks',
    'retention_alerts', 'student_activity_events', 'student_admin_notes',
  ]) {
    const { error } = await client.from(table).delete().eq('student_id', id)
    if (error) return { error: `${table}: ${error.message}` }
  }
  const { error } = await client.from('students').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/students')
  revalidatePath('/admin/reactivacion')
  redirect('/admin/students')
}

export async function setStudentPasswordAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const authErr = await assertAdmin()
  if (authErr) return authErr

  const student_id = formData.get('student_id') as string
  const password   = (formData.get('password') as string)?.trim()
  const confirm    = (formData.get('confirm')   as string)?.trim()

  if (!student_id || !password) return { error: 'Completa todos los campos.' }
  if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  if (password !== confirm) return { error: 'Las contraseñas no coinciden.' }

  const { data: student, error: fetchErr } = await createAdminClient()
    .from('students')
    .select('id, email, user_id')
    .eq('id', student_id)
    .single()

  if (fetchErr || !student) return { error: 'Estudiante no encontrado.' }
  if (!student.email) return { error: 'El estudiante no tiene email. Agrégalo primero.' }

  if (student.user_id) {
    const { error } = await createAdminClient().auth.admin.updateUserById(student.user_id, {
      password,
      app_metadata: { role: 'student' },
    })
    if (error) return { error: error.message }
  } else {
    const { data: newUser, error } = await createAdminClient().auth.admin.createUser({
      email: student.email,
      password,
      email_confirm: true,
      user_metadata: { role: 'student' },
      app_metadata: { role: 'student' },
    })
    if (error) {
      if (error.message?.includes('already registered')) {
        return { error: 'Ya existe una cuenta con ese email. Usa "Invitar" para vincularla.' }
      }
      return { error: error.message }
    }
    const { error: linkErr } = await createAdminClient()
      .from('students')
      .update({ user_id: newUser.user.id })
      .eq('id', student_id)
    if (linkErr) return { error: 'No se pudo vincular la cuenta al estudiante.' }
  }

  // Persistir contraseña en plain_password para consulta del admin
  await createAdminClient()
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
  const authErr = await assertAdmin()
  if (authErr) return authErr

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
  const eps             = (formData.get('eps')          as string | null)?.trim() || null
  const emergency_contact_name  = (formData.get('emergency_contact_name')  as string | null)?.trim() || null
  const emergency_contact_phone = (formData.get('emergency_contact_phone') as string | null)?.trim() || null

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
    eps,
    emergency_contact_name,
    emergency_contact_phone,
  }

  if (student_status) update.student_status = student_status
  if (student_since !== null) update.student_since = student_since || null
  if (plan_expires_at !== null) update.plan_expires_at = plan_expires_at || null
  if (next_payment_due_at !== null) update.next_payment_due_at = next_payment_due_at || null
  if (retention_score_raw) update.retention_score = Math.max(0, Math.min(100, Number(retention_score_raw)))

  const { error } = await createAdminClient()
    .from('students')
    .update(update as never)
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

// ── Beneficio de Cumpleaños ───────────────────────────────────────

export async function grantBirthdayBenefitAction(
  studentId: string
): Promise<{ error?: string; success?: boolean }> {
  const authErr = await assertAdmin()
  if (authErr) return authErr

  const { data: student, error: fetchErr } = await createAdminClient()
    .from('students')
    .select('id, name, birth_date, student_status, birthday_benefit_year, birthday_benefit_used, birthday_discount_percent')
    .eq('id', studentId)
    .single()

  if (fetchErr || !student) return { error: 'Estudiante no encontrado.' }

  const status = getBirthdayBenefitStatus(student)

  if (student.student_status !== 'activo') return { error: 'El beneficio aplica solo a estudiantes activos.' }
  if (!isBirthdayMonth(student.birth_date)) return { error: 'No es el mes de cumpleaños del estudiante.' }
  if (status === 'granted' || status === 'used') return { error: 'El beneficio ya fue otorgado este año.' }

  const currentYear = new Date().getFullYear()
  const { error } = await createAdminClient()
    .from('students')
    .update({ birthday_benefit_year: currentYear, birthday_benefit_used: false })
    .eq('id', studentId)

  if (error) return { error: error.message }

  await logActivity({
    entity_type:       'student',
    entity_id:         studentId,
    action:            'birthday.benefit_granted',
    description:       `Beneficio de cumpleaños otorgado a ${student.name} (${student.birthday_discount_percent ?? 10}% descuento)`,
    metadata:          { discount_percent: student.birthday_discount_percent ?? 10, year: currentYear },
    severity:          'info',
    created_by_system: false,
  })

  revalidatePath('/admin/students')
  revalidatePath(`/admin/students/${studentId}`)
  return { success: true }
}

export async function useBirthdayDiscountAction(
  studentId: string
): Promise<{ error?: string; success?: boolean }> {
  const authErr = await assertAdmin()
  if (authErr) return authErr

  const { data: student, error: fetchErr } = await createAdminClient()
    .from('students')
    .select('id, name, birthday_benefit_year, birthday_benefit_used, birthday_discount_percent')
    .eq('id', studentId)
    .single()

  if (fetchErr || !student) return { error: 'Estudiante no encontrado.' }

  const currentYear = new Date().getFullYear()
  if (student.birthday_benefit_year !== currentYear) return { error: 'No hay beneficio otorgado este año.' }
  if (student.birthday_benefit_used) return { error: 'El descuento ya fue utilizado.' }

  const { error } = await createAdminClient()
    .from('students')
    .update({ birthday_benefit_used: true })
    .eq('id', studentId)

  if (error) return { error: error.message }

  await logActivity({
    entity_type:       'student',
    entity_id:         studentId,
    action:            'birthday.discount_used',
    description:       `Descuento de cumpleaños aplicado a ${student.name} (${student.birthday_discount_percent ?? 10}%)`,
    metadata:          { discount_percent: student.birthday_discount_percent ?? 10, year: currentYear },
    severity:          'info',
    created_by_system: false,
  })

  revalidatePath('/admin/students')
  revalidatePath(`/admin/students/${studentId}`)
  return { success: true }
}

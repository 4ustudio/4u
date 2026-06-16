'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createAuthServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { parseRole, hasAcademicAccess } from '@/lib/auth/roles'
import { safeRecordStudentActivity } from './retention'
import { activity } from '@/lib/activity'

async function assertAdmin(): Promise<{ error: string } | null> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = parseRole(user?.user_metadata ?? null)
  if (!hasAcademicAccess(role)) return { error: 'No autorizado.' }
  return null
}

// ─── Dashboard data ──────────────────────────────────────────────

export interface AcademicDashboardData {
  kpis: {
    todayClasses: number
    weekClasses: number
    monthClasses: number
    instructorOccupancy: number
    classroomOccupancy: number
    studentsWithoutSchedule: number
    instructorsWithoutAssignment: number
    averageAttendance: number
    noShowRate: number
  }
  attendanceByInstructor: { name: string; total: number; attended: number; rate: number }[]
  attendanceByCourse: { name: string; total: number; attended: number; rate: number }[]
  riskStudents: {
    id: string
    name: string
    student_status: string | null
    retention_score: number | null
    risk_level: string
    recent_no_shows: number
    attendance_rate_90d: number | null
  }[]
  matching: {
    unmatchedSchedules: { student_name: string; course_name: string; day_of_week: number; start_time: string }[]
    availableInstructors: { name: string; email: string | null; courses: string[]; availabilitySlots: number }[]
  }
  capacity: {
    classroomHeatmap: { name: string; day_of_week: number; hour: string; occupancy: number }[]
    instructorHeatmap: { name: string; day_of_week: number; hour: string; occupancy: number }[]
  }
}

export async function getAcademicDashboardData(): Promise<AcademicDashboardData> {
  const authErr = await assertAdmin()
  if (authErr) throw new Error(authErr.error)

  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  const weekStartStr = weekStart.toISOString().split('T')[0]
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekEndStr = weekEnd.toISOString().split('T')[0]

  const monthStart = today.slice(0, 7) + '-01'
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const monthEnd = nextMonth.toISOString().split('T')[0]

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  // KPIs en paralelo
  const [
    { count: todayCount },
    { count: weekCount },
    { count: monthCount },
    { data: instructors },
    { data: classrooms },
    { data: studentsActive },
    { data: schedules },
    { data: sessions30d },
    { data: riskData },
  ] = await Promise.all([
    admin.from('class_sessions').select('id', { count: 'exact', head: true })
      .eq('scheduled_date', today).not('status', 'in', '(cancelled,rescheduled)'),
    admin.from('class_sessions').select('id', { count: 'exact', head: true })
      .gte('scheduled_date', weekStartStr).lte('scheduled_date', weekEndStr)
      .not('status', 'in', '(cancelled,rescheduled)'),
    admin.from('class_sessions').select('id', { count: 'exact', head: true })
      .gte('scheduled_date', monthStart).lt('scheduled_date', monthEnd)
      .not('status', 'in', '(cancelled,rescheduled)'),
    admin.from('instructors').select('id, name, email').eq('status', 'active'),
    admin.from('classrooms').select('id, name').eq('is_active', true),
    admin.from('students').select('id').eq('status', 'active'),
    admin.from('student_schedules').select('id, student_id, course_id, instructor_id, day_of_week, start_time, student:students!inner(name), course:courses(name)').eq('status', 'active'),
    admin.from('class_sessions').select('id, status, attendance_status, instructor_id, course_id, instructor:instructors(name), course:courses(name)')
      .gte('scheduled_date', today.slice(0, 7) + '-01').lt('scheduled_date', monthEnd).limit(2000),
    admin.from('class_sessions').select('student_id, status, attendance_status')
      .gte('scheduled_date', new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0])
      .in('status', ['completed', 'no_show']).limit(3000),
  ])

  const instructorCount = instructors?.length ?? 0
  const classroomCount = classrooms?.length ?? 0
  const activeStudentCount = studentsActive?.length ?? 0
  const activeSchedules = schedules ?? []
  const recentSessions = sessions30d ?? []

  // Ocupación
  const sessionCount = recentSessions.length
  const totalCapacity = classroomCount * 11 * 22 // salones × slots/día × días hábiles
  const instructorSessions = new Set(recentSessions.map(s => (s as any).instructor_id).filter(Boolean)).size
  const instructorOccupancy = instructorCount > 0 ? Math.round((instructorSessions / instructorCount) * 100) : 0
  const classroomOccupancy = totalCapacity > 0 ? Math.round((sessionCount / totalCapacity) * 100) : 0

  // Estudiantes sin horario
  const studentsWithSchedule = new Set(activeSchedules.map(s => (s as any).student_id))
  const studentsWithoutSchedule = activeStudentCount - studentsWithSchedule.size

  // Instructores sin asignación
  const instructorsWithSchedules = new Set(activeSchedules.filter(s => (s as any).instructor_id).map(s => (s as any).instructor_id))
  const instructorsWithoutAssignment = instructorCount - instructorsWithSchedules.size

  // Asistencia promedio
  const completed = recentSessions.filter(s => s.status === 'completed').length
  const noShows = recentSessions.filter(s => s.status === 'no_show').length
  const averageAttendance = sessionCount > 0 ? Math.round((completed / sessionCount) * 100) : 0
  const noShowRate = sessionCount > 0 ? Math.round((noShows / sessionCount) * 100) : 0

  // Asistencia por instructor
  const byInstructor = new Map<string, { total: number; attended: number }>()
  for (const s of recentSessions) {
    const inst = (s as any).instructor as { name: string } | null
    if (!inst?.name) continue
    const key = inst.name
    if (!byInstructor.has(key)) byInstructor.set(key, { total: 0, attended: 0 })
    const rec = byInstructor.get(key)!
    rec.total++
    if (s.status === 'completed' || s.attendance_status === 'attended') rec.attended++
  }
  const attendanceByInstructor = Array.from(byInstructor.entries())
    .map(([name, v]) => ({ name, total: v.total, attended: v.attended, rate: Math.round((v.attended / v.total) * 100) }))
    .sort((a, b) => b.total - a.total)

  // Asistencia por curso
  const byCourse = new Map<string, { total: number; attended: number }>()
  for (const s of recentSessions) {
    const course = (s as any).course as { name: string } | null
    if (!course?.name) continue
    const key = course.name
    if (!byCourse.has(key)) byCourse.set(key, { total: 0, attended: 0 })
    const rec = byCourse.get(key)!
    rec.total++
    if (s.status === 'completed' || s.attendance_status === 'attended') rec.attended++
  }
  const attendanceByCourse = Array.from(byCourse.entries())
    .map(([name, v]) => ({ name, total: v.total, attended: v.attended, rate: Math.round((v.attended / v.total) * 100) }))
    .sort((a, b) => b.total - a.total)

  // Estudiantes en riesgo (desde la vista o computado)
  const riskStudents = await computeRiskStudents(riskData ?? [], activeSchedules, admin)

  // Matching: horarios sin instructor
  const unmatchedSchedules = activeSchedules
    .filter(s => !(s as any).instructor_id)
    .map(s => ({
      student_name: (s as any).student?.name ?? '—',
      course_name: (s as any).course?.name ?? '—',
      day_of_week: (s as any).day_of_week,
      start_time: (s as any).start_time.slice(0, 5),
    }))

  // Matching: instructores disponibles
  const { data: instructorCoursesRaw } = await admin
    .from('instructor_courses')
    .select('instructor_id, course:courses(name)')
  const { data: instructorAvailRaw } = await admin
    .from('instructor_availability')
    .select('instructor_id')
    .eq('status' as never, 'available' as never)
  const availMap = new Map<string, number>()
  for (const a of (instructorAvailRaw as any[]) ?? []) {
    availMap.set(a.instructor_id, (availMap.get(a.instructor_id) ?? 0) + 1)
  }
  const coursesByInstructor = new Map<string, string[]>()
  for (const ic of (instructorCoursesRaw as any[]) ?? []) {
    const iid = ic.instructor_id
    if (!coursesByInstructor.has(iid)) coursesByInstructor.set(iid, [])
    coursesByInstructor.get(iid)!.push(ic.course?.name ?? '')
  }
  const availableInstructors = (instructors ?? []).map(i => ({
    name: (i as any).name,
    email: (i as any).email,
    courses: coursesByInstructor.get((i as any).id) ?? [],
    availabilitySlots: availMap.get((i as any).id) ?? 0,
  }))

  return {
    kpis: {
      todayClasses: todayCount ?? 0,
      weekClasses: weekCount ?? 0,
      monthClasses: monthCount ?? 0,
      instructorOccupancy,
      classroomOccupancy,
      studentsWithoutSchedule,
      instructorsWithoutAssignment,
      averageAttendance,
      noShowRate,
    },
    attendanceByInstructor,
    attendanceByCourse,
    riskStudents,
    matching: { unmatchedSchedules, availableInstructors },
    capacity: { classroomHeatmap: [], instructorHeatmap: [] },
  }
}

async function computeRiskStudents(sessions: any[], _schedules: any[], admin: ReturnType<typeof createAdminClient>) {
  const { data: allStudents } = await admin
    .from('students')
    .select('id, name, student_status, retention_score')
    .eq('status', 'active')

  const studentMap = new Map<string, { id: string; name: string; student_status: string | null; retention_score: number | null; no_shows: number; total: number; completed: number }>()
  for (const st of allStudents ?? []) {
    const s = st as any
    studentMap.set(s.id, { id: s.id, name: s.name, student_status: s.student_status, retention_score: s.retention_score, no_shows: 0, total: 0, completed: 0 })
  }

  for (const s of sessions) {
    const rec = studentMap.get(s.student_id)
    if (!rec) continue
    rec.total++
    if (s.status === 'completed') rec.completed++
    if (s.status === 'no_show') rec.no_shows++
  }

  return Array.from(studentMap.values()).map(s => {
    const rate = s.total > 0 ? Math.round((s.completed / s.total) * 100) : null
    const riskLevel = s.no_shows >= 3 ? 'critical' : (rate !== null && rate < 50) ? 'warning' : 'ok'
    return {
      id: s.id,
      name: s.name || '—',
      student_status: s.student_status,
      retention_score: s.retention_score,
      risk_level: riskLevel,
      recent_no_shows: s.no_shows,
      attendance_rate_90d: rate,
    }
  }).filter(s => s.risk_level !== 'ok').sort((a, b) => {
    const order = { critical: 0, warning: 1, ok: 2 }
    return order[a.risk_level as keyof typeof order] - order[b.risk_level as keyof typeof order]
  })
}

// ─── Registrar asistencia (nuevo sistema simplificado) ──────────

export async function registerAttendanceAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const authErr = await assertAdmin()
  if (authErr) return authErr

  const sessionId = formData.get('session_id') as string
  const attendance = formData.get('attendance') as string // 'attended' | 'absent' | 'no_show' | 'cancelled'

  if (!sessionId || !attendance) return { error: 'Faltan datos.' }
  if (!['attended', 'absent', 'no_show', 'cancelled'].includes(attendance)) {
    return { error: 'Estado de asistencia inválido.' }
  }

  const { data: session } = await createAdminClient()
    .from('class_sessions')
    .select('student_id, scheduled_date, start_time, course_id, status')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) return { error: 'Clase no encontrada.' }

  const update: Record<string, unknown> = {
    attendance_status: attendance,
    attendance_confirmed_at: new Date().toISOString(),
  }

  // Mapear asistencia a status de sesión
  if (attendance === 'attended') {
    update.status = 'completed'
  } else if (attendance === 'no_show' || attendance === 'absent') {
    update.status = 'no_show'
  } else if (attendance === 'cancelled' && !['cancelled', 'rescheduled', 'completed'].includes(session.status)) {
    update.status = 'cancelled'
    update.cancelled_at = new Date().toISOString()
    update.cancelled_by = 'admin'
  }

  const { error } = await createAdminClient()
    .from('class_sessions')
    .update(update as never)
    .eq('id', sessionId)

  if (error) return { error: error.message }

  if (attendance === 'attended') {
    await safeRecordStudentActivity(session.student_id, 'class_completed', 'Asistencia registrada.', {
      session_id: sessionId, course_id: session.course_id,
    })
    await activity.attendanceConfirmed({ session_id: sessionId, student_name: 'Estudiante', source: 'admin' })
  } else if (attendance === 'no_show' || attendance === 'absent') {
    await safeRecordStudentActivity(session.student_id, 'class_no_show', 'Inasistencia registrada.', { session_id: sessionId })
    await activity.attendanceNoShow({ session_id: sessionId, student_name: 'Estudiante', source: 'admin' })
  }

  revalidatePath('/admin/agenda')
  revalidatePath('/admin/academico')
  return { success: true }
}

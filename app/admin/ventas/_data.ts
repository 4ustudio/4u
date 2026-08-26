import { createAdminClient } from '@/lib/supabase/admin'
import { getEnrollmentFunnelMetrics } from '@/app/admin/_actions/enrollments'
import { courseEstimate, formatOccurredAt, getMonthBounds, type RecentSale } from './_utils'

export async function getExecutiveData(refMonth: Date = new Date()) {
  const db = createAdminClient()
  const now = new Date()
  const weekStartDate = new Date(now)
  weekStartDate.setDate(now.getDate() - ((now.getDay() || 7) - 1))
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekStartDate.getDate() + 6)
  const weekStart = weekStartDate.toISOString().slice(0, 10)
  const weekEnd = weekEndDate.toISOString().slice(0, 10)
  const monthStart = new Date(refMonth.getFullYear(), refMonth.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(refMonth.getFullYear(), refMonth.getMonth() + 1, 0).toISOString().slice(0, 10)

  const [
    { data: retentionDashboard },
    funnel,
    { data: enrollments },
    { count: classSessionsMonth },
    { data: instructorSessions },
    { data: classrooms },
    { data: sessionsToday },
  ] = await Promise.all([
    db.from('v_retention_dashboard').select('*').maybeSingle(),
    getEnrollmentFunnelMetrics(refMonth),
    db
      .from('enrollments')
      .select('student_name, course_interest, created_at, status, last_contact_at')
      .order('created_at', { ascending: false })
      .limit(20),
    db
      .from('class_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('scheduled_date', monthStart)
      .lte('scheduled_date', monthEnd)
      .not('status', 'in', '(cancelled,rescheduled)'),
    db
      .from('class_sessions')
      .select('instructor_id, instructor:instructors(name)')
      .gte('scheduled_date', weekStart)
      .lte('scheduled_date', weekEnd)
      .not('status', 'in', '(cancelled,rescheduled)'),
    db.from('classrooms').select('id, name').order('name'),
    db
      .from('class_sessions')
      .select('classroom_id')
      .eq('scheduled_date', now.toISOString().slice(0, 10))
      .not('status', 'in', '(cancelled,rescheduled)'),
  ])

  const retention = (retentionDashboard ?? {}) as Record<string, number | null>
  const activeStudents = retention.active_students ?? 0
  const riskStudents = retention.risk_students ?? 0
  const inactiveStudents = retention.inactive_students ?? 0
  const alumniStudents = retention.alumni_students ?? 0
  const totalManaged = activeStudents + riskStudents + inactiveStudents + alumniStudents
  const retencionPct = totalManaged > 0 ? Math.round((activeStudents / totalManaged) * 100) : 0

  const instructorMap = new Map<string, { name: string; count: number }>()
  for (const row of instructorSessions ?? []) {
    const raw = row as { instructor_id?: string | null; instructor?: { name?: string | null } | null }
    const key = raw.instructor_id ?? 'unassigned'
    const prev = instructorMap.get(key)
    instructorMap.set(key, {
      name: raw.instructor?.name ?? 'Sin asignar',
      count: (prev?.count ?? 0) + 1,
    })
  }
  const instructorOccupancy = Array.from(instructorMap.values()).sort((a, b) => b.count - a.count).slice(0, 4)
  const maxInstructorCount = Math.max(...instructorOccupancy.map((item) => item.count), 1)

  const classroomCountMap = new Map<string, number>()
  for (const row of sessionsToday ?? []) {
    const classroomId = (row as { classroom_id?: string | null }).classroom_id
    if (!classroomId) continue
    classroomCountMap.set(classroomId, (classroomCountMap.get(classroomId) ?? 0) + 1)
  }
  const studioOccupancy = (classrooms ?? []).map((room: { id: string; name: string }) => {
    const sessions = classroomCountMap.get(room.id) ?? 0
    return { name: room.name, sessions, pct: Math.min(100, Math.round((sessions / 6) * 100)) }
  })

  const recentSales: RecentSale[] = (enrollments ?? [])
    .filter((row: { status?: string | null }) => row.status === 'converted')
    .slice(0, 4)
    .map((row: { student_name: string; course_interest: string | null; created_at: string }) => ({
      name: row.student_name,
      detail: row.course_interest || 'Inscripción convertida',
      amount: courseEstimate(row.course_interest),
      status: 'Completado',
      statusTone: 'green' as const,
      occurredAt: formatOccurredAt(row.created_at),
    }))

  // Leads sin seguimiento (pendientes sin contacto en >3 días)
  const cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const leadsSinSeguimiento = (enrollments ?? []).filter(
    (row: { status?: string | null; last_contact_at?: string | null }) =>
      row.status === 'pending' &&
      (!row.last_contact_at || row.last_contact_at < cutoff)
  ).length

  // Matrículas pendientes
  const matriculasPendientes = (enrollments ?? []).filter(
    (row: { status?: string | null }) =>
      row.status === 'pending' || row.status === 'trial_scheduled'
  ).length

  return {
    rangeLabel: getMonthBounds(refMonth).rangeLabel,
    activeStudents,
    riskStudents,
    alumnosCriticos: inactiveStudents,
    reactivatedMonth: retention.reactivated_this_month ?? 0,
    reactivationRate: retention.reactivation_rate ?? 0,
    retencionPct,
    totalManaged,
    leadsSinSeguimiento,
    matriculasPendientes,
    leadsThisMonth: funnel.totalMonth,
    convertedLeads: funnel.converted,
    conversionRate: funnel.conversionRate,
    classSessionsMonth: classSessionsMonth ?? 0,
    plansExpiringWeek: retention.plans_expiring_week ?? 0,
    withoutUpcoming: retention.without_upcoming_sessions ?? 0,
    recentSales,
    instructorOccupancy,
    maxInstructorCount,
    studioOccupancy,
    funnelStages: [
      { label: 'Leads', value: funnel.totalMonth },
      { label: 'Contactados', value: funnel.contacted },
      { label: 'Clase de prueba', value: funnel.clasePrueba },
      { label: 'Matriculados', value: funnel.converted },
      { label: 'Activos', value: activeStudents },
    ],
  }
}

export type ExecutiveData = Awaited<ReturnType<typeof getExecutiveData>>

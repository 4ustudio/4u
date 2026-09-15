import { createAdminClient } from '@/lib/supabase/admin'
import { getAvailableSlots } from '../_actions/sessions'
import { getCachedCourses, getCachedClassrooms, getCachedInstructors } from '@/lib/cache/catalogs'
import HybridView from './_components/HybridView'
import type { ClassSession, AvailableSlot, TrialSession } from '@/types/admin'

export const dynamic = 'force-dynamic'

function getWeekStart(query?: string): string {
  if (query) return query
  const now  = new Date()
  const dow  = now.getDay() || 7
  const mon  = new Date(now)
  mon.setDate(now.getDate() - (dow - 1))
  return mon.toISOString().split('T')[0]
}

async function getPageData(weekStart: string) {
  const supabase = createAdminClient()
  const endDate  = new Date(weekStart)
  endDate.setDate(endDate.getDate() + 6)
  const end = endDate.toISOString().split('T')[0]

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + 'T12:00:00')
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const [
    [
      { data: sessions },
      { data: blocked },
      { data: students },
      { data: trials },
    ],
    courses,
    classrooms,
    instructors,
    availabilityResults,
  ] = await Promise.all([
    Promise.all([
      supabase
        .from('class_sessions')
        .select('*, student:students(name,phone), course:courses(name), classroom:classrooms(name), instructor:instructors(name)')
        .gte('scheduled_date', weekStart)
        .lte('scheduled_date', end)
        .order('start_time'),

      supabase
        .from('blocked_dates')
        .select('*')
        .gte('blocked_date', weekStart)
        .lte('blocked_date', end),

      supabase
        .from('students')
        .select('id, name, phone, email, status, student_type')
        .order('name'),

      // Sesiones de reconocimiento (clases de prueba de interesados): viven en
      // enrollments, no en class_sessions, pero ocupan el mismo horario y salón.
      supabase
        .from('enrollments')
        .select('id, student_name, phone, course_interest, status, trial_date, trial_time, trial_instructor_id, trial_classroom_id, instructor:instructors!enrollments_trial_instructor_id_fkey(name), classroom:classrooms(name)')
        .gte('trial_date', weekStart)
        .lte('trial_date', end)
        .not('trial_date', 'is', null)
        .not('status', 'in', '(perdido,cancelled,converted)')
        .order('trial_time'),
    ]),
    getCachedCourses(),
    getCachedClassrooms(),
    getCachedInstructors(),
    Promise.allSettled(days.map(day => getAvailableSlots(day))),
  ])

  const availabilityByDay: Record<string, AvailableSlot[]> = {}
  days.forEach((day, i) => {
    const result = availabilityResults[i]
    availabilityByDay[day] = result.status === 'fulfilled' ? result.value : []
  })

  return {
    sessions:    (sessions as ClassSession[]) ?? [],
    trials:      (trials as unknown as TrialSession[]) ?? [],
    blocked:     blocked ?? [],
    students:    students ?? [],
    courses:     courses  ?? [],
    classrooms:  classrooms ?? [],
    instructors: instructors ?? [],
    availabilityByDay,
  }
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const { week } = await searchParams
  const weekStart = getWeekStart(week)
  const data      = await getPageData(weekStart)

  return (
    <HybridView weekStart={weekStart} {...data} />
  )
}

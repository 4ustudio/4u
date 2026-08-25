import { createAdminClient } from '@/lib/supabase/admin'
import { getAvailableSlots } from '../_actions/sessions'
import { getCachedCourses, getCachedClassrooms, getCachedInstructors } from '@/lib/cache/catalogs'
import HybridView from './_components/HybridView'
import type { ClassSession, AvailableSlot } from '@/types/admin'

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

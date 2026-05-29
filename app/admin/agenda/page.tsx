import { createAdminClient } from '@/lib/supabase/admin'
import WeekCalendar from './_components/WeekCalendar'
import type { ClassSession } from '@/types/admin'

function getWeekStart(query?: string): string {
  if (query) return query
  const now  = new Date()
  const dow  = now.getDay() || 7        // 1=Lun … 7=Dom
  const mon  = new Date(now)
  mon.setDate(now.getDate() - (dow - 1))
  return mon.toISOString().split('T')[0]
}

async function getPageData(weekStart: string) {
  const supabase = createAdminClient()
  const start    = weekStart
  const endDate  = new Date(weekStart)
  endDate.setDate(endDate.getDate() + 6)
  const end = endDate.toISOString().split('T')[0]

  const [
    { data: sessions },
    { data: blocked },
    { data: students },
    { data: courses },
    { data: classrooms },
    { data: instructors },
  ] = await Promise.all([
    supabase
      .from('class_sessions')
      .select('*, student:students(name,phone), course:courses(name), classroom:classrooms(name), instructor:instructors(name)')
      .gte('scheduled_date', start)
      .lte('scheduled_date', end)
      .order('start_time'),

    supabase
      .from('blocked_dates')
      .select('*')
      .gte('blocked_date', start)
      .lte('blocked_date', end),

    supabase.from('students').select('id, name, phone').eq('status', 'active').order('name'),
    supabase.from('courses').select('id, name').eq('is_active', true),
    supabase.from('classrooms').select('id, name').eq('is_active', true),
    supabase.from('instructors').select('id, name').eq('status', 'active'),
  ])

  return {
    sessions:    (sessions as ClassSession[]) ?? [],
    blocked:     blocked ?? [],
    students:    students ?? [],
    courses:     courses  ?? [],
    classrooms:  classrooms ?? [],
    instructors: instructors ?? [],
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
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Agenda</h1>
      <WeekCalendar weekStart={weekStart} {...data} />
    </div>
  )
}

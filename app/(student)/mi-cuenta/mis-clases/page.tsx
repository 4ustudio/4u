import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase/server'
import { getMyDashboardData, getMonthSessions } from '../../_actions/student'
import Header from '@/components/layout/Header'
import AutoRefresh from '../_components/AutoRefresh'
import ClassesCalendar from '../_components/ClassesCalendar'

export const dynamic = 'force-dynamic'

export default async function MisClasesPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/mi-cuenta/login')

  const data = await getMyDashboardData(user.id)
  if (!data) redirect('/admin')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { student, schedules } = data as any
  const now = new Date()
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null
  const firstName = student.first_name ?? student.name?.split(' ')[0] ?? 'Estudiante'

  const monthSessions = await getMonthSessions(now.getFullYear(), now.getMonth() + 1)

  return (
    <>
      <AutoRefresh studentId={student.id} />
      <Header />
      <main className="max-w-5xl mx-auto px-4 pt-[80px] pb-12 space-y-6 min-h-screen bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-poppins">Mis Clases</h1>
            <p className="text-sm text-gray-500 font-roboto mt-0.5">Historial y calendario de tus clases.</p>
          </div>
        </div>
        <ClassesCalendar
          initialSessions={monthSessions}
          schedules={schedules ?? []}
          initialYear={now.getFullYear()}
          initialMonth={now.getMonth() + 1}
        />
      </main>
    </>
  )
}

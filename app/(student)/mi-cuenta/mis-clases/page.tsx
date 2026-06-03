import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase/server'
import { getMyDashboardData, getMonthSessions } from '../../_actions/student'
import StudentPortalHeader from '../_components/StudentPortalHeader'
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
      <StudentPortalHeader userEmail={user.email ?? ''} avatarUrl={avatarUrl} firstName={firstName} />
      <main className="max-w-5xl mx-auto px-4 pt-[68px] pb-12 space-y-6 min-h-screen"
        style={{ backgroundColor: '#0a0a0a' }}>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold text-white font-poppins">Mis Clases</h1>
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

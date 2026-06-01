import { createAdminClient } from '@/lib/supabase/admin'
function db(): any { return createAdminClient() }
import { notFound } from 'next/navigation'
import StudentEditForm from './_form'
import ScheduleSection from './_components/ScheduleSection'
import GenerateClassesButton from './_components/GenerateClassesButton'
import InviteStudentButton from './_components/InviteStudentButton'
import StudentSessionsPanel from './_components/StudentSessionsPanel'
import type { Student, MonthlyUsage, StudentSchedule } from '@/types/admin'

export const dynamic = 'force-dynamic'

async function getStudentData(id: string) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  const [{ data: student, error }, usageResult, { data: sessions }, { data: schedules }] = await Promise.all([
    db().from('students').select('*').eq('id', id).single(),
    db().rpc('fn_monthly_usage', {
      p_student_id: id,
      p_year:  now.getFullYear(),
      p_month: now.getMonth() + 1,
    }),
    db()
      .from('class_sessions')
      .select('*, course:courses(name), classroom:classrooms(name), instructor:instructors(name)')
      .eq('student_id', id)
      .order('scheduled_date', { ascending: false })
      .order('start_time',     { ascending: false })
      .limit(30),
    db()
      .from('student_schedules')
      .select('*, course:courses(name), classroom:classrooms(name), instructor:instructors(name)')
      .eq('student_id', id)
      .order('day_of_week')
      .order('start_time'),
  ])

  if (error || !student) return null

  const sessionsList = (sessions ?? []) as any[]
  const upcoming = sessionsList.filter(s => s.scheduled_date >= today).slice(0, 10)
  const past     = sessionsList.filter(s => s.scheduled_date < today).slice(0, 20)

  return {
    student:   student as Student,
    usage:     usageResult.data?.[0] as MonthlyUsage | null,
    upcoming,
    past,
    schedules: (schedules as StudentSchedule[]) ?? [],
  }
}


export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data   = await getStudentData(id)
  if (!data) notFound()

  const { student, usage, upcoming, past, schedules } = data
  const now = new Date()
  const monthLabel = now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  // Datos para los modales de horarios
  const [{ data: courses }, { data: classrooms }, { data: instructors }] = await Promise.all([
    db().from('courses').select('id, name').eq('is_active', true),
    db().from('classrooms').select('id, name').eq('is_active', true),
    db().from('instructors').select('id, name').eq('status', 'active'),
  ])

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{student.name}</h1>
          <p className="text-sm text-white/40 mt-0.5 truncate">
            {student.phone}{student.email && ` · ${student.email}`}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-white/30">
            {student.birth_date && (
              <span>{(() => { const age = Math.floor((new Date().getTime() - new Date(student.birth_date!).getTime()) / 31557600000); return `${age} años`; })()}</span>
            )}
            {student.city && <span>{student.city}</span>}
            {student.profession && <span>{student.profession}</span>}
            {student.music_genre && <span>{student.music_genre}</span>}
          </div>
        </div>
        <a href="/admin/agenda" className="text-xs text-white/40 hover:text-white shrink-0 mt-1">← Volver</a>
      </div>

      {/* Grid principal: en móvil columna única, en desktop 2 columnas */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          <StudentEditForm student={student} />

          <ScheduleSection
            schedules={schedules}
            studentId={id}
            courses={courses ?? []}
            classrooms={classrooms ?? []}
            instructors={instructors ?? []}
          />

          <GenerateClassesButton studentId={id} />

          <StudentSessionsPanel
            studentId={id}
            student={{ id, name: student.name, phone: student.phone }}
            upcoming={upcoming}
            past={past}
            students={[{ id, name: student.name, phone: student.phone }]}
            courses={courses ?? []}
            classrooms={classrooms ?? []}
            instructors={instructors ?? []}
          />
        </div>

        {/* Aside: sticky en desktop */}
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="bg-gray-900 border border-white/10 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">Acceso al portal</h2>
            <InviteStudentButton
              studentId={id}
              email={student.email}
              hasAccount={!!student.user_id}
            />
          </div>

          <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Cuota — {monthLabel}</h2>
            {usage ? (
              <div className="space-y-2.5">
                <QuotaRow label="Total del mes"          value={usage.quota_total} />
                <QuotaRow label="Agendadas / próximas"   value={usage.classes_scheduled} />
                <QuotaRow label="Completadas"            value={usage.classes_completed} />
                <QuotaRow label="Cancelaciones tardías"  value={usage.late_cancellations} color="red" />
                <div className="pt-2 border-t border-white/10">
                  <QuotaRow
                    label="Disponibles"
                    value={usage.classes_available}
                    color={usage.classes_available > 0 ? 'green' : 'red'}
                    bold
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-white/40">Sin actividad este mes.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function QuotaRow({ label, value, color, bold }: { label: string; value: number; color?: 'red' | 'green'; bold?: boolean }) {
  const textColor = color === 'red' ? 'text-red-400' : color === 'green' ? 'text-green-400' : 'text-white'
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/50">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold' : ''} ${textColor}`}>{value}</span>
    </div>
  )
}

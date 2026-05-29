import { createAdminClient } from '@/lib/supabase/admin'
function db(): any { return createAdminClient() }
import { notFound } from 'next/navigation'
import StudentEditForm from './_form'
import ScheduleSection from './_components/ScheduleSection'
import GenerateClassesButton from './_components/GenerateClassesButton'
import InviteStudentButton from './_components/InviteStudentButton'
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

const STATUS_COLOR: Record<string, string> = {
  pending:     'bg-yellow-900/40 text-yellow-400',
  confirmed:   'bg-green-900/40 text-green-400',
  completed:   'bg-blue-900/40 text-blue-400',
  cancelled:   'bg-red-900/40 text-red-400',
  rescheduled: 'bg-purple-900/40 text-purple-400',
  no_show:     'bg-gray-800 text-gray-400',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada',
  cancelled: 'Cancelada', rescheduled: 'Reagendada', no_show: 'No asistió',
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
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{student.name}</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {student.phone} {student.email && `· ${student.email}`}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-white/40">
            {student.birth_date && (
              <span>{(() => { const age = Math.floor((new Date().getTime() - new Date(student.birth_date!).getTime()) / 31557600000); return `${age} años`; })()}</span>
            )}
            {student.city && <span>{student.city}</span>}
            {student.profession && <span>{student.profession}</span>}
            {student.music_genre && <span>{student.music_genre}</span>}
            {student.document_number && <span>{student.document_type ?? 'Doc'}: {student.document_number}</span>}
          </div>
        </div>
        <a href="/admin/students" className="text-xs text-white/40 hover:text-white">← Volver</a>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-5">
          <StudentEditForm student={student} />

          <ScheduleSection
            schedules={schedules}
            studentId={id}
            courses={courses ?? []}
            classrooms={classrooms ?? []}
            instructors={instructors ?? []}
          />

          <GenerateClassesButton studentId={id} />

          {upcoming.length > 0 && (
            <section className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <h2 className="text-sm font-semibold text-white">Próximas clases</h2>
              </div>
              <div className="divide-y divide-white/5">
                {upcoming.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white">
                        {new Date(s.scheduled_date).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })} · {s.start_time.slice(0, 5)}
                      </p>
                      <p className="text-xs text-white/40">{s.course?.name} · {s.classroom?.name}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[s.status] ?? 'bg-gray-800 text-gray-400'}`}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white">
                {past.length > 0 ? 'Últimas clases' : 'Historial de clases'}
              </h2>
            </div>
            {past.length === 0 && upcoming.length === 0 ? (
              <p className="px-5 py-8 text-center text-white/35 text-sm">Sin historial de clases.</p>
            ) : past.length === 0 ? (
              <p className="px-5 py-8 text-center text-white/35 text-sm">Sin clases anteriores.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {past.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white">
                        {new Date(s.scheduled_date).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })} · {s.start_time.slice(0, 5)}
                      </p>
                      <p className="text-xs text-white/40">{s.course?.name} · {s.classroom?.name}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[s.status] ?? 'bg-gray-800 text-gray-400'}`}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          {/* Portal de acceso */}
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

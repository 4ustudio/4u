import { createAdminClient } from '@/lib/supabase/admin'
function db(): any { return createAdminClient() }
import { notFound } from 'next/navigation'
import StudentEditForm from './_form'
import ScheduleSection from './_components/ScheduleSection'
import GenerateClassesButton from './_components/GenerateClassesButton'
import DeleteStudentButton from './_components/DeleteStudentButton'
import StudentSessionsPanel from './_components/StudentSessionsPanel'
import PasswordSection from './_components/PasswordSection'
import BirthdayBenefitPanel from './_components/BirthdayBenefitPanel'
import StudentPaymentsPanel from './_components/StudentPaymentsPanel'
import type { Student, MonthlyUsage, StudentSchedule } from '@/types/admin'
import { getStudentRetentionProfile } from '../../_actions/retention'
import { getStudentPayments } from '@/app/admin/pagos/_actions'

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

  const { data: leadConsent } = student.lead_id
    ? await db()
        .from('enrollments')
        .select('terms_accepted, terms_accepted_at, terms_version, data_consent, image_consent')
        .eq('id', student.lead_id)
        .maybeSingle()
    : { data: null }

  const sessionsList = (sessions ?? []) as any[]
  const upcoming = sessionsList.filter(s => s.scheduled_date >= today).slice(0, 10)
  const past     = sessionsList.filter(s => s.scheduled_date < today).slice(0, 20)

  return {
    student:     student as Student,
    usage:       usageResult.data?.[0] as MonthlyUsage | null,
    upcoming,
    past,
    schedules:   (schedules as StudentSchedule[]) ?? [],
    leadConsent: leadConsent as {
      terms_accepted:    boolean | null
      terms_accepted_at: string | null
      terms_version:     string | null
      data_consent:      boolean | null
      image_consent:     boolean | null
    } | null,
  }
}


export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data   = await getStudentData(id)
  if (!data) notFound()

  const { student, usage, upcoming, past, schedules, leadConsent } = data
  const [retention, studentPayments] = await Promise.all([
    getStudentRetentionProfile(id),
    getStudentPayments(id),
  ])
  const now = new Date()
  const monthLabel = now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  // Datos para los modales de horarios
  const [{ data: courses }, { data: classrooms }, { data: instructors }] = await Promise.all([
    db().from('courses').select('id, name').eq('is_active', true),
    db().from('classrooms').select('id, name, classroom_courses(course_id)').eq('is_active', true),
    db().from('instructors').select('id, name').eq('status', 'active'),
  ])

  return (
    <div className="space-y-5 w-full page-animate">
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

          <PasswordSection studentId={id} hasAccount={!!student.user_id} email={student.email} />

          <BirthdayBenefitPanel student={student} />

          <StudentPaymentsPanel
            studentId={id}
            studentName={student.name}
            payments={studentPayments}
            studentAsOption={{
              id:                        student.id,
              name:                      student.name,
              phone:                     student.phone,
              plan_name:                 student.plan_name ?? null,
              birth_date:                student.birth_date,
              birthday_benefit_used:     student.birthday_benefit_used ?? null,
              birthday_benefit_year:     student.birthday_benefit_year ?? null,
              birthday_discount_percent: student.birthday_discount_percent ?? null,
              student_status:            student.student_status ?? null,
            }}
          />

          <section className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Perfil histórico</h2>
                <p className="mt-1 text-xs text-white/35">Retención, instrumentos y actividad permanente del alumno.</p>
              </div>
              <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-300">
                {student.retention_score ?? 100}/100
              </span>
            </div>

            {retention.migrationMissing ? (
              <p className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-100">
                Aplica supabase-retention-v1.sql para activar historial CRM.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <HistoryKpi label="Alumno desde" value={formatShortDate(student.student_since ?? student.enrolled_at)} />
                  <HistoryKpi label="Última actividad" value={formatShortDate(student.last_activity_at)} />
                  <HistoryKpi label="Estado" value={student.student_status ?? 'activo'} />
                  <HistoryKpi label="Instrumentos" value={retention.instruments.length} />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/35">Instrumentos estudiados</p>
                    <div className="mt-3 space-y-2">
                      {retention.instruments.length === 0 ? (
                        <p className="text-xs text-white/35">Sin clases registradas todavía.</p>
                      ) : retention.instruments.map((item: any) => (
                        <div key={item.course_id} className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-semibold text-white">{item.course_name}</span>
                          <span className="text-white/40">
                            {item.completed_classes} completadas · {item.cancelled_classes} canceladas · {item.no_show_classes} no show
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/35">Eventos recientes</p>
                    <div className="mt-3 space-y-2">
                      {retention.events.length === 0 ? (
                        <p className="text-xs text-white/35">Sin eventos de retención.</p>
                      ) : retention.events.slice(0, 5).map((event: any) => (
                        <div key={event.id} className="text-xs">
                          <p className="font-semibold text-white">{event.description ?? event.event_type}</p>
                          <p className="text-white/35">{formatShortDate(event.occurred_at)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-white/35">Observaciones administrativas</p>
                  <div className="mt-3 space-y-3">
                    {retention.notes.length === 0 ? (
                      <p className="text-xs text-white/35">Sin observaciones históricas.</p>
                    ) : retention.notes.slice(0, 4).map((note: any) => (
                      <div key={note.id} className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                        <p className="text-xs text-white/75">{note.note}</p>
                        <p className="mt-1 text-[11px] text-white/30">{formatShortDate(note.created_at)}{note.outcome ? ` · ${note.outcome}` : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>

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
          <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">Acciones</h2>
            <DeleteStudentButton studentId={id} studentName={student.name} />
          </div>

          <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5">
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
          {/* Documentación */}
          <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">Documentación</h2>
            {leadConsent ? (
              <div className="space-y-2.5">
                <ConsentRow
                  label="Términos y condiciones"
                  accepted={leadConsent.terms_accepted}
                  date={leadConsent.terms_accepted_at}
                  version={leadConsent.terms_version}
                />
                <ConsentRow
                  label="Datos personales (Ley 1581)"
                  accepted={leadConsent.data_consent}
                  date={leadConsent.terms_accepted_at}
                />
                <ConsentRow
                  label="Uso de imagen"
                  accepted={leadConsent.image_consent}
                  date={leadConsent.terms_accepted_at}
                  optional
                />
              </div>
            ) : (
              <p className="text-xs text-white/30">Sin registro de aceptación (inscripción anterior a v2.0).</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function formatShortDate(value?: string | null) {
  if (!value) return 'Sin registro'
  return new Date(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function HistoryKpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-sm font-black capitalize text-white">{value}</p>
      <p className="mt-1 text-[11px] text-white/35">{label}</p>
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

function ConsentRow({
  label, accepted, date, version, optional,
}: {
  label: string
  accepted: boolean | null
  date?: string | null
  version?: string | null
  optional?: boolean
}) {
  const ok = accepted === true
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className={`text-xs font-medium leading-tight ${ok ? 'text-white/80' : optional ? 'text-white/30' : 'text-red-400/80'}`}>
          {ok ? '✓' : '○'} {label}
          {optional && !ok && <span className="text-white/25 ml-1">(opcional)</span>}
        </p>
        {ok && date && (
          <p className="text-[11px] text-white/30 mt-0.5">
            {new Date(date).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {version && ` · v${version}`}
          </p>
        )}
      </div>
    </div>
  )
}

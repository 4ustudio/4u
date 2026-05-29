import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase/server'
import { getMyDashboardData } from '../_actions/student'
import StudentNav from '../_components/StudentNav'
import BookingCalendar from '@/components/sections/BookingCalendar'
import { studentBookAction } from '../_actions/student'
import type { MonthlyUsage } from '@/types/admin'

export const dynamic = 'force-dynamic'

const DAY_NAME: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado',
}

const STATUS_COLOR: Record<string, string> = {
  pending:     'bg-yellow-900/40 text-yellow-400 border-yellow-500/20',
  confirmed:   'bg-green-900/40 text-green-400 border-green-500/20',
  completed:   'bg-blue-900/40 text-blue-400 border-blue-500/20',
  cancelled:   'bg-red-900/40 text-red-400 border-red-500/20',
  rescheduled: 'bg-purple-900/40 text-purple-400 border-purple-500/20',
  no_show:     'bg-gray-800 text-gray-400 border-gray-700',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada',
  cancelled: 'Cancelada', rescheduled: 'Reagendada', no_show: 'No asistió',
}

export default async function MiCuentaPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/mi-cuenta/login')

  // Pasamos el user.id directamente para evitar una segunda llamada a getUser()
  // que puede fallar en contexto de Server Component con cookies de solo lectura
  const data = await getMyDashboardData(user.id)

  // Si el usuario está autenticado pero no tiene perfil de estudiante,
  // mostrar mensaje en lugar de redirigir (causaría loop con el middleware)
  if (!data) {
    return (
      <>
        <StudentNav userEmail={user.email ?? ''} />
        <main className="max-w-5xl mx-auto px-4 pt-[74px] pb-16 flex flex-col items-center text-center gap-4">
          <div className="h-14 w-14 rounded-full border border-white/10 flex items-center justify-center">
            <svg className="h-6 w-6 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="text-white font-poppins font-bold text-lg">Perfil no encontrado</h2>
          <p className="text-white/40 font-roboto text-sm max-w-sm">
            Tu cuenta existe pero no está vinculada a un perfil de estudiante.
            Comunícate con 4U Studio Academy para que activen tu acceso.
          </p>
          <p className="text-white/25 font-roboto text-xs">{user.email}</p>
        </main>
      </>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { student, usage, upcoming, past, schedules } = data as any
  const now = new Date()
  const monthLabel = now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  const usageTyped = usage as MonthlyUsage | null

  return (
    <>
      <StudentNav userEmail={user.email ?? ''} />

      <main className="max-w-5xl mx-auto px-4 pt-[74px] pb-8 space-y-8">

        {/* ── Saludo ─────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-white font-poppins">
            Hola, {student.first_name ?? student.name} 👋
          </h1>
          <p className="text-sm text-white/40 mt-1 font-roboto">
            {student.email} · {student.student_type === 'new' ? 'Estudiante nuevo' : 'Estudiante regular'}
          </p>
        </div>

        {/* ── Cuota del mes ────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 font-roboto">
            Cuota — {monthLabel}
          </h2>
          {usageTyped ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <QuotaCard label="Disponibles" value={usageTyped.classes_available}
                color={usageTyped.classes_available > 0 ? 'orange' : 'red'} large />
              <QuotaCard label="Total del mes"     value={usageTyped.quota_total} />
              <QuotaCard label="Agendadas"          value={usageTyped.classes_scheduled} />
              <QuotaCard label="Completadas"        value={usageTyped.classes_completed} />
              <QuotaCard label="Cancelac. tardías"  value={usageTyped.late_cancellations}
                color={usageTyped.late_cancellations > 0 ? 'red' : undefined} />
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/40 font-roboto">
              Sin actividad registrada este mes.
            </div>
          )}
        </section>

        {/* ── Horarios fijos ────────────────────────────────────────── */}
        {schedules?.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 font-roboto">
              Horarios fijos
            </h2>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden divide-y divide-white/5">
              {schedules.map((s: any) => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-poppins">
                      {DAY_NAME[s.day_of_week] ?? `Día ${s.day_of_week}`} · {s.start_time?.slice(0, 5)}
                      {s.frequency === 'biweekly' && <span className="text-white/30 text-xs ml-1">(quincenal)</span>}
                    </p>
                    <p className="text-xs text-white/40 font-roboto mt-0.5">
                      {s.course?.name ?? '—'} · {s.classroom?.name ?? '—'}
                      {s.instructor?.name ? ` · ${s.instructor.name}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full shrink-0 border font-roboto font-semibold bg-green-900/40 text-green-400 border-green-500/20">
                    Activo
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Próximas clases ───────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 font-roboto">
            Próximas clases
          </h2>
          {upcoming.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/40 font-roboto text-center">
              No tienes clases agendadas próximamente.
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden divide-y divide-white/5">
              {upcoming.map((s: any) => (
                <SessionRow key={s.id} session={s} />
              ))}
            </div>
          )}
        </section>

        {/* ── Historial ────────────────────────────────────────────── */}
        {past.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 font-roboto">
              Historial de clases
            </h2>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden divide-y divide-white/5">
              {past.map((s: any) => (
                <SessionRow key={s.id} session={s} />
              ))}
            </div>
          </section>
        )}

        {/* ── Agendar nueva clase ───────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 font-roboto">
            Agendar nueva clase
          </h2>
          {usageTyped && usageTyped.classes_available > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
              <BookingCalendar serverAction={studentBookAction} mode="student" />
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/40 font-roboto text-center">
              No tienes clases disponibles este mes. Comunícate con 4U Studio para más información.
            </div>
          )}
        </section>

      </main>
    </>
  )
}

// ── Subcomponentes ────────────────────────────────────────────────────

function QuotaCard({
  label, value, color, large,
}: {
  label: string
  value: number
  color?: 'orange' | 'red'
  large?: boolean
}) {
  const textColor =
    color === 'orange' ? 'text-[#ff7a00]' :
    color === 'red'    ? 'text-red-400'   :
    'text-white'

  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-1 ${large ? 'col-span-2 sm:col-span-1' : ''}`}>
      <span className="text-[10px] uppercase tracking-wider text-white/40 font-roboto">{label}</span>
      <span className={`text-2xl font-bold font-poppins ${textColor}`}>{value}</span>
    </div>
  )
}

function SessionRow({ session: s }: { session: any }) {
  const color = STATUS_COLOR[s.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'
  const label = STATUS_LABEL[s.status] ?? s.status

  const dateStr = new Date(s.scheduled_date + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white font-poppins">
          {dateStr} · {s.start_time?.slice(0, 5)}
        </p>
        <p className="text-xs text-white/40 font-roboto mt-0.5">
          {s.course?.name ?? '—'} · {s.classroom?.name ?? '—'} · {s.instructor?.name ?? 'Sin instructor'}
        </p>
      </div>
      <span className={`text-[10px] px-2.5 py-1 rounded-full shrink-0 border font-roboto font-semibold ${color}`}>
        {label}
      </span>
    </div>
  )
}

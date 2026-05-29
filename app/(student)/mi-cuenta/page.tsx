import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase/server'
import { getMyDashboardData } from '../_actions/student'
import StudentNav from '../_components/StudentNav'
import BookingCalendar from '@/components/sections/BookingCalendar'
import { studentBookAction } from '../_actions/student'
import type { MonthlyUsage } from '@/types/admin'

export const dynamic = 'force-dynamic'

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
  // Auth check
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/mi-cuenta/login')

  const data = await getMyDashboardData()
  if (!data) redirect('/mi-cuenta/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { student, usage, upcoming, past } = data as any
  const now = new Date()
  const monthLabel = now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  const usageTyped = usage as MonthlyUsage | null

  return (
    <>
      <StudentNav userEmail={user.email ?? ''} />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Saludo ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white font-poppins">
              Hola, {student.first_name ?? student.name} 👋
            </h1>
            <p className="text-sm text-white/40 mt-1 font-roboto">
              {student.email} · {student.student_type === 'new' ? 'Estudiante nuevo' : 'Estudiante regular'}
            </p>
          </div>
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
        {usageTyped && usageTyped.classes_available > 0 ? (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 font-roboto">
              Agendar nueva clase
            </h2>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
              <BookingCalendar serverAction={studentBookAction} mode="student" />
            </div>
          </section>
        ) : usageTyped && usageTyped.classes_available <= 0 ? (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 font-roboto">
              Agendar nueva clase
            </h2>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/40 font-roboto text-center">
              No tienes clases disponibles este mes. Comunícate con 4U Studio para más información.
            </div>
          </section>
        ) : null}

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

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMyDashboardData } from '../_actions/student'
import StudentNav from '../_components/StudentNav'
import BookingCalendar from '@/components/sections/BookingCalendar'
import { studentBookAction } from '../_actions/student'
import AutoRefresh from './_components/AutoRefresh'
import ProfileModal from './_components/ProfileModal'
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

  const adminClient = createAdminClient()
  const [data, { data: instructorsRaw }] = await Promise.all([
    getMyDashboardData(user.id),
    adminClient.from('instructors').select('id, name').eq('status', 'active').order('name'),
  ])
  const instructors = (instructorsRaw ?? []) as { id: string; name: string }[]

  if (!data) {
    redirect('/admin')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { student, usage, upcoming, past, schedules } = data as any
  const now = new Date()
  const monthLabel = now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  const usageTyped = usage as MonthlyUsage | null
  const avatarUrl  = (user.user_metadata?.avatar_url as string | undefined) ?? null

  // Derived info for hero cards
  const firstName    = student.first_name ?? student.name?.split(' ')[0] ?? 'Estudiante'
  const fullName     = [student.first_name, student.last_name].filter(Boolean).join(' ') || student.name
  const initials     = (firstName[0] ?? 'E').toUpperCase()

  // Next upcoming class
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextClass    = upcoming[0] as any | undefined

  // Primary instructor from schedules or upcoming
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instructorName: string | null =
    schedules?.[0]?.instructor?.name ??
    nextClass?.instructor?.name ??
    null

  // Plan label from student_type
  const planLabel =
    student.student_type === 'new'    ? 'Estudiante nuevo'
    : student.student_type === 'kids' ? 'Plan Kids'
    : student.student_type === 'teen' ? 'Plan Teens'
    : 'Estudiante regular'

  return (
    <>
      <AutoRefresh studentId={student.id} />
      <StudentNav userEmail={user.email ?? ''} avatarUrl={avatarUrl} firstName={firstName} />

      <main className="max-w-5xl mx-auto px-4 pt-[82px] pb-12 space-y-8 page-animate">

        {/* ── HERO HEADER ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8">
          {/* Glow naranja de fondo */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #ff7a00 0%, transparent 70%)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full opacity-10 blur-2xl"
            style={{ background: 'radial-gradient(circle, #ff7a00 0%, transparent 70%)' }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar grande */}
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover border-2 border-[#ff7a00]/60 shadow-lg"
                  style={{ boxShadow: '0 0 24px rgba(255,122,0,0.25)' }}
                />
              ) : (
                <div
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold text-white border-2 border-[#ff7a00]/60 shadow-lg shrink-0"
                  style={{ backgroundColor: '#ff7a00', boxShadow: '0 0 24px rgba(255,122,0,0.25)' }}
                >
                  {initials}
                </div>
              )}
              {/* Badge activo */}
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-zinc-950 shadow" title="Activo" />
            </div>

            {/* Info principal */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-widest text-[#ff7a00]/80 font-roboto font-semibold mb-1">
                Portal del Estudiante
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-poppins leading-tight truncate">
                {fullName}
              </h1>
              <p className="text-sm text-white/40 font-roboto mt-1 truncate">{student.email}</p>

              {/* Info chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                <InfoChip
                  icon={
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 12h.01M15 12h.01M9 16h.01M15 16h.01M12 8h.01"/><rect x="3" y="4" width="18" height="18" rx="2"/>
                      <path d="M16 2v4M8 2v4"/>
                    </svg>
                  }
                  label={planLabel}
                />
                {instructorName && (
                  <InfoChip
                    icon={
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
                      </svg>
                    }
                    label={instructorName}
                    accent
                  />
                )}
                {nextClass && (
                  <InfoChip
                    icon={
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
                      </svg>
                    }
                    label={`Próx. clase: ${formatDate(nextClass.scheduled_date)} · ${nextClass.start_time?.slice(0,5)}`}
                  />
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex sm:flex-col gap-2 shrink-0">
              <ProfileModal
                firstName={student.first_name ?? student.name ?? ''}
                lastName={student.last_name ?? ''}
                email={user.email ?? ''}
                avatarUrl={avatarUrl}
                userId={user.id}
              />
              <Link
                href="/agendar"
                className="flex items-center gap-2 text-xs font-semibold text-white font-poppins rounded-xl px-4 py-2.5 transition-all hover:brightness-110 active:scale-95"
                style={{ backgroundColor: '#ff7a00' }}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                Agendar clase
              </Link>
            </div>
          </div>
        </section>

        {/* ── CUOTA DEL MES ──────────────────────────────────────────── */}
        <section>
          <SectionLabel>{`Cuota — ${monthLabel}`}</SectionLabel>
          {usageTyped ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <QuotaCard label="Disponibles" value={usageTyped.classes_available}
                color={usageTyped.classes_available > 0 ? 'orange' : 'red'} large />
              <QuotaCard label="Total del mes"    value={usageTyped.quota_total} />
              <QuotaCard label="Agendadas"         value={usageTyped.classes_scheduled} />
              <QuotaCard label="Completadas"       value={usageTyped.classes_completed} />
              <QuotaCard label="Cancelac. tardías" value={usageTyped.late_cancellations}
                color={usageTyped.late_cancellations > 0 ? 'red' : undefined} />
            </div>
          ) : (
            <EmptyState>Sin actividad registrada este mes.</EmptyState>
          )}
        </section>

        {/* ── HORARIOS FIJOS ─────────────────────────────────────────── */}
        {schedules?.length > 0 && (
          <section>
            <SectionLabel>Horarios fijos</SectionLabel>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden divide-y divide-white/[0.06]">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {schedules.map((s: any) => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,122,0,0.12)' }}>
                    <svg className="h-4 w-4 text-[#ff7a00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-poppins font-medium">
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

        {/* ── CLASES DEL MES ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>{`Clases de ${monthLabel}`}</SectionLabel>
            <Link
              href="/mi-cuenta/clases-mes"
              className="no-print inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/50 hover:text-[#ff7a00] transition-colors font-roboto"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>
              </svg>
              Ver reporte PDF
            </Link>
          </div>
          {(() => {
            const now = new Date()
            const ms = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const monthSessions = [...upcoming, ...past].filter((s: any) => s.scheduled_date?.startsWith(ms))
              .sort((a: any, b: any) => a.scheduled_date.localeCompare(b.scheduled_date) || a.start_time.localeCompare(b.start_time))
            return monthSessions.length === 0 ? (
              <EmptyState>No hay clases registradas para este mes.</EmptyState>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden divide-y divide-white/[0.06]">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {monthSessions.map((s: any) => <SessionRow key={s.id} session={s} />)}
              </div>
            )
          })()}
        </section>

        {/* ── PRÓXIMAS CLASES ────────────────────────────────────────── */}
        <section>
          <SectionLabel>Próximas clases</SectionLabel>
          {upcoming.length === 0 ? (
            <EmptyState>No tienes clases agendadas próximamente.</EmptyState>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden divide-y divide-white/[0.06]">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {upcoming.map((s: any) => (
                <SessionRow key={s.id} session={s} />
              ))}
            </div>
          )}
        </section>

        {/* ── HISTORIAL ──────────────────────────────────────────────── */}
        {past.length > 0 && (
          <section>
            <SectionLabel>Historial de clases</SectionLabel>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden divide-y divide-white/[0.06]">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {past.map((s: any) => (
                <SessionRow key={s.id} session={s} />
              ))}
            </div>
          </section>
        )}

        {/* ── AGENDAR NUEVA CLASE ────────────────────────────────────── */}
        <section id="agendar">
          <SectionLabel>Agendar nueva clase</SectionLabel>
          {usageTyped && usageTyped.classes_available > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
              <BookingCalendar
                serverAction={studentBookAction}
                mode="student"
                isLoggedIn={true}
                instructors={instructors}
              />
            </div>
          ) : (
            <EmptyState>
              No tienes clases disponibles este mes. Comunícate con 4U Studio para más información.
            </EmptyState>
          )}
        </section>

      </main>
    </>
  )
}

// ── Utilidades ────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

// ── Subcomponentes ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-widest text-white/35 mb-3 font-roboto">
      {children}
    </h2>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/35 font-roboto text-center">
      {children}
    </div>
  )
}

function InfoChip({ icon, label, accent }: { icon: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-roboto px-2.5 py-1 rounded-full border ${
      accent
        ? 'border-[#ff7a00]/30 text-[#ff7a00] bg-[#ff7a00]/10'
        : 'border-white/10 text-white/50 bg-white/[0.04]'
    }`}>
      {icon}
      {label}
    </span>
  )
}

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

  const glowStyle = color === 'orange'
    ? { boxShadow: 'inset 0 0 0 1px rgba(255,122,0,0.15), 0 0 20px rgba(255,122,0,0.06)' }
    : {}

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-1 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05] ${large ? 'col-span-2 sm:col-span-1' : ''}`}
      style={glowStyle}
    >
      <span className="text-[10px] uppercase tracking-wider text-white/35 font-roboto">{label}</span>
      <span className={`text-2xl font-bold font-poppins ${textColor}`}>{value}</span>
    </div>
  )
}

function SessionRow({ session: s }: { session: any }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const color = STATUS_COLOR[s.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'
  const label = STATUS_LABEL[s.status] ?? s.status

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors">
      <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-white/[0.04] border border-white/[0.06]">
        <svg className="h-4 w-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white font-poppins font-medium">
          {formatDate(s.scheduled_date)} · {s.start_time?.slice(0, 5)}
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

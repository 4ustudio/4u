import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase/server'
import { getMyDashboardData, getMonthSessions } from '../_actions/student'
import StudentNav from '../_components/StudentNav'
import AutoRefresh from './_components/AutoRefresh'
import ProfileModal from './_components/ProfileModal'
import ClassesCalendar from './_components/ClassesCalendar'
import HistoryDrawer from './_components/HistoryDrawer'
import type { MonthlyUsage } from '@/types/admin'

export const dynamic = 'force-dynamic'

export default async function MiCuentaPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/mi-cuenta/login')

  const data = await getMyDashboardData(user.id)

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

  // Sesiones completas del mes actual para el calendario
  const currentYear  = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const monthSessions = await getMonthSessions(currentYear, currentMonth)

  // Primary instructor from schedules or upcoming
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instructorName: string | null =
    schedules?.[0]?.instructor?.name ??
    nextClass?.instructor?.name ??
    null

  // Plan label from student_type
  const planLabel =
    student.student_type === 'new'    ? 'Estudiante nuevo'
    : student.student_type === 'kids' ? '🎮 Plan Kids'
    : student.student_type === 'teen' ? '🚀 Plan Teens'
    : '🎵 Estudiante regular'

  // Progreso mensual
  const classesAvailable = usageTyped?.classes_available ?? 0
  const classesCompleted = usageTyped?.classes_completed ?? 0
  const classesScheduled = usageTyped?.classes_scheduled ?? 0
  const lateCancellations = usageTyped?.late_cancellations ?? 0
  const progressPct = classesAvailable > 0 ? Math.round((classesCompleted / classesAvailable) * 100) : 0

  // Stats color palette
  const CARD_META = [
    { label: 'Disponibles',      value: classesAvailable,   color: '#ff7a00', border: 'border-l-[#ff7a00]' },
    { label: 'Agendadas',        value: classesScheduled,   color: '#3b82f6', border: 'border-l-blue-500'   },
    { label: 'Completadas',      value: classesCompleted,   color: '#16a34a', border: 'border-l-green-500'  },
    { label: 'Para reprogramar', value: lateCancellations,  color: '#dc2626', border: 'border-l-red-500'    },
  ]

  return (
    <>
      <AutoRefresh studentId={student.id} />
      <StudentNav userEmail={user.email ?? ''} avatarUrl={avatarUrl} firstName={firstName} />

      <main className="max-w-5xl mx-auto px-4 pt-[82px] pb-12 space-y-8 page-animate bg-stone-50 text-gray-800 min-h-screen">

        {/* ── HERO HEADER (oscuro — identidad 4U) ────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8">
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
                <InfoChip icon={<span className="text-[11px]">{planLabel.split(' ')[0]}</span>} label={planLabel.replace(/^[^\s]+\s/, '') || planLabel} />
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
                    label={`Próx.: ${formatDate(nextClass.scheduled_date)} · ${nextClass.start_time?.slice(0, 5)}`}
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

        {/* ── BARRA DE PROGRESO MENSUAL ──────────────────────────────── */}
        {usageTyped && classesAvailable > 0 && (
          <section>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                <div>
                  <span className="text-sm font-bold text-gray-900 font-poppins">
                    {classesCompleted} de {classesAvailable} clases realizadas
                  </span>
                  <span className="ml-2 text-xs text-gray-400 font-roboto">
                    · {monthLabel}
                  </span>
                </div>
                <span className="text-xl font-bold font-poppins" style={{ color: progressPct >= 80 ? '#16a34a' : progressPct >= 50 ? '#ff7a00' : '#dc2626' }}>
                  {progressPct}%
                </span>
              </div>
              {/* Barra de progreso */}
              <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progressPct}%`,
                    background: progressPct >= 80
                      ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                      : progressPct >= 50
                        ? 'linear-gradient(90deg, #ff7a00, #fbbf24)'
                        : 'linear-gradient(90deg, #dc2626, #f87171)',
                  }}
                />
              </div>
            </div>
          </section>
        )}

        {/* ── TARJETAS DE ESTADO (coloreadas) ────────────────────────── */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CARD_META.map(m => (
              <div
                key={m.label}
                className={`rounded-2xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col gap-1 border-l-4 ${m.border} transition-all duration-200 hover:shadow-md`}
              >
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-roboto">{m.label}</span>
                <span className="text-2xl font-bold font-poppins" style={{ color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400 font-roboto leading-relaxed">
            Las clases no asistidas y no canceladas con mínimo 24 horas de anticipación se
            consideran utilizadas. Si existe autorización de reposición aparecerán aquí para reprogramar.
          </p>
        </section>

        {/* ── CALENDARIO (elemento principal) ────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>{`${monthLabel}`}</SectionLabel>
            <Link
              href="/mi-cuenta/clases-mes"
              className="no-print inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-[#ff7a00] transition-colors font-roboto"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>
              </svg>
              Ver reporte PDF
            </Link>
          </div>
          <ClassesCalendar
            initialSessions={monthSessions}
            schedules={schedules ?? []}
            initialYear={currentYear}
            initialMonth={currentMonth}
          />
        </section>

        {/* ── HISTORIAL (drawer) ─────────────────────────────────────── */}
        {past.length > 0 && (
          <section>
            <HistoryDrawer past={past} />
          </section>
        )}

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
    <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3 font-roboto">
      {children}
    </h2>
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

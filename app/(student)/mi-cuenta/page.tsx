import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase/server'
import { getMyDashboardData } from '../_actions/student'
import StudentPortalHeader from './_components/StudentPortalHeader'
import AutoRefresh from './_components/AutoRefresh'
import ProfileModal from './_components/ProfileModal'
import HistoryDrawer from './_components/HistoryDrawer'
import { InstrumentIcon } from './_components/instruments'
import { statusMeta } from './_components/statusMeta'
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
  const { student, usage, upcoming, past } = data as any
  const now = new Date()
  const monthLabel = now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  const usageTyped = usage as MonthlyUsage | null
  const avatarUrl  = (user.user_metadata?.avatar_url as string | undefined) ?? null

  const firstName    = student.first_name ?? student.name?.split(' ')[0] ?? 'Estudiante'
  const fullName     = [student.first_name, student.last_name].filter(Boolean).join(' ') || student.name
  const initials     = (firstName[0] ?? 'E').toUpperCase()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextClass    = upcoming[0] as any | undefined

  // ─── Progreso mensual ─────────────────────────────────────────────
  const classesAvailable   = usageTyped?.classes_available ?? 0
  const classesCompleted   = usageTyped?.classes_completed ?? 0
  const classesScheduled   = usageTyped?.classes_scheduled ?? 0
  const lateCancellations  = usageTyped?.late_cancellations ?? 0
  const planTotal = usageTyped?.quota_total ?? classesAvailable
  const rawPct = planTotal > 0 ? (classesCompleted / planTotal) * 100 : 0

  // ─── Tarjetas de estado ───────────────────────────────────────────
  const CARD_META = [
    {
      label: 'Disponibles',
      value: classesAvailable,
      color: '#ff7a00',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          <path d="m9 16 2 2 4-4"/>
        </svg>
      ),
    },
    {
      label: 'Agendadas',
      value: classesScheduled,
      color: '#3b82f6',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
        </svg>
      ),
    },
    {
      label: 'Completadas',
      value: classesCompleted,
      color: '#16a34a',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      ),
    },
    {
      label: 'Para reprogramar',
      value: lateCancellations,
      color: '#dc2626',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 12a9 9 0 1 1-9-9"/><path d="M12 6v6l4 2"/>
          <circle cx="12" cy="12" r="9" opacity="0.2"/>
        </svg>
      ),
    },
  ]

  return (
    <>
      <AutoRefresh studentId={student.id} />
      <StudentPortalHeader userEmail={user.email ?? ''} avatarUrl={avatarUrl} firstName={firstName} />

      <main className="max-w-5xl mx-auto px-4 pt-[68px] pb-12 space-y-6 min-h-screen"
        style={{ backgroundColor: '#0a0a0a' }}>

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 sm:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #ff7a00 0%, transparent 70%)' }}
          />
          <div className="relative z-10 flex items-center gap-4">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 border-[#ff7a00]/60"
                  style={{ boxShadow: '0 0 20px rgba(255,122,0,0.2)' }}
                />
              ) : (
                <div
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-white border-2 border-[#ff7a00]/60"
                  style={{ backgroundColor: '#ff7a00', boxShadow: '0 0 20px rgba(255,122,0,0.2)' }}
                >
                  {initials}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white font-poppins leading-tight truncate">
                {fullName}
              </h1>
              <p className="text-xs text-white/40 font-roboto mt-0.5 truncate">{student.email}</p>
            </div>
            <div className="flex gap-2 shrink-0">
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
                Agendar
              </Link>
            </div>
          </div>
        </section>

        {/* ── RESUMEN MENSUAL ───────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CARD_META.map(m => (
              <div
                key={m.label}
                className="relative rounded-2xl border border-white/5 bg-[#181818] p-4 flex flex-col gap-2 overflow-hidden"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-6 -right-6 h-16 w-16 rounded-full opacity-[0.04] blur-xl"
                  style={{ background: m.color }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-white/35 font-roboto">{m.label}</span>
                  <span className="shrink-0" style={{ color: m.color }}>{m.icon}</span>
                </div>
                <span className="text-2xl sm:text-3xl font-bold font-poppins tracking-tight" style={{ color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRÓXIMA CLASE ─────────────────────────────────────────── */}
        {nextClass ? (
          <section>
            <div className="bg-[#181818] rounded-2xl border border-[#ff7a00]/15 p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="h-px flex-1 bg-gradient-to-r from-[#ff7a00]/40 to-transparent" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#ff7a00] font-roboto shrink-0">
                  Próxima clase
                </span>
                <span className="h-px flex-1 bg-gradient-to-l from-[#ff7a00]/40 to-transparent" />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,122,0,0.12)' }}
                >
                  <span className="text-[#ff7a00]">
                    <InstrumentIcon courseName={nextClass.course?.name} className="h-7 w-7" />
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-white font-poppins">
                      {nextClass.course?.name ?? 'Clase'}
                    </h2>
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusMeta(nextClass.status).badgeClass}`}>
                      {statusMeta(nextClass.status).label}
                    </span>
                  </div>
                  <p className="text-sm text-white/50 font-roboto mt-1">
                    {formatDateLong(nextClass.scheduled_date)} · {nextClass.start_time?.slice(0, 5)}
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs font-roboto">
                    <span className="text-white/35">
                      Instructor: <span className="text-white/60 font-medium">{nextClass.instructor?.name ?? 'Sin asignar'}</span>
                    </span>
                    <span className="text-white/35">
                      Salón: <span className="text-white/60 font-medium">{nextClass.classroom?.name ?? '—'}</span>
                    </span>
                  </div>
                </div>

                <Link
                  href="/mi-cuenta/mis-clases"
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 px-4 py-2 text-xs font-semibold font-roboto transition-all"
                >
                  Ver detalle
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section>
            <div className="bg-[#181818] rounded-2xl border border-white/5 p-5 sm:p-6 text-center">
              <p className="text-sm text-white/30 font-roboto">No tienes clases agendadas próximamente.</p>
              <Link
                href="/agendar"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff7a00] hover:text-[#ff7a00]/80 mt-2 transition-colors font-roboto"
              >
                Agendar una clase →
              </Link>
            </div>
          </section>
        )}

        {/* ── AVANCE DEL MES ────────────────────────────────────────── */}
        {usageTyped && planTotal > 0 && (
          <section>
            <div className="bg-[#181818] rounded-2xl border border-white/5 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,122,0,0.12)' }}
                  >
                    <svg className="h-5 w-5 text-[#ff7a00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/35 font-roboto">Tu avance este mes</p>
                    <p className="text-sm font-bold text-white font-poppins mt-0.5">
                      {classesCompleted} de {planTotal} clases realizadas
                    </p>
                  </div>
                </div>
                <span className="text-white/20 text-[10px] font-roboto">{monthLabel}</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(rawPct, 100)}%`,
                    background: 'linear-gradient(90deg, #ff7a00, #fbbf24)',
                  }}
                />
              </div>
            </div>
          </section>
        )}

        {/* ── PRÓXIMAS CLASES ───────────────────────────────────────── */}
        {upcoming.length > 1 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Próximas clases</SectionLabel>
              <Link
                href="/mi-cuenta/mis-clases"
                className="text-[11px] font-semibold text-white/35 hover:text-[#ff7a00] transition-colors font-roboto"
              >
                Ver calendario completo →
              </Link>
            </div>
            <div className="space-y-2">
              {upcoming.slice(1, 5).map((s: any) => {
                const meta = statusMeta(s.status)
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 bg-[#181818] rounded-xl border border-white/5 p-3"
                  >
                    <span className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.hex + '1f', color: meta.hex }}>
                      <InstrumentIcon courseName={s.course?.name} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white font-poppins font-medium">
                        {s.course?.name ?? '—'} · {s.start_time?.slice(0, 5)}
                      </p>
                      <p className="text-xs text-white/35 font-roboto truncate">
                        {formatDate(s.scheduled_date)} · {s.instructor?.name ?? 'Sin instructor'}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-semibold ${meta.badgeClass}`}>{meta.label}</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── HISTORIAL ─────────────────────────────────────────────── */}
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

function formatDateLong(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-3.5 w-1 rounded-full bg-[#ff7a00]/60 shrink-0" />
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-white/35 font-roboto">
        {children}
      </h2>
    </div>
  )
}

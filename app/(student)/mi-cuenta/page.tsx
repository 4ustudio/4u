import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase/server'
import { getMyDashboardData } from '../_actions/student'
import { studentBookAction } from '../_actions/student'
import { createAdminClient } from '@/lib/supabase/admin'
import Header from '@/components/layout/Header'
import AutoRefresh from './_components/AutoRefresh'
import ProfileModal from './_components/ProfileModal'
import { InstrumentIcon } from './_components/instruments'
import { statusMeta } from './_components/statusMeta'
import BookingCalendar from '@/components/sections/BookingCalendar'
import { ACADEMY } from '@/lib/constants'
import type { MonthlyUsage } from '@/types/admin'

export const dynamic = 'force-dynamic'

export default async function MiCuentaPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/mi-cuenta/login')

  const [data, instructorsResult] = await Promise.all([
    getMyDashboardData(user.id),
    createAdminClient()
      .from('instructors')
      .select('id, name')
      .eq('status', 'active')
      .order('name'),
  ])

  if (!data) redirect('/admin')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { student, usage, upcoming } = data as any
  const usageTyped = usage as MonthlyUsage | null
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null

  const firstName = student.first_name ?? student.name?.split(' ')[0] ?? 'Estudiante'
  const fullName = [student.first_name, student.last_name].filter(Boolean).join(' ') || student.name
  const initials = (firstName[0] ?? 'E').toUpperCase()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextClass = upcoming[0] as any | undefined

  const classesCompleted = usageTyped?.classes_completed ?? 0
  const classesScheduled = usageTyped?.classes_scheduled ?? 0
  const lateCancellations = usageTyped?.late_cancellations ?? 0
  const classesAvailable = usageTyped?.classes_available ?? 0
  const planTotal = usageTyped?.quota_total ?? 0
  const progressPct = planTotal > 0 ? Math.round((classesCompleted / planTotal) * 100) : 0

  const memberSince = student.enrolled_at
    ? new Date(student.enrolled_at + 'T12:00:00').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    : null

  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const monthName = now.toLocaleDateString('es-CO', { month: 'long' })
  const planExpiry = `${lastDay} de ${monthName} ${now.getFullYear()}`

  const instructors = (instructorsResult.data ?? []) as { id: string; name: string }[]

  const circumference = 2 * Math.PI * 20
  const dashOffset = circumference - (progressPct / 100) * circumference

  return (
    <>
      <AutoRefresh studentId={student.id} />
      <Header />

      <div className="min-h-screen bg-gray-50">
        <main className="max-w-5xl mx-auto px-4 pt-[80px] pb-16 space-y-6">

          {/* ── TÍTULO ──────────────────────────────────────────────── */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-poppins">Mi Perfil</h1>
            <p className="text-sm text-gray-500 font-roboto mt-0.5">Aquí puedes ver tu información y gestionar tus clases.</p>
          </div>

          {/* ── HERO ──────────────────────────────────────────────────── */}
          <section className="relative overflow-hidden rounded-2xl bg-[#1a1a1a] p-5 sm:p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-15 blur-3xl"
              style={{ background: 'radial-gradient(circle, #ff7a00 0%, transparent 70%)' }}
            />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">

              {/* Avatar + info personal */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="h-16 w-16 rounded-full object-cover border-2 border-[#ff7a00]/60"
                      style={{ boxShadow: '0 0 18px rgba(255,122,0,0.25)' }}
                    />
                  ) : (
                    <div
                      className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-white border-2 border-[#ff7a00]/60"
                      style={{ backgroundColor: '#ff7a00', boxShadow: '0 0 18px rgba(255,122,0,0.25)' }}
                    >
                      {initials}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-400 border-2 border-[#1a1a1a]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-white font-poppins truncate">{fullName}</h2>
                    <ProfileModal
                      firstName={student.first_name ?? student.name ?? ''}
                      lastName={student.last_name ?? ''}
                      email={user.email ?? ''}
                      avatarUrl={avatarUrl}
                      userId={user.id}
                    />
                  </div>
                  <p className="text-xs text-white/50 font-roboto mt-0.5 truncate">{student.email ?? user.email}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff7a00] text-white font-roboto">
                      Estudiante
                    </span>
                    {memberSince && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-white/35 font-roboto">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                        </svg>
                        Miembro desde {memberSince}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Plan actual */}
              {planTotal > 0 && (
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35 font-roboto">Mi plan actual</p>
                    <div className="flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-[#ff7a00]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2 8c0-.55.45-1 1-1h2l1.5-3.5a1 1 0 0 1 1.83 0L10 7h4l1.67-3.5a1 1 0 0 1 1.83 0L19 7h2a1 1 0 0 1 .95 1.32l-3 9A1 1 0 0 1 18 18H6a1 1 0 0 1-.95-.68l-3-9A1 1 0 0 1 2 8z"/>
                      </svg>
                      <span className="text-base font-bold text-white font-poppins">Plan Estudiante</span>
                    </div>
                    <p className="text-xs text-white/50 font-roboto">{planTotal} clases al mes</p>
                    <p className="text-[11px] text-white/30 font-roboto">Vence el {planExpiry}</p>
                    <Link href="/mi-cuenta/mis-clases" className="text-[11px] font-semibold text-[#ff7a00] hover:text-[#ff7a00]/80 transition-colors font-roboto mt-0.5">
                      Ver detalles →
                    </Link>
                  </div>

                  {/* Circular progress */}
                  <div className="relative h-[70px] w-[70px] shrink-0">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                      <circle
                        cx="24" cy="24" r="20"
                        fill="none"
                        stroke="#ff7a00"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <span className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-bold text-white font-poppins leading-none">{progressPct}%</span>
                      <span className="text-[8px] text-white/35 font-roboto leading-none mt-0.5">completado</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── RESUMEN DE CLASES ─────────────────────────────────────── */}
          <section>
            <h2 className="text-base font-bold text-gray-900 font-poppins mb-0.5">Resumen de clases</h2>
            <p className="text-xs text-gray-500 font-roboto mb-3">Así va tu progreso este mes.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Completadas */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-roboto">Completadas</span>
                  <span className="text-green-500">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>
                    </svg>
                  </span>
                </div>
                <span className="text-2xl font-bold font-poppins text-gray-900">{classesCompleted}</span>
                <p className="text-[10px] text-gray-400 font-roboto">de {planTotal}</p>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full transition-all duration-700" style={{ width: `${Math.min(progressPct, 100)}%` }} />
                </div>
              </div>

              {/* Agendadas */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-roboto">Agendadas</span>
                  <span className="text-blue-400">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
                    </svg>
                  </span>
                </div>
                <span className="text-2xl font-bold font-poppins text-gray-900">{classesScheduled}</span>
                <p className="text-[10px] text-blue-400 font-roboto font-semibold">próximas</p>
              </div>

              {/* Tomadas */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-roboto">Tomadas</span>
                  <span className="text-green-500">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/>
                    </svg>
                  </span>
                </div>
                <span className="text-2xl font-bold font-poppins text-gray-900">{classesCompleted}</span>
                <p className="text-[10px] text-gray-400 font-roboto">este mes</p>
              </div>

              {/* Canceladas */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-roboto">Canceladas</span>
                  <span className="text-red-400">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>
                    </svg>
                  </span>
                </div>
                <span className="text-2xl font-bold font-poppins text-gray-900">{lateCancellations}</span>
                <p className="text-[10px] text-gray-400 font-roboto">este mes</p>
              </div>

              {/* Restantes */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-roboto">Restantes</span>
                  <span className="text-[#ff7a00]">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 3h14M5 21h14M12 3v5M12 21v-5"/><path d="M5 8h4l3 4-3 4H5M19 8h-4l-3 4 3 4h4"/>
                    </svg>
                  </span>
                </div>
                <span className="text-2xl font-bold font-poppins text-gray-900">{classesAvailable}</span>
                <p className="text-[10px] text-[#ff7a00] font-roboto font-semibold">para este mes</p>
              </div>
            </div>
          </section>

          {/* ── PRÓXIMA CLASE ─────────────────────────────────────────── */}
          {nextClass ? (
            <section>
              <div className="rounded-2xl bg-[#1a1a1a] overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
                  <svg className="h-4 w-4 text-[#ff7a00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
                  </svg>
                  <span className="text-sm font-bold text-white font-poppins">Próxima clase</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,122,0,0.15)' }}
                  >
                    <span className="text-[#ff7a00]">
                      <InstrumentIcon courseName={nextClass.course?.name} className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white font-poppins">{nextClass.course?.name ?? 'Clase'}</h3>
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusMeta(nextClass.status).badgeClass}`}>
                        {statusMeta(nextClass.status).label}
                      </span>
                    </div>
                    <p className="text-sm text-white/50 font-roboto mt-1 capitalize">
                      {formatDateLong(nextClass.scheduled_date)} · {nextClass.start_time?.slice(0, 5)}
                    </p>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-xs font-roboto">
                      <span className="text-white/30">Instructor: <span className="text-white/55 font-medium">{nextClass.instructor?.name ?? 'Sin asignar'}</span></span>
                      <span className="text-white/30">Salón: <span className="text-white/55 font-medium">{nextClass.classroom?.name ?? '—'}</span></span>
                    </div>
                  </div>
                  <Link
                    href="/mi-cuenta/mis-clases"
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold font-roboto text-white transition-all hover:brightness-110 active:scale-95"
                    style={{ backgroundColor: '#ff7a00' }}
                  >
                    Ver detalles
                  </Link>
                </div>
              </div>
            </section>
          ) : (
            <section>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
                <p className="text-sm text-gray-400 font-roboto">No tienes clases agendadas próximamente.</p>
                <Link href="/agendar" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ff7a00] hover:text-[#ff7a00]/80 mt-2 transition-colors font-roboto">
                  Agendar una clase →
                </Link>
              </div>
            </section>
          )}

          {/* ── AGENDA TU CLASE ───────────────────────────────────────── */}
          <section>
            <h2 className="text-base font-bold text-gray-900 font-poppins mb-0.5">Agenda tu clase</h2>
            <p className="text-xs text-gray-500 font-roboto mb-4">Selecciona una fecha y horario disponible.</p>
            <BookingCalendar
              serverAction={studentBookAction}
              mode="student"
              isLoggedIn={true}
              instructors={instructors}
            />
          </section>

          {/* ── ¿NECESITAS AYUDA? ─────────────────────────────────────── */}
          <section>
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#ff7a00]/10 flex items-center justify-center shrink-0">
                  <svg className="h-5 w-5 text-[#ff7a00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 font-poppins">¿Necesitas ayuda?</p>
                  <p className="text-xs text-gray-400 font-roboto">Si tienes dudas sobre tus clases o agendamiento, estamos aquí para ayudarte.</p>
                </div>
              </div>
              <a
                href={`https://wa.me/${ACADEMY.phone}?text=Hola, necesito ayuda con mi cuenta de 4U Studio Academy.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold font-roboto text-white transition-all hover:brightness-110 active:scale-95 shrink-0"
                style={{ backgroundColor: '#ff7a00' }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Contacto de soporte
              </a>
            </div>
          </section>

        </main>
      </div>
    </>
  )
}

function formatDateLong(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

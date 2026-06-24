import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { createAuthServerClient } from '@/lib/supabase/server'
import { getInstructorDashboardData, getMonthSessions, getMyDashboardData, getPortalAccess } from '../_actions/student'
import Header from '@/components/layout/Header'
import AutoRefresh from './_components/AutoRefresh'
import ProfileModal from './_components/ProfileModal'
import InstructorProfileModal from './_components/InstructorProfileModal'
import SchedulePdfButton from './_components/SchedulePdfButton'
import ClassesCalendar from './_components/ClassesCalendar'
import InstructorCalendar from './_components/InstructorCalendar'
import AvailabilityEditor from './_components/AvailabilityEditor'
import InstructorCancelSession from './_components/InstructorCancelSession'
import { InstrumentIcon } from './_components/instruments'
import { statusMeta } from './_components/statusMeta'
import BirthdayBenefitCard from './_components/BirthdayBenefitCard'
import DocumentsSection from './_components/DocumentsSection'
import { getBirthdayBenefitStatus, isBirthdayMonth } from '@/lib/students/birthday'
import { ACADEMY } from '@/lib/constants'
import { getHolidayMap } from '@/lib/calendar/colombia-holidays'
import { EVENT_STYLE } from '@/lib/calendar/types'
import type { MonthlyUsage } from '@/types/admin'

export const dynamic = 'force-dynamic'

/* eslint-disable @typescript-eslint/no-explicit-any */

const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DOW_HEAD = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
const WEEK_DAYS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM']
const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']

function normalizeRole(role: unknown) {
  if (role === 'owner' || role === 'super_admin' || role === 'admin') return 'admin'
  if (role === 'instructor' || role === 'teacher' || role === 'maestro') return 'instructor'
  return 'student'
}

export default async function MiCuentaPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/mi-cuenta/login')

  const role = normalizeRole(user.user_metadata?.role)
  if (role === 'admin') redirect('/admin')

  const now = new Date()
  const monthLabel = `${MONTHS_ES[now.getMonth()]} ${now.getFullYear()}`

  if (role === 'instructor') {
    const data = await getInstructorDashboardData(user.id, user.email) ?? {
      instructor: {
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Instructor 4U',
        email: user.email,
        created_at: null,
      },
      sessions: [],
      availability: [],
      upcoming: [],
      cancelled: [],
      blocksCount: 0,
      lastModification: null,
      availabilitySummary: { totalSlots: 0, activeDays: 0, blockedDates: 0, lastModified: null },
      stats: { weekScheduled: 0, completed: 0, cancelled: 0, activeStudents: 0, todayUpcoming: 0 },
    }
    return <InstructorDashboard data={data} user={user} monthLabel={monthLabel} now={now} />
  }

  const [data, monthSessions] = await Promise.all([
    getMyDashboardData(user.id),
    getMonthSessions(now.getFullYear(), now.getMonth() + 1),
  ])

  if (!data) redirect('/planes')
  const access = await getPortalAccess(data.student.id, data.student.lead_id ?? null, data.student.plan_name ?? null)
  return <StudentDashboard data={data} monthSessions={monthSessions} user={user} monthLabel={monthLabel} now={now} access={access} />
}

function StudentDashboard({ data, monthSessions, user, monthLabel, now, access }: any) {
  const { student, usage, upcoming, schedules } = data
  const canSchedule = access?.hasContract && access?.hasPaid
  const usageTyped = usage as MonthlyUsage | null
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null
  const firstName = student.first_name ?? student.name?.split(' ')[0] ?? 'Estudiante'
  const fullName = [student.first_name, student.last_name].filter(Boolean).join(' ') || student.name || 'Estudiante 4U'
  const initials = (firstName[0] ?? 'E').toUpperCase()
  const nextClass = upcoming?.[0]

  const completed = usageTyped?.classes_completed ?? monthSessions.filter((s: any) => s.status === 'completed').length
  const scheduled = usageTyped?.classes_scheduled ?? monthSessions.filter((s: any) => ['pending', 'confirmed'].includes(s.status)).length
  const cancelled = usageTyped?.late_cancellations ?? monthSessions.filter((s: any) => ['cancelled', 'no_show'].includes(s.status)).length
  const remaining = usageTyped?.classes_available ?? 0
  const total = usageTyped?.quota_total ?? Math.max(completed + remaining, 8)
  const progress = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0
  const memberSince = student.enrolled_at
    ? new Date(student.enrolled_at + 'T12:00:00').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    : 'mayo 2026'

  return (
    <>
      <AutoRefresh studentId={student.id} />
      <Header />
      <main className="min-h-screen bg-[#fafafa] px-4 pt-[92px] pb-12">
        <div className="mx-auto max-w-[1180px] space-y-6">
          <PageTitle subtitle="Aqui puedes ver tu informacion y gestionar tus clases." />

          <ProfileHero
            avatarUrl={avatarUrl}
            initials={initials}
            name={fullName}
            email={student.email ?? user.email}
            badge="Estudiante"
            memberSince={memberSince}
            action={<ProfileModal firstName={student.first_name ?? student.name ?? ''} lastName={student.last_name ?? ''} email={user.email ?? ''} avatarUrl={avatarUrl} userId={user.id} birthdayBenefit={{ student }} />}
            right={
              <PlanCard
                title="Plan Estudiante"
                subtitle={`${total} clases al mes`}
                meta={`Vence el ${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()} de ${monthLabel.toLowerCase()}`}
                progress={progress}
              />
            }
          />

          {/* Beneficio de cumpleaños — destacado cuando activo */}
          {(isBirthdayMonth(student.birth_date) || getBirthdayBenefitStatus(student) !== 'expired') && (
            <BirthdayBenefitCard student={student} />
          )}

          <section>
            <SectionTitle title="Resumen de clases" subtitle="Asi va tu progreso este mes." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <MetricCard icon="calendar-check" value={completed} label="Clases completadas" hint={`de ${total}`} color="green" progress={progress} />
              <MetricCard icon="calendar" value={scheduled} label="Clases agendadas" hint="proximas" color="blue" />
              <MetricCard icon="check" value={completed} label="Clases tomadas" hint="este mes" color="orange" />
              <MetricCard icon="x" value={cancelled} label="Clases canceladas" hint="este mes" color="red" />
              <MetricCard icon="hourglass" value={remaining} label="Clases restantes" hint="para este mes" color="purple" />
            </div>
          </section>

          {nextClass ? <NextClassCard session={nextClass} /> : <EmptyNextClass />}

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <SectionTitle title="Agenda tu clase" subtitle="Selecciona una fecha y horario disponible." />
              {canSchedule && <SchedulePdfButton name={fullName} roleLabel="Estudiante" monthLabel={monthLabel} sessions={monthSessions} />}
            </div>
            {canSchedule ? (
              <ClassesCalendar
                initialSessions={monthSessions}
                schedules={schedules ?? []}
                initialYear={now.getFullYear()}
                initialMonth={now.getMonth() + 1}
              />
            ) : (
              <ScheduleLocked hasContract={access?.hasContract} hasPaid={access?.hasPaid} />
            )}
          </section>

          <div id="documentos" className="scroll-mt-24" />
          <PaymentSection payments={access?.pendingPayments ?? []} />
          <DocumentsSection studentId={student.id} enrollmentId={student.lead_id ?? null} />

          <DisclaimerBar />
          <SupportBar />
        </div>
      </main>
    </>
  )
}

function InstructorDashboard({ data, user, monthLabel, now }: any) {
  const { instructor, sessions, availability, upcoming, cancelled, stats, blocksCount, lastModification, availabilitySummary } = data
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null
  const name = instructor.name ?? user.user_metadata?.name ?? 'Instructor 4U'
  const initials = (name[0] ?? 'I').toUpperCase()
  const memberSince = instructor.created_at
    ? new Date(instructor.created_at).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    : 'marzo 2024'

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fafafa] px-4 pt-[92px] pb-12">
        <div className="mx-auto max-w-[1180px] space-y-6">
          <PageTitle subtitle="Administra tus clases, horarios y alumnos." />

          <ProfileHero
            avatarUrl={avatarUrl}
            initials={initials}
            name={name}
            email={instructor.email ?? user.email}
            badge="Maestro"
            memberSince={memberSince}
            action={<InstructorProfileModal name={name} email={instructor.email ?? user.email ?? ''} avatarUrl={avatarUrl} />}
            right={<InstructorSummary stats={stats} />}
          />

          {/* Accesos rápidos */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ActionCard icon="calendar" title="Ver horarios"     text="Tu disponibilidad"        href="#disponibilidad" />
            <ActionCard icon="briefcase" title="Gestionar clases" text="Ver tus clases del mes"  href="#calendario" />
            <ActionCard icon="lock"     title="Bloquear fechas"  text="Fechas específicas"     href="#disponibilidad" />
            <ActionCard icon="users"    title="Mis alumnos"      text="Ver estudiantes activos"   href="#alumnos" />
            <ActionCard icon="report"   title="Reportes"         text="Tu actividad mensual"     href="/mi-cuenta/clases-mes" />
          </div>

          {/* Métricas */}
          <section>
            <SectionTitle title="Resumen de clases" subtitle="Asi va tu actividad este mes." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard icon="calendar" value={stats.weekScheduled}  label="Proximas"     hint="Confirmadas"   color="blue" />
              <MetricCard icon="check"    value={stats.completed}      label="Completadas"  hint="Este mes"      color="green" />
              <MetricCard icon="clock"    value={stats.todayUpcoming}  label="Hoy"          hint="Proximas hoy"  color="orange" />
              <MetricCard icon="x"        value={stats.cancelled}      label="Canceladas"   hint="Este mes"      color="red" />
            </div>
          </section>

          {/* Próximas clases hoy */}
          {upcoming.filter((s: any) => s.scheduled_date === now.toISOString().split('T')[0]).length > 0 && (
            <section className="rounded-xl bg-[#090909] p-6 text-white shadow-lg">
              <h2 className="mb-4 font-poppins text-lg font-extrabold text-[#ff7a00]">Clases de hoy</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.filter((s: any) => s.scheduled_date === now.toISOString().split('T')[0]).map((s: any) => (
                  <div key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="font-poppins font-bold">{s.start_time?.slice(0,5)} · {s.course?.name ?? 'Clase'}</p>
                    <p className="text-sm text-white/60 mt-1">{s.student?.name ?? 'Sin alumno'}</p>
                    <p className="text-xs text-white/40 mt-0.5">{s.classroom?.name ?? '—'}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Calendario interactivo */}
          <section>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <SectionTitle title="Tu calendario" subtitle="Tus clases del mes — navega por fecha." />
              <SchedulePdfButton name={name} roleLabel="Instructor" monthLabel={monthLabel} sessions={sessions} />
            </div>
            <InstructorCalendar
              initialSessions={sessions}
              initialYear={now.getFullYear()}
              initialMonth={now.getMonth() + 1}
            />
          </section>

          {/* Alumnos activos */}
          {upcoming.length > 0 && (
            <section id="alumnos" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <SectionTitle title="Proximas clases" subtitle="Tus clases confirmadas y pendientes este mes." />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {upcoming.slice(0, 6).map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                    <span className="h-9 w-9 rounded-full bg-orange-100 text-[#ff7a00] flex items-center justify-center font-bold text-sm shrink-0">
                      {(s.student?.name ?? '?')[0].toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.student?.name ?? 'Sin alumno'}</p>
                      <p className="text-xs text-gray-400">{s.course?.name ?? '—'} · {s.scheduled_date} {s.start_time?.slice(0,5)}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusMeta(s.status).badgeClass}`}>{statusMeta(s.status).label}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Resumen de disponibilidad */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <SectionTitle title="Disponibilidad" subtitle="Resumen de tu horario semanal." />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
                <p className="text-2xl font-extrabold font-poppins text-[#ff7a00]">{availabilitySummary?.totalSlots ?? availability?.length ?? 0}</p>
                <p className="text-sm font-semibold text-gray-700 mt-1">Franjas activas</p>
                <p className="text-xs text-gray-500">horarios configurados</p>
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                <p className="text-2xl font-extrabold font-poppins text-blue-600">{availabilitySummary?.activeDays ?? 0}</p>
                <p className="text-sm font-semibold text-gray-700 mt-1">Días activos</p>
                <p className="text-xs text-gray-500">días con disponibilidad</p>
              </div>
              <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                <p className="text-2xl font-extrabold font-poppins text-red-500">{blocksCount ?? 0}</p>
                <p className="text-sm font-semibold text-gray-700 mt-1">Fechas bloqueadas</p>
                <p className="text-xs text-gray-500">bloqueos activos</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-2xl font-extrabold font-poppins text-gray-600">
                  {lastModification
                    ? (() => {
                        const diff = Math.floor((Date.now() - new Date(lastModification).getTime()) / (1000 * 60 * 60 * 24))
                        return diff === 0 ? 'Hoy' : diff === 1 ? 'Ayer' : `${diff} días`
                      })()
                    : '—'}
                </p>
                <p className="text-sm font-semibold text-gray-700 mt-1">Última modificación</p>
                <p className="text-xs text-gray-500">cambio de horario</p>
              </div>
            </div>
          </section>

          {/* Cancelar clase + Editor de disponibilidad */}
          <InstructorCancelSession upcomingSessions={upcoming ?? []} />
          <AvailabilityEditor initialAvailability={availability ?? []} />

          <SupportBar />
        </div>
      </main>
    </>
  )
}

function ScheduleLocked({ hasContract, hasPaid }: { hasContract: boolean; hasPaid: boolean }) {
  const steps = [
    { done: !!hasContract, label: 'Firma tu contrato' },
    { done: !!hasPaid,     label: 'Realiza tu pago con Bold' },
  ]
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Icon name="lock" className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h3 className="font-poppins text-base font-extrabold text-amber-900">Agenda bloqueada</h3>
          <p className="mt-0.5 text-sm text-amber-700">Para agendar clases primero completa estos pasos:</p>
          <ul className="mt-4 space-y-2">
            {steps.map(s => (
              <li key={s.label} className="flex items-center gap-2 text-sm">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${s.done ? 'bg-green-500 text-white' : 'bg-white border border-amber-300 text-amber-500'}`}>
                  {s.done ? '✓' : '!'}
                </span>
                <span className={s.done ? 'text-gray-500 line-through' : 'font-semibold text-amber-900'}>{s.label}</span>
              </li>
            ))}
          </ul>
          <a href="#documentos" className="mt-4 inline-flex rounded-lg bg-[#ff7a00] px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all">
            Ir a contrato y pago →
          </a>
        </div>
      </div>
    </section>
  )
}

function PaymentSection({ payments }: { payments: any[] }) {
  const payable = payments.filter(p => p?.metadata?.bold_checkout_url)
  if (payable.length === 0) return null
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[#ff7a00] mt-0.5">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
        </span>
        <div>
          <h2 className="font-poppins text-base font-extrabold text-gray-950">Tus pagos</h2>
          <p className="text-sm text-gray-600 mt-0.5">Paga tu mensualidad de forma segura con Bold.</p>
        </div>
      </div>
      <div className="space-y-3">
        {payable.map(p => {
          const mes = new Date(p.period_year, p.period_month - 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
          let countdown: { text: string; tone: string } | null = null
          if (p.due_date) {
            const due = new Date(p.due_date + 'T23:59:59')
            const days = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            countdown = days < 0
              ? { text: `Vencido hace ${Math.abs(days)} día${Math.abs(days) === 1 ? '' : 's'}`, tone: 'text-red-600' }
              : days === 0
              ? { text: 'Vence hoy', tone: 'text-red-600' }
              : { text: `Te quedan ${days} día${days === 1 ? '' : 's'} para pagar`, tone: days <= 3 ? 'text-amber-600' : 'text-gray-500' }
          }
          return (
            <div key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 capitalize">{p.plan_name ?? 'Mensualidad'} · {mes}</p>
                <p className="text-xs text-gray-400 mt-0.5">${Number(p.final_amount).toLocaleString('es-CO')} COP</p>
                {countdown && <p className={`text-xs font-semibold mt-0.5 ${countdown.tone}`}>{countdown.text}</p>}
              </div>
              <a
                href={p.metadata.bold_checkout_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#ff7a00] px-5 py-2 text-sm font-bold text-white hover:brightness-110 transition-all shrink-0"
              >
                Pagar con Bold
              </a>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function PageTitle({ subtitle }: { subtitle: string }) {
  return (
    <div>
      <h1 className="font-poppins text-3xl font-extrabold text-gray-950">Mi Perfil</h1>
      <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="font-poppins text-xl font-extrabold text-gray-950">{title}</h2>
      <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
    </div>
  )
}

function ProfileHero({ avatarUrl, initials, name, email, badge, memberSince, action, right }: any) {
  return (
    <section className="overflow-hidden rounded-xl bg-[#090909] p-7 text-white shadow-xl">
      <div className="grid gap-7 lg:grid-cols-[1fr_560px] lg:items-center">
        <div className="flex items-center gap-6">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-[#ff7a00]">
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center font-poppins text-4xl font-black">{initials}</span>}
            <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-black bg-green-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="truncate font-poppins text-3xl font-extrabold">{name}</h2>
              {action}
            </div>
            <p className="mt-2 text-white/70">{email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/65">
              <span className="rounded-full bg-[#ff7a00]/20 px-2 py-1 text-xs font-bold text-[#ff7a00]">{badge}</span>
              <span className="inline-flex items-center gap-2">
                <Icon name="calendar" className="h-4 w-4" />
                Miembro desde {memberSince}
              </span>
            </div>
          </div>
        </div>
        {right}
      </div>
    </section>
  )
}

function PlanCard({ title, subtitle, meta, progress }: { title: string; subtitle: string; meta: string; progress: number }) {
  const circumference = 2 * Math.PI * 42
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white/45">Mi plan actual</p>
          <h3 className="mt-3 flex items-center gap-3 font-poppins text-2xl font-extrabold">
            <Icon name="crown" className="h-6 w-6 text-[#ff7a00]" />
            {title}
          </h3>
          <p className="mt-2 font-bold text-white">{subtitle}</p>
          <div className="mt-5 flex gap-8 text-sm">
            <span className="text-white/55">{meta}</span>
            <Link href="/mi-cuenta/mis-clases" className="font-bold text-[#ff7a00]">Ver detalles</Link>
          </div>
        </div>
        <div className="relative h-32 w-32 shrink-0">
          <svg className="-rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#ff7a00" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (progress / 100) * circumference} />
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <strong className="font-poppins text-2xl">{progress}%</strong>
            <small className="text-white/55">completado</small>
          </span>
        </div>
      </div>
    </div>
  )
}

function InstructorSummary({ stats }: any) {
  const items = [
    ['Clases esta semana', stats.weekScheduled, 'calendar'],
    ['Clases completadas', stats.completed, 'check'],
    ['Clases canceladas', stats.cancelled, 'x'],
    ['Alumnos activos', stats.activeStudents, 'users'],
  ]
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <p className="mb-4 text-xs font-bold text-white/75">Resumen general</p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map(([label, value, icon]) => (
          <div key={label as string} className="border-white/10 lg:border-l lg:pl-5 first:border-l-0 first:pl-0">
            <Icon name={icon as string} className="mb-2 h-5 w-5 text-[#ff7a00]" />
            <p className="text-xs text-white/55">{label}</p>
            <strong className="font-poppins text-3xl">{value as number}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricCard({ icon, value, label, hint, color, progress }: any) {
  const colors: Record<string, string> = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-[#ff7a00]',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <span className={`mb-5 flex h-11 w-11 items-center justify-center rounded-full ${colors[color]}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <strong className="font-poppins text-3xl font-extrabold text-gray-950">{value}</strong>
      <p className="mt-2 font-semibold text-gray-900">{label}</p>
      <p className={`mt-1 text-sm font-bold ${color === 'red' ? 'text-red-600' : color === 'blue' ? 'text-blue-600' : color === 'purple' ? 'text-purple-600' : 'text-[#ff7a00]'}`}>{hint}</p>
      {typeof progress === 'number' && <div className="mt-5 h-2 rounded-full bg-gray-100"><div className="h-full rounded-full bg-green-500" style={{ width: `${progress}%` }} /></div>}
    </div>
  )
}

function NextClassCard({ session }: { session: any }) {
  return (
    <section className="rounded-xl bg-[#090909] p-6 text-white shadow-lg">
      <h2 className="mb-5 flex items-center gap-2 font-poppins text-xl font-extrabold text-[#ff7a00]">
        <Icon name="headphones" className="h-5 w-5" />
        Proxima clase
      </h2>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#ff7a00]/20 text-[#ff7a00]">
          <InstrumentIcon courseName={session.course?.name} className="h-8 w-8" />
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-poppins text-xl font-bold">{session.course?.name ?? 'Clase'}</h3>
            <span className={`rounded-full border px-2 py-1 text-xs font-bold ${statusMeta(session.status).badgeClass}`}>{statusMeta(session.status).label}</span>
          </div>
          <p className="mt-2 text-white/70">{formatDateLong(session.scheduled_date)} · {session.start_time?.slice(0, 5)}</p>
          <p className="mt-2 text-sm text-white/45">Instructor: {session.instructor?.name ?? 'Sin asignar'} <span className="mx-4">Salon: {session.classroom?.name ?? '-'}</span></p>
        </div>
        <Link href="/mi-cuenta/mis-clases" className="rounded-lg bg-[#ff7a00] px-8 py-3 font-bold text-white shadow-lg shadow-orange-500/20">Ver detalles</Link>
      </div>
    </section>
  )
}

function EmptyNextClass() {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
      <p className="font-semibold text-gray-700">No tienes clases agendadas proximamente.</p>
      <Link href="/agendar" className="mt-3 inline-flex font-bold text-[#ff7a00]">Agendar una clase →</Link>
    </section>
  )
}

function MonthCalendar({ sessions, year, month }: { sessions: any[]; year: number; month: number }) {
  const firstDow = new Date(year, month, 1).getDay()
  const total = new Date(year, month + 1, 0).getDate()
  const cells: { day: number; current: boolean }[] = []
  for (let i = 0; i < firstDow; i++) cells.push({ day: 0, current: false })
  for (let d = 1; d <= total; d++) cells.push({ day: d, current: true })
  while (cells.length % 7 !== 0) cells.push({ day: 0, current: false })

  const byDay: Record<string, any[]> = {}
  sessions.forEach(s => {
    if (!byDay[s.scheduled_date]) byDay[s.scheduled_date] = []
    byDay[s.scheduled_date].push(s)
  })

  const holidayMap = getHolidayMap(year)
  const mm = String(month + 1).padStart(2, '0')
  const todayIso = new Date().toISOString().split('T')[0]
  const hs = EVENT_STYLE.holiday

  return (
    <div>
      <div className="grid grid-cols-7 border-l border-t border-gray-200">
        {DOW_HEAD.map(d => <div key={d} className="border-b border-r border-gray-200 py-3 text-center text-xs font-bold text-gray-500">{d}</div>)}
        {cells.map((cell, i) => {
          const key = cell.current ? `${year}-${mm}-${String(cell.day).padStart(2, '0')}` : ''
          const daySessions = byDay[key] ?? []
          const isToday = key === todayIso
          const holiday = key ? holidayMap[key]?.[0] : undefined
          return (
            <div
              key={i}
              className={`min-h-[104px] border-b border-r border-gray-200 p-2 ${isToday ? 'bg-orange-50' : holiday ? '' : cell.current ? 'bg-white' : 'bg-gray-50'}`}
              style={holiday && !isToday ? { background: hs.bg } : undefined}
            >
              <span className={`text-sm font-bold ${isToday ? 'text-[#ff7a00]' : holiday ? '' : daySessions.length ? 'text-gray-950' : 'text-gray-400'}`}
                style={holiday && !isToday ? { color: hs.text } : undefined}
              >{cell.current ? cell.day : ''}</span>
              {holiday && (
                <span
                  className="block text-[8px] font-bold truncate leading-tight px-1 rounded mt-0.5"
                  style={{ background: hs.bg, color: hs.text, border: `1px solid ${hs.border}` }}
                  title={holiday.description ? `${holiday.title} — ${holiday.description}` : holiday.title}
                >
                  Festivo
                </span>
              )}
              <div className="mt-1 space-y-1">
                {daySessions.slice(0, 3).map(s => <CalendarPill key={s.id} session={s} />)}
              </div>
            </div>
          )
        })}
      </div>
      <Legend />
    </div>
  )
}

function CalendarPill({ session }: { session: any }) {
  const color = session.status === 'completed' ? 'bg-purple-100 text-purple-700' : session.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
  return <div className={`rounded-md px-2 py-1 text-xs font-bold ${color}`}>{session.course?.name ?? 'Clase'}<br />{session.start_time?.slice(0, 5)}</div>
}

function StudentSidePanel({ sessions, schedules }: { sessions: any[]; schedules: any[] }) {
  const today = new Date().toISOString().split('T')[0]
  const available = sessions.filter(s => s.scheduled_date >= today && ['pending', 'confirmed'].includes(s.status)).slice(0, 2)
  return (
    <aside className="space-y-4">
      <div className="rounded-xl border border-gray-200 p-5">
        <h3 className="font-poppins text-lg font-extrabold">Clases disponibles</h3>
        <p className="mt-1 text-sm text-gray-600">{formatDateLong(today)}</p>
        <div className="mt-4 space-y-3">
          {(available.length ? available : schedules.slice(0, 2)).map((s: any, i: number) => (
            <div key={s.id ?? i} className="rounded-lg bg-green-50 p-4">
              <p className="font-bold">{s.course?.name ?? 'Canto'}</p>
              <p className="text-sm text-gray-600">{s.start_time?.slice(0, 5) ?? '18:00'}</p>
              <p className="text-sm text-gray-600">{s.classroom?.name ?? 'Salon 1'}</p>
            </div>
          ))}
          {!available.length && !schedules.length && <p className="text-sm text-gray-500">No hay clases disponibles por ahora.</p>}
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 p-5">
        <h3 className="font-poppins text-lg font-extrabold">Filtros</h3>
        <label className="mt-4 block text-sm font-semibold text-gray-600">Materia</label>
        <select className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm"><option>Todas</option></select>
        <label className="mt-4 block text-sm font-semibold text-gray-600">Instructor</label>
        <select className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm"><option>Todos</option></select>
      </div>
    </aside>
  )
}

function InstructorWeekCalendar({ sessions, now }: { sessions: any[]; now: Date }) {
  const monday = new Date(now)
  const day = monday.getDay() || 7
  monday.setDate(monday.getDate() - (day - 1))
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
  const bySlot: Record<string, any[]> = {}
  sessions.forEach(s => {
    const key = `${s.scheduled_date}-${s.start_time?.slice(0, 5)}`
    if (!bySlot[key]) bySlot[key] = []
    bySlot[key].push(s)
  })
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-16 border border-gray-200 bg-white p-2" />
            {days.map((d, i) => <th key={i} className="border border-gray-200 bg-white p-2 text-xs text-gray-600">{WEEK_DAYS[i]}<br />{d.getDate()}</th>)}
          </tr>
        </thead>
        <tbody>
          {HOURS.map(hour => (
            <tr key={hour}>
              <td className="border border-gray-200 p-2 text-xs text-gray-500">{hour}</td>
              {days.map((d, i) => {
                const iso = d.toISOString().split('T')[0]
                const list = bySlot[`${iso}-${hour}`] ?? []
                return (
                  <td key={i} className="h-16 border border-gray-200 p-1 align-top">
                    {list.map(s => <div key={s.id} className="rounded-md bg-green-100 p-2 text-xs text-green-800"><strong>{s.course?.name}</strong><br />{s.student?.name}</div>)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <Legend />
    </div>
  )
}

function InstructorSidePanel({ upcoming, cancelled }: { upcoming: any[]; cancelled: any[] }) {
  return (
    <aside className="space-y-4">
      <ListPanel title="Proximas clases (hoy)" items={upcoming} tone="green" />
      <ListPanel title="Clases canceladas" items={cancelled} tone="red" />
    </aside>
  )
}

function ListPanel({ title, items, tone }: { title: string; items: any[]; tone: 'green' | 'red' }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="font-poppins text-lg font-extrabold">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length ? items.slice(0, 4).map(item => (
          <div key={item.id} className={`rounded-lg p-4 ${tone === 'green' ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="font-bold">{item.start_time?.slice(0, 5)} · {item.course?.name ?? 'Clase'}</p>
            <p className="text-sm text-gray-600">{item.student?.name ?? item.instructor?.name ?? '-'} · {item.classroom?.name ?? '-'}</p>
          </div>
        )) : <p className="text-sm text-gray-500">No hay registros.</p>}
      </div>
    </div>
  )
}

function AvailabilityStrip({ availability }: { availability: any[] }) {
  const names = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']
  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-poppins text-lg font-extrabold">Tu horario disponible</h3>
          <p className="text-sm text-gray-600">Define los horarios en los que puedes dar clases.</p>
        </div>
        <button className="rounded-lg border border-[#ff7a00]/35 px-4 py-2 text-sm font-bold text-[#ff7a00]">Editar horario</button>
      </div>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
        {names.map((name, i) => {
          const slot = availability.find(a => a.day_of_week === i + 1)
          return <div key={name} className="rounded-lg border border-gray-200 p-3 text-xs"><span className="font-bold">{name}</span><br />{slot ? `${slot.start_time?.slice(0, 5)} - ${slot.end_time?.slice(0, 5)}` : 'No disponible'}</div>
        })}
      </div>
    </div>
  )
}

function ActionCard({ icon, title, text, href }: { icon: string; title: string; text: string; href?: string }) {
  const content = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[#ff7a00]"><Icon name={icon} className="h-5 w-5" /></span>
      <div>
        <p className="font-poppins font-extrabold text-gray-950">{title}</p>
        <p className="text-sm text-gray-600">{text}</p>
      </div>
    </>
  )
  const cls = "flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-[#ff7a00]/30 hover:shadow-md transition-all"
  if (href?.startsWith('#')) {
    return <a href={href} className={cls}>{content}</a>
  }
  if (href) {
    return <Link href={href} className={cls}>{content}</Link>
  }
  return <div className={cls}>{content}</div>
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap gap-5 text-sm text-gray-600">
      <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-green-500" />Confirmada</span>
      <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-blue-500" />Completada</span>
      <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-amber-400" />Pendiente</span>
      <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-red-500" />Para reprogramar</span>
      <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-yellow-400" />Festivo</span>
    </div>
  )
}

function SupportBar() {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[#ff7a00]"><Icon name="calendar" className="h-6 w-6" /></span>
          <div>
            <p className="font-poppins text-lg font-extrabold text-gray-950">¿Necesitas ayuda?</p>
            <p className="text-sm text-gray-700">Si tienes dudas o necesitas soporte, estamos aqui para ayudarte.</p>
          </div>
        </div>
        <a href={`https://wa.me/${ACADEMY.phone}?text=Hola, necesito ayuda con mi cuenta de 4U Studio Academy.`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#ff7a00]/35 px-7 py-3 text-center font-bold text-[#ff7a00] hover:bg-[#ff7a00] hover:text-white transition-colors">Contacto de soporte</a>
      </div>
    </section>
  )
}

function DisclaimerBar() {
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </span>
        <div>
          <p className="font-poppins text-sm font-bold text-amber-900">Política de asistencia</p>
          <p className="mt-0.5 text-sm text-amber-800 leading-relaxed">
            Las clases a las que no asististe y que <strong>no fueron canceladas con al menos 24 horas de anticipación</strong> se contabilizan como clases tomadas y se descuentan de tu plan mensual.
          </p>
        </div>
      </div>
    </section>
  )
}

function Icon({ name, className }: { name: string; className?: string }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const paths: Record<string, ReactNode> = {
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    'calendar-check': <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" /></>,
    x: <><circle cx="12" cy="12" r="9" /><path d="m15 9-6 6M9 9l6 6" /></>,
    hourglass: <><path d="M5 3h14M5 21h14M7 3v5l5 4-5 4v5M17 3v5l-5 4 5 4v5" /></>,
    headphones: <><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1v-8h3zM3 19a2 2 0 0 0 2 2h1v-8H3z" /></>,
    crown: <><path d="M2 8l4 10h12l4-10-6 4-4-7-4 7-6-4z" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></>,
    report: <><path d="M8 3h8l4 4v14H4V3z" /><path d="M14 3v5h5M8 13h8M8 17h5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  }
  return <svg {...common}>{paths[name] ?? paths.calendar}</svg>
}

function formatDateLong(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

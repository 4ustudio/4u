import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { ClassSession } from '@/types/admin'
import { ActivityFeed } from './_components/DashboardLive'
import { getRetentionDashboardData } from './_actions/retention'

export const dynamic = 'force-dynamic'

function getWeekRange() {
  const now   = new Date()
  const day   = now.getDay() || 7
  const start = new Date(now)
  start.setDate(now.getDate() - (day - 1))
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return {
    start: start.toISOString().split('T')[0],
    end:   end.toISOString().split('T')[0],
  }
}

async function getDashboardStats() {
  const supabase = createAdminClient()
  const today    = new Date().toISOString().split('T')[0]
  const week     = getWeekRange()

  const [
    { count: activeStudents },
    { data: todaySessions },
    { data: rooms },
    { data: todayAttendance },
    { data: weekAttendance },
    { count: overdueCount },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('class_sessions')
      .select('*, student:students(name), course:courses(name), classroom:classrooms(name), instructor:instructors(name)')
      .eq('scheduled_date', today)
      .not('status', 'in', '(cancelled,rescheduled)')
      .order('start_time'),
    supabase.from('class_sessions').select('classroom:classrooms(name), classroom_id')
      .eq('scheduled_date', today).not('status', 'in', '(cancelled,rescheduled)'),
    // Métricas de asistencia hoy
    supabase.from('class_sessions').select('attendance_status, status, cancelled_by')
      .eq('scheduled_date', today),
    // Métricas de asistencia semana
    supabase.from('class_sessions').select('attendance_status, status')
      .gte('scheduled_date', week.start)
      .lte('scheduled_date', week.end),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
  ])

  const roomMap: Record<string, number> = {}
  for (const s of rooms ?? []) {
    const name = (s as any).classroom?.name ?? 'Sin salón'
    roomMap[name] = (roomMap[name] ?? 0) + 1
  }
  const roomOccupancy = Object.entries(roomMap).map(([name, count]) => ({ name, count }))

  const todayAll = todayAttendance ?? []
  const weekAll  = weekAttendance  ?? []

  const attendanceToday = {
    confirmed:   todayAll.filter((s: any) => s.attendance_status === 'confirmed').length,
    pending:     todayAll.filter((s: any) => s.attendance_status === 'pending' && !['cancelled','rescheduled'].includes(s.status)).length,
    declined:    todayAll.filter((s: any) => s.attendance_status === 'declined').length,
    no_response: todayAll.filter((s: any) => s.attendance_status === 'no_response').length,
    no_show:     todayAll.filter((s: any) => s.status === 'no_show').length,
    cancelled_by_instructor: todayAll.filter((s: any) => s.cancelled_by === 'instructor').length,
  }

  const weekTotal = weekAll.filter((s: any) => !['cancelled','rescheduled'].includes(s.status)).length
  const weekCompleted = weekAll.filter((s: any) => s.status === 'completed').length
  const weekNoShow    = weekAll.filter((s: any) => s.status === 'no_show').length
  const weekConfirmed = weekAll.filter((s: any) => s.attendance_status === 'confirmed').length

  const attendanceWeek = {
    attendance_rate:    weekCompleted > 0 && weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : null,
    confirmation_rate:  weekTotal > 0 ? Math.round((weekConfirmed / weekTotal) * 100) : null,
    no_show_rate:       weekTotal > 0 ? Math.round((weekNoShow / weekTotal) * 100) : null,
  }

  return {
    activeStudents:   activeStudents ?? 0,
    todaySessions:    (todaySessions as ClassSession[]) ?? [],
    roomOccupancy,
    attendanceToday,
    attendanceWeek,
    overdueCount:     overdueCount ?? 0,
  }
}

const STATUS_LABEL: Record<string, string> = {
  pending:     'Pendiente',
  confirmed:   'Confirmada',
  completed:   'Completada',
  cancelled:   'Cancelada',
  rescheduled: 'Reagendada',
  no_show:     'No asistió',
}

const STATUS_STYLE: Record<string, { background: string; color: string; borderColor: string }> = {
  pending:     { background: 'var(--adm-warning-soft)', color: 'var(--adm-warning)', borderColor: 'color-mix(in srgb, var(--adm-warning) 18%, var(--adm-border) 82%)' },
  confirmed:   { background: 'var(--adm-success-soft)', color: 'var(--adm-success)', borderColor: 'color-mix(in srgb, var(--adm-success) 18%, var(--adm-border) 82%)' },
  completed:   { background: 'var(--adm-success-soft)', color: 'var(--adm-success)', borderColor: 'color-mix(in srgb, var(--adm-success) 18%, var(--adm-border) 82%)' },
  cancelled:   { background: 'var(--adm-danger-soft)', color: 'var(--adm-danger)', borderColor: 'color-mix(in srgb, var(--adm-danger) 18%, var(--adm-border) 82%)' },
  rescheduled: { background: 'var(--adm-info-soft)', color: 'var(--adm-info)', borderColor: 'color-mix(in srgb, var(--adm-info) 18%, var(--adm-border) 82%)' },
  no_show:     { background: 'var(--adm-neutral-soft)', color: 'var(--adm-text-muted)', borderColor: 'var(--adm-border)' },
}

export default async function AdminDashboard() {
  const [stats, retention] = await Promise.all([getDashboardStats(), getRetentionDashboardData()])
  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const retentionDashboard = retention.dashboard as any
  const highRisk = retention.highRisk as any[]

  return (
    <div className="w-full space-y-8 page-animate">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="adm-section-heading text-4xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm capitalize" style={{ color: 'var(--adm-text-muted)' }}>{today}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/agenda" className="adm-button-primary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
            </svg>
            Ver agenda
          </Link>
          <Link href="/admin/students/nuevo" className="adm-button-secondary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/><path d="M19 8v6M16 11h6"/>
            </svg>
            Nuevo estudiante
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-5 xl:grid-cols-4">
        <KpiCard
          title="Estudiantes activos"
          value={String(stats.activeStudents)}
          trend="Total con estado activo"
          icon={<UserIcon />}
        />
        <KpiCard
          title="Clases hoy"
          value={String(stats.todaySessions.length)}
          trend="Programadas para hoy"
          icon={<CalendarIcon />}
        />
        <KpiCard
          title="Cobros vencidos"
          value={String(stats.overdueCount)}
          trend="Pagos sin saldar"
          icon={<AlertIcon />}
        />
        <KpiCard
          title="Sin próxima clase"
          value={String(retentionDashboard?.without_upcoming_sessions ?? 0)}
          trend="Alumnos activos sin sesión"
          icon={<NoSessionIcon />}
        />
      </section>

      {/* Dashboard Operativo — Asistencia */}
      <section>
        <DashCard
          title="Operación académica hoy"
          subtitle="Estado de confirmaciones y asistencia"
          action={<Link href="/admin/agenda" className="adm-link-accent text-xs font-semibold transition-colors">Ver agenda →</Link>}
        >
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
            <OpsMetric label="Confirmadas"   value={stats.attendanceToday.confirmed}              tone="green" />
            <OpsMetric label="Pendientes"    value={stats.attendanceToday.pending}                tone="yellow" />
            <OpsMetric label="Rechazadas"    value={stats.attendanceToday.declined}               tone="red" />
            <OpsMetric label="Sin respuesta" value={stats.attendanceToday.no_response}            tone="gray" />
            <OpsMetric label="No asistió"    value={stats.attendanceToday.no_show}                tone="gray" />
            <OpsMetric label="Cancel. instructor" value={stats.attendanceToday.cancelled_by_instructor} tone="orange" />
          </div>
          {(stats.attendanceWeek.attendance_rate !== null || stats.attendanceWeek.confirmation_rate !== null || stats.attendanceWeek.no_show_rate !== null) && (
            <div className="mt-5 flex flex-wrap gap-6 border-t pt-4" style={{ borderTopColor: 'var(--adm-border)' }}>
              {stats.attendanceWeek.confirmation_rate !== null && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--adm-text-faint)' }}>Confirmación semanal</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--adm-title)' }}>{stats.attendanceWeek.confirmation_rate}%</p>
                </div>
              )}
              {stats.attendanceWeek.attendance_rate !== null && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--adm-text-faint)' }}>Asistencia semanal</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--adm-title)' }}>{stats.attendanceWeek.attendance_rate}%</p>
                </div>
              )}
              {stats.attendanceWeek.no_show_rate !== null && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--adm-text-faint)' }}>Tasa No Show semanal</p>
                  <p
                    className="text-xl font-bold"
                    style={{ color: (stats.attendanceWeek.no_show_rate ?? 0) > 20 ? 'var(--adm-danger)' : 'var(--adm-title)' }}
                  >
                    {stats.attendanceWeek.no_show_rate}%
                  </p>
                </div>
              )}
            </div>
          )}
        </DashCard>
      </section>

      {/* Retención + Mayor riesgo */}
      <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <DashCard
          title="Retención de estudiantes"
          subtitle="Alertas operativas para priorizar seguimiento"
          action={<Link href="/admin/reactivacion" className="adm-link-accent text-xs font-semibold transition-colors">Abrir módulo →</Link>}
        >
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniRetention label="En riesgo"      value={retentionDashboard?.risk_students ?? 0}                 tone="yellow" />
            <MiniRetention label="Inactivos"      value={retentionDashboard?.inactive_students ?? 0}             tone="red" />
            <MiniRetention label="Planes vencen"  value={retentionDashboard?.plans_expiring_week ?? 0}           tone="orange" />
            <MiniRetention label="Sin próximas"   value={retentionDashboard?.without_upcoming_sessions ?? 0}     tone="blue" />
          </div>
        </DashCard>

        <DashCard title="Mayor riesgo" subtitle="Alumnos priorizados">
          <div className="mt-3 space-y-2">
            {highRisk.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--adm-text-faint)' }}>Sin alumnos priorizados.</p>
            ) : highRisk.slice(0, 4).map((student) => (
              <Link key={student.id} href={`/admin/students/${student.id}`}
                className="adm-row flex items-center justify-between rounded-xl border px-3 py-3 transition-colors">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: 'var(--adm-title)' }}>{student.name}</p>
                  <p className="text-[11px]" style={{ color: 'var(--adm-text-faint)' }}>{student.days_since_activity} días sin actividad</p>
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--adm-danger)' }}>{student.retention_score ?? 0}</span>
              </Link>
            ))}
          </div>
        </DashCard>
      </section>

      {/* Actividad en tiempo real */}
      <DashCard title="Actividad reciente" subtitle="Eventos en tiempo real — esta sesión" badge>
        <ActivityFeed />
      </DashCard>

      {/* Clases de hoy + Salones */}
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <DashCard
          title="Clases de hoy"
          subtitle="Puedes gestionar cada clase desde la agenda"
          action={<Link href="/admin/agenda" className="adm-link-accent text-xs font-semibold transition-colors">Abrir agenda →</Link>}
        >
          {stats.todaySessions.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm" style={{ color: 'var(--adm-text-faint)' }}>No hay clases programadas para hoy.</p>
              <Link href="/admin/agenda" className="adm-link-accent inline-block mt-3 text-xs font-medium hover:underline">
                Ir a la agenda para crear una →
              </Link>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              {stats.todaySessions.map((s) => (
                <div key={s.id} className="adm-row flex items-center gap-4 rounded-2xl border px-4 py-3.5 transition-colors">
                  <div className="text-center shrink-0 w-12">
                    <p className="text-sm font-bold font-mono" style={{ color: 'var(--adm-title)' }}>{s.start_time.slice(0, 5)}</p>
                    <p className="text-[10px]" style={{ color: 'var(--adm-text-faint)' }}>hs</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: 'var(--adm-title)' }}>{(s.student as any)?.name ?? '—'}</p>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--adm-text-muted)' }}>{(s.course as any)?.name} · {(s.classroom as any)?.name}</p>
                  </div>
                  <span
                    className="adm-status-pill shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={STATUS_STYLE[s.status] ?? STATUS_STYLE.no_show}
                  >
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashCard>

        <DashCard title="Disponibilidad de salones" subtitle="Estado actual para hoy">
          <div className="mt-4 space-y-3">
            {['Salón 1', 'Salón 2', 'Salón 3'].map((room) => {
              const occ = stats.roomOccupancy.find((r) => r.name === room)
              return (
                <div key={room} className="adm-row flex items-center justify-between rounded-2xl border px-3.5 py-3 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: occ ? 'var(--adm-accent)' : 'var(--adm-success)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--adm-title)' }}>{room}</span>
                  </div>
                  <span
                    className="adm-status-pill rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={occ
                      ? { background: 'var(--adm-accent-soft)', color: 'var(--adm-accent-strong)', borderColor: 'var(--adm-accent-border)' }
                      : { background: 'var(--adm-success-soft)', color: 'var(--adm-success)', borderColor: 'color-mix(in srgb, var(--adm-success) 18%, var(--adm-border) 82%)' }}
                  >
                    {occ ? `${occ.count} clase${occ.count !== 1 ? 's' : ''}` : 'Libre'}
                  </span>
                </div>
              )
            })}
          </div>
        </DashCard>
      </div>
    </div>
  )
}

function KpiCard({ title, value, trend, icon }: { title: string; value: string; trend: string; icon: React.ReactNode }) {
  return (
    <div className="adm-panel adm-kpi-shell rounded-[30px] p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--adm-text-faint)' }}>{title}</p>
          <p className="mt-6 text-[2.8rem] font-extrabold leading-none tracking-tight" style={{ color: 'var(--adm-accent)' }}>{value}</p>
          <p className="mt-3 text-sm leading-6" style={{ color: 'var(--adm-text-muted)' }}>{trend}</p>
        </div>
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] border"
          style={{ borderColor: 'var(--adm-accent-border)', background: 'var(--adm-accent-soft)', color: 'var(--adm-accent)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)' }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

function DashCard({
  title, subtitle, action, badge, children,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  badge?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="adm-panel rounded-[30px] p-6 lg:p-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="adm-section-heading text-[1.45rem] font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1.5 text-sm leading-6" style={{ color: 'var(--adm-text-muted)' }}>{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {action}
          {badge && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--adm-success)' }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: 'var(--adm-success)' }} />
            </span>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

function MiniRetention({ label, value, tone }: { label: string; value: number; tone: 'yellow' | 'red' | 'orange' | 'blue' }) {
  const colors = {
    yellow: 'var(--adm-warning)',
    red: 'var(--adm-danger)',
    orange: 'var(--adm-info)',
    blue: 'var(--adm-accent)',
  }
  return (
    <div className="adm-panel-muted rounded-[22px] px-4 py-4">
      <p className="text-[2.15rem] font-extrabold leading-none" style={{ color: colors[tone] }}>{value}</p>
      <p className="mt-1.5 text-[11px] font-medium" style={{ color: 'var(--adm-text-muted)' }}>{label}</p>
    </div>
  )
}

function OpsMetric({ label, value, tone }: { label: string; value: number; tone: 'green' | 'yellow' | 'red' | 'gray' | 'orange' }) {
  const colors = {
    green:  'var(--adm-success)',
    yellow: 'var(--adm-warning)',
    red:    'var(--adm-danger)',
    gray:   'var(--adm-text-muted)',
    orange: 'var(--adm-info)',
  }
  return (
    <div className="adm-panel-muted rounded-[22px] px-4 py-4">
      <p className="text-[2.15rem] font-extrabold leading-none" style={{ color: colors[tone] }}>{value}</p>
      <p className="mt-1.5 text-[11px] font-medium leading-tight" style={{ color: 'var(--adm-text-muted)' }}>{label}</p>
    </div>
  )
}

function UserIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>
    </svg>
  )
}

function NoSessionIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="m9 14 2 2 4-4"/>
    </svg>
  )
}

function RoomIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

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
    { count: weekCount },
    { data: rooms },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('class_sessions')
      .select('*, student:students(name), course:courses(name), classroom:classrooms(name), instructor:instructors(name)')
      .eq('scheduled_date', today)
      .not('status', 'in', '(cancelled,rescheduled)')
      .order('start_time'),
    supabase.from('class_sessions').select('*', { count: 'exact', head: true })
      .gte('scheduled_date', week.start).lte('scheduled_date', week.end)
      .not('status', 'in', '(cancelled,rescheduled)'),
    supabase.from('class_sessions').select('classroom:classrooms(name), classroom_id')
      .eq('scheduled_date', today).not('status', 'in', '(cancelled,rescheduled)'),
  ])

  const roomMap: Record<string, number> = {}
  for (const s of rooms ?? []) {
    const name = (s as any).classroom?.name ?? 'Sin salón'
    roomMap[name] = (roomMap[name] ?? 0) + 1
  }
  const roomOccupancy = Object.entries(roomMap).map(([name, count]) => ({ name, count }))

  return {
    activeStudents:   activeStudents ?? 0,
    todaySessions:    (todaySessions as ClassSession[]) ?? [],
    weekSessionCount: weekCount ?? 0,
    roomOccupancy,
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

const STATUS_COLOR: Record<string, string> = {
  pending:     'bg-yellow-900/40 text-yellow-400',
  confirmed:   'bg-green-900/40 text-green-400',
  completed:   'bg-blue-900/40 text-blue-400',
  cancelled:   'bg-red-900/40 text-red-400',
  rescheduled: 'bg-purple-900/40 text-purple-400',
  no_show:     'bg-white/5 text-white/40',
}

export default async function AdminDashboard() {
  const [stats, retention] = await Promise.all([getDashboardStats(), getRetentionDashboardData()])
  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const retentionDashboard = retention.dashboard as any
  const highRisk = retention.highRisk as any[]

  return (
    <div className="space-y-6 w-full page-animate">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-white/40 capitalize">{today}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/agenda" className="inline-flex items-center gap-2 rounded-2xl border border-[#ff7a00]/20 bg-[#ff7a00]/8 px-4 py-2.5 text-sm font-semibold text-[#ff9a3b] transition-colors hover:bg-[#ff7a00]/14">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
            </svg>
            Ver agenda
          </Link>
          <Link href="/admin/students/nuevo" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/><path d="M19 8v6M16 11h6"/>
            </svg>
            Nuevo estudiante
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
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
          title="Clases esta semana"
          value={String(stats.weekSessionCount)}
          trend="Lunes a domingo"
          icon={<WeekIcon />}
        />
        <KpiCard
          title="Salones en uso"
          value={String(stats.roomOccupancy.length)}
          trend="Con al menos una clase hoy"
          icon={<RoomIcon />}
        />
      </section>

      {/* Retención + Mayor riesgo */}
      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <DashCard
          title="Retención de estudiantes"
          subtitle="Alertas operativas para priorizar seguimiento"
          action={<Link href="/admin/reactivacion" className="text-xs text-[#ff9a3b] hover:text-[#ff7a00] font-medium transition-colors">Abrir módulo →</Link>}
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
              <p className="text-xs text-white/35">Sin alumnos priorizados.</p>
            ) : highRisk.slice(0, 4).map((student) => (
              <Link key={student.id} href={`/admin/students/${student.id}`}
                className="flex items-center justify-between rounded-xl border border-white/6 bg-black/20 px-3 py-2.5 transition-colors hover:border-[#ff7a00]/25">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">{student.name}</p>
                  <p className="text-[10px] text-white/30">{student.days_since_activity} días sin actividad</p>
                </div>
                <span className="text-xs font-bold text-red-300">{student.retention_score ?? 0}</span>
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
      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <DashCard
          title="Clases de hoy"
          subtitle="Puedes gestionar cada clase desde la agenda"
          action={<Link href="/admin/agenda" className="text-xs text-[#ff9a3b] hover:text-[#ff7a00] font-medium transition-colors">Abrir agenda →</Link>}
        >
          {stats.todaySessions.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-white/35 text-sm">No hay clases programadas para hoy.</p>
              <Link href="/admin/agenda" className="inline-block mt-3 text-xs text-[#ff9a3b] hover:underline">
                Ir a la agenda para crear una →
              </Link>
            </div>
          ) : (
            <div className="mt-1 divide-y divide-white/5">
              {stats.todaySessions.map((s) => (
                <div key={s.id} className="flex items-center gap-4 py-3.5">
                  <div className="text-center shrink-0 w-12">
                    <p className="text-sm font-bold text-white/80 font-mono">{s.start_time.slice(0, 5)}</p>
                    <p className="text-[10px] text-white/30">hs</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">{(s.student as any)?.name ?? '—'}</p>
                    <p className="text-xs text-white/40 mt-0.5">{(s.course as any)?.name} · {(s.classroom as any)?.name}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_COLOR[s.status] ?? 'bg-white/5 text-white/40'}`}>
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
                <div key={room} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${occ ? 'bg-[#ff7a00]' : 'bg-green-400'}`} />
                    <span className="text-sm text-white/70">{room}</span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    occ ? 'bg-[#ff7a00]/12 text-[#ff9a3b]' : 'bg-green-900/30 text-green-400'
                  }`}>
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
    <div className="rounded-[28px] border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/35">{title}</p>
          <p className="mt-5 text-3xl font-bold tracking-tight text-[#ff7a00]">{value}</p>
          <p className="mt-3 text-xs text-white/40">{trend}</p>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#ff7a00]/20 bg-[#ff7a00]/8 text-[#ff7a00]">
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
    <div className="rounded-[28px] border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)] lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {action}
          {badge && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

function MiniRetention({ label, value, tone }: { label: string; value: number; tone: 'yellow' | 'red' | 'orange' | 'blue' }) {
  const colors = { yellow: 'text-yellow-300', red: 'text-red-300', orange: 'text-[#ff9a3b]', blue: 'text-blue-300' }
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-3">
      <p className={`text-2xl font-black ${colors[tone]}`}>{value}</p>
      <p className="text-[11px] text-white/35 mt-0.5">{label}</p>
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

function WeekIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
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

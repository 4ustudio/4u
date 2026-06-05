import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { ClassSession } from '@/types/admin'
import { ActivityFeed } from './_components/DashboardLive'
import { getRetentionDashboardData } from './_actions/retention'

export const dynamic = 'force-dynamic'

function getWeekRange() {
  const now   = new Date()
  const day   = now.getDay() || 7           // 1=Lun … 7=Dom
  const start = new Date(now)
  start.setDate(now.getDate() - (day - 1))  // lunes
  const end = new Date(start)
  end.setDate(start.getDate() + 6)          // domingo
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
    supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),

    supabase
      .from('class_sessions')
      .select('*, student:students(name), course:courses(name), classroom:classrooms(name), instructor:instructors(name)')
      .eq('scheduled_date', today)
      .not('status', 'in', '(cancelled,rescheduled)')
      .order('start_time'),

    supabase
      .from('class_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('scheduled_date', week.start)
      .lte('scheduled_date', week.end)
      .not('status', 'in', '(cancelled,rescheduled)'),

    supabase
      .from('class_sessions')
      .select('classroom:classrooms(name), classroom_id')
      .eq('scheduled_date', today)
      .not('status', 'in', '(cancelled,rescheduled)'),
  ])

  // Ocupación de salones hoy
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
  no_show:     'bg-gray-800 text-gray-400',
}

export default async function AdminDashboard() {
  const [stats, retention] = await Promise.all([getDashboardStats(), getRetentionDashboardData()])
  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const retentionDashboard = retention.dashboard as any
  const highRisk = retention.highRisk as any[]

  return (
    <div className="space-y-6 w-full page-animate">
      {/* Bienvenida */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Bienvenido al panel</h1>
          <p className="text-sm text-white/40 capitalize mt-0.5">{today}</p>
        </div>
      </div>

      {/* Acciones rápidas */}
      <section>
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Acciones rápidas</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link
            href="/admin/agenda"
            className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 transition-colors rounded-xl px-4 py-3.5"
          >
            <svg className="h-5 w-5 text-white shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
            </svg>
            <div>
              <p className="text-sm font-bold text-white">Ver agenda</p>
              <p className="text-[11px] text-white/70">Clases y estudiantes</p>
            </div>
          </Link>
          <Link
            href="/admin/students/nuevo"
            className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-white/10 transition-colors rounded-xl px-4 py-3.5"
          >
            <svg className="h-5 w-5 text-white/60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/><path d="M19 8v6M16 11h6"/>
            </svg>
            <div>
              <p className="text-sm font-bold text-white">Nuevo estudiante</p>
              <p className="text-[11px] text-white/40">Registrar en el sistema</p>
            </div>
          </Link>
          <div className="flex items-center gap-3 bg-gray-900 border border-white/10 rounded-xl px-4 py-3.5">
            <svg className="h-5 w-5 text-white/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
            <div>
              <p className="text-sm font-semibold text-white/50">Próximamente</p>
              <p className="text-[11px] text-white/25">Más funciones</p>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section>
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Resumen de hoy</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Estudiantes activos" value={stats.activeStudents} color="orange" hint="Total de estudiantes con estado activo" />
          <KpiCard label="Clases hoy"           value={stats.todaySessions.length} color="blue"   hint="Clases programadas para el día de hoy" />
          <KpiCard label="Clases esta semana"   value={stats.weekSessionCount}      color="green"  hint="Total de clases de lunes a domingo" />
          <KpiCard label="Salones en uso hoy"   value={stats.roomOccupancy.length}  color="purple" hint="Salones con al menos una clase hoy" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-sm text-white">Retención de estudiantes</h2>
              <p className="text-xs text-white/30 mt-0.5">Alertas operativas para priorizar seguimiento</p>
            </div>
            <Link href="/admin/reactivacion" className="text-xs text-orange-400 hover:text-orange-300 font-medium">
              Abrir módulo →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniRetention label="En riesgo" value={retentionDashboard?.risk_students ?? 0} tone="yellow" />
            <MiniRetention label="Inactivos" value={retentionDashboard?.inactive_students ?? 0} tone="red" />
            <MiniRetention label="Planes vencen" value={retentionDashboard?.plans_expiring_week ?? 0} tone="orange" />
            <MiniRetention label="Sin próximas" value={retentionDashboard?.without_upcoming_sessions ?? 0} tone="blue" />
          </div>
        </div>

        <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
          <h2 className="font-semibold text-sm text-white">Mayor riesgo</h2>
          <div className="mt-3 space-y-2">
            {highRisk.length === 0 ? (
              <p className="text-xs text-white/35">Sin alumnos priorizados.</p>
            ) : highRisk.slice(0, 4).map((student) => (
              <Link key={student.id} href={`/admin/students/${student.id}`} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2 hover:border-orange-500/25">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">{student.name}</p>
                  <p className="text-[10px] text-white/30">{student.days_since_activity} días sin actividad</p>
                </div>
                <span className="text-xs font-bold text-red-300">{student.retention_score ?? 0}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Actividad en tiempo real */}
      <section className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="font-semibold text-sm text-white">Actividad reciente</h2>
            <p className="text-xs text-white/30 mt-0.5">Eventos en tiempo real — esta sesión</p>
          </div>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
        </div>
        <ActivityFeed />
      </section>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Clases de hoy */}
        <section className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <h2 className="font-semibold text-sm text-white">Clases de hoy</h2>
              <p className="text-xs text-white/30 mt-0.5">Puedes gestionar cada clase desde la agenda</p>
            </div>
            <Link href="/admin/agenda" className="text-xs text-orange-400 hover:text-orange-300 font-medium">
              Abrir agenda →
            </Link>
          </div>

          {stats.todaySessions.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-white/35 text-sm">No hay clases programadas para hoy.</p>
              <Link href="/admin/agenda" className="inline-block mt-3 text-xs text-orange-400 hover:underline">
                Ir a la agenda para crear una →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {stats.todaySessions.map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="text-center shrink-0 w-12">
                    <p className="text-sm font-bold text-white/80 font-mono">{s.start_time.slice(0, 5)}</p>
                    <p className="text-[10px] text-white/30">hs</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">{(s.student as any)?.name ?? '—'}</p>
                    <p className="text-xs text-white/40 mt-0.5">{(s.course as any)?.name} · {(s.classroom as any)?.name}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_COLOR[s.status] ?? 'bg-gray-800 text-gray-400'}`}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Ocupación de salones */}
        <section className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold text-sm text-white">Disponibilidad de salones</h2>
            <p className="text-xs text-white/30 mt-0.5">Estado actual para hoy</p>
          </div>
          <div className="p-5 space-y-3">
            {['Salón 1', 'Salón 2', 'Salón 3'].map((room) => {
              const occ = stats.roomOccupancy.find((r) => r.name === room)
              return (
                <div key={room} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${occ ? 'bg-orange-400' : 'bg-green-400'}`} />
                    <span className="text-sm text-white/70">{room}</span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    occ ? 'bg-orange-900/40 text-orange-400' : 'bg-green-900/30 text-green-400'
                  }`}>
                    {occ ? `${occ.count} clase${occ.count !== 1 ? 's' : ''}` : 'Libre'}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

function MiniRetention({ label, value, tone }: { label: string; value: number; tone: 'yellow' | 'red' | 'orange' | 'blue' }) {
  const colors = {
    yellow: 'text-yellow-300',
    red: 'text-red-300',
    orange: 'text-orange-300',
    blue: 'text-blue-300',
  }
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-3">
      <p className={`text-2xl font-black ${colors[tone]}`}>{value}</p>
      <p className="text-[11px] text-white/35">{label}</p>
    </div>
  )
}

function KpiCard({ label, value, color, hint }: { label: string; value: number; color: 'orange' | 'blue' | 'green' | 'purple'; hint?: string }) {
  const colors = {
    orange: 'text-orange-400',
    blue:   'text-blue-400',
    green:  'text-green-400',
    purple: 'text-purple-400',
  }
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl px-5 py-4">
      <p className="text-xs text-white/40 mb-1 leading-tight">{label}</p>
      <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
      {hint && <p className="text-[10px] text-white/20 mt-1.5 leading-tight">{hint}</p>}
    </div>
  )
}

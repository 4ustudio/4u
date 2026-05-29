import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { ClassSession } from '@/types/admin'

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
  const stats = await getDashboardStats()
  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white/40 capitalize mt-0.5">{today}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Estudiantes activos" value={stats.activeStudents} color="orange" />
        <KpiCard label="Clases hoy"           value={stats.todaySessions.length} color="blue" />
        <KpiCard label="Clases esta semana"   value={stats.weekSessionCount} color="green" />
        <KpiCard label="Salones ocupados hoy" value={stats.roomOccupancy.length} color="purple" />
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Clases de hoy */}
        <section className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold text-sm text-white">Clases de hoy</h2>
            <Link href="/admin/agenda" className="text-xs text-orange-400 hover:text-orange-300">
              Ver agenda →
            </Link>
          </div>

          {stats.todaySessions.length === 0 ? (
            <p className="px-5 py-8 text-center text-white/35 text-sm">No hay clases programadas para hoy.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {stats.todaySessions.map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="text-sm font-mono text-white/60 w-14 shrink-0">
                    {s.start_time.slice(0, 5)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{(s.student as any)?.name ?? '—'}</p>
                    <p className="text-xs text-white/40">{(s.course as any)?.name} · {(s.classroom as any)?.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[s.status] ?? 'bg-gray-800 text-gray-400'}`}>
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
            <h2 className="font-semibold text-sm text-white">Salones hoy</h2>
          </div>
          <div className="p-5 space-y-3">
            {['Salón 1', 'Salón 2', 'Salón 3'].map((room) => {
              const occ = stats.roomOccupancy.find((r) => r.name === room)
              return (
                <div key={room} className="flex items-center justify-between">
                  <span className="text-sm text-white/70">{room}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${occ ? 'bg-orange-900/40 text-orange-400' : 'bg-white/5 text-white/30'}`}>
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

function KpiCard({ label, value, color }: { label: string; value: number; color: 'orange' | 'blue' | 'green' | 'purple' }) {
  const colors = {
    orange: 'text-orange-400',
    blue:   'text-blue-400',
    green:  'text-green-400',
    purple: 'text-purple-400',
  }
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl px-5 py-4">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  )
}

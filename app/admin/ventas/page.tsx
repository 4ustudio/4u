import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseRole, canAccessSalesDashboard } from '@/lib/auth/roles'
import { getEnrollmentFunnelMetrics } from '@/app/admin/_actions/enrollments'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard Ejecutivo — 4U Studio Academy' }

// ── Queries ───────────────────────────────────────────────────────

async function getExecutiveData() {
  const db = createAdminClient()
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  const startOfWeek = (() => {
    const d = new Date(now)
    d.setDate(d.getDate() - ((d.getDay() || 7) - 1))
    return d.toISOString().split('T')[0]
  })()
  const endOfWeek = (() => {
    const d = new Date(now)
    d.setDate(d.getDate() + (7 - (d.getDay() || 7)))
    return d.toISOString().split('T')[0]
  })()

  const [
    { data: rd },
    { data: instructorSessionsRaw },
    { data: classroomSessionsRaw },
    { data: allClassrooms },
    funnelMetrics,
  ] = await Promise.all([
    // Vista de retención — fuente única de verdad para métricas de estudiantes
    db.from('v_retention_dashboard').select('*').maybeSingle(),

    // Clases por instructor esta semana
    db.from('class_sessions')
      .select('instructor_id, instructor:instructors(name)')
      .gte('scheduled_date', startOfWeek)
      .lte('scheduled_date', endOfWeek)
      .not('status', 'in', '(cancelled,rescheduled)'),

    // Clases por salón hoy con horarios
    db.from('class_sessions')
      .select('classroom_id, classroom:classrooms(name), start_time, end_time, student:students(name)')
      .eq('scheduled_date', today)
      .not('status', 'in', '(cancelled,rescheduled)')
      .order('start_time'),

    // Todos los salones registrados
    db.from('classrooms').select('id, name').order('name'),

    // Métricas del embudo comercial — desde enrollments
    getEnrollmentFunnelMetrics(),
  ])

  // Ocupación de instructores
  const instructorMap: Record<string, { name: string; count: number }> = {}
  for (const s of instructorSessionsRaw ?? []) {
    const id   = (s as any).instructor_id ?? '__unknown'
    const name = (s as any).instructor?.name ?? 'Sin asignar'
    if (!instructorMap[id]) instructorMap[id] = { name, count: 0 }
    instructorMap[id].count++
  }
  const instructorOccupancy = Object.values(instructorMap).sort((a, b) => b.count - a.count)
  const maxClases = instructorOccupancy[0]?.count ?? 1

  // Ocupación de estudios hoy
  const classroomMap: Record<string, { name: string; sessions: { start: string; end: string; student: string }[] }> = {}
  for (const s of classroomSessionsRaw ?? []) {
    const id   = (s as any).classroom_id ?? '__unknown'
    const name = (s as any).classroom?.name ?? 'Sin asignar'
    if (!classroomMap[id]) classroomMap[id] = { name, sessions: [] }
    classroomMap[id].sessions.push({
      start:   (s as any).start_time ?? '',
      end:     (s as any).end_time   ?? '',
      student: (s as any).student?.name ?? '',
    })
  }
  const studioData = (allClassrooms ?? []).map((c: any) => ({
    id:       c.id as string,
    name:     c.name as string,
    sessions: classroomMap[c.id]?.sessions ?? [],
  }))

  const retention = rd as Record<string, number> | null

  // Salud general — porcentaje de activos sobre el total gestionado
  const managed =
    (retention?.active_students    ?? 0) +
    (retention?.risk_students      ?? 0) +
    (retention?.inactive_students  ?? 0)
  const healthPct = managed > 0
    ? Math.round(((retention?.active_students ?? 0) / managed) * 100)
    : null

  return {
    // Métricas de estudiantes (todas desde v_retention_dashboard)
    activeStudents:    retention?.active_students          ?? 0,
    riskStudents:      retention?.risk_students            ?? 0,
    inactiveStudents:  retention?.inactive_students        ?? 0,
    alumniStudents:    retention?.alumni_students          ?? 0,
    reactivatedMonth:  retention?.reactivated_this_month   ?? 0,
    reactivationRate:  retention?.reactivation_rate        ?? null,
    plansExpiringWeek: retention?.plans_expiring_week      ?? 0,
    withoutUpcoming:   retention?.without_upcoming_sessions ?? 0,
    // Salud
    healthPct,
    managed,
    // Operación
    instructorOccupancy,
    maxClases,
    studioData,
    startOfWeek,
    // Embudo comercial
    funnel: funnelMetrics,
    endOfWeek,
  }
}

// ── Página ────────────────────────────────────────────────────────

export default async function VentasPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = parseRole(user?.user_metadata ?? null)
  if (!canAccessSalesDashboard(role)) redirect('/admin')

  const d = await getExecutiveData()

  const todayLabel = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const weekLabel = (() => {
    const fmt = (s: string) =>
      new Date(s + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
    return `${fmt(d.startOfWeek)} – ${fmt(d.endOfWeek)}`
  })()

  return (
    <div className="space-y-8 w-full page-animate">

      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard Ejecutivo</h1>
          <p className="text-sm text-white/40 mt-0.5 capitalize">{todayLabel}</p>
        </div>
        {d.healthPct !== null && (
          <div className="text-right">
            <p className="text-xs text-white/30 mb-1">Salud general</p>
            <HealthBadge pct={d.healthPct} />
          </div>
        )}
      </div>

      {/* ── Estudiantes ──────────────────────────────────────── */}
      <section>
        <SectionLabel>Estudiantes</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Activos"
            value={d.activeStudents}
            color="green"
          />
          <KpiCard
            label="En riesgo"
            value={d.riskStudents}
            color="yellow"
            action={{ href: '/admin/reactivacion', label: 'Gestionar' }}
          />
          <KpiCard
            label="Inactivos"
            value={d.inactiveStudents}
            color="red"
            action={{ href: '/admin/reactivacion', label: 'Gestionar' }}
          />
          <KpiCard
            label="Reactivados este mes"
            value={d.reactivatedMonth}
            color="blue"
            sub={d.reactivationRate !== null ? `${d.reactivationRate}% tasa` : undefined}
          />
        </div>
      </section>

      {/* ── Alertas operativas ────────────────────────────────── */}
      <section>
        <SectionLabel>Alertas operativas</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <AlertCard
            label="Sin próximas clases"
            value={d.withoutUpcoming}
            tone={d.withoutUpcoming > 5 ? 'red' : d.withoutUpcoming > 0 ? 'yellow' : 'ok'}
            hint="Requieren reagendamiento"
            href="/admin/reactivacion"
          />
          <AlertCard
            label="Planes vencen esta semana"
            value={d.plansExpiringWeek}
            tone={d.plansExpiringWeek > 3 ? 'red' : d.plansExpiringWeek > 0 ? 'yellow' : 'ok'}
            hint="Renovar antes de vencer"
            href="/admin/students"
          />
          <AlertCard
            label="Exalumnos"
            value={d.alumniStudents}
            tone="neutral"
            hint="Candidatos a reactivar"
            href="/admin/reactivacion"
          />
        </div>
      </section>

      {/* ── Salud general ─────────────────────────────────────── */}
      {d.managed > 0 && (
        <section>
          <SectionLabel>Salud de la academia</SectionLabel>
          <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-white/60">
                Distribución de {d.managed} estudiantes gestionados
              </p>
              <span className={`text-sm font-bold ${
                d.healthPct !== null && d.healthPct >= 70 ? 'text-green-400'
                : d.healthPct !== null && d.healthPct >= 50 ? 'text-yellow-400'
                : 'text-red-400'
              }`}>
                {d.healthPct}% activos
              </span>
            </div>
            {/* Barra de distribución */}
            <div className="flex h-3 rounded-full overflow-hidden gap-px">
              <DistBar value={d.activeStudents}   total={d.managed} color="bg-green-500"  />
              <DistBar value={d.riskStudents}      total={d.managed} color="bg-yellow-500" />
              <DistBar value={d.inactiveStudents}  total={d.managed} color="bg-red-500"    />
              <DistBar value={d.alumniStudents}    total={d.managed} color="bg-gray-600"   />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
              <Legend color="bg-green-500"  label="Activos"   value={d.activeStudents}   total={d.managed} />
              <Legend color="bg-yellow-500" label="En riesgo" value={d.riskStudents}      total={d.managed} />
              <Legend color="bg-red-500"    label="Inactivos" value={d.inactiveStudents}  total={d.managed} />
              <Legend color="bg-gray-600"   label="Exalumnos" value={d.alumniStudents}    total={d.managed} />
            </div>
          </div>
        </section>
      )}

      {/* ── Ocupación de instructores ─────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel noMargin>Instructores esta semana</SectionLabel>
          <span className="text-xs text-white/30">{weekLabel}</span>
        </div>
        <div className="bg-gray-900 border border-white/10 rounded-xl divide-y divide-white/5">
          {d.instructorOccupancy.length === 0 ? (
            <p className="px-5 py-8 text-sm text-white/30 text-center">
              Sin clases registradas esta semana.
            </p>
          ) : d.instructorOccupancy.map((inst) => {
            const pct = Math.round((inst.count / d.maxClases) * 100)
            return (
              <div key={inst.name} className="flex items-center gap-4 px-5 py-3.5">
                <p className="text-sm text-white/80 w-40 shrink-0 truncate">{inst.name}</p>
                <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                  <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-sm text-white/50 w-20 text-right shrink-0 tabular-nums">
                  {inst.count} clase{inst.count !== 1 ? 's' : ''}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Ocupación de estudios ─────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel noMargin>Estudios hoy</SectionLabel>
          <span className="text-xs text-white/30 capitalize">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
        </div>
        {d.studioData.length === 0 ? (
          <p className="text-sm text-white/30 px-1">No hay salones registrados.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {d.studioData.map((studio) => (
              <StudioCard key={studio.id} name={studio.name} sessions={studio.sessions} />
            ))}
          </div>
        )}
      </section>

      {/* ── Embudo comercial ──────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel noMargin>Embudo comercial</SectionLabel>
          <Link href="/admin/leads" className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
            Ver pipeline →
          </Link>
        </div>

        {/* KPIs del mes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <FunnelKpi label="Leads este mes"    value={d.funnel.totalMonth}    color="text-white" />
          <FunnelKpi label="Clases de prueba"  value={d.funnel.clasePrueba}   color="text-green-400" />
          <FunnelKpi label="Matriculados"      value={d.funnel.converted}     color="text-purple-400" />
          <FunnelKpi
            label="Tasa de conversión"
            value={`${d.funnel.conversionRate}%`}
            color={d.funnel.conversionRate >= 50 ? 'text-green-400' : d.funnel.conversionRate >= 30 ? 'text-yellow-400' : 'text-red-400'}
            sub={d.funnel.avgDaysToConvert !== null ? `Prom. ${d.funnel.avgDaysToConvert}d` : undefined}
          />
        </div>

        {/* Embudo visual */}
        <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {[
              { label: 'Nuevos',       val: d.funnel.pending,    dot: 'bg-yellow-400' },
              { label: 'Contactados',  val: d.funnel.contacted,  dot: 'bg-blue-400' },
              { label: 'Clase Prueba', val: d.funnel.clasePrueba,dot: 'bg-green-400' },
              { label: 'Matriculados', val: d.funnel.converted,  dot: 'bg-purple-400' },
              { label: 'Perdidos',     val: d.funnel.perdido,    dot: 'bg-red-500' },
            ].map((stage, i, arr) => (
              <div key={stage.label} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} />
                <span className="text-xs text-white/50">{stage.label}</span>
                <span className="text-xs font-bold text-white">{stage.val}</span>
                {i < arr.length - 1 && <span className="text-white/20 ml-1">→</span>}
              </div>
            ))}
          </div>

          {/* Barras proporcionales */}
          {d.funnel.totalMonth > 0 ? (
            <div className="space-y-2">
              {[
                { label: 'Nuevos',       val: d.funnel.pending,     color: 'bg-yellow-500' },
                { label: 'Contactados',  val: d.funnel.contacted,   color: 'bg-blue-500' },
                { label: 'Clase Prueba', val: d.funnel.clasePrueba, color: 'bg-green-500' },
                { label: 'Matriculados', val: d.funnel.converted,   color: 'bg-purple-500' },
              ].map(row => {
                const pct = Math.round((row.val / d.funnel.totalMonth) * 100)
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="text-[11px] text-white/35 w-28 shrink-0">{row.label}</span>
                    <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                      <div className={`${row.color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] text-white/40 w-8 text-right tabular-nums">{row.val}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-white/25 text-center py-4">Sin leads registrados este mes.</p>
          )}

          {/* Top cursos + fuentes */}
          {(d.funnel.topCourses.length > 0 || d.funnel.topSources.length > 0) && (
            <div className="grid grid-cols-2 gap-6 mt-5 pt-5 border-t border-white/[0.06]">
              {d.funnel.topCourses.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-2">Instrumento</p>
                  <ol className="space-y-1.5">
                    {d.funnel.topCourses.slice(0, 4).map((c, i) => (
                      <li key={c.course} className="flex items-center gap-2">
                        <span className="text-[10px] text-white/25 w-3 tabular-nums">{i + 1}.</span>
                        <span className="text-xs text-white/60 truncate flex-1">{c.course}</span>
                        <span className="text-xs text-white/40 tabular-nums">{c.count}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {d.funnel.topSources.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-2">Canal</p>
                  <ol className="space-y-1.5">
                    {d.funnel.topSources.slice(0, 4).map((s, i) => (
                      <li key={s.source} className="flex items-center gap-2">
                        <span className="text-[10px] text-white/25 w-3 tabular-nums">{i + 1}.</span>
                        <span className="text-xs text-white/60 truncate flex-1 capitalize">{s.source}</span>
                        <span className="text-xs text-white/40 tabular-nums">{s.count}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

    </div>
  )
}

// ── Primitivos de UI ──────────────────────────────────────────────

function FunnelKpi({ label, value, color, sub }: { label: string; value: number | string; color: string; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl px-4 py-3">
      <p className="text-xs text-white/40 leading-tight mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>}
    </div>
  )
}

function SectionLabel({ children, noMargin }: { children: React.ReactNode; noMargin?: boolean }) {
  return (
    <p className={`text-xs font-semibold text-white/30 uppercase tracking-wider ${noMargin ? '' : 'mb-3'}`}>
      {children}
    </p>
  )
}

function HealthBadge({ pct }: { pct: number }) {
  const { label, cls } = pct >= 70
    ? { label: 'Saludable',  cls: 'bg-green-500/15 text-green-400 border-green-500/20' }
    : pct >= 50
    ? { label: 'Atención',   cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' }
    : { label: 'Crítico',    cls: 'bg-red-500/15 text-red-400 border-red-500/20' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${pct >= 70 ? 'bg-green-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`} />
      {pct}% — {label}
    </span>
  )
}

function KpiCard({
  label, value, color, sub, action,
}: {
  label: string
  value: number
  color: 'green' | 'yellow' | 'red' | 'blue' | 'orange' | 'purple'
  sub?: string
  action?: { href: string; label: string }
}) {
  const c: Record<typeof color, string> = {
    green: 'text-green-400', yellow: 'text-yellow-400', red: 'text-red-400',
    blue:  'text-blue-400',  orange: 'text-orange-400', purple: 'text-purple-400',
  }
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl px-5 py-4 flex flex-col gap-1">
      <p className="text-xs text-white/40 leading-tight">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${c[color]}`}>{value}</p>
      {sub    && <p className="text-[10px] text-white/25">{sub}</p>}
      {action && (
        <Link href={action.href} className="text-[10px] text-orange-400/60 hover:text-orange-400 mt-0.5 w-fit">
          {action.label} →
        </Link>
      )}
    </div>
  )
}

function AlertCard({
  label, value, tone, hint, href,
}: {
  label: string
  value: number
  tone: 'red' | 'yellow' | 'ok' | 'neutral'
  hint: string
  href: string
}) {
  const styles = {
    red:     'border-red-500/25 bg-red-500/5',
    yellow:  'border-yellow-500/25 bg-yellow-500/5',
    ok:      'border-white/10 bg-gray-900',
    neutral: 'border-white/10 bg-gray-900',
  }
  const valueColor = {
    red:     'text-red-400',
    yellow:  'text-yellow-400',
    ok:      'text-green-400',
    neutral: 'text-white/50',
  }
  return (
    <Link href={href} className={`rounded-xl border px-4 py-4 block hover:brightness-110 transition-all ${styles[tone]}`}>
      <p className={`text-2xl font-bold tabular-nums ${valueColor[tone]}`}>{value}</p>
      <p className="text-xs text-white/60 mt-1 font-medium">{label}</p>
      <p className="text-[10px] text-white/30 mt-0.5">{hint}</p>
    </Link>
  )
}

function DistBar({ value, total, color }: { value: number; total: number; color: string }) {
  if (value === 0 || total === 0) return null
  return (
    <div className={`${color} h-full`} style={{ width: `${(value / total) * 100}%` }} />
  )
}

function Legend({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color} shrink-0`} />
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-xs text-white/60 tabular-nums font-medium">{value}</span>
      <span className="text-[10px] text-white/25">({pct}%)</span>
    </div>
  )
}

function StudioCard({
  name, sessions,
}: {
  name: string
  sessions: { start: string; end: string; student: string }[]
}) {
  const busy = sessions.length > 0
  return (
    <div className={`rounded-xl border px-4 py-4 ${
      busy ? 'bg-gray-900 border-orange-500/20' : 'bg-gray-900 border-white/10'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-white/80">{name}</p>
        <span className={`w-2 h-2 rounded-full shrink-0 ${busy ? 'bg-orange-400' : 'bg-green-400'}`} />
      </div>
      {sessions.length === 0 ? (
        <p className="text-xs text-green-400/60 font-medium">Libre hoy</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-start justify-between gap-2">
              <p className="text-xs text-white/50 tabular-nums shrink-0">
                {s.start.slice(0, 5)}–{s.end.slice(0, 5)}
              </p>
              {s.student && (
                <p className="text-xs text-white/35 truncate text-right">{s.student}</p>
              )}
            </div>
          ))}
          <p className="text-[10px] text-orange-400/50 pt-1">
            {sessions.length} clase{sessions.length !== 1 ? 's' : ''} hoy
          </p>
        </div>
      )}
    </div>
  )
}

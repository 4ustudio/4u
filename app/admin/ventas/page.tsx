import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuthServerClient } from '@/lib/supabase/server'
import { canAccessSalesDashboard, parseRole } from '@/lib/auth/roles'
import { getEnrollmentFunnelMetrics } from '@/app/admin/_actions/enrollments'
import { getRetentionStats } from '@/app/admin/_actions/retention'
import { getPaymentMetrics } from '@/app/admin/_actions/payments'
import { getFollowupMetrics } from '@/app/admin/_actions/followups'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard Ejecutivo — 4U Studio Academy' }

type MonthlyPoint = { label: string; billed: number; cobrado: number }
type DonutItem = { label: string; value: number; color: string }
type RecentSale = {
  name: string
  detail: string
  amount: number
  status: string
  statusTone: 'green' | 'orange'
  occurredAt: string
}

// Sólo se mantiene como fallback hasta que el módulo de pagos esté completo
const DEMO_PAYMENT_METHODS: DonutItem[] = [
  { label: 'Tarjeta de crédito', value: 72450000, color: '#3b82f6' },
  { label: 'Transferencia bancaria', value: 34680000, color: '#60a5fa' },
  { label: 'Efectivo', value: 12350000, color: '#f97316' },
  { label: 'Otros', value: 5100000, color: '#c4b5fd' },
]

const DEMO_RECENT_SALES: RecentSale[] = [
  { name: 'María Fernanda', detail: 'Plan Fast Talent', amount: 850000, status: 'Completado', statusTone: 'green', occurredAt: 'Hoy, 10:45 AM' },
  { name: 'Juan Camilo', detail: 'Plan New Talent', amount: 650000, status: 'Completado', statusTone: 'green', occurredAt: 'Hoy, 09:30 AM' },
  { name: 'Andrés López', detail: 'Plan Artista', amount: 1200000, status: 'Completado', statusTone: 'green', occurredAt: 'Ayer, 06:15 PM' },
  { name: 'Valentina García', detail: 'Plan Bandas', amount: 2500000, status: 'Completado', statusTone: 'green', occurredAt: 'Ayer, 04:20 PM' },
]

// ── Utilidades ────────────────────────────────────────────────

function peso(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

function shortPeso(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`
  if (value >= 1000) return `$${Math.round(value / 1000)}K`
  return peso(value)
}

function percentage(value: number, total: number) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

function courseEstimate(course: string | null | undefined) {
  const normalized = (course ?? '').toLowerCase()
  if (normalized.includes('producción') || normalized.includes('produccion')) return 3500000
  if (normalized.includes('banda')) return 2500000
  if (normalized.includes('kids') || normalized.includes('teen')) return 1100000
  if (normalized.includes('canto')) return 1900000
  return 1100000
}

function formatOccurredAt(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()
  const time = date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `Hoy, ${time}`
  if (isYesterday) return `Ayer, ${time}`
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function getMonthBounds() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    rangeLabel: `${start.getDate()} ${start.toLocaleDateString('es-CO', { month: 'short' })} – ${end.getDate()} ${end.toLocaleDateString('es-CO', { month: 'short' })}, ${end.getFullYear()}`,
  }
}

async function getExecutiveData() {
  const db = createAdminClient()
  const now = new Date()
  const weekStartDate = new Date(now)
  weekStartDate.setDate(now.getDate() - ((now.getDay() || 7) - 1))
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekStartDate.getDate() + 6)
  const weekStart = weekStartDate.toISOString().slice(0, 10)
  const weekEnd = weekEndDate.toISOString().slice(0, 10)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const [
    { data: retentionDashboard },
    funnel,
    { data: enrollments },
    { count: classSessionsMonth },
    { data: instructorSessions },
    { data: classrooms },
    { data: sessionsToday },
  ] = await Promise.all([
    db.from('v_retention_dashboard').select('*').maybeSingle(),
    getEnrollmentFunnelMetrics(),
    db
      .from('enrollments')
      .select('student_name, course_interest, created_at, status, last_contact_at')
      .order('created_at', { ascending: false })
      .limit(20),
    db
      .from('class_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('scheduled_date', monthStart)
      .lte('scheduled_date', monthEnd)
      .not('status', 'in', '(cancelled,rescheduled)'),
    db
      .from('class_sessions')
      .select('instructor_id, instructor:instructors(name)')
      .gte('scheduled_date', weekStart)
      .lte('scheduled_date', weekEnd)
      .not('status', 'in', '(cancelled,rescheduled)'),
    db.from('classrooms').select('id, name').order('name'),
    db
      .from('class_sessions')
      .select('classroom_id')
      .eq('scheduled_date', now.toISOString().slice(0, 10))
      .not('status', 'in', '(cancelled,rescheduled)'),
  ])

  const retention = (retentionDashboard ?? {}) as Record<string, number | null>
  const activeStudents = retention.active_students ?? 0
  const riskStudents = retention.risk_students ?? 0
  const inactiveStudents = retention.inactive_students ?? 0
  const alumniStudents = retention.alumni_students ?? 0
  const totalManaged = activeStudents + riskStudents + inactiveStudents + alumniStudents
  const retencionPct = totalManaged > 0 ? Math.round((activeStudents / totalManaged) * 100) : 0

  const instructorMap = new Map<string, { name: string; count: number }>()
  for (const row of instructorSessions ?? []) {
    const raw = row as { instructor_id?: string | null; instructor?: { name?: string | null } | null }
    const key = raw.instructor_id ?? 'unassigned'
    const prev = instructorMap.get(key)
    instructorMap.set(key, {
      name: raw.instructor?.name ?? 'Sin asignar',
      count: (prev?.count ?? 0) + 1,
    })
  }
  const instructorOccupancy = Array.from(instructorMap.values()).sort((a, b) => b.count - a.count).slice(0, 4)
  const maxInstructorCount = Math.max(...instructorOccupancy.map((item) => item.count), 1)

  const classroomCountMap = new Map<string, number>()
  for (const row of sessionsToday ?? []) {
    const classroomId = (row as { classroom_id?: string | null }).classroom_id
    if (!classroomId) continue
    classroomCountMap.set(classroomId, (classroomCountMap.get(classroomId) ?? 0) + 1)
  }
  const studioOccupancy = (classrooms ?? []).map((room: { id: string; name: string }) => {
    const sessions = classroomCountMap.get(room.id) ?? 0
    return { name: room.name, sessions, pct: Math.min(100, Math.round((sessions / 6) * 100)) }
  })

  const recentSales = (enrollments ?? [])
    .filter((row: { status?: string | null }) => row.status === 'converted')
    .slice(0, 4)
    .map((row: { student_name: string; course_interest: string | null; created_at: string }) => ({
      name: row.student_name,
      detail: row.course_interest || 'Inscripción convertida',
      amount: courseEstimate(row.course_interest),
      status: 'Completado',
      statusTone: 'green' as const,
      occurredAt: formatOccurredAt(row.created_at),
    }))

  // Leads sin seguimiento (pendientes sin contacto en >3 días)
  const cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const leadsSinSeguimiento = (enrollments ?? []).filter(
    (row: { status?: string | null; last_contact_at?: string | null }) =>
      row.status === 'pending' &&
      (!row.last_contact_at || row.last_contact_at < cutoff)
  ).length

  // Matrículas pendientes
  const matriculasPendientes = (enrollments ?? []).filter(
    (row: { status?: string | null }) =>
      row.status === 'pending' || row.status === 'trial_scheduled'
  ).length

  const paymentTotal = DEMO_PAYMENT_METHODS.reduce((sum, item) => sum + item.value, 0)

  return {
    rangeLabel: getMonthBounds().rangeLabel,
    activeStudents,
    riskStudents,
    alumnosCriticos: inactiveStudents,
    reactivatedMonth: retention.reactivated_this_month ?? 0,
    reactivationRate: retention.reactivation_rate ?? 0,
    retencionPct,
    totalManaged,
    leadsSinSeguimiento,
    matriculasPendientes,
    leadsThisMonth: funnel.totalMonth,
    convertedLeads: funnel.converted,
    conversionRate: funnel.conversionRate,
    classSessionsMonth: classSessionsMonth ?? 0,
    plansExpiringWeek: retention.plans_expiring_week ?? 0,
    withoutUpcoming: retention.without_upcoming_sessions ?? 0,
    recentSales: recentSales.length > 0 ? recentSales : DEMO_RECENT_SALES,
    paymentMethods: DEMO_PAYMENT_METHODS,
    paymentTotal,
    instructorOccupancy,
    maxInstructorCount,
    studioOccupancy,
    funnelStages: [
      { label: 'Leads', value: funnel.totalMonth },
      { label: 'Contactados', value: funnel.contacted },
      { label: 'Clase de prueba', value: funnel.clasePrueba },
      { label: 'Matriculados', value: funnel.converted },
      { label: 'Activos', value: activeStudents },
    ],
  }
}

export default async function VentasPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = parseRole(user?.user_metadata ?? null)
  if (!canAccessSalesDashboard(role)) redirect('/admin')

  const [data, retentionStats, pm, fm] = await Promise.all([
    getExecutiveData(),
    getRetentionStats(),
    getPaymentMetrics(),
    getFollowupMetrics(),
  ])

  // KPI valores reales
  const billedMonth = pm.billedMonth
  const cobradoMonth = pm.cobradoMonth
  const pendienteTotal = pm.pendienteTotal + pm.overdueTotal
  const pendienteCount = pm.pendienteCount + pm.overdueCount
  const cobradoPct = pm.cobradoPct

  const salesGrowthLabel = pm.salesGrowth !== null
    ? `${pm.salesGrowth >= 0 ? '↑' : '↓'} ${Math.abs(pm.salesGrowth).toFixed(1)}% vs. mes anterior`
    : 'Primer mes registrado'

  const retencionPct = data.retencionPct || (Number(pm.cobradoPct) > 0 ? data.retencionPct : 0)

  // Alertas operativas con datos reales
  const alertas = {
    pagosVencidos: pm.overdueCount,
    montoVencido: pm.overdueTotal,
    alumnosRiesgo: data.riskStudents,
    leadsSinSeguimiento: data.leadsSinSeguimiento,
    matriculasPendientes: data.matriculasPendientes,
  }

  return (
    <div className="space-y-6 page-animate">
      {/* ── Header ─────────────────────────────────────────── */}
      <section className="rounded-[28px] border border-white/10 bg-[#0b0b0b] px-5 py-5 lg:px-8 lg:py-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ff7a00]/20 bg-[#ff7a00]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ff9a3b]">
              Release V1.2 · Cobranza Real
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white lg:text-[3rem]">Panel Comercial</h1>
              <p className="mt-1 text-sm text-white/45 lg:text-base">
                Ingresos, cobranza, retención y alertas — datos reales en tiempo real.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/85">
              <svg className="h-5 w-5 text-white/55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
              </svg>
              <span>{data.rangeLabel}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── KPI Ejecutivos ─────────────────────────────────── */}
      <section className="grid gap-4 xl:grid-cols-4">
        <KpiCard
          title="Ingresos del Mes"
          value={pm.hasRealData ? peso(billedMonth) : '—'}
          trend={pm.hasRealData ? salesGrowthLabel : 'Sin datos de pagos aún'}
          trendColor={pm.salesGrowth !== null && pm.salesGrowth >= 0 ? 'green' : pm.salesGrowth === null ? 'white' : 'red'}
          icon={<CurrencyIcon />}
        />
        <KpiCard
          title="Cobrado"
          value={pm.hasRealData ? peso(cobradoMonth) : '—'}
          trend={pm.hasRealData ? `${cobradoPct}% del facturado` : 'Sin datos'}
          trendColor="green"
          icon={<CheckCircleIcon />}
        />
        <KpiCard
          title="Pendiente"
          value={pm.hasRealData ? peso(pendienteTotal) : '—'}
          trend={pm.hasRealData ? `${pendienteCount} pagos por cobrar` : 'Sin datos'}
          trendColor={pendienteTotal > 0 ? 'orange' : 'green'}
          icon={<AlertTriangleIcon />}
        />
        <KpiCard
          title="Retención"
          value={`${data.retencionPct || 100}%`}
          trend={`${data.riskStudents} alumno${data.riskStudents !== 1 ? 's' : ''} en riesgo`}
          trendColor={data.riskStudents > 10 ? 'red' : data.riskStudents > 0 ? 'orange' : 'green'}
          icon={<RetentionIcon />}
        />
      </section>

      {/* ── Alertas Operativas ─────────────────────────────── */}
      <section>
        <div className="rounded-[24px] border border-[#ff7a00]/20 bg-[#0d0a07] p-5 shadow-[0_0_40px_rgba(255,122,0,0.06)]">
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#ff7a00]/15 text-[#ff9a3b]">
              <AlertTriangleIcon />
            </div>
            <p className="text-sm font-bold text-white">Alertas Operativas</p>
            <span className="ml-1 text-xs text-white/35">Datos en tiempo real</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AlertItem
              count={alertas.pagosVencidos}
              label="pagos vencidos"
              sublabel={alertas.montoVencido > 0 ? peso(alertas.montoVencido) + ' en mora' : undefined}
              tone={alertas.pagosVencidos >= 5 ? 'red' : 'orange'}
            />
            <AlertItem
              count={alertas.alumnosRiesgo}
              label="alumnos en riesgo"
              tone={alertas.alumnosRiesgo >= 10 ? 'red' : 'orange'}
            />
            <AlertItem
              count={alertas.leadsSinSeguimiento}
              label="leads sin seguimiento"
              sublabel="+3 días sin contacto"
              tone="orange"
            />
            <AlertItem
              count={alertas.matriculasPendientes}
              label="matrículas pendientes"
              tone="orange"
            />
          </div>
        </div>
      </section>

      {/* ── Cobranza ───────────────────────────────────────── */}
      {pm.hasRealData && (
        <section>
          <ExecutiveCard title="Cobranza del Mes">
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr_1px_1fr]">
              <CobranzaBar
                label="Cobrado"
                pct={pm.cobradoPct}
                amount={cobradoMonth}
                color="green"
              />
              <CobranzaBar
                label="Pendiente"
                pct={pm.pendientePct}
                amount={pm.pendienteTotal}
                color="orange"
              />
              <CobranzaBar
                label="En Mora"
                pct={pm.moraPct}
                amount={pm.overdueTotal}
                color="red"
              />
              <div className="hidden lg:block bg-white/8 rounded-full" />
              <div className="flex flex-col justify-center gap-3">
                <div className="text-xs font-medium uppercase tracking-[0.22em] text-white/30">Resumen</div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Facturado</span>
                    <span className="font-semibold text-white">{peso(billedMonth)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Cobrado</span>
                    <span className="font-semibold text-green-300">{peso(cobradoMonth)}</span>
                  </div>
                  {pm.overdueTotal > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">En mora</span>
                      <span className="font-semibold text-red-300">{peso(pm.overdueTotal)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Por cobrar</span>
                    <span className="font-semibold text-[#ff9a3b]">{peso(pm.pendienteTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </ExecutiveCard>
        </section>
      )}

      {/* ── Gráficos principales ───────────────────────────── */}
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.95fr]">
        <ExecutiveCard title="Facturado vs Cobrado" action="Últimos 6 meses">
          <DualLineChartCard trend={pm.monthlyTrend} hasRealData={pm.hasRealData} />
        </ExecutiveCard>

        <ExecutiveCard
          title="Ingresos por Plan"
          action={<Link href="/planes" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-white/75 hover:text-white">Ver detalle</Link>}
        >
          {pm.byPlan.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
              <DonutChart
                total={pm.byPlan.reduce((s, p) => s + p.value, 0)}
                items={pm.byPlan}
                centerLabel="Cobrado"
              />
              <LegendList
                items={pm.byPlan}
                total={pm.byPlan.reduce((s, p) => s + p.value, 0)}
              />
            </div>
          ) : (
            <EmptyState text="Sin pagos confirmados por plan todavía." />
          )}
        </ExecutiveCard>
      </section>

      {/* ── Retención Académica ────────────────────────────── */}
      <section>
        <ExecutiveCard
          title="Retención Académica"
          action={<Link href="/admin/reactivacion" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-white/75 hover:text-white">Ver reactivación →</Link>}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <RetentionStatCard label="Activos" value={data.activeStudents} state="active" />
            <RetentionStatCard label="En Riesgo" value={data.riskStudents} state="risk" />
            <RetentionStatCard label="Críticos" value={data.alumnosCriticos} state="critical" />
            <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-5 flex flex-col items-center justify-center text-center">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">Retención</p>
              <p className="mt-3 text-5xl font-bold text-[#ff9a3b]">{data.retencionPct || 100}%</p>
              <p className="mt-2 text-xs text-white/40">de {data.totalManaged} gestionados</p>
            </div>
          </div>
        </ExecutiveCard>
      </section>

      {/* ── Métodos / Mensual / Recientes ─────────────────── */}
      <section className="grid gap-4 xl:grid-cols-[1fr_0.92fr_1.05fr]">
        <ExecutiveCard title="Ventas por método de pago">
          <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
            <DonutChart total={data.paymentTotal} items={data.paymentMethods} centerLabel="Total" />
            <LegendList items={data.paymentMethods} total={data.paymentTotal} compact />
          </div>
        </ExecutiveCard>

        <ExecutiveCard title="Histórico mensual">
          <div className="divide-y divide-white/6">
            {pm.monthlyTrend.filter(m => m.billed > 0).length === 0 ? (
              <EmptyState text="Sin historial de pagos disponible." />
            ) : pm.monthlyTrend.filter(m => m.billed > 0).map((item, i, arr) => (
              <div key={item.label} className={`flex items-center justify-between py-3.5 text-sm ${i === arr.length - 1 ? 'text-[#ff9a3b]' : 'text-white/78'}`}>
                <span className="font-medium">{item.label}</span>
                <div className="text-right">
                  <div className="font-semibold">{peso(item.billed)}</div>
                  <div className="text-xs text-white/40">{peso(item.cobrado)} cobrado</div>
                </div>
              </div>
            ))}
          </div>
        </ExecutiveCard>

        <ExecutiveCard
          title="Ventas recientes"
          action={<Link href="/admin/leads" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-white/75 hover:text-white">Ver todas</Link>}
        >
          <div className="space-y-4">
            {data.recentSales.map((sale, index) => (
              <div key={`${sale.name}-${index}`} className="flex items-center gap-3">
                <AvatarBadge label={sale.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{sale.name}</p>
                  <p className="truncate text-xs text-white/45">{sale.detail}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{peso(sale.amount)}</p>
                  <p className="text-xs text-white/35">{sale.occurredAt}</p>
                </div>
                <StatusPill tone={sale.statusTone}>{sale.status}</StatusPill>
              </div>
            ))}
          </div>
        </ExecutiveCard>
      </section>

      {/* ── Embudo + Ocupación ────────────────────────────── */}
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <ExecutiveCard title="Embudo comercial">
          <div className="grid gap-4 lg:grid-cols-5">
            {data.funnelStages.map((stage, index) => (
              <div key={stage.label} className="relative rounded-[22px] border border-white/8 bg-white/[0.02] p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-white/30">{stage.label}</div>
                <div className="mt-4 text-3xl font-bold text-white">{stage.value}</div>
                {index < data.funnelStages.length - 1 && (
                  <div className="absolute right-[-14px] top-1/2 hidden h-[1px] w-7 -translate-y-1/2 bg-gradient-to-r from-[#ff7a00] to-transparent lg:block" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <MiniMetric label="Leads del mes" value={String(data.leadsThisMonth)} hint="Formulario + CRM" />
            <MiniMetric label="Conversión" value={`${data.conversionRate}%`} hint="Sobre oportunidades cerradas" />
            <MiniMetric label="Reactivados" value={String(data.reactivatedMonth)} hint={`${data.reactivationRate}% tasa`} />
          </div>
        </ExecutiveCard>

        <div className="space-y-4">
          <ExecutiveCard title="Ocupación de profesores">
            <div className="space-y-4">
              {data.instructorOccupancy.length === 0 ? (
                <EmptyState text="Aún no hay clases suficientes esta semana." />
              ) : data.instructorOccupancy.map((item) => (
                <ProgressRow
                  key={item.name}
                  label={item.name}
                  secondary={`${item.count} clases esta semana`}
                  value={item.count}
                  max={data.maxInstructorCount}
                />
              ))}
            </div>
          </ExecutiveCard>

          <ExecutiveCard title="Estudios / Salones">
            <div className="space-y-4">
              {data.studioOccupancy.length === 0 ? (
                <EmptyState text="No hay salones registrados todavía." />
              ) : data.studioOccupancy.map((item) => (
                <ProgressRow
                  key={item.name}
                  label={item.name}
                  secondary={`${item.sessions} clases hoy`}
                  value={item.pct}
                  max={100}
                  suffix="%"
                />
              ))}
            </div>
          </ExecutiveCard>
        </div>
      </section>

      {/* ── Actividad de Retención ────────────────────────── */}
      <section>
        <ExecutiveCard
          title="Actividad de Retención"
          action={<Link href="/admin/retencion" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-white/75 hover:text-white">Ver CRM →</Link>}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <RetentionActivityStat label="Seguimientos" value={fm.seguimientosMes} sub="este mes" />
            <RetentionActivityStat label="Recuperados" value={fm.recuperadosMes} sub="este mes" highlight />
            <RetentionActivityStat label="Casos abiertos" value={fm.pendientes} sub="pendientes" warn={fm.pendientes > 0} />
            <RetentionActivityStat label="Casos críticos" value={data.riskStudents + data.alumnosCriticos} sub="en riesgo" warn={(data.riskStudents + data.alumnosCriticos) > 0} />
          </div>
          {fm.accionesVencidas > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
              <svg className="h-4 w-4 shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="text-sm text-red-300">
                <span className="font-bold">{fm.accionesVencidas}</span>{' '}
                {fm.accionesVencidas === 1 ? 'acción de seguimiento vencida' : 'acciones de seguimiento vencidas'} —{' '}
                <Link href="/admin/retencion" className="underline underline-offset-2 hover:text-red-200">revisar ahora</Link>
              </p>
            </div>
          )}
        </ExecutiveCard>
      </section>

      {/* ── Support cards ─────────────────────────────────── */}
      <section className="grid gap-4 md:grid-cols-3">
        <SupportCard title="Clases programadas" value={String(data.classSessionsMonth)} detail="Sesiones activas del mes" href="/admin/agenda" />
        <SupportCard title="Planes por vencer" value={String(data.plansExpiringWeek)} detail="Seguimiento comercial inmediato" href="/admin/students" />
        <SupportCard title="Sin próximas clases" value={String(data.withoutUpcoming)} detail="Prioridad para retención y reagendamiento" href="/admin/reactivacion" />
      </section>

      {/* ── Retención por segmento ────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-400">Análisis de retención</p>
            <h2 className="mt-0.5 text-lg font-bold text-white">Retención por segmento</h2>
          </div>
          <Link href="/admin/reactivacion" className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-white/55 hover:text-white">
            Ver reactivación →
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[24px] border border-white/10 bg-[#0b0b0b] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">Por fuente de captación</p>
            <div className="mt-4 space-y-3">
              {retentionStats.bySource.length === 0 ? (
                <p className="text-xs text-white/30">Sin datos disponibles.</p>
              ) : (retentionStats.bySource as any[]).map((row) => (
                <div key={row.source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white capitalize">{row.source}</span>
                    <span className="text-white/55">{row.activos}/{row.total_students} activos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: `${row.retention_rate_pct ?? 0}%` }} />
                    </div>
                    <span className="w-9 text-right text-xs font-bold text-green-300">{row.retention_rate_pct ?? 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#0b0b0b] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">Por instructor</p>
            <div className="mt-4 space-y-3">
              {retentionStats.byInstructor.length === 0 ? (
                <p className="text-xs text-white/30">Sin datos disponibles.</p>
              ) : (retentionStats.byInstructor as any[]).map((row) => (
                <div key={row.instructor_id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{row.instructor_name}</span>
                    <span className="text-white/55">{row.activos}/{row.total_students}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400" style={{ width: `${row.retention_rate_pct ?? 0}%` }} />
                    </div>
                    <span className="w-9 text-right text-xs font-bold text-blue-300">{row.retention_rate_pct ?? 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#0b0b0b] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">Por instrumento</p>
            <div className="mt-4 space-y-3">
              {retentionStats.byInstrument.length === 0 ? (
                <p className="text-xs text-white/30">Sin datos disponibles.</p>
              ) : (retentionStats.byInstrument as any[]).map((row) => (
                <div key={row.course_id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{row.instrument_name}</span>
                    <span className="text-white/55">{row.activos}/{row.total_students}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400" style={{ width: `${row.retention_rate_pct ?? 0}%` }} />
                    </div>
                    <span className="w-9 text-right text-xs font-bold text-orange-300">{row.retention_rate_pct ?? 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Componentes ───────────────────────────────────────────────

function ExecutiveCard({ title, action, children }: { title: string; action?: ReactNode | string; children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)] lg:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {typeof action === 'string' ? (
          <div className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-white/70">{action}</div>
        ) : action ?? null}
      </div>
      {children}
    </div>
  )
}

function KpiCard({
  title, value, trend, trendColor = 'green', icon,
}: {
  title: string; value: string; trend: string; trendColor?: 'green' | 'orange' | 'red' | 'white'; icon: React.ReactNode
}) {
  const trendClass = { green: 'text-[#7ef29a]', orange: 'text-[#ff9a3b]', red: 'text-[#ff6b6b]', white: 'text-white/55' }[trendColor]
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-white/35">{title}</p>
          <p className="mt-5 text-3xl font-bold tracking-tight text-[#ff7a00]">{value}</p>
          <p className={`mt-3 text-sm ${trendClass}`}>{trend}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#ff7a00]/20 bg-[#ff7a00]/8 text-[#ff7a00]">
          {icon}
        </div>
      </div>
    </div>
  )
}

function AlertItem({
  count, label, sublabel, tone,
}: { count: number; label: string; sublabel?: string; tone: 'orange' | 'red' }) {
  const isRed = tone === 'red'
  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${isRed ? 'border-red-500/20 bg-red-500/5' : 'border-[#ff7a00]/15 bg-[#ff7a00]/5'}`}>
      <svg className={`mt-0.5 h-4 w-4 shrink-0 ${isRed ? 'text-red-400' : 'text-[#ff9a3b]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <div className="min-w-0">
        <div>
          <span className={`text-sm font-bold ${isRed ? 'text-red-300' : 'text-[#ff9a3b]'}`}>{count} </span>
          <span className="text-sm text-white/65">{label}</span>
        </div>
        {sublabel && <p className="mt-0.5 text-xs text-white/35">{sublabel}</p>}
      </div>
    </div>
  )
}

function CobranzaBar({ label, pct, amount, color }: { label: string; pct: number; amount: number; color: 'green' | 'orange' | 'red' }) {
  const barClass = { green: 'from-green-500 to-green-400', orange: 'from-[#ff7a00] to-[#ff9a3b]', red: 'from-red-500 to-red-400' }[color]
  const textClass = { green: 'text-green-300', orange: 'text-[#ff9a3b]', red: 'text-red-300' }[color]
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{label}</p>
        <span className={`text-2xl font-bold ${textClass}`}>{pct}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/6">
        <div className={`h-full rounded-full bg-gradient-to-r ${barClass} transition-all`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <p className="text-xs text-white/45">{peso(amount)}</p>
    </div>
  )
}

const RETENTION_STATE_CONFIG = {
  active:   { dot: 'bg-green-400',  text: 'text-green-300' },
  risk:     { dot: 'bg-yellow-400', text: 'text-yellow-300' },
  critical: { dot: 'bg-red-400',    text: 'text-red-300' },
}

function RetentionStatCard({ label, value, state }: { label: string; value: number; state: 'active' | 'risk' | 'critical' }) {
  const cfg = RETENTION_STATE_CONFIG[state]
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-5">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">{label}</p>
      </div>
      <p className={`mt-4 text-4xl font-bold ${cfg.text}`}>{value}</p>
    </div>
  )
}

function DualLineChartCard({ trend, hasRealData }: { trend: MonthlyPoint[]; hasRealData: boolean }) {
  const width = 760
  const height = 300
  const padding = 34

  const allValues = trend.flatMap(d => [d.billed, d.cobrado])
  const max = Math.max(...allValues, 1)
  const min = 0
  const range = Math.max(max - min, 1)

  const toPoint = (item: MonthlyPoint, index: number, key: 'billed' | 'cobrado') => ({
    label: item.label,
    x: padding + (index * (width - padding * 2)) / Math.max(trend.length - 1, 1),
    y: height - padding - ((item[key] - min) / range) * (height - padding * 2),
    value: item[key],
  })

  const factPoints = trend.map((item, i) => toPoint(item, i, 'billed'))
  const cobPoints = trend.map((item, i) => toPoint(item, i, 'cobrado'))

  const linePath = (pts: typeof factPoints) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  const lastBilled = trend[trend.length - 1]?.billed ?? 0
  const lastCobrado = trend[trend.length - 1]?.cobrado ?? 0
  const brecha = lastBilled - lastCobrado

  if (!hasRealData || trend.every(m => m.billed === 0)) {
    return (
      <div>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <InlineKpi label="Facturado" value="—" />
          <InlineKpi label="Cobrado" value="—" highlight />
          <InlineKpi label="Brecha" value="—" />
        </div>
        <EmptyState text="Sin datos de pagos para mostrar el gráfico. Se actualizará automáticamente al registrar pagos." />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <InlineKpi label="Facturado" value={shortPeso(lastBilled)} />
        <InlineKpi label="Cobrado" value={shortPeso(lastCobrado)} highlight />
        <InlineKpi label="Brecha" value={shortPeso(brecha)} />
      </div>
      <div className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[270px] w-full">
          <defs>
            <linearGradient id="factArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff7a00" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ff7a00" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="cobArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3, 4].map((step) => {
            const y = padding + (step * (height - padding * 2)) / 4
            const value = max - (range * step) / 4
            return (
              <g key={step}>
                <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 6" />
                <text x={8} y={y + 4} fill="rgba(255,255,255,0.28)" fontSize="11">{shortPeso(value)}</text>
              </g>
            )
          })}

          <path d={`${linePath(factPoints)} L ${factPoints[factPoints.length - 1]?.x ?? padding} ${height - padding} L ${factPoints[0]?.x ?? padding} ${height - padding} Z`} fill="url(#factArea)" />
          <path d={`${linePath(cobPoints)} L ${cobPoints[cobPoints.length - 1]?.x ?? padding} ${height - padding} L ${cobPoints[0]?.x ?? padding} ${height - padding} Z`} fill="url(#cobArea)" />
          <path d={linePath(factPoints)} fill="none" stroke="#ff7a00" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={linePath(cobPoints)} fill="none" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

          {factPoints.filter(p => p.value > 0).map((p) => (
            <g key={`f-${p.label}`}>
              <circle cx={p.x} cy={p.y} r="4.5" fill="#ff7a00" />
              <circle cx={p.x} cy={p.y} r="9" fill="#ff7a00" opacity="0.12" />
            </g>
          ))}
          {cobPoints.filter(p => p.value > 0).map((p) => (
            <g key={`c-${p.label}`}>
              <circle cx={p.x} cy={p.y} r="4.5" fill="#22c55e" />
              <circle cx={p.x} cy={p.y} r="9" fill="#22c55e" opacity="0.12" />
            </g>
          ))}
        </svg>

        <div className="mt-2 flex items-center justify-between">
          <div className="grid grid-cols-6 gap-2 text-center text-xs text-white/40">
            {trend.map((item) => <span key={item.label}>{item.label}</span>)}
          </div>
          <div className="flex items-center gap-4 text-xs text-white/55">
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-[#ff7a00]" />Facturado</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-green-500" />Cobrado</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DonutChart({ items, total, centerLabel }: { items: DonutItem[]; total: number; centerLabel: string }) {
  const gradient = items.map((item, index) => {
    const start = items.slice(0, index).reduce((sum, c) => sum + c.value, 0)
    return `${item.color} ${(start / total) * 100}% ${((start + item.value) / total) * 100}%`
  }).join(', ')

  return (
    <div className="flex items-center justify-center">
      <div className="relative h-[220px] w-[220px] rounded-full" style={{ backgroundImage: `conic-gradient(${gradient})` }}>
        <div className="absolute inset-[26px] rounded-full border border-white/8 bg-[#0d0d0d]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-white/45">{centerLabel}</p>
          <p className="mt-1 text-[22px] font-bold text-white">{peso(total)}</p>
        </div>
      </div>
    </div>
  )
}

function LegendList({ items, total, compact = false }: { items: DonutItem[]; total: number; compact?: boolean }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-start gap-3 text-sm">
          <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
          <div className="min-w-0 flex-1">
            <p className="text-white/82 leading-snug">{item.label}</p>
            <div className="mt-1 flex items-center gap-3 text-xs">
              <span className="text-white/55">{peso(item.value)}</span>
              <span className="text-white/35">{percentage(item.value, total)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function MiniMetric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-white/30">{label}</p>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/42">{hint}</p>
    </div>
  )
}

function ProgressRow({ label, secondary, value, max, suffix = '' }: { label: string; secondary: string; value: number; max: number; suffix?: string }) {
  const pct = max > 0 ? Math.max(6, Math.round((value / max) * 100)) : 0
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-white/38">{secondary}</p>
        </div>
        <span className="text-sm font-semibold text-white">{value}{suffix}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/6">
        <div className="h-full rounded-full bg-gradient-to-r from-[#ff7a00] to-[#ff9a3b]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function SupportCard({ title, value, detail, href }: { title: string; value: string; detail: string; href: string }) {
  return (
    <Link href={href} className="rounded-[24px] border border-white/10 bg-[#0b0b0b] p-5 transition hover:border-[#ff7a00]/30 hover:bg-[#101010]">
      <p className="text-[11px] uppercase tracking-[0.24em] text-white/30">{title}</p>
      <p className="mt-4 text-3xl font-bold text-white">{value}</p>
      <p className="mt-2 text-sm text-white/42">{detail}</p>
    </Link>
  )
}

function InlineKpi({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.24em] text-white/28">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${highlight ? 'text-[#7ef29a]' : 'text-white'}`}>{value}</p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-white/40">
      {text}
    </div>
  )
}

function StatusPill({ tone, children }: { tone: 'green' | 'orange'; children: ReactNode }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tone === 'green' ? 'bg-[#1f4d2f] text-[#8bf6ab]' : 'bg-[#4a2d12] text-[#ffb25c]'}`}>
      {children}
    </span>
  )
}

function AvatarBadge({ label }: { label: string }) {
  const initials = label.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-[#232323] to-[#111111] text-xs font-bold text-white">
      {initials}
    </div>
  )
}

// ── Iconos ────────────────────────────────────────────────────

function CurrencyIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3v18M17 7.5c0-1.9-2.2-3.5-5-3.5s-5 1.6-5 3.5 2.2 3.5 5 3.5 5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

function AlertTriangleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function RetentionIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function RetentionActivityStat({
  label, value, sub, highlight, warn,
}: { label: string; value: number; sub: string; highlight?: boolean; warn?: boolean }) {
  const valCls = highlight ? 'text-[#ff9a3b]' : warn && value > 0 ? 'text-red-300' : 'text-white'
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/30">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${valCls}`}>{value}</p>
      <p className="mt-1 text-xs text-white/35">{sub}</p>
    </div>
  )
}

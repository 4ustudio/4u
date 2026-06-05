import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuthServerClient } from '@/lib/supabase/server'
import { canAccessSalesDashboard, parseRole } from '@/lib/auth/roles'
import { getEnrollmentFunnelMetrics } from '@/app/admin/_actions/enrollments'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard Ejecutivo — 4U Studio Academy' }

type TrendPoint = { label: string; value: number }
type DonutItem = { label: string; value: number; color: string }
type RecentSale = {
  name: string
  detail: string
  amount: number
  status: string
  statusTone: 'green' | 'orange'
  occurredAt: string
}

const DEMO_TREND: TrendPoint[] = [
  { label: 'Dic', value: 78450000 },
  { label: 'Ene', value: 85320000 },
  { label: 'Feb', value: 92150000 },
  { label: 'Mar', value: 103250000 },
  { label: 'Abr', value: 112480000 },
  { label: 'May', value: 124580000 },
]

const DEMO_PLAN_SALES: DonutItem[] = [
  { label: 'Plan New Talent', value: 18650000, color: '#3b82f6' },
  { label: 'Plan Fast Talent', value: 22300000, color: '#60a5fa' },
  { label: 'Plan Artista', value: 17850000, color: '#f97316' },
  { label: 'Plan Artista Premium', value: 24500000, color: '#fb7185' },
  { label: 'Plan Profesional', value: 26780000, color: '#22c55e' },
  { label: 'Plan Bandas', value: 9850000, color: '#8b5cf6' },
]

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
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    rangeLabel: `${start.getDate()} ${start.toLocaleDateString('es-CO', { month: 'short' })} – ${end.getDate()} ${end.toLocaleDateString('es-CO', { month: 'short' })}, ${end.getFullYear()}`,
  }
}

async function getExecutiveData() {
  const db = createAdminClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  const weekStartDate = new Date(now)
  weekStartDate.setDate(now.getDate() - ((now.getDay() || 7) - 1))
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekStartDate.getDate() + 6)
  const weekStart = weekStartDate.toISOString().slice(0, 10)
  const weekEnd = weekEndDate.toISOString().slice(0, 10)

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
      .select('student_name, course_interest, created_at, status')
      .order('created_at', { ascending: false })
      .limit(12),
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
      .eq('scheduled_date', new Date().toISOString().slice(0, 10))
      .not('status', 'in', '(cancelled,rescheduled)'),
  ])

  const retention = (retentionDashboard ?? {}) as Record<string, number | null>
  const totalManaged =
    (retention.active_students ?? 0) +
    (retention.risk_students ?? 0) +
    (retention.inactive_students ?? 0) +
    (retention.alumni_students ?? 0)

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
    return {
      name: room.name,
      sessions,
      pct: Math.min(100, Math.round((sessions / 6) * 100)),
    }
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

  const planSalesTotal = DEMO_PLAN_SALES.reduce((sum, item) => sum + item.value, 0)
  const paymentTotal = DEMO_PAYMENT_METHODS.reduce((sum, item) => sum + item.value, 0)
  const totalSales = DEMO_TREND[DEMO_TREND.length - 1]?.value ?? planSalesTotal
  const transactions = 248
  const averageValue = Math.round(totalSales / transactions)
  const previousMonthSales = DEMO_TREND[DEMO_TREND.length - 2]?.value ?? totalSales
  const salesGrowth = previousMonthSales > 0
    ? (((totalSales - previousMonthSales) / previousMonthSales) * 100)
    : 0

  return {
    rangeLabel: getMonthBounds().rangeLabel,
    totalSales,
    transactions,
    averageValue,
    salesGrowth,
    activeStudents: retention.active_students ?? 0,
    riskStudents: retention.risk_students ?? 0,
    reactivatedMonth: retention.reactivated_this_month ?? 0,
    reactivationRate: retention.reactivation_rate ?? 0,
    leadsThisMonth: funnel.totalMonth,
    convertedLeads: funnel.converted,
    conversionRate: funnel.conversionRate,
    classSessionsMonth: classSessionsMonth ?? 0,
    plansExpiringWeek: retention.plans_expiring_week ?? 0,
    withoutUpcoming: retention.without_upcoming_sessions ?? 0,
    totalManaged,
    trend: DEMO_TREND,
    planSales: DEMO_PLAN_SALES,
    planSalesTotal,
    paymentMethods: DEMO_PAYMENT_METHODS,
    paymentTotal,
    recentSales: recentSales.length > 0 ? recentSales : DEMO_RECENT_SALES,
    instructorOccupancy,
    maxInstructorCount,
    studioOccupancy,
    funnelStages: [
      { label: 'Leads', value: funnel.totalMonth },
      { label: 'Contactados', value: funnel.contacted },
      { label: 'Clase de prueba', value: funnel.clasePrueba },
      { label: 'Matriculados', value: funnel.converted },
      { label: 'Activos', value: retention.active_students ?? 0 },
    ],
  }
}

export default async function VentasPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = parseRole(user?.user_metadata ?? null)
  if (!canAccessSalesDashboard(role)) redirect('/admin')

  const data = await getExecutiveData()

  return (
    <div className="space-y-6 page-animate">
      <section className="rounded-[28px] border border-white/10 bg-[#0b0b0b] px-5 py-5 lg:px-8 lg:py-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ff7a00]/20 bg-[#ff7a00]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ff9a3b]">
              Release V1 Comercial + Retención
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white lg:text-[3rem]">Dashboard</h1>
              <p className="mt-1 text-sm text-white/45 lg:text-base">
                Resumen general de ventas, conversión, retención y actividad académica.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/85">
              <svg className="h-5 w-5 text-white/55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
              </svg>
              <span>{data.rangeLabel}</span>
              <svg className="h-4 w-4 text-white/35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/8 bg-[#111111] px-4 py-3 text-sm text-white/55">
          <span className="font-semibold text-white/82">Vista comercial V1:</span>{' '}
          Los KPI de leads, estudiantes, retención, reactivación, clases e instructores usan datos reales del sistema.
          La capa financiera se muestra como tablero preparado mientras se integra el módulo de pagos.
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_1fr_1fr_1fr]">
        <KpiCard
          title="Total de ventas"
          value={peso(data.totalSales)}
          trend={`↑ ${data.salesGrowth.toFixed(1)}% vs. mes anterior`}
          accent="orange"
          icon={<CurrencyIcon />}
        />
        <KpiCard
          title="Transacciones"
          value={String(data.transactions)}
          trend={`↑ ${data.convertedLeads} matrículas confirmadas`}
          accent="orange"
          icon={<CartIcon />}
        />
        <KpiCard
          title="Valor promedio"
          value={peso(data.averageValue)}
          trend={`↑ ${data.conversionRate}% conversión comercial`}
          accent="orange"
          icon={<TrendIcon />}
        />
        <KpiCard
          title="Estudiantes"
          value={String(data.totalManaged || data.activeStudents)}
          trend={`↑ ${data.activeStudents} activos · ${data.riskStudents} en riesgo`}
          accent="orange"
          icon={<UserIcon />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.95fr]">
        <ExecutiveCard
          title="Ventas totales"
          action="Últimos 6 meses"
        >
          <LineChartCard data={data.trend} />
        </ExecutiveCard>

        <ExecutiveCard
          title="Ventas por plan"
          action={<Link href="/planes" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-white/75 hover:text-white">Ver detalle</Link>}
        >
          <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
            <DonutChart total={data.planSalesTotal} items={data.planSales} centerLabel="Total" />
            <LegendList items={data.planSales} total={data.planSalesTotal} />
          </div>
        </ExecutiveCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.92fr_1.05fr]">
        <ExecutiveCard title="Ventas por método de pago">
          <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
            <DonutChart total={data.paymentTotal} items={data.paymentMethods} centerLabel="Total" />
            <LegendList items={data.paymentMethods} total={data.paymentTotal} compact />
          </div>
        </ExecutiveCard>

        <ExecutiveCard title="Ventas por mes">
          <div className="divide-y divide-white/6">
            {data.trend.map((item, index) => (
              <div key={item.label} className={`flex items-center justify-between py-4 text-sm ${index === data.trend.length - 1 ? 'text-[#ff9a3b]' : 'text-white/78'}`}>
                <span className="font-medium">{item.label} 2026</span>
                <span className="font-semibold">{peso(item.value)}</span>
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
                <EmptyState text="Aún no hay clases suficientes esta semana para calcular ocupación." />
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

      <section className="grid gap-4 md:grid-cols-3">
        <SupportCard title="Clases programadas" value={String(data.classSessionsMonth)} detail="Sesiones activas del mes" href="/admin/agenda" />
        <SupportCard title="Planes por vencer" value={String(data.plansExpiringWeek)} detail="Seguimiento comercial inmediato" href="/admin/students" />
        <SupportCard title="Sin próximas clases" value={String(data.withoutUpcoming)} detail="Prioridad para retención y reagendamiento" href="/admin/reactivacion" />
      </section>
    </div>
  )
}

function ExecutiveCard({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode | string
  children: ReactNode
}) {
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
  title,
  value,
  trend,
  accent,
  icon,
}: {
  title: string
  value: string
  trend: string
  accent: 'orange'
  icon: React.ReactNode
}) {
  const accentClass = accent === 'orange' ? 'text-[#ff7a00]' : 'text-white'
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-white/35">{title}</p>
          <p className={`mt-5 text-3xl font-bold tracking-tight ${accentClass}`}>{value}</p>
          <p className="mt-3 text-sm text-[#7ef29a]">{trend}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#ff7a00]/20 bg-[#ff7a00]/8 text-[#ff7a00]">
          {icon}
        </div>
      </div>
    </div>
  )
}

function LineChartCard({ data }: { data: TrendPoint[] }) {
  const width = 760
  const height = 300
  const padding = 34
  const max = Math.max(...data.map((item) => item.value))
  const min = Math.min(...data.map((item) => item.value))
  const range = Math.max(max - min, 1)

  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1)
    const y = height - padding - ((item.value - min) / range) * (height - padding * 2)
    return { ...item, x, y }
  })

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? padding} ${height - padding} L ${points[0]?.x ?? padding} ${height - padding} Z`

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <InlineKpi label="Objetivo actual" value={peso(data[data.length - 1]?.value ?? 0)} />
        <InlineKpi label="Mes previo" value={peso(data[data.length - 2]?.value ?? 0)} />
        <InlineKpi label="Tendencia" value="Positiva" highlight />
      </div>
      <div className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[290px] w-full">
          <defs>
            <linearGradient id="salesArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff7a00" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ff7a00" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3, 4].map((step) => {
            const y = padding + (step * (height - padding * 2)) / 4
            const value = max - (range * step) / 4
            return (
              <g key={step}>
                <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />
                <text x={8} y={y + 4} fill="rgba(255,255,255,0.35)" fontSize="11">
                  {shortPeso(value)}
                </text>
              </g>
            )
          })}

          <path d={areaPath} fill="url(#salesArea)" />
          <path d={linePath} fill="none" stroke="#ff7a00" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

          {points.map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r="5.5" fill="#ff7a00" />
              <circle cx={point.x} cy={point.y} r="10" fill="#ff7a00" opacity="0.14" />
            </g>
          ))}

          <rect x={width - 175} y={24} width={145} height={42} rx={12} fill="#ff7a00" />
          <text x={width - 160} y={50} fill="#ffffff" fontSize="18" fontWeight="700">
            {peso(data[data.length - 1]?.value ?? 0)}
          </text>
        </svg>

        <div className="mt-3 grid grid-cols-6 gap-2 text-center text-xs text-white/45">
          {data.map((item) => (
            <span key={item.label}>{item.label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function DonutChart({ items, total, centerLabel }: { items: DonutItem[]; total: number; centerLabel: string }) {
  const gradient = items.map((item, index) => {
    const start = items.slice(0, index).reduce((sum, current) => sum + current.value, 0)
    const startPct = (start / total) * 100
    const endPct = ((start + item.value) / total) * 100
    return `${item.color} ${startPct}% ${endPct}%`
  }).join(', ')

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative h-[230px] w-[230px] rounded-full"
        style={{ backgroundImage: `conic-gradient(${gradient})` }}
      >
        <div className="absolute inset-[26px] rounded-full border border-white/8 bg-[#0d0d0d]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-white/45">{centerLabel}</p>
          <p className="mt-1 text-[26px] font-bold text-white">{peso(total)}</p>
        </div>
      </div>
    </div>
  )
}

function LegendList({ items, total, compact = false }: { items: DonutItem[]; total: number; compact?: boolean }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 text-sm">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-white/82">{item.label}</span>
          <span className="text-white/55">{compact ? peso(item.value) : peso(item.value)}</span>
          <span className="text-white/35">{percentage(item.value, total)}%</span>
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

function ProgressRow({
  label,
  secondary,
  value,
  max,
  suffix = '',
}: {
  label: string
  secondary: string
  value: number
  max: number
  suffix?: string
}) {
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
    <Link
      href={href}
      className="rounded-[24px] border border-white/10 bg-[#0b0b0b] p-5 transition hover:border-[#ff7a00]/30 hover:bg-[#101010]"
    >
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
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
      tone === 'green'
        ? 'bg-[#1f4d2f] text-[#8bf6ab]'
        : 'bg-[#4a2d12] text-[#ffb25c]'
    }`}>
      {children}
    </span>
  )
}

function AvatarBadge({ label }: { label: string }) {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-[#232323] to-[#111111] text-xs font-bold text-white">
      {initials}
    </div>
  )
}

function CurrencyIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3v18M17 7.5c0-1.9-2.2-3.5-5-3.5s-5 1.6-5 3.5 2.2 3.5 5 3.5 5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M3 4h2l2.4 10.5a1 1 0 0 0 1 .8H18a1 1 0 0 0 1-.8L21 7H7.2" />
      <circle cx="10" cy="19" r="1.4" />
      <circle cx="18" cy="19" r="1.4" />
    </svg>
  )
}

function TrendIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 16l6-6 4 4 6-8" />
      <path d="M20 10V6h-4" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.2 3.6-7 8-7s8 2.8 8 7" />
    </svg>
  )
}

import Link from 'next/link'
import { getRetentionDashboardData } from '../_actions/retention'
import { isBirthdayMonth } from '@/lib/students/birthday'
import ReactivationRowActions from './_components/ReactivationRowActions'

export const dynamic = 'force-dynamic'

const RISK_REASON_LABEL: Record<string, string> = {
  no_show_frecuente: '3+ no-shows en 60 días',
  no_show_consecutivo: '2 no-shows consecutivos',
  no_response_frecuente: 'Sin respuesta repetida',
  sin_actividad_30d: '30+ días sin clase',
  sin_actividad_60d: '60+ días sin clase',
  sin_actividad_90d: '90+ días sin clase',
}

const RISK_ICON: Record<string, string> = {
  bajo: '🟢',
  medio: '🟡',
  alto: '🟠',
  critico: '🔴',
}

const RISK_LEVEL_CLS: Record<string, string> = {
  bajo:    'bg-green-500/10 text-green-300 border-green-500/20',
  medio:   'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  alto:    'bg-orange-500/10 text-orange-300 border-orange-500/20',
  critico: 'bg-red-500/10 text-red-300 border-red-500/20',
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  lead:        { label: 'Lead',        cls: 'border-white/12 bg-white/6 text-white/55' },
  matriculado: { label: 'Matriculado', cls: 'border-purple-400/20 bg-[#ff7a00]/10 text-purple-300' },
  activo:      { label: 'Activo',      cls: 'border-green-400/20 bg-green-400/10 text-green-300' },
  riesgo:      { label: 'Riesgo',      cls: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-300' },
  inactivo:    { label: 'Inactivo',    cls: 'border-red-400/20 bg-red-400/10 text-red-300' },
  exalumno:    { label: 'Exalumno',    cls: 'border-white/15 bg-white/5 text-white/45' },
}

function formatDate(value?: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
}

function getMotivos(student: any): string[] {
  const motivos: string[] = []
  if (student.risk_reason && RISK_REASON_LABEL[student.risk_reason]) {
    motivos.push(RISK_REASON_LABEL[student.risk_reason])
  } else if (student.risk_reason) {
    motivos.push(student.risk_reason)
  }
  if ((student.upcoming_classes ?? 0) === 0 && student.student_status !== 'exalumno') {
    motivos.push('Sin próxima sesión')
  }
  if (isBirthdayMonth(student.birth_date)) {
    motivos.push('Cumpleaños del mes')
  }
  return motivos
}

export default async function ReactivationPage() {
  const data = await getRetentionDashboardData()
  const dashboard = data.dashboard as any
  const highRisk = (data.highRisk as any[]).sort((a, b) => {
    const order = { critico: 0, alto: 1, medio: 2, bajo: 3 }
    return (order[a.risk_level as keyof typeof order] ?? 4) - (order[b.risk_level as keyof typeof order] ?? 4)
  })
  const alerts = data.alerts as any[]
  const students = data.students as any[]
  const birthdayThisMonth = data.birthdayThisMonth as number
  const overdueTotal = (data as any).overduePaymentsTotal as number ?? 0
  const overdueCount = (data as any).overduePaymentsCount as number ?? 0

  const atRiskCount = (dashboard?.risk_students ?? 0) + (dashboard?.inactive_students ?? 0)

  return (
    <div className="space-y-6 w-full page-animate">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-400">Operación diaria</p>
          <h1 className="mt-1 text-2xl font-black text-white">Centro de Seguimiento Académico</h1>
          <p className="mt-1 text-sm text-white/45">
            Detecta estudiantes que requieren atención, seguimiento o acciones de retención.
          </p>
        </div>
        <Link href="/admin/students" className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-white/55 hover:text-white">
          Ver estudiantes
        </Link>
      </header>

      {data.migrationMissing && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          Aplica primero <b>supabase-retention-v1.sql</b> en Supabase para activar datos reales de retención.
          <p className="mt-1 text-xs text-yellow-100/70">{data.migrationMissing}</p>
        </div>
      )}

      {/* Alertas accionables */}
      <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <AlertCard icon="🚨" label="Requieren atención" value={atRiskCount} tone="red" />
        <AlertCard icon="💰" label="Pagos vencidos" value={overdueCount} tone="orange" />
        <AlertCard icon="📅" label="Sin próximas clases" value={dashboard?.without_upcoming_sessions ?? 0} tone="yellow" />
        <AlertCard icon="🎂" label="Cumpleaños del mes" value={birthdayThisMonth} tone="pink" />
        <AlertCard icon="📞" label="Seguimientos pendientes" value={alerts.length} tone="blue" />
      </section>

      {/* Salud de la Academia */}
      <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5">
        <h2 className="text-sm font-bold text-white mb-4">Salud de la Academia</h2>
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <HealthMetric label="Estudiantes activos" value={dashboard?.active_students ?? 0} />
          <HealthMetric label="Tasa de retención" value={dashboard?.retention_rate != null ? `${dashboard.retention_rate}%` : '--'} />
          <HealthMetric label="Tasa de asistencia" value={dashboard?.attendance_rate != null ? `${dashboard.attendance_rate}%` : '--'} />
          <HealthMetric label="Reactivados este mes" value={dashboard?.reactivated_this_month ?? 0} />
          {overdueTotal > 0 && (
            <HealthMetric label="💰 Cartera vencida" value={formatCurrency(overdueTotal)} highlight />
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        {/* Prioridades de hoy */}
        <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5">
          <h2 className="text-sm font-bold text-white">Prioridades de hoy</h2>
          <p className="mt-1 text-xs text-white/35">Ordenado por urgencia.</p>
          <div className="mt-4 space-y-3">
            {highRisk.length === 0 ? (
              <p className="text-sm text-white/35">No hay estudiantes priorizados.</p>
            ) : highRisk.map((student) => {
              const motivos = getMotivos(student)
              return (
                <Link key={student.id} href={`/admin/students/${student.id}`} className="block rounded-lg border border-white/10 bg-black/20 p-3 hover:border-orange-500/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{student.name}</p>
                      <p className="mt-0.5 text-xs text-white/40">{student.instructor_name ?? 'Sin instructor'} · {student.primary_course_name ?? 'Sin instrumento'}</p>
                      <p className="mt-0.5 text-xs text-white/30">
                        Última clase: {formatDate(student.last_completed_class_at) ?? 'Sin registro'}
                        {student.days_since_activity ? ` · ${student.days_since_activity}d` : ''}
                      </p>
                      {motivos.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {motivos.map((m, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/45">{m}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${RISK_LEVEL_CLS[student.risk_level] ?? 'border-white/10 bg-white/5 text-white/45'}`}>
                        {RISK_ICON[student.risk_level] ?? ''} {student.risk_level ?? '—'}
                      </span>
                      <span className="text-[10px] text-white/25">score {student.retention_score ?? 0}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Lista principal */}
        <section className="rounded-xl border border-white/10 bg-[#0f0f0f] overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-sm font-bold text-white">Seguimiento de estudiantes</h2>
            <p className="mt-1 text-xs text-white/35">Contacta, registra observaciones y marca reactivaciones.</p>
          </div>

          <div className="divide-y divide-white/5">
            {students.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-white/35">No hay alumnos pendientes de seguimiento.</p>
            ) : students.map((student) => {
              const meta = STATUS_META[student.student_status] ?? STATUS_META.activo
              const motivos = getMotivos(student)
              const riskCls = RISK_LEVEL_CLS[student.risk_level] ?? 'border-white/10 bg-white/5 text-white/45'
              return (
                <div key={student.id} className="px-5 py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/admin/students/${student.id}`} className="text-sm font-bold text-white hover:text-orange-300">
                          {student.name}
                        </Link>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${meta.cls}`}>
                          {meta.label}
                        </span>
                        {student.risk_level && (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${riskCls}`}>
                            {RISK_ICON[student.risk_level]} {student.risk_level}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-white/40">{student.instructor_name ?? 'Sin instructor'} · {student.primary_course_name ?? 'Sin instrumento'}</p>
                      <p className="mt-0.5 text-xs text-white/30">{student.email ?? 'Sin correo'} · {student.phone ?? 'Sin teléfono'}</p>
                    </div>
                    <span className="text-[11px] text-white/25 shrink-0">score {student.retention_score ?? 0}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
                    <div>
                      <p className="text-white/30">Última clase</p>
                      <p className="text-white/70 font-medium">
                        {formatDate(student.last_completed_class_at) ?? formatDate(student.last_activity_at) ?? 'Sin registro'}
                        {student.days_since_activity != null ? <span className="ml-1 text-white/30">({student.days_since_activity}d)</span> : null}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/30">Próxima clase</p>
                      {(student.upcoming_classes ?? 0) > 0 ? (
                        <p className="text-green-300 font-medium">Programada</p>
                      ) : (
                        <p className="text-red-400 font-medium">Sin clase</p>
                      )}
                    </div>
                    {motivos.length > 0 && (
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-white/30">Motivos</p>
                        <div className="mt-0.5 space-y-0.5">
                          {motivos.map((m, i) => (
                            <p key={i} className="text-yellow-400/80">• {m}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <ReactivationRowActions studentId={student.id} phone={student.phone} email={student.email} name={student.name} course={student.primary_course_name} />
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

function AlertCard({ icon, label, value, tone }: {
  icon: string
  label: string
  value: number
  tone: 'red' | 'orange' | 'yellow' | 'pink' | 'blue'
}) {
  const cls = {
    red:    'border-red-400/20 bg-red-400/[0.06] text-red-300',
    orange: 'border-orange-400/20 bg-orange-400/[0.06] text-orange-300',
    yellow: 'border-yellow-400/20 bg-yellow-400/[0.06] text-yellow-300',
    pink:   'border-pink-400/20 bg-pink-400/[0.06] text-pink-300',
    blue:   'border-violet-400/20 bg-violet-400/[0.06] text-violet-300',
  }[tone]
  return (
    <div className={`rounded-xl border px-4 py-3 ${cls}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-medium text-white/45">{icon} {label}</p>
    </div>
  )
}

function HealthMetric({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3">
      <p className={`text-xl font-black ${highlight ? 'text-orange-300' : 'text-white'}`}>{value}</p>
      <p className="mt-1 text-xs text-white/35">{label}</p>
    </div>
  )
}

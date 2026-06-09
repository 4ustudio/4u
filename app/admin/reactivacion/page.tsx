import Link from 'next/link'
import { getRetentionDashboardData } from '../_actions/retention'
import RetentionPreviewPanel from './_components/RetentionPreviewPanel'
import ReactivationRowActions from './_components/ReactivationRowActions'

export const dynamic = 'force-dynamic'

const RISK_REASON_LABEL: Record<string, string> = {
  no_show_frecuente: '⚠ 3+ no-shows en 60 días',
  no_show_consecutivo: '⚠ 2 no-shows consecutivos',
  no_response_frecuente: '⚠ Sin respuesta repetida',
  sin_actividad_30d: '30+ días sin clase',
  sin_actividad_60d: '60+ días sin clase',
  sin_actividad_90d: '90+ días sin clase',
}

const RISK_LEVEL_CLS: Record<string, string> = {
  bajo:    'bg-green-500/10 text-green-300',
  medio:   'bg-yellow-500/10 text-yellow-300',
  alto:    'bg-orange-500/10 text-orange-300',
  critico: 'bg-red-500/10 text-red-300',
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  lead: { label: 'Lead', cls: 'border-white/12 bg-white/6 text-white/55' },
  matriculado: { label: 'Matriculado', cls: 'border-purple-400/20 bg-[#ff7a00]/10 text-purple-300' },
  activo: { label: 'Activo', cls: 'border-green-400/20 bg-green-400/10 text-green-300' },
  riesgo: { label: 'Riesgo', cls: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-300' },
  inactivo: { label: 'Inactivo', cls: 'border-red-400/20 bg-red-400/10 text-red-300' },
  exalumno: { label: 'Exalumno', cls: 'border-white/15 bg-white/5 text-white/45' },
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin registro'
  return new Date(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function percent(value?: number | null) {
  return `${Math.round(Number(value ?? 0))}%`
}

export default async function ReactivationPage() {
  const data = await getRetentionDashboardData()
  const dashboard = data.dashboard as any
  const highRisk = data.highRisk as any[]
  const alerts = data.alerts as any[]
  const students = data.students as any[]

  return (
    <div className="space-y-6 w-full page-animate">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-400">Retención de estudiantes</p>
          <h1 className="mt-1 text-2xl font-black text-white">Reactivación y seguimiento</h1>
          <p className="mt-1 text-sm text-white/45">
            Detección, seguimiento y reportes sin eliminar historial.
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Activos" value={dashboard?.active_students ?? 0} tone="green" />
        <Metric label="En riesgo" value={dashboard?.risk_students ?? 0} tone="yellow" />
        <Metric label="Inactivos" value={dashboard?.inactive_students ?? 0} tone="red" />
        <Metric label="Exalumnos" value={dashboard?.alumni_students ?? 0} tone="white" />
        <Metric label="Planes por vencer" value={dashboard?.plans_expiring_week ?? 0} tone="orange" />
        <Metric label="Reactivados este mes" value={dashboard?.reactivated_this_month ?? 0} tone="blue" />
        <Metric label="Tasa reactivación" value={percent(dashboard?.reactivation_rate)} tone="purple" />
        <Metric label="Sin próximas clases" value={dashboard?.without_upcoming_sessions ?? 0} tone="orange" />
      </section>

      {alerts.length > 0 && (
        <section className="rounded-xl border border-yellow-500/20 bg-yellow-500/[0.06] p-5">
          <h2 className="text-sm font-bold text-white">Alertas administrativas</h2>
          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-white/10 bg-black/25 px-4 py-3">
                <p className="text-sm font-semibold text-white">{alert.title}</p>
                <p className="mt-1 text-xs text-white/45">{alert.message}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <RetentionPreviewPanel />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5">
          <h2 className="text-sm font-bold text-white">Estudiantes con mayor riesgo</h2>
          <p className="mt-1 text-xs text-white/35">Ordenado por menor score y más días sin actividad.</p>
          <div className="mt-4 space-y-3">
            {highRisk.length === 0 ? (
              <p className="text-sm text-white/35">No hay estudiantes priorizados.</p>
            ) : highRisk.map((student) => (
              <Link key={student.id} href={`/admin/students/${student.id}`} className="block rounded-lg border border-white/10 bg-black/20 p-3 hover:border-orange-500/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{student.name}</p>
                    <p className="mt-0.5 text-xs text-white/40">{student.instructor_name ?? 'Sin instructor'} · {student.primary_course_name ?? 'Sin instrumento'}</p>
                    <p className="mt-0.5 text-xs text-white/30">
                      Última clase: {student.last_completed_class_at ? formatDate(student.last_completed_class_at) : 'Sin registro'}
                      {' '}· {student.days_since_activity} días
                    </p>
                    {student.risk_reason && (
                      <p className="mt-1 text-[11px] text-yellow-400/70">{RISK_REASON_LABEL[student.risk_reason] ?? student.risk_reason}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${RISK_LEVEL_CLS[student.risk_level] ?? 'bg-white/5 text-white/45'}`}>
                      {student.retention_score ?? 0}
                    </span>
                    {student.risk_level && <span className="text-[10px] text-white/30">{student.risk_level}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#0f0f0f] overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-sm font-bold text-white">Centro de reactivación</h2>
            <p className="mt-1 text-xs text-white/35">Contacta, registra observaciones y marca reactivaciones.</p>
          </div>

          <div className="divide-y divide-white/5">
            {students.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-white/35">No hay alumnos pendientes de seguimiento.</p>
            ) : students.map((student) => {
              const meta = STATUS_META[student.student_status] ?? STATUS_META.activo
              return (
                <div key={student.id} className="grid gap-4 px-5 py-4 xl:grid-cols-[1.2fr_160px_110px_1.4fr]">
                  <div className="min-w-0">
                    <Link href={`/admin/students/${student.id}`} className="text-sm font-bold text-white hover:text-orange-300">
                      {student.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-white/40">{student.instructor_name ?? 'Sin instructor'} · {student.primary_course_name ?? 'Sin instrumento'}</p>
                    <p className="mt-0.5 truncate text-xs text-white/30">{student.email ?? 'Sin correo'} · {student.phone ?? 'Sin teléfono'}</p>
                    <p className="mt-0.5 text-xs text-white/25">
                      Última clase: {student.last_completed_class_at ? formatDate(student.last_completed_class_at) : formatDate(student.last_activity_at)}
                    </p>
                    {student.risk_reason && (
                      <p className="mt-1 text-[11px] text-yellow-400/60">{RISK_REASON_LABEL[student.risk_reason] ?? student.risk_reason}</p>
                    )}
                  </div>
                  <div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <p className="mt-2 text-xs text-white/35">{student.days_since_activity ?? 0} días</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{student.retention_score ?? 0}</p>
                    <p className="text-xs text-white/35">{student.risk_level ?? 'score'}</p>
                  </div>
                  <ReactivationRowActions studentId={student.id} phone={student.phone} email={student.email} />
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone: 'green' | 'yellow' | 'red' | 'white' | 'orange' | 'blue' | 'purple' }) {
  const color: Record<typeof tone, string> = {
    green: 'text-green-300 border-green-400/15 bg-green-400/[0.06]',
    yellow: 'text-yellow-300 border-yellow-400/15 bg-yellow-400/[0.06]',
    red: 'text-red-300 border-red-400/15 bg-red-400/[0.06]',
    white: 'text-white border-white/10 bg-white/[0.04]',
    orange: 'text-orange-300 border-orange-400/15 bg-orange-400/[0.06]',
    blue: 'text-violet-300 border-violet-400/15 bg-white/40/[0.06]',
    purple: 'text-purple-300 border-purple-400/15 bg-[#ff7a00]/[0.06]',
  }
  return (
    <div className={`rounded-xl border px-5 py-4 ${color[tone]}`}>
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-medium text-white/45">{label}</p>
    </div>
  )
}

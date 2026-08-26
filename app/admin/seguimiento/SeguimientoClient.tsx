'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { MdEditNote, MdHistory, MdCall, MdCheck, MdClose, MdRefresh } from 'react-icons/md'
import { FaWhatsapp } from 'react-icons/fa'
import type { StudentAtRisk, Followup, RiskLevel, FollowupMetrics } from '@/app/admin/_actions/followups'
import { createFollowup, markStudentRecovered, getStudentFollowups } from '@/app/admin/_actions/followups'
import { isBirthdayMonth } from '@/lib/students/birthday'

// ── Constantes ────────────────────────────────────────────────

const RISK_CONFIG: Record<RiskLevel, { label: string; dot: string; badge: string; text: string }> = {
  HIGH:   { label: 'Alto',  dot: 'bg-red-400',    badge: 'bg-red-500/12 text-red-300 border-red-500/20',    text: 'text-red-300' },
  MEDIUM: { label: 'Medio', dot: 'bg-yellow-400',  badge: 'bg-yellow-500/12 text-yellow-300 border-yellow-500/20', text: 'text-yellow-300' },
  LOW:    { label: 'Bajo',  dot: 'bg-green-400',   badge: 'bg-green-500/12 text-green-300 border-green-500/20',  text: 'text-green-300' },
}

const FOLLOWUP_TYPES = ['llamada', 'whatsapp', 'email', 'reunión', 'observación'] as const
const FOLLOWUP_TYPE_LABELS: Record<string, string> = {
  llamada: '📞 Llamada', whatsapp: '💬 WhatsApp', email: '✉️ Email',
  reunión: '🤝 Reunión', observación: '📝 Observación',
}

const STATUS_OPTIONS = [
  { value: 'completado',    label: 'Completado' },
  { value: 'sin_respuesta', label: 'Sin respuesta' },
  { value: 'pendiente',     label: 'Pendiente' },
]

const RISK_REASON_LABEL: Record<string, string> = {
  no_show_frecuente: '3+ no-shows en 60 días',
  no_show_consecutivo: '2 no-shows consecutivos',
  no_response_frecuente: 'Sin respuesta repetida',
  sin_actividad_30d: '30+ días sin clase',
  sin_actividad_60d: '60+ días sin clase',
  sin_actividad_90d: '90+ días sin clase',
}

const RISK_ICON: Record<string, string> = { bajo: '🟢', medio: '🟡', alto: '🟠', critico: '🔴' }

const RISK_LEVEL_CLS: Record<string, string> = {
  bajo:    'bg-green-500/10 text-green-300 border-green-500/20',
  medio:   'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  alto:    'bg-orange-500/10 text-orange-300 border-orange-500/20',
  critico: 'bg-red-500/10 text-red-300 border-red-500/20',
}

function peso(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatShortDate(value?: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function cleanPhone(raw: string | null): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  return digits.startsWith('57') ? digits : `57${digits}`
}

function buildWhatsApp(student: StudentAtRisk): string {
  const phone = cleanPhone(student.phone)
  const firstName = student.full_name.split(' ')[0] ?? student.full_name
  const msg = encodeURIComponent(
    `Hola ${firstName} 👋\n\nNotamos que no has asistido recientemente a tus clases en 4U Studio Academy.\n\nQueríamos saber cómo estás y ayudarte a retomar tu proceso de formación.\n\n¿Podemos ayudarte con algo?\n\nEquipo 4U Studio Academy`
  )
  return phone ? `https://wa.me/${phone}?text=${msg}` : '#'
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

// ── Tipos ─────────────────────────────────────────────────────

type Stats = {
  active: number; risk: number; critical: number
  recoveredMonth: number; totalManaged: number; recoveryRate: number
}

type Props = {
  students: StudentAtRisk[]
  latestFollowups: Record<string, Followup>
  followupMetrics: FollowupMetrics
  stats: Stats
  dashboard: Record<string, any> | null
  highRisk: any[]
  alerts: any[]
  birthdayThisMonth: number
  overduePaymentsTotal: number
  overduePaymentsCount: number
  migrationMissing: string | false
}

type ModalMode = 'followup' | 'history' | null

// ── Componente principal ──────────────────────────────────────

export default function SeguimientoClient({
  students, latestFollowups: initialFollowups, followupMetrics, stats,
  dashboard, highRisk, alerts, birthdayThisMonth, overduePaymentsTotal, overduePaymentsCount, migrationMissing,
}: Props) {
  const [filter, setFilter] = useState<RiskLevel | 'ALL'>('ALL')
  const [modal, setModal] = useState<{ mode: ModalMode; student: StudentAtRisk | null }>({ mode: null, student: null })
  const [followups, setFollowups] = useState<Record<string, Followup>>(initialFollowups)
  const [historyData, setHistoryData] = useState<Followup[]>([])
  const [isPending, startTransition] = useTransition()
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [recoveryPending, setRecoveryPending] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const filtered = filter === 'ALL' ? students : students.filter(s => s.computed_risk_level === filter)
  const atRiskCount = (dashboard?.risk_students ?? 0) + (dashboard?.inactive_students ?? 0)

  const counts: Record<RiskLevel | 'ALL', number> = {
    ALL: students.length,
    HIGH: students.filter(s => s.computed_risk_level === 'HIGH').length,
    MEDIUM: students.filter(s => s.computed_risk_level === 'MEDIUM').length,
    LOW: students.filter(s => s.computed_risk_level === 'LOW').length,
  }

  function openFollowup(student: StudentAtRisk) {
    setModal({ mode: 'followup', student })
  }

  async function openHistory(student: StudentAtRisk) {
    setModal({ mode: 'history', student })
    setLoadingHistory(true)
    const data = await getStudentFollowups(student.id)
    setHistoryData(data)
    setLoadingHistory(false)
  }

  function closeModal() {
    setModal({ mode: null, student: null })
    setHistoryData([])
    formRef.current?.reset()
  }

  async function handleFollowup(formData: FormData) {
    startTransition(async () => {
      const result = await createFollowup(formData)
      if (result.ok) closeModal()
    })
  }

  async function handleMarkRecovered(studentId: string) {
    setRecoveryPending(studentId)
    await markStudentRecovered(studentId)
    setRecoveryPending(null)
  }

  const followupStatus = (id: string) => {
    const f = followups[id]
    if (!f) return { label: 'Pendiente', cls: 'bg-white/6 text-white/50 border-white/12' }
    const days = Math.floor((Date.now() - new Date(f.created_at).getTime()) / 86400000)
    if (days <= 2) return { label: 'Seguimiento activo', cls: 'bg-green-500/10 text-green-300 border-green-500/20' }
    return { label: `Hace ${days}d`, cls: 'bg-white/6 text-white/50 border-white/12' }
  }

  return (
    <div className="space-y-6 page-animate">
      {/* ── Header ────────────────────────────────────────── */}
      <section className="rounded-[28px] border border-white/10 bg-[#0b0b0b] px-5 py-5 lg:px-8 lg:py-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ff7a00]/20 bg-[#ff7a00]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ff9a3b]">
              Operación diaria
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">Seguimiento de Alumnos</h1>
            <p className="text-sm text-white/45">Detecta estudiantes en riesgo, contáctalos y registra el seguimiento en un solo lugar.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Recovery Rate</p>
              <p className="mt-1 text-2xl font-bold text-[#ff9a3b]">{stats.recoveryRate}%</p>
            </div>
          </div>
        </div>
      </section>

      {migrationMissing && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          Aplica primero <b>supabase-retention-v1.sql</b> en Supabase para activar datos reales de retención.
          <p className="mt-1 text-xs text-yellow-100/70">{migrationMissing}</p>
        </div>
      )}

      {/* ── Alertas del día ──────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <AlertCard icon="🚨" label="Requieren atención" value={atRiskCount} tone="red" />
        <AlertCard icon="💰" label="Pagos vencidos" value={overduePaymentsCount} tone="orange" />
        <AlertCard icon="📅" label="Sin próximas clases" value={dashboard?.without_upcoming_sessions ?? 0} tone="yellow" />
        <AlertCard icon="🎂" label="Cumpleaños del mes" value={birthdayThisMonth} tone="pink" />
        <AlertCard icon="📞" label="Seguimientos pendientes" value={alerts.length} tone="blue" />
      </section>

      {/* ── Salud de la Academia ─────────────────────────── */}
      <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5">
        <h2 className="text-sm font-bold text-white mb-4">Salud de la Academia</h2>
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <HealthMetric label="Estudiantes activos" value={dashboard?.active_students ?? 0} />
          <HealthMetric label="Tasa de retención" value={dashboard?.retention_rate != null ? `${dashboard.retention_rate}%` : '--'} />
          <HealthMetric label="Tasa de asistencia" value={dashboard?.attendance_rate != null ? `${dashboard.attendance_rate}%` : '--'} />
          <HealthMetric label="Reactivados este mes" value={dashboard?.reactivated_this_month ?? 0} />
          {overduePaymentsTotal > 0 && (
            <HealthMetric label="💰 Cartera vencida" value={peso(overduePaymentsTotal)} highlight />
          )}
        </div>
      </section>

      {/* ── Auditoría de Seguimientos ────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <AuditStat label="Seguimientos este mes" value={followupMetrics.seguimientosMes} />
        <AuditStat label="Pendientes" value={followupMetrics.pendientes} warn={followupMetrics.pendientes > 0} />
        <AuditStat label="Completados" value={followupMetrics.completadosMes} />
        <AuditStat label="Acciones vencidas" value={followupMetrics.accionesVencidas} warn={followupMetrics.accionesVencidas > 0} />
        <AuditStat label="Recuperados este mes" value={followupMetrics.recuperadosMes} highlight />
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        {/* ── Prioridades de hoy ──────────────────────────── */}
        <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5 self-start">
          <h2 className="text-sm font-bold text-white">Prioridades de hoy</h2>
          <p className="mt-1 text-xs text-white/35">Ordenado por urgencia.</p>
          <div className="mt-4 space-y-3">
            {highRisk.length === 0 ? (
              <p className="text-sm text-white/35">No hay estudiantes priorizados.</p>
            ) : highRisk.map((student: any) => {
              const motivos = getMotivos(student)
              return (
                <Link key={student.id} href={`/admin/students/${student.id}`} className="block rounded-lg border border-white/10 bg-black/20 p-3 hover:border-orange-500/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{student.name}</p>
                      <p className="mt-0.5 text-xs text-white/40">{student.instructor_name ?? 'Sin instructor'} · {student.primary_course_name ?? 'Sin instrumento'}</p>
                      <p className="mt-0.5 text-xs text-white/30">
                        Última clase: {formatShortDate(student.last_completed_class_at) ?? 'Sin registro'}
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

        {/* ── Filtros + Tabla de estudiantes ────────────────── */}
        <section className="rounded-[28px] border border-white/10 bg-[#0b0b0b] shadow-[0_20px_60px_rgba(0,0,0,0.24)] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-white/8 px-5 py-4 flex-wrap">
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(lvl => {
              const cfg = lvl === 'ALL' ? null : RISK_CONFIG[lvl]
              const active = filter === lvl
              return (
                <button
                  key={lvl}
                  onClick={() => setFilter(lvl)}
                  className={[
                    'flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all',
                    active
                      ? 'border-[#ff7a00]/30 bg-[#2a1b12] text-[#ff9a3b]'
                      : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white',
                  ].join(' ')}
                >
                  {cfg && <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />}
                  <span>{lvl === 'ALL' ? 'Todos' : cfg!.label}</span>
                  <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${active ? 'bg-[#ff7a00] text-white' : 'bg-white/10 text-white/60'}`}>
                    {counts[lvl]}
                  </span>
                </button>
              )
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-white/35">
              No hay estudiantes con este nivel de riesgo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[740px]">
                <thead>
                  <tr className="border-b border-white/6 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/30">
                    <th className="px-5 py-3 text-left">Estudiante</th>
                    <th className="px-4 py-3 text-left">Programa</th>
                    <th className="px-4 py-3 text-center">Riesgo</th>
                    <th className="px-4 py-3 text-center">Sin asistir</th>
                    <th className="px-4 py-3 text-right">Mora</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filtered.map(student => {
                    const st = followupStatus(student.id)
                    const isRecovering = recoveryPending === student.id
                    return (
                      <tr key={student.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <AvatarBadge name={student.full_name} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate max-w-[160px]">{student.full_name}</p>
                              {student.phone && (
                                <p className="text-xs text-white/35 truncate">{student.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-white/70">{student.plan_name ?? '—'}</p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <RiskBadge level={student.computed_risk_level} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          {student.days_since_last_class != null ? (
                            <span className={`text-sm font-medium ${student.days_since_last_class > 30 ? 'text-red-300' : student.days_since_last_class > 14 ? 'text-yellow-300' : 'text-white/70'}`}>
                              {student.days_since_last_class}d
                            </span>
                          ) : <span className="text-white/30 text-sm">—</span>}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {student.overdue_amount > 0 ? (
                            <span className="text-sm font-semibold text-red-300">{peso(student.overdue_amount)}</span>
                          ) : (
                            <span className="text-sm text-white/30">$0</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <ActionBtn label="Seguimiento" icon={<NoteIcon />} onClick={() => openFollowup(student)} />
                            <ActionBtn label="Historial" icon={<HistoryIcon />} onClick={() => openHistory(student)} />
                            <a
                              href={buildWhatsApp(student)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="WhatsApp"
                              className="grid h-8 w-8 place-items-center rounded-xl border border-green-500/20 bg-green-500/8 text-green-400 transition hover:bg-green-500/15"
                            >
                              <WaIcon />
                            </a>
                            {student.phone && (
                              <a
                                href={`tel:${student.phone}`}
                                title="Llamar"
                                className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-white/55 transition hover:text-white"
                              >
                                <PhoneIcon />
                              </a>
                            )}
                            <button
                              onClick={() => handleMarkRecovered(student.id)}
                              disabled={isRecovering}
                              title="Marcar Recuperado"
                              className="grid h-8 w-8 place-items-center rounded-xl border border-[#ff7a00]/20 bg-[#ff7a00]/8 text-[#ff9a3b] transition hover:bg-[#ff7a00]/15 disabled:opacity-50"
                            >
                              {isRecovering ? <SpinnerIcon /> : <CheckIcon />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ── Modal Seguimiento ────────────────────────────── */}
      {modal.mode === 'followup' && modal.student && (
        <ModalOverlay onClose={closeModal}>
          <div className="w-full max-w-md">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/35">Registrar Seguimiento</p>
                <h2 className="mt-1 text-lg font-bold text-white">{modal.student.full_name}</h2>
              </div>
              <button onClick={closeModal} className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 text-white/50 hover:text-white">
                <CloseIcon />
              </button>
            </div>

            <form ref={formRef} action={handleFollowup} className="space-y-4">
              <input type="hidden" name="student_id" value={modal.student.id} />

              <FormField label="Tipo de contacto">
                <select
                  name="followup_type"
                  required
                  className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-[#ff7a00]/40 focus:bg-white/[0.06]"
                >
                  <option value="" className="bg-[#111]">Seleccionar...</option>
                  {FOLLOWUP_TYPES.map(t => (
                    <option key={t} value={t} className="bg-[#111]">{FOLLOWUP_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Notas">
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Descripción del contacto realizado..."
                  className="w-full resize-none rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-[#ff7a00]/40 focus:bg-white/[0.06]"
                />
              </FormField>

              <FormField label="Resultado">
                <input
                  name="result"
                  type="text"
                  placeholder="Ej: Retomará clases la próxima semana"
                  className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-[#ff7a00]/40"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Estado">
                  <select
                    name="status"
                    className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-[#ff7a00]/40"
                  >
                    {STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value} className="bg-[#111]">{o.label}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Próxima acción">
                  <input
                    name="next_action_date"
                    type="date"
                    className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white/80 outline-none focus:border-[#ff7a00]/40 [color-scheme:dark]"
                  />
                </FormField>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-2xl border border-white/10 py-3 text-sm font-medium text-white/60 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-2xl bg-[#ff7a00] py-3 text-sm font-semibold text-white transition hover:bg-[#ff8f1f] disabled:opacity-60"
                >
                  {isPending ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* ── Modal Historial ──────────────────────────────── */}
      {modal.mode === 'history' && modal.student && (
        <ModalOverlay onClose={closeModal}>
          <div className="w-full max-w-lg">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/35">Historial de Seguimiento</p>
                <h2 className="mt-1 text-lg font-bold text-white">{modal.student.full_name}</h2>
              </div>
              <button onClick={closeModal} className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 text-white/50 hover:text-white">
                <CloseIcon />
              </button>
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-10">
                <SpinnerIcon />
              </div>
            ) : historyData.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/35">
                Sin seguimientos registrados para este estudiante.
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
                {historyData.map(f => (
                  <div key={f.id} className="rounded-[20px] border border-white/8 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#ff9a3b]">
                        {FOLLOWUP_TYPE_LABELS[f.followup_type]}
                      </span>
                      <span className="text-[11px] text-white/35">{formatDate(f.created_at)}</span>
                    </div>
                    {f.notes && <p className="mt-2 text-sm text-white/75">{f.notes}</p>}
                    {f.result && <p className="mt-1 text-xs text-green-300">→ {f.result}</p>}
                    {f.next_action_date && (
                      <p className="mt-1 text-xs text-white/35">Próxima acción: {formatDate(f.next_action_date)}</p>
                    )}
                    <StatusPill status={f.status} />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => { closeModal(); setTimeout(() => openFollowup(modal.student!), 50) }}
                className="rounded-2xl bg-[#ff7a00] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ff8f1f] transition"
              >
                + Nuevo seguimiento
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────

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

function AuditStat({ label, value, warn, highlight }: { label: string; value: number; warn?: boolean; highlight?: boolean }) {
  const textCls = highlight ? 'text-[#ff9a3b]' : warn && value > 0 ? 'text-red-300' : 'text-white'
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.02] px-4 py-3.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/30">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${textCls}`}>{value}</p>
    </div>
  )
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg = RISK_CONFIG[level]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cfg.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function AvatarBadge({ name }: { name: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')
  return (
    <div
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xs font-bold"
      style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-accent-soft)', color: 'var(--adm-accent)' }}
    >
      {initials}
    </div>
  )
}

function ActionBtn({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-white/55 transition hover:border-[#ff7a00]/20 hover:bg-[#ff7a00]/8 hover:text-[#ff9a3b]"
    >
      {icon}
    </button>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">{label}</label>
      {children}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    completado:    'bg-green-500/10 text-green-300',
    sin_respuesta: 'bg-red-500/10 text-red-300',
    pendiente:     'bg-yellow-500/10 text-yellow-300',
  }
  return (
    <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${cfg[status] ?? 'bg-white/8 text-white/45'}`}>
      {status}
    </span>
  )
}

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full rounded-[28px] border border-white/12 bg-[#0d0d0d] p-6 shadow-[0_40px_80px_rgba(0,0,0,0.5)]"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

// ── Iconos ────────────────────────────────────────────────────

function NoteIcon() { return <MdEditNote className="h-4 w-4" aria-hidden="true" /> }
function HistoryIcon() { return <MdHistory className="h-4 w-4" aria-hidden="true" /> }
function WaIcon() { return <FaWhatsapp className="h-4 w-4" aria-hidden="true" /> }
function PhoneIcon() { return <MdCall className="h-4 w-4" aria-hidden="true" /> }
function CheckIcon() { return <MdCheck className="h-4 w-4" aria-hidden="true" /> }
function CloseIcon() { return <MdClose className="h-4 w-4" aria-hidden="true" /> }
function SpinnerIcon() { return <MdRefresh className="h-4 w-4 animate-spin" aria-hidden="true" /> }

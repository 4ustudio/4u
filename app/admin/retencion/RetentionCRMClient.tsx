'use client'

import { useState, useTransition, useRef } from 'react'
import type { StudentAtRisk, Followup, RiskLevel, FollowupMetrics } from '@/app/admin/_actions/followups'
import { createFollowup, markStudentRecovered, getStudentFollowups } from '@/app/admin/_actions/followups'

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

function peso(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
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

// ── Tipos internos ────────────────────────────────────────────

type Stats = {
  active: number; risk: number; critical: number
  recoveredMonth: number; totalManaged: number; recoveryRate: number
}

type Props = {
  students: StudentAtRisk[]
  latestFollowups: Record<string, Followup>
  followupMetrics: FollowupMetrics
  stats: Stats
}

type ModalMode = 'followup' | 'history' | null

// ── Componente principal ──────────────────────────────────────

export default function RetentionCRMClient({ students, latestFollowups: initialFollowups, followupMetrics, stats }: Props) {
  const [filter, setFilter] = useState<RiskLevel | 'ALL'>('ALL')
  const [modal, setModal] = useState<{ mode: ModalMode; student: StudentAtRisk | null }>({ mode: null, student: null })
  const [followups, setFollowups] = useState<Record<string, Followup>>(initialFollowups)
  const [historyData, setHistoryData] = useState<Followup[]>([])
  const [isPending, startTransition] = useTransition()
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [recoveryPending, setRecoveryPending] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const filtered = filter === 'ALL' ? students : students.filter(s => s.computed_risk_level === filter)
  const criticalCases = students.filter(s =>
    s.computed_risk_level === 'HIGH' ||
    s.overdue_amount > 0 ||
    (s.days_since_last_class ?? 0) > 30
  )

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
      if (result.ok) {
        closeModal()
      }
    })
  }

  async function handleMarkRecovered(studentId: string) {
    setRecoveryPending(studentId)
    const result = await markStudentRecovered(studentId)
    if (result.ok) {
      // Optimistic: remove from list or change badge - page will revalidate
    }
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
              CRM Retención V1.3
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">Retención de Estudiantes</h1>
            <p className="text-sm text-white/45">Seguimiento activo de estudiantes en riesgo y recuperación de matrículas.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Recovery Rate</p>
              <p className="mt-1 text-2xl font-bold text-[#ff9a3b]">{stats.recoveryRate}%</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── KPIs ─────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Estudiantes Activos" value={stats.active} color="green" />
        <KpiCard label="En Riesgo" value={stats.risk} color="yellow" />
        <KpiCard label="Críticos" value={stats.critical} color="red" />
        <KpiCard label="Recuperados este mes" value={stats.recoveredMonth} color="orange" />
      </section>

      {/* ── Auditoría de Seguimientos ────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <AuditStat label="Seguimientos este mes" value={followupMetrics.seguimientosMes} />
        <AuditStat label="Pendientes" value={followupMetrics.pendientes} warn={followupMetrics.pendientes > 0} />
        <AuditStat label="Completados" value={followupMetrics.completadosMes} />
        <AuditStat label="Acciones vencidas" value={followupMetrics.accionesVencidas} warn={followupMetrics.accionesVencidas > 0} />
        <AuditStat label="Recuperados este mes" value={followupMetrics.recuperadosMes} highlight />
      </section>

      {/* ── Casos Críticos ───────────────────────────────── */}
      {criticalCases.length > 0 && (
        <section>
          <div className="rounded-[24px] border border-red-500/20 bg-red-500/[0.04] p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400 animate-pulse" />
              <p className="text-sm font-bold text-red-300">Casos Críticos — Atención Inmediata</p>
              <span className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {criticalCases.length}
              </span>
            </div>
            <div className="space-y-3">
              {criticalCases.map(student => (
                <div key={student.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-[#0b0b0b] px-4 py-3">
                  <AvatarBadge name={student.full_name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{student.full_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-white/45">
                      {student.plan_name && <span>{student.plan_name}</span>}
                      {(student.days_since_last_class ?? 0) > 0 && (
                        <span className="text-red-300">{student.days_since_last_class}d sin asistir</span>
                      )}
                      {student.overdue_amount > 0 && (
                        <span className="text-red-300">{peso(student.overdue_amount)} en mora</span>
                      )}
                    </div>
                  </div>
                  <RiskBadge level={student.computed_risk_level} />
                  <div className="flex items-center gap-2">
                    <ActionBtn
                      label="Seguimiento"
                      icon={<NoteIcon />}
                      onClick={() => openFollowup(student)}
                    />
                    <a
                      href={buildWhatsApp(student)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid h-8 w-8 place-items-center rounded-xl border border-green-500/20 bg-green-500/8 text-green-400 transition hover:bg-green-500/15"
                      title="Enviar WhatsApp"
                    >
                      <WaIcon />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Filtros + Tabla ──────────────────────────────── */}
      <section className="rounded-[28px] border border-white/10 bg-[#0b0b0b] shadow-[0_20px_60px_rgba(0,0,0,0.24)] overflow-hidden">
        {/* Filtros */}
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

        {/* Tabla */}
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

function AuditStat({ label, value, warn, highlight }: { label: string; value: number; warn?: boolean; highlight?: boolean }) {
  const textCls = highlight ? 'text-[#ff9a3b]' : warn && value > 0 ? 'text-red-300' : 'text-white'
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.02] px-4 py-3.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/30">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${textCls}`}>{value}</p>
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: number; color: 'green' | 'yellow' | 'red' | 'orange' }) {
  const cls = {
    green:  'text-green-300',
    yellow: 'text-yellow-300',
    red:    'text-red-300',
    orange: 'text-[#ff9a3b]',
  }[color]
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#0b0b0b] p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/35">{label}</p>
      <p className={`mt-4 text-4xl font-bold ${cls}`}>{value}</p>
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

function NoteIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M12 8v4l2 2"/><path d="M3.05 11a9 9 0 1 0 .5-4.5"/><path d="M3 3v5h5"/>
    </svg>
  )
}

function WaIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.34h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.08 6.08l1.32-.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  )
}

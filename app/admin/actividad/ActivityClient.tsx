'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { getActivityLogs } from './_actions'
import type { ActivityLogRow, ActivityFilters, ActivityModule, DashboardMetrics } from './_actions'
import type { Severity } from '@/lib/activity'
import { getContactPhoneForActivity } from '@/app/admin/_actions/whatsapp'
import WhatsAppButton from '@/components/admin/WhatsAppButton'

// ── Utils ─────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Ahora'
  if (m < 60) return `Hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Ayer'
  if (d < 7)  return `Hace ${d}d`
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: '2-digit' })
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })
}

function fmtDateGroup(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
}

// ── Meta por acción ───────────────────────────────────────────────

type ActionMeta = { color: string; bg: string; icon: string; label: string; module: string }

const ACTION_META: Record<string, ActionMeta> = {
  'enrollment.completed':      { color: 'text-green-400',   bg: 'bg-green-400/10',   icon: '🎓', label: 'Inscripción',    module: 'Ventas' },
  'lead.created':              { color: 'text-blue-400',    bg: 'bg-blue-400/10',    icon: '◎',  label: 'Lead nuevo',     module: 'CRM' },
  'lead.converted':            { color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: '⇢',  label: 'Conversión',     module: 'CRM' },
  'payment.received':          { color: 'text-[#ff7a00]',   bg: 'bg-[#ff7a00]/10',   icon: '💳', label: 'Pago',           module: 'Ventas' },
  'session.created':           { color: 'text-purple-400',  bg: 'bg-purple-400/10',  icon: '📅', label: 'Clase',          module: 'Académico' },
  'session.cancelled':         { color: 'text-red-400',     bg: 'bg-red-400/10',     icon: '✕',  label: 'Cancelación',    module: 'Académico' },
  'session.rescheduled':       { color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  icon: '↻',  label: 'Reprogramación', module: 'Académico' },
  'attendance.confirmed':      { color: 'text-teal-400',    bg: 'bg-teal-400/10',    icon: '✔',  label: 'Asistencia',     module: 'Académico' },
  'attendance.no_show':        { color: 'text-orange-400',  bg: 'bg-orange-400/10',  icon: '⚠️', label: 'No Show',        module: 'Académico' },
  'retention.status_changed':  { color: 'text-indigo-400',  bg: 'bg-indigo-400/10',  icon: '⚠️', label: 'Retención',      module: 'Retención' },
  'student.reactivated':       { color: 'text-cyan-400',    bg: 'bg-cyan-400/10',    icon: '★',  label: 'Reactivación',   module: 'Retención' },
  'student.profile_updated':   { color: 'text-white/60',    bg: 'bg-white/5',        icon: '✎',  label: 'Perfil',         module: 'Sistema' },
}

function getMeta(action: string): ActionMeta {
  return ACTION_META[action] ?? { color: 'text-white/50', bg: 'bg-white/5', icon: '·', label: action, module: 'Sistema' }
}

// ── Severity ──────────────────────────────────────────────────────

const SEVERITY_STYLE: Record<Severity, { dot: string; badge: string; label: string }> = {
  info:     { dot: 'border-white/8',           badge: 'bg-white/5 text-white/30',           label: 'Info' },
  warning:  { dot: 'border-yellow-500/30',      badge: 'bg-yellow-500/10 text-yellow-400',   label: 'Aviso' },
  critical: { dot: 'border-red-500/40',         badge: 'bg-red-500/10 text-red-400',         label: 'Crítico' },
}

// ── Rutas contextuales ────────────────────────────────────────────

function buildEntityLink(entity_type: string, entity_id: string | null): string | null {
  if (!entity_id) {
    const fallbacks: Record<string, string> = {
      lead:       '/admin/leads',
      enrollment: '/admin/enrollments',
      payment:    '/admin/ventas',
      session:    '/admin/agenda',
      attendance: '/admin/agenda',
      student:    '/admin/students',
      retention:  '/admin/reactivacion',
    }
    return fallbacks[entity_type] ?? null
  }
  switch (entity_type) {
    case 'student':    return `/admin/students/${entity_id}`
    case 'session':    return `/admin/agenda?session=${entity_id}`
    case 'attendance': return `/admin/agenda?session=${entity_id}`
    case 'lead':       return '/admin/leads'
    case 'enrollment': return '/admin/enrollments'
    case 'payment':    return '/admin/ventas'
    case 'retention':  return '/admin/reactivacion'
    default:           return null
  }
}

// ── Dashboard ─────────────────────────────────────────────────────

function MetricBlock({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-0.5">
      <div className={`text-xl font-mono font-bold ${color}`}>{value}</div>
      <div className="text-[11px] text-white/35 leading-tight">{label}</div>
    </div>
  )
}

interface DashboardProps { metrics: DashboardMetrics }

function Dashboard({ metrics }: DashboardProps) {
  const [period, setPeriod] = useState<'today' | 'week'>('today')
  const m = period === 'today' ? metrics.today : metrics.week

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
      {/* Header con toggle */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/6">
        <h2 className="text-sm font-semibold text-white/70">Resumen</h2>
        <div className="flex rounded-xl border border-white/8 overflow-hidden text-xs">
          {(['today', 'week'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={[
                'px-3 py-1.5 transition-colors',
                period === p
                  ? 'bg-[#ff7a00]/15 text-[#ff8a1d]'
                  : 'text-white/35 hover:text-white/60',
              ].join(' ')}
            >
              {p === 'today' ? 'Hoy' : '7 días'}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-px bg-white/5">
        {[
          { label: 'Eventos',       value: m.total,           color: 'text-white/70' },
          { label: 'Inscripciones', value: m.enrollments,     color: 'text-green-400' },
          { label: 'Leads',         value: m.leads_created,   color: 'text-blue-400' },
          { label: 'Conversiones',  value: m.leads_converted, color: 'text-emerald-400' },
          { label: 'Pagos',         value: m.payments,        color: 'text-[#ff7a00]' },
          { label: 'Clases',        value: m.sessions,        color: 'text-purple-400' },
          { label: 'Cancelaciones', value: m.cancellations,   color: 'text-red-400' },
          { label: 'No shows',      value: m.no_shows,        color: 'text-orange-400' },
          { label: 'En riesgo',     value: m.at_risk,         color: 'text-indigo-400' },
        ].map(item => (
          <div key={item.label} className="bg-[#070707] px-4 py-4">
            <MetricBlock {...item} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Drawer de detalle ─────────────────────────────────────────────

function DataDiff({ old_data, new_data }: { old_data: Record<string, unknown> | null; new_data: Record<string, unknown> | null }) {
  if (!old_data && !new_data) return null
  const keys = Array.from(new Set([...Object.keys(old_data ?? {}), ...Object.keys(new_data ?? {})]))
  if (keys.length === 0) return null

  return (
    <div className="space-y-1">
      {keys.map(k => {
        const oldVal = old_data?.[k]
        const newVal = new_data?.[k]
        const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal)
        return (
          <div key={k} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-start text-xs">
            <div className={`rounded-lg px-2 py-1.5 font-mono break-all ${changed && oldVal !== undefined ? 'bg-red-500/8 text-red-300/70' : 'bg-white/4 text-white/40'}`}>
              {oldVal !== undefined ? String(oldVal) : <span className="italic text-white/20">—</span>}
            </div>
            <div className="text-white/20 pt-1.5">→</div>
            <div className={`rounded-lg px-2 py-1.5 font-mono break-all ${changed && newVal !== undefined ? 'bg-green-500/8 text-green-300/80' : 'bg-white/4 text-white/40'}`}>
              {newVal !== undefined ? String(newVal) : <span className="italic text-white/20">—</span>}
            </div>
          </div>
        )
      }).filter(Boolean)}
    </div>
  )
}

function MetaTable({ data, title }: { data: Record<string, unknown>; title: string }) {
  const entries = Object.entries(data)
  if (entries.length === 0) return null
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-white/25 mb-2">{title}</p>
      <div className="rounded-xl border border-white/6 divide-y divide-white/4 overflow-hidden">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-3 px-3 py-2 text-xs">
            <span className="text-white/35 font-mono shrink-0 w-28 truncate">{k}</span>
            <span className="text-white/70 font-mono break-all">{JSON.stringify(v)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const CONTACTABLE_TYPES = new Set(['student', 'lead', 'enrollment', 'retention', 'payment'])

function Drawer({ row, onClose }: { row: ActivityLogRow; onClose: () => void }) {
  const [showJson, setShowJson] = useState(false)
  const [contact, setContact] = useState<{ name: string; phone: string } | null>(null)
  const meta = getMeta(row.action)
  const sev = SEVERITY_STYLE[row.severity ?? 'info']
  const entityLink = buildEntityLink(row.entity_type, row.entity_id)
  const hasDiff = row.old_data || row.new_data

  useEffect(() => {
    setContact(null)
    if (!row.entity_id || !CONTACTABLE_TYPES.has(row.entity_type)) return
    getContactPhoneForActivity(row.entity_type, row.entity_id).then(setContact)
  }, [row.entity_type, row.entity_id])

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#0a0a0a] border-l border-white/8 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm ${meta.bg} ${meta.color} border ${sev.dot}`}>
              {meta.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{meta.label}</p>
              <p className="text-[11px] text-white/30">{fmtDateTime(row.created_at)}</p>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 text-white/30 hover:text-white transition-colors mt-0.5">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Descripción */}
          <div>
            <p className="text-[11px] uppercase tracking-widest text-white/25 mb-1">Descripción</p>
            <p className="text-sm text-white/85 leading-relaxed">{row.description ?? row.action}</p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${sev.badge}`}>{sev.label}</span>
            <span className="rounded-lg px-2.5 py-1 text-xs bg-white/5 text-white/40">{meta.module}</span>
            {row.source && (
              <span className="rounded-lg px-2.5 py-1 text-xs bg-white/5 text-white/40 uppercase tracking-wider">{row.source}</span>
            )}
            {row.created_by_system && (
              <span className="rounded-lg px-2.5 py-1 text-xs bg-white/5 text-white/30">Sistema</span>
            )}
          </div>

          {/* Actor */}
          {(row.actor_name || row.actor_role) && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/25 mb-2">Actor</p>
              <div className="rounded-xl border border-white/6 px-3 py-2.5 flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-white/8 grid place-items-center text-xs text-white/50 shrink-0">
                  {row.actor_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-sm text-white/80">{row.actor_name ?? '—'}</p>
                  {row.actor_role && <p className="text-[11px] text-white/30 capitalize">{row.actor_role}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Entidad */}
          <div>
            <p className="text-[11px] uppercase tracking-widest text-white/25 mb-2">Entidad</p>
            <div className="rounded-xl border border-white/6 px-3 py-2.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-white/50 capitalize">{row.entity_type}</p>
                {row.entity_id && <p className="text-[11px] font-mono text-white/25 truncate max-w-[200px]">{row.entity_id}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {contact && (
                  <WhatsAppButton
                    phone={contact.phone}
                    template="general_message"
                    vars={{ name: contact.name }}
                    entityType={row.entity_type as 'student' | 'lead' | 'payment' | 'retention'}
                    entityId={row.entity_id ?? ''}
                    variant="pill"
                    label="Contactar"
                  />
                )}
                {entityLink && (
                  <Link
                    href={entityLink}
                    onClick={onClose}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white hover:border-white/25 transition-all"
                  >
                    Ver →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Diff old → new */}
          {hasDiff && !showJson && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-widest text-white/25">Cambios</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-white/20 mr-1">
                  <span className="text-center">Antes</span>
                  <span className="text-center">Después</span>
                </div>
              </div>
              <DataDiff old_data={row.old_data} new_data={row.new_data} />
            </div>
          )}

          {/* Metadata */}
          {row.metadata && !showJson && (
            <MetaTable data={row.metadata} title="Metadata" />
          )}

          {/* JSON view */}
          {showJson && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/25 mb-2">JSON completo</p>
              <pre className="rounded-xl border border-white/6 bg-white/[0.02] p-4 text-[11px] font-mono text-white/50 overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify({
                  action: row.action,
                  entity_type: row.entity_type,
                  entity_id: row.entity_id,
                  severity: row.severity,
                  source: row.source,
                  old_data: row.old_data,
                  new_data: row.new_data,
                  metadata: row.metadata,
                }, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/6 px-5 py-3 flex items-center justify-between">
          <button
            onClick={() => setShowJson(v => !v)}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            {showJson ? '← Vista amigable' : 'Ver JSON'}
          </button>
          {entityLink && (
            <Link
              href={entityLink}
              onClick={onClose}
              className="rounded-xl border border-[#ff7a00]/20 bg-[#ff7a00]/8 px-4 py-1.5 text-xs text-[#ff8a1d] hover:bg-[#ff7a00]/15 transition-all"
            >
              Abrir entidad →
            </Link>
          )}
        </div>
      </div>
    </>
  )
}

// ── Timeline row ─────────────────────────────────────────────────

function TimelineRow({ row, onClick }: { row: ActivityLogRow; onClick: () => void }) {
  const meta = getMeta(row.action)
  const sev  = SEVERITY_STYLE[row.severity ?? 'info']

  return (
    <button
      onClick={onClick}
      className="w-full text-left group flex gap-3 py-3 px-4 hover:bg-white/[0.025] transition-colors"
    >
      <div className="flex flex-col items-center pt-0.5 shrink-0">
        <div className={`grid h-8 w-8 place-items-center rounded-xl text-xs ${meta.bg} ${meta.color} border ${sev.dot}`}>
          {meta.icon}
        </div>
        <div className="mt-1 w-px flex-1 bg-white/5 min-h-[12px]" />
      </div>

      <div className="min-w-0 flex-1 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-white/85 leading-snug group-hover:text-white transition-colors">
              {row.description ?? row.action}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-white/30">
              {row.actor_name && <span>{row.actor_name}</span>}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${meta.bg} ${meta.color}`}>{meta.label}</span>
              {row.severity !== 'info' && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${sev.badge}`}>{sev.label}</span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-white/25">{fmtTime(row.created_at)}</p>
            <p className="text-[11px] text-white/18">{timeAgo(row.created_at)}</p>
          </div>
        </div>
      </div>
    </button>
  )
}

// ── Separador de fecha ────────────────────────────────────────────

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-2 px-4">
      <div className="flex-1 h-px bg-white/5" />
      <span className="text-[11px] uppercase tracking-[0.2em] text-white/22 font-medium capitalize">
        {fmtDateGroup(date)}
      </span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  )
}

// ── Módulos ───────────────────────────────────────────────────────

const MODULE_OPTS: { value: ActivityModule; label: string }[] = [
  { value: 'all',       label: 'Todo' },
  { value: 'crm',       label: 'CRM' },
  { value: 'ventas',    label: 'Ventas' },
  { value: 'academico', label: 'Académico' },
  { value: 'retencion', label: 'Retención' },
  { value: 'sistema',   label: 'Sistema' },
]

const SEVERITY_OPTS: { value: Severity | 'all'; label: string }[] = [
  { value: 'all',      label: 'Todos' },
  { value: 'info',     label: 'Info' },
  { value: 'warning',  label: 'Avisos' },
  { value: 'critical', label: 'Críticos' },
]

// ── Componente principal ──────────────────────────────────────────

interface Props {
  initialData: ActivityLogRow[]
  initialTotal: number
  metrics: DashboardMetrics
  actors: { id: string; name: string }[]
}

export default function ActivityClient({ initialData, initialTotal, metrics, actors }: Props) {
  const [logs, setLogs] = useState<ActivityLogRow[]>(initialData)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<ActivityLogRow | null>(null)

  const [filters, setFilters] = useState<ActivityFilters>({
    module: 'all',
    severity: 'all',
    search: '',
    date_from: '',
    date_to: '',
    actor_user_id: '',
  })

  const applyFilters = useCallback((next: ActivityFilters, nextPage = 1) => {
    startTransition(async () => {
      const result = await getActivityLogs({ ...next, page: nextPage })
      setLogs(result.data)
      setTotal(result.total)
      setPage(nextPage)
    })
  }, [])

  function set<K extends keyof ActivityFilters>(key: K, value: ActivityFilters[K]) {
    const next = { ...filters, [key]: value }
    setFilters(next)
    applyFilters(next, 1)
  }

  function loadMore() {
    const next = page + 1
    startTransition(async () => {
      const result = await getActivityLogs({ ...filters, page: next })
      setLogs(prev => [...prev, ...result.data])
      setPage(next)
    })
  }

  // Agrupar por fecha
  const grouped: { date: string; rows: ActivityLogRow[] }[] = []
  for (const row of logs) {
    const date = row.created_at.slice(0, 10)
    const last = grouped[grouped.length - 1]
    if (last?.date === date) last.rows.push(row)
    else grouped.push({ date, rows: [row] })
  }

  return (
    <div className="space-y-5">

      {/* Dashboard */}
      <Dashboard metrics={metrics} />

      {/* Filtros */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 space-y-3">

        {/* Módulos */}
        <div className="flex flex-wrap gap-2">
          {MODULE_OPTS.map(opt => (
            <button
              key={opt.value}
              onClick={() => set('module', opt.value)}
              className={[
                'rounded-xl border px-3 py-1.5 text-xs font-medium transition-all',
                filters.module === opt.value
                  ? 'border-[#ff7a00]/30 bg-[#ff7a00]/10 text-[#ff8a1d]'
                  : 'border-white/8 text-white/40 hover:text-white hover:border-white/18',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}

          <div className="flex-1" />

          {/* Severity */}
          {SEVERITY_OPTS.map(opt => (
            <button
              key={opt.value}
              onClick={() => set('severity', opt.value)}
              className={[
                'rounded-xl border px-3 py-1.5 text-xs font-medium transition-all',
                filters.severity === opt.value
                  ? opt.value === 'warning'  ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                  : opt.value === 'critical' ? 'border-red-500/30 bg-red-500/10 text-red-400'
                  :                            'border-white/15 bg-white/8 text-white/70'
                  : 'border-white/6 text-white/30 hover:text-white/50',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Búsqueda + fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="search"
            placeholder="Buscar en descripción…"
            value={filters.search ?? ''}
            onChange={e => set('search', e.target.value)}
            className="col-span-1 lg:col-span-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff7a00]/40"
          />
          <input
            type="date"
            value={filters.date_from ?? ''}
            onChange={e => set('date_from', e.target.value)}
            className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white/60 focus:outline-none focus:border-[#ff7a00]/40 [color-scheme:dark]"
          />
          <input
            type="date"
            value={filters.date_to ?? ''}
            onChange={e => set('date_to', e.target.value)}
            className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white/60 focus:outline-none focus:border-[#ff7a00]/40 [color-scheme:dark]"
          />
        </div>

        {/* Usuario */}
        {actors.length > 0 && (
          <select
            value={filters.actor_user_id ?? ''}
            onChange={e => set('actor_user_id', e.target.value)}
            className="w-full sm:w-56 rounded-xl border border-white/8 bg-[#0d0d0d] px-3 py-2 text-sm text-white/55 focus:outline-none focus:border-[#ff7a00]/40"
          >
            <option value="">Todos los usuarios</option>
            {actors.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.015] overflow-hidden">
        <div className="border-b border-white/5 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/60">Actividad</h2>
          <div className="flex items-center gap-3">
            {isPending && <span className="text-xs text-white/25 animate-pulse">Cargando…</span>}
            <span className="text-xs text-white/25">{total.toLocaleString('es-CO')} eventos</span>
          </div>
        </div>

        {!isPending && logs.length === 0 && (
          <div className="px-5 py-14 text-center text-sm text-white/20">
            Sin actividad para los filtros seleccionados.
          </div>
        )}

        <div>
          {grouped.map(group => (
            <div key={group.date} className="border-b border-white/4 last:border-0">
              <DateSeparator date={group.date} />
              {group.rows.map(row => (
                <TimelineRow key={row.id} row={row} onClick={() => setSelected(row)} />
              ))}
            </div>
          ))}
        </div>

        {logs.length < total && (
          <div className="border-t border-white/5 p-4 text-center">
            <button
              onClick={loadMore}
              disabled={isPending}
              className="rounded-xl border border-white/8 px-6 py-2 text-sm text-white/40 hover:text-white hover:border-white/18 transition-all disabled:opacity-30"
            >
              Cargar más ({(total - logs.length).toLocaleString('es-CO')} restantes)
            </button>
          </div>
        )}
      </div>

      {/* Drawer */}
      {selected && (
        <Drawer row={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

'use client'

import { useState, useTransition, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getPayments, markPaymentOverdue, processOverduePayments, generateBoldCheckout } from './_actions'
import type { PaymentWithStudent, PaymentMetrics, BoldMetrics, PaymentTab, StudentOption, EnrollmentOption } from './_actions'
import { PaymentStatusPill } from './_components/PaymentStatusPill'
import RegisterPaymentModal from './_components/RegisterPaymentModal'
import GeneratePaymentModal from './_components/GeneratePaymentModal'
import ApplyDiscountModal from './_components/ApplyDiscountModal'
import StudentHistoryModal from './_components/StudentHistoryModal'
import CreateCobroModal from './_components/CreateCobroModal'
import { getBirthdayBenefitStatus } from '@/lib/students/birthday'
import WhatsAppButton from '@/components/admin/WhatsAppButton'

const ORANGE = '#ff7a00'
const SURFACE = 'var(--adm-surface)'
const SURFACE_2 = 'var(--adm-surface-3)'
const BORDER = 'var(--adm-panel-border)'
const TEXT = 'var(--adm-title)'
const TEXT_MUTED = 'var(--adm-text-muted)'
const TEXT_FAINT = 'var(--adm-text-faint)'

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function periodLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
}

function daysOverdue(due: string): number {
  return Math.floor((Date.now() - new Date(due).getTime()) / 86400000)
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const AVATAR_COLORS = [
  'bg-orange-500/15 text-orange-500',
  'bg-slate-100 text-slate-600',
  'bg-violet-100 text-violet-600',
  'bg-emerald-100 text-emerald-600',
  'bg-rose-100 text-rose-500',
]
function avatarColor(id: string) { return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length] }

// ── Bold Metrics ──────────────────────────────────────────────────

function BoldMetricsStrip({ m }: { m: BoldMetrics }) {
  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
  const fmtTime = (iso: string | null) => iso
    ? new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div
      className="rounded-[24px] px-5 py-4"
      style={{
        border: `1px solid ${BORDER}`,
        background: 'linear-gradient(135deg, rgba(255,122,0,0.08), rgba(255,255,255,0.9) 40%)',
        boxShadow: 'var(--adm-card-shadow)',
      }}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--adm-brand-muted)' }}>Bold Sandbox</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-2xl font-extrabold" style={{ color: 'var(--adm-accent)' }}>{m.pagos_hoy}</p>
          <p className="text-[10px]" style={{ color: TEXT_FAINT }}>Pagos Bold hoy</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold" style={{ color: 'var(--adm-accent)' }}>{fmt(m.recaudacion_hoy)}</p>
          <p className="text-[10px]" style={{ color: TEXT_FAINT }}>Recaudación Bold hoy</p>
        </div>
        <div>
          <p suppressHydrationWarning className="text-2xl font-extrabold" style={{ color: TEXT }}>{fmtTime(m.ultimo_webhook)}</p>
          <p className="text-[10px]" style={{ color: TEXT_FAINT }}>Último webhook</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold" style={{ color: m.webhooks_fallidos_hoy > 0 ? 'var(--adm-danger)' : TEXT_MUTED }}>{m.webhooks_fallidos_hoy}</p>
          <p className="text-[10px]" style={{ color: TEXT_FAINT }}>Webhooks fallidos hoy</p>
        </div>
      </div>
    </div>
  )
}

// ── Bold Info Drawer ──────────────────────────────────────────────

function BoldInfoDrawer({ payment, sessionUrl, onClose }: {
  payment: PaymentWithStudent
  sessionUrl?: string | null
  onClose: () => void
}) {
  const [showPayload, setShowPayload] = useState(false)
  const checkoutUrl = sessionUrl ?? payment.metadata?.bold_checkout_url ?? null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-[#0f0f0f] border-l border-white/10 h-full overflow-y-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <p className="text-sm font-bold text-white">Información Bold</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Datos */}
        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
            <span className="text-white/40">Estudiante</span>
            <span className="text-white font-medium">{payment.student_name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
            <span className="text-white/40">Estado</span>
            <span className={`font-semibold ${payment.status === 'paid' ? 'text-green-400' : 'text-yellow-300'}`}>
              {payment.status === 'paid' ? 'Pagado' : payment.status}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
            <span className="text-white/40">Referencia Bold</span>
            <span className="text-white/70 font-mono text-[11px]">{payment.external_ref ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
            <span className="text-white/40">Fecha de pago</span>
            <span className="text-white/70">
              {payment.paid_at
                ? new Date(payment.paid_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
            <span className="text-white/40">Método</span>
            <span className="text-orange-300 font-semibold">Bold</span>
          </div>
        </div>

        {/* Botones */}
        <div className="space-y-2">
          {checkoutUrl ? (
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold rounded-xl border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></svg>
              Abrir checkout Bold
            </a>
          ) : (
            <p className="text-center text-xs text-white/25 py-1">Sin link de checkout generado</p>
          )}

          {payment.gateway_response && (
            <button
              onClick={() => setShowPayload(!showPayload)}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold rounded-xl border border-white/10 text-white/50 hover:bg-white/5 transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              {showPayload ? 'Ocultar payload' : 'Ver payload gateway'}
            </button>
          )}
        </div>

        {/* Payload JSON */}
        {showPayload && payment.gateway_response && (
          <pre className="text-[10px] text-green-300/80 bg-black/60 border border-white/8 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(payment.gateway_response, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}

// ── Bold Cell ─────────────────────────────────────────────────────

function BoldCell({ payment, sessionUrl, onShowDrawer, onUrlGenerated }: {
  payment: PaymentWithStudent
  sessionUrl: string | null
  onShowDrawer: () => void
  onUrlGenerated: (url: string) => void
}) {
  const [genPending, startGen] = useTransition()
  const [genError, setGenError] = useState<string | null>(null)

  const isBoldPaid  = payment.payment_method === 'bold'
  const existingUrl = sessionUrl ?? payment.metadata?.bold_checkout_url ?? null
  const canGenerate = (payment.status === 'pending' || payment.status === 'overdue') && !existingUrl && !isBoldPaid

  if (isBoldPaid) return (
    <button onClick={onShowDrawer} className="text-[10px] text-orange-400 font-semibold hover:text-orange-300 transition-colors">
      Pagado vía Bold ↗
    </button>
  )

  if (existingUrl) return (
    <button onClick={onShowDrawer} className="text-[10px] text-orange-300/80 font-semibold hover:text-orange-300 transition-colors border border-orange-500/30 rounded px-1.5 py-0.5">
      Link Bold ↗
    </button>
  )

  if (!canGenerate) return null

  return (
    <div className="space-y-0.5">
      <button
        disabled={genPending}
        onClick={() => {
          setGenError(null)
          startGen(async () => {
            const res = await generateBoldCheckout(payment.id)
            if (res.error) setGenError(res.error)
            else if (res.url) onUrlGenerated(res.url)
          })
        }}
        className="text-[10px] text-orange-400/70 hover:text-orange-400 font-medium transition-colors disabled:opacity-40 flex items-center gap-1"
      >
        {genPending
          ? <><span className="h-2.5 w-2.5 rounded-full border border-orange-400/50 border-t-orange-400 animate-spin" />Generando…</>
          : <>
              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Generar link Bold
            </>
        }
      </button>
      {genError && <p className="text-[10px] text-red-400">{genError}</p>}
    </div>
  )
}

// ── Métricas ──────────────────────────────────────────────────────

function MetricsStrip({ m }: { m: PaymentMetrics }) {
  const cards = [
    { label: 'Recaudado (mes)', val: formatCOP(m.recaudado),  c: 'text-green-400',  bg: 'bg-green-400/8 border-green-400/10' },
    { label: 'Pendientes',      val: String(m.pendientes),    c: 'text-yellow-300', bg: 'bg-yellow-400/8 border-yellow-400/10' },
    { label: 'Vencidos',        val: String(m.vencidos),      c: 'text-red-400',    bg: 'bg-red-400/8 border-red-400/10' },
    { label: 'Mora total',      val: formatCOP(m.mora_total), c: 'text-red-300',    bg: 'bg-red-500/6 border-red-500/10' },
    { label: 'Con descuento',   val: String(m.descuentos),    c: 'text-white/55',   bg: 'bg-white/5 border-white/8' },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map(c => (
        <div
          key={c.label}
          className="rounded-[24px] px-5 py-4"
          style={{ border: `1px solid ${BORDER}`, background: SURFACE, boxShadow: 'var(--adm-card-shadow)' }}
        >
          <p className={`text-[2rem] font-extrabold leading-none ${c.c}`}>{c.val}</p>
          <p className="mt-2 text-[11px] font-medium" style={{ color: TEXT_FAINT }}>{c.label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Row actions dropdown ──────────────────────────────────────────

function RowActions({
  payment,
  onRegister,
  onGenerate,
  onDiscount,
  onOverdue,
  onHistory,
}: {
  payment: PaymentWithStudent
  onRegister: () => void
  onGenerate: () => void
  onDiscount: () => void
  onOverdue:  () => void
  onHistory:  () => void
}) {
  const [open, setOpen] = useState(false)
  const isPending  = payment.status === 'pending'
  const isOverdue  = payment.status === 'overdue'
  const canDiscount = payment.status !== 'paid' && payment.status !== 'voided'
  const canOverdue  = isPending

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-xl p-2 transition-colors"
        style={{ color: TEXT_FAINT }}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-9 z-20 w-52 overflow-hidden rounded-2xl"
            style={{ background: SURFACE, border: `1px solid ${BORDER}`, boxShadow: 'var(--adm-elevated-shadow)' }}
          >
            {(isPending || isOverdue) && (
              <button
                type="button"
                onClick={() => { setOpen(false); onRegister() }}
                className="w-full text-left flex items-center gap-2.5 px-4 py-3 text-xs transition-colors"
                style={{ color: TEXT_MUTED }}
              >
                <svg className="h-3.5 w-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                Registrar pago
              </button>
            )}
            <button
              type="button"
              onClick={() => { setOpen(false); onGenerate() }}
              className="w-full text-left flex items-center gap-2.5 px-4 py-3 text-xs transition-colors"
              style={{ color: TEXT_MUTED }}
            >
              <svg className="h-3.5 w-3.5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Generar pago del mes
            </button>
            {canDiscount && (
              <button
                type="button"
                onClick={() => { setOpen(false); onDiscount() }}
                className="w-full text-left flex items-center gap-2.5 px-4 py-3 text-xs transition-colors"
                style={{ color: TEXT_MUTED }}
              >
                <svg className="h-3.5 w-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 5 5 19M9 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM19 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/></svg>
                Aplicar descuento
              </button>
            )}
            {canOverdue && (
              <button
                type="button"
                onClick={() => { setOpen(false); onOverdue() }}
                className="w-full text-left flex items-center gap-2.5 px-4 py-3 text-xs transition-colors"
                style={{ color: 'var(--adm-danger)' }}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                Marcar vencido
              </button>
            )}
            <div style={{ borderTop: `1px solid ${BORDER}` }} />
            {payment.student_phone && (
              <div className="px-3 py-2" onClick={() => setOpen(false)}>
                <WhatsAppButton
                  phone={payment.student_phone}
                  template={payment.status === 'overdue' || payment.status === 'pending' ? 'payment_overdue' : 'general_message'}
                  vars={{
                    name:   payment.student_name,
                    period: periodLabel(payment.period_year, payment.period_month),
                    amount: formatCOP(payment.final_amount),
                  }}
                  entityType="payment"
                  entityId={payment.id}
                  logAction={payment.status === 'overdue' || payment.status === 'pending' ? 'whatsapp.payment_reminder' : undefined}
                  variant="full"
                  label="Recordatorio de pago"
                />
              </div>
            )}
            <div style={{ borderTop: `1px solid ${BORDER}` }} />
            <button
              type="button"
              onClick={() => { setOpen(false); onHistory() }}
              className="w-full text-left flex items-center gap-2.5 px-4 py-3 text-xs transition-colors"
              style={{ color: TEXT_MUTED }}
            >
              <svg className="h-3.5 w-3.5" style={{ color: TEXT_FAINT }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
              Ver historial
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Confirm inline (overdue) ──────────────────────────────────────

function ConfirmOverdue({ payment, onConfirm, onCancel, pending }: {
  payment: PaymentWithStudent
  onConfirm: () => void
  onCancel: () => void
  pending: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm bg-[#0f0f0f] border border-white/12 rounded-2xl p-6 space-y-4">
        <div className="h-10 w-10 rounded-full bg-red-500/15 flex items-center justify-center mx-auto">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">Marcar como vencido</p>
          <p className="text-xs text-white/40 mt-1">{payment.student_name} · {periodLabel(payment.period_year, payment.period_month)}</p>
          <p className="text-xs text-white/30 mt-2">Esta acción actualizará el nivel de riesgo del estudiante y registrará el evento en actividad.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-medium text-white/50 bg-white/5 hover:bg-white/8 rounded-xl transition-colors">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-red-700/80 hover:bg-red-700 rounded-xl transition-all disabled:opacity-50"
          >
            {pending ? 'Procesando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────

interface Props {
  initialPayments: PaymentWithStudent[]
  initialTotal:    number
  initialMetrics:  PaymentMetrics
  boldMetrics:     BoldMetrics
  students:        StudentOption[]
  enrollments:     EnrollmentOption[]
}

export default function PagosClient({ initialPayments, initialTotal, initialMetrics, boldMetrics, students, enrollments }: Props) {
  const router  = useRouter()
  const [overduePending, startOverdue] = useTransition()
  const [markPending,    startMark]    = useTransition()

  const [tab,     setTab]     = useState<PaymentTab>('all')
  const [search,  setSearch]  = useState('')
  const [payments, setPayments] = useState<PaymentWithStudent[]>(initialPayments)
  const [total,    setTotal]    = useState(initialTotal)
  const [metrics,  setMetrics]  = useState<PaymentMetrics>(initialMetrics)
  const [loading,  setLoading]  = useState(false)
  const [overdueMsg, setOverdueMsg] = useState<string | null>(null)

  // Modal state
  const [showRegister, setShowRegister]   = useState(false)
  const [generateFor,  setGenerateFor]    = useState<{ studentId?: string } | null>(null)
  const [discountFor,  setDiscountFor]    = useState<PaymentWithStudent | null>(null)
  const [historyFor,   setHistoryFor]     = useState<{ id: string; name: string } | null>(null)
  const [confirmOverdue, setConfirmOverdue] = useState<PaymentWithStudent | null>(null)
  const [boldDrawer, setBoldDrawer] = useState<PaymentWithStudent | null>(null)
  const [showCobro, setShowCobro] = useState(false)
  const [boldUrls, setBoldUrls] = useState<Record<string, string>>({})

  function handleBoldUrl(paymentId: string, url: string) {
    setBoldUrls(prev => ({ ...prev, [paymentId]: url }))
  }

  const reload = useCallback(async (t: PaymentTab = tab, s: string = search) => {
    setLoading(true)
    const { data, total: count } = await getPayments(t, s, 1)
    setPayments(data)
    setTotal(count)
    setLoading(false)
    router.refresh()
  }, [tab, search, router])

  function handleTabChange(t: PaymentTab) {
    setTab(t)
    reload(t, search)
  }

  function handleSearch(val: string) {
    setSearch(val)
    reload(tab, val)
  }

  function handleOverdueConfirm() {
    if (!confirmOverdue) return
    startMark(async () => {
      await markPaymentOverdue(confirmOverdue.id)
      setConfirmOverdue(null)
      reload()
    })
  }

  async function handleProcessOverdue() {
    setOverdueMsg(null)
    startOverdue(async () => {
      const res = await processOverduePayments()
      if (res.error) setOverdueMsg(`Error: ${res.error}`)
      else setOverdueMsg(res.processed === 0 ? 'No hay pagos pendientes vencidos.' : `${res.processed} pago(s) marcados como vencidos.`)
      reload()
    })
  }

  const TABS: { key: PaymentTab; label: string }[] = [
    { key: 'all',     label: 'Todos' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'paid',    label: 'Pagados' },
    { key: 'overdue', label: 'Vencidos' },
  ]

  return (
    <div className="w-full space-y-7 page-animate">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="adm-section-heading text-[2rem] font-extrabold tracking-tight">Pagos</h1>
          <p className="mt-1 text-sm" style={{ color: TEXT_MUTED }}>Gestión de cobros mensuales</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleProcessOverdue}
            disabled={overduePending}
            className="flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50"
            style={{ border: `1px solid color-mix(in srgb, var(--adm-danger) 18%, white 82%)`, background: 'var(--adm-danger-soft)', color: 'var(--adm-danger)' }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            {overduePending ? 'Procesando…' : 'Procesar vencidos'}
          </button>
          <button
            type="button"
            onClick={() => setShowCobro(true)}
            className="flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-semibold transition-colors"
            style={{ border: `1px solid ${BORDER}`, background: SURFACE, color: 'var(--adm-accent)', boxShadow: 'var(--adm-card-shadow)' }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            Crear cobro
          </button>
          <button
            type="button"
            onClick={() => setShowRegister(true)}
            className="adm-button-primary flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all hover:brightness-110"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Registrar pago
          </button>
        </div>
      </div>

      {/* Feedback procesar vencidos */}
      {overdueMsg && (
        <div
          className="flex items-center justify-between rounded-2xl px-4 py-3 text-xs"
          style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_MUTED, boxShadow: 'var(--adm-card-shadow)' }}
        >
          {overdueMsg}
          <button type="button" onClick={() => setOverdueMsg(null)} className="ml-3" style={{ color: TEXT_FAINT }}>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Métricas Bold */}
      <BoldMetricsStrip m={boldMetrics} />

      {/* Métricas */}
      <MetricsStrip m={metrics} />

      {/* Tabs */}
      <div className="adm-soft-tabs flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleTabChange(t.key)}
            className="rounded-full px-4 py-2 text-xs font-semibold transition-all"
            style={tab === t.key
              ? { background: 'linear-gradient(180deg, color-mix(in srgb, var(--adm-accent) 92%, white 8%) 0%, var(--adm-accent-strong) 100%)', color: '#fff', boxShadow: '0 10px 20px rgba(255,122,0,0.16)' }
              : { background: 'transparent', color: TEXT_MUTED }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: TEXT_FAINT }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar por estudiante…"
          className="w-full rounded-2xl py-2.5 pl-9 pr-4 text-sm outline-none transition-all"
          style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, boxShadow: 'var(--adm-card-shadow)' }}
        />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="py-16 text-center text-sm" style={{ color: TEXT_FAINT }}>Cargando…</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-sm" style={{ color: TEXT_FAINT }}>
            {tab === 'all' && !search ? 'Sin pagos registrados.' : 'Sin resultados para este filtro.'}
          </p>
          {tab === 'all' && !search && (
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
              style={{ color: 'var(--adm-accent)' }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Registrar primer pago
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="adm-panel overflow-hidden rounded-[28px]">
            <div
              className="grid grid-cols-[52px_1.35fr_130px_120px_100px_90px_100px_120px_44px] gap-4 px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.24em]"
              style={{ color: TEXT_FAINT, background: SURFACE_2 }}
            >
              <span/>
              <span>Estudiante</span>
              <span>Plan</span>
              <span>Periodo</span>
              <span>Original</span>
              <span>Desc.</span>
              <span>Total</span>
              <span>Estado / Venc.</span>
              <span/>
            </div>
            <div className="space-y-2 px-3 py-3">
              {payments.map(p => {
                const days  = p.status === 'overdue' ? daysOverdue(p.due_date) : null
                const bStatus = getBirthdayBenefitStatus(p)
                const showBday = bStatus === 'eligible' || bStatus === 'granted'
                return (
                  <div
                    key={p.id}
                    className="adm-row grid grid-cols-[52px_1.35fr_130px_120px_100px_90px_100px_120px_44px] items-center gap-4 rounded-[22px] px-6 py-4 transition-all"
                  >
                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-[11px] font-bold ${avatarColor(p.student_id)}`}>
                      {initials(p.student_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold" style={{ color: TEXT }}>{p.student_name}</span>
                        {showBday && <span className="text-[11px]" title="Beneficio cumpleaños disponible">🎂</span>}
                      </div>
                      <p className="truncate font-mono text-[11px]" style={{ color: TEXT_FAINT }}>{p.student_phone}</p>
                    </div>
                    <p className="truncate text-xs" style={{ color: TEXT_MUTED }}>{p.plan_name ?? <span style={{ color: TEXT_FAINT }}>—</span>}</p>
                    <p className="text-xs capitalize" style={{ color: TEXT_MUTED }}>{periodLabel(p.period_year, p.period_month)}</p>
                    <p className="text-xs font-medium" style={{ color: TEXT_MUTED }}>{formatCOP(p.original_amount)}</p>
                    <p className="text-xs font-medium" style={{ color: p.discount_amount > 0 ? 'var(--adm-success)' : TEXT_FAINT }}>
                      {p.discount_amount > 0 ? `−${formatCOP(p.discount_amount)}` : '—'}
                    </p>
                    <p className="text-base font-bold" style={{ color: TEXT }}>{formatCOP(p.final_amount)}</p>
                    <div className="space-y-1">
                      <PaymentStatusPill status={p.status} />
                      <BoldCell
                        payment={p}
                        sessionUrl={boldUrls[p.id] ?? null}
                        onShowDrawer={() => setBoldDrawer(p)}
                        onUrlGenerated={url => handleBoldUrl(p.id, url)}
                      />
                      {days !== null && days > 0 && (
                        <p suppressHydrationWarning className="text-[10px]" style={{ color: 'var(--adm-danger)' }}>{days}d mora</p>
                      )}
                      {p.status === 'pending' && (
                        <p className="text-[10px]" style={{ color: TEXT_FAINT }}>
                          {new Date(p.due_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                    <RowActions
                      payment={p}
                      onRegister={() => setShowRegister(true)}
                      onGenerate={() => setGenerateFor({ studentId: p.student_id })}
                      onDiscount={() => setDiscountFor(p)}
                      onOverdue={() => setConfirmOverdue(p)}
                      onHistory={() => setHistoryFor({ id: p.student_id, name: p.student_name })}
                    />
                  </div>
                )
              })}
            </div>
            <div className="px-6 pb-5 pt-2 text-xs" style={{ color: TEXT_FAINT }}>
              {payments.length} de {total} registros
            </div>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden space-y-2">
            {payments.map(p => {
              const days = p.status === 'overdue' ? daysOverdue(p.due_date) : null
              const bStatus = getBirthdayBenefitStatus(p)
              const showBday = bStatus === 'eligible' || bStatus === 'granted'
              return (
                <div key={p.id} className="adm-panel rounded-[24px] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold" style={{ color: TEXT }}>{p.student_name}</span>
                        {showBday && <span className="text-xs">🎂</span>}
                      </div>
                      <p className="mt-0.5 text-xs" style={{ color: TEXT_MUTED }}>{p.plan_name ?? '—'} · {periodLabel(p.period_year, p.period_month)}</p>
                    </div>
                    <PaymentStatusPill status={p.status} />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-xl font-bold" style={{ color: TEXT }}>{formatCOP(p.final_amount)}</p>
                      {p.discount_amount > 0 && (
                        <p className="text-[11px]" style={{ color: 'var(--adm-success)' }}>−{formatCOP(p.discount_amount)} desc.</p>
                      )}
                      <BoldCell
                        payment={p}
                        sessionUrl={boldUrls[p.id] ?? null}
                        onShowDrawer={() => setBoldDrawer(p)}
                        onUrlGenerated={url => handleBoldUrl(p.id, url)}
                      />
                      {days !== null && days > 0 && (
                        <p suppressHydrationWarning className="text-[11px]" style={{ color: 'var(--adm-danger)' }}>{days} días de mora</p>
                      )}
                    </div>
                    <RowActions
                      payment={p}
                      onRegister={() => setShowRegister(true)}
                      onGenerate={() => setGenerateFor({ studentId: p.student_id })}
                      onDiscount={() => setDiscountFor(p)}
                      onOverdue={() => setConfirmOverdue(p)}
                      onHistory={() => setHistoryFor({ id: p.student_id, name: p.student_name })}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Modales */}
      {showCobro && (
        <CreateCobroModal
          students={students}
          enrollments={enrollments}
          onClose={() => setShowCobro(false)}
          onSuccess={reload}
        />
      )}
      {showRegister && (
        <RegisterPaymentModal
          students={students}
          onClose={() => setShowRegister(false)}
          onSuccess={reload}
        />
      )}
      {generateFor !== null && (
        <GeneratePaymentModal
          preselectedStudentId={generateFor.studentId}
          students={students}
          onClose={() => setGenerateFor(null)}
          onSuccess={reload}
        />
      )}
      {discountFor && (
        <ApplyDiscountModal
          payment={discountFor}
          onClose={() => setDiscountFor(null)}
          onSuccess={reload}
        />
      )}
      {historyFor && (
        <StudentHistoryModal
          studentId={historyFor.id}
          studentName={historyFor.name}
          onClose={() => setHistoryFor(null)}
        />
      )}
      {confirmOverdue && (
        <ConfirmOverdue
          payment={confirmOverdue}
          onConfirm={handleOverdueConfirm}
          onCancel={() => setConfirmOverdue(null)}
          pending={markPending}
        />
      )}
      {boldDrawer && (
        <BoldInfoDrawer
          payment={boldDrawer}
          sessionUrl={boldUrls[boldDrawer.id] ?? null}
          onClose={() => setBoldDrawer(null)}
        />
      )}
    </div>
  )
}

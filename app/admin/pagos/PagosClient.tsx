'use client'

import { useState, useTransition, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getPayments, markPaymentOverdue, processOverduePayments } from './_actions'
import type { PaymentWithStudent, PaymentMetrics, PaymentTab, StudentOption } from './_actions'
import { PaymentStatusPill } from './_components/PaymentStatusPill'
import RegisterPaymentModal from './_components/RegisterPaymentModal'
import GeneratePaymentModal from './_components/GeneratePaymentModal'
import ApplyDiscountModal from './_components/ApplyDiscountModal'
import StudentHistoryModal from './_components/StudentHistoryModal'
import { getBirthdayBenefitStatus } from '@/lib/students/birthday'
import WhatsAppButton from '@/components/admin/WhatsAppButton'

const ORANGE = '#ff7a00'

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
  'bg-orange-500/20 text-orange-300',
  'bg-white/10 text-white/60',
  'bg-purple-500/20 text-purple-300',
  'bg-green-500/20 text-green-300',
  'bg-pink-500/20 text-pink-300',
]
function avatarColor(id: string) { return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length] }

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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map(c => (
        <div key={c.label} className={`rounded-xl border px-4 py-3 ${c.bg}`}>
          <p className={`text-xl font-extrabold ${c.c}`}>{c.val}</p>
          <p className="text-[11px] text-white/35 mt-0.5 font-medium">{c.label}</p>
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
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-48 bg-[#1a1a1a] border border-white/12 rounded-xl shadow-xl overflow-hidden">
            {(isPending || isOverdue) && (
              <button
                onClick={() => { setOpen(false); onRegister() }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/80 hover:bg-white/8 hover:text-white transition-colors text-left"
              >
                <svg className="h-3.5 w-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                Registrar pago
              </button>
            )}
            <button
              onClick={() => { setOpen(false); onGenerate() }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/80 hover:bg-white/8 hover:text-white transition-colors text-left"
            >
              <svg className="h-3.5 w-3.5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Generar pago del mes
            </button>
            {canDiscount && (
              <button
                onClick={() => { setOpen(false); onDiscount() }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/80 hover:bg-white/8 hover:text-white transition-colors text-left"
              >
                <svg className="h-3.5 w-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 5 5 19M9 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM19 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/></svg>
                Aplicar descuento
              </button>
            )}
            {canOverdue && (
              <button
                onClick={() => { setOpen(false); onOverdue() }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/8 transition-colors text-left"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                Marcar vencido
              </button>
            )}
            <div className="border-t border-white/8" />
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
            <div className="border-t border-white/8" />
            <button
              onClick={() => { setOpen(false); onHistory() }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/80 hover:bg-white/8 hover:text-white transition-colors text-left"
            >
              <svg className="h-3.5 w-3.5 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
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
  students:        StudentOption[]
}

export default function PagosClient({ initialPayments, initialTotal, initialMetrics, students }: Props) {
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
    <div className="space-y-5 w-full page-animate">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Pagos</h1>
          <p className="text-sm text-white/40 mt-0.5">Gestión de cobros mensuales</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleProcessOverdue}
            disabled={overduePending}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/8 text-red-400 hover:bg-red-500/12 disabled:opacity-50 transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            {overduePending ? 'Procesando…' : 'Procesar vencidos'}
          </button>
          <button
            onClick={() => setShowRegister(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-xl transition-all hover:brightness-110"
            style={{ backgroundColor: ORANGE }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Registrar pago
          </button>
        </div>
      </div>

      {/* Feedback procesar vencidos */}
      {overdueMsg && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/60">
          {overdueMsg}
          <button onClick={() => setOverdueMsg(null)} className="text-white/30 hover:text-white ml-3">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Métricas */}
      <MetricsStrip m={metrics} />

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`text-xs px-4 py-1.5 rounded-full font-semibold transition-all ${
              tab === t.key ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`}
            style={tab === t.key ? { backgroundColor: ORANGE } : { backgroundColor: 'rgba(255,255,255,0.06)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar por estudiante…"
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
        />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-16 text-white/30 text-sm">Cargando…</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-white/30 text-sm">
            {tab === 'all' && !search ? 'Sin pagos registrados.' : 'Sin resultados para este filtro.'}
          </p>
          {tab === 'all' && !search && (
            <button
              onClick={() => setShowRegister(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Registrar primer pago
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[44px_1fr_130px_100px_90px_90px_90px_110px_44px] gap-3 px-5 py-2.5 border-b border-white/[0.06] text-[10px] uppercase tracking-widest text-white/25 font-semibold">
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
            <div className="divide-y divide-white/[0.04]">
              {payments.map(p => {
                const days  = p.status === 'overdue' ? daysOverdue(p.due_date) : null
                const bStatus = getBirthdayBenefitStatus(p)
                const showBday = bStatus === 'eligible' || bStatus === 'granted'
                return (
                  <div key={p.id} className="grid grid-cols-[44px_1fr_130px_100px_90px_90px_90px_110px_44px] gap-3 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[11px] font-bold ${avatarColor(p.student_id)}`}>
                      {initials(p.student_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white truncate">{p.student_name}</span>
                        {showBday && <span className="text-[11px]" title="Beneficio cumpleaños disponible">🎂</span>}
                      </div>
                      <p className="text-[11px] text-white/30 font-mono truncate">{p.student_phone}</p>
                    </div>
                    <p className="text-xs text-white/55 truncate">{p.plan_name ?? <span className="text-white/20">—</span>}</p>
                    <p className="text-xs text-white/55 capitalize">{periodLabel(p.period_year, p.period_month)}</p>
                    <p className="text-xs text-white/55">{formatCOP(p.original_amount)}</p>
                    <p className={`text-xs ${p.discount_amount > 0 ? 'text-green-400' : 'text-white/20'}`}>
                      {p.discount_amount > 0 ? `−${formatCOP(p.discount_amount)}` : '—'}
                    </p>
                    <p className="text-sm font-semibold text-white">{formatCOP(p.final_amount)}</p>
                    <div className="space-y-1">
                      <PaymentStatusPill status={p.status} />
                      {days !== null && days > 0 && (
                        <p className="text-[10px] text-red-400">{days}d mora</p>
                      )}
                      {p.status === 'pending' && (
                        <p className="text-[10px] text-white/30">
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
            <div className="px-5 py-3 border-t border-white/[0.06] text-xs text-white/25">
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
                <div key={p.id} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white truncate">{p.student_name}</span>
                        {showBday && <span className="text-xs">🎂</span>}
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">{p.plan_name ?? '—'} · {periodLabel(p.period_year, p.period_month)}</p>
                    </div>
                    <PaymentStatusPill status={p.status} />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-base font-bold text-white">{formatCOP(p.final_amount)}</p>
                      {p.discount_amount > 0 && (
                        <p className="text-[11px] text-green-400">−{formatCOP(p.discount_amount)} desc.</p>
                      )}
                      {days !== null && days > 0 && (
                        <p className="text-[11px] text-red-400">{days} días de mora</p>
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
    </div>
  )
}

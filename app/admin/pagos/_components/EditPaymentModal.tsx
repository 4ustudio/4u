'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { MdClose } from 'react-icons/md'
import { updatePayment } from '../_actions'
import type { PaymentWithStudent, StudentOption, PaymentType, PaymentMethod, PaymentStatus } from '../_actions'
import { LABEL as STATUS_LABEL } from './PaymentStatusPill'
import PopupSelect from '../../_components/PopupSelect'
import { usePlans } from '@/app/admin/planes/usePlans'
import { bogotaDateStr } from '@/lib/tz'

const ORANGE = '#ff7a00'

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'efectivo',      label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'nequi',         label: 'Nequi' },
  { value: 'daviplata',     label: 'Daviplata' },
  { value: 'tarjeta',       label: 'Tarjeta' },
  { value: 'bold',          label: 'Bold' },
  { value: 'pse',           label: 'PSE' },
  { value: 'wompi',         label: 'Wompi' },
  { value: 'otro',          label: 'Otro' },
]

const TYPES: { value: PaymentType; label: string }[] = [
  { value: 'monthly_fee',     label: 'Mensualidad' },
  { value: 'partial_payment', label: 'Abono' },
  { value: 'adjustment',      label: 'Ajuste' },
  { value: 'scholarship',     label: 'Beca' },
  { value: 'refund',          label: 'Devolución' },
]

const REASONS = [
  { value: 'cumpleaños', label: 'Cumpleaños' },
  { value: 'beca',       label: 'Beca' },
  { value: 'cortesía',   label: 'Cortesía comercial' },
  { value: 'corrección', label: 'Corrección' },
  { value: 'otro',       label: 'Otro' },
]

const INPUT = 'w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-orange-500/40'
const LBL = 'block text-[11px] uppercase tracking-wider text-white/35 mb-1.5'

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

interface Props {
  payment: PaymentWithStudent
  students: StudentOption[]
  onClose: () => void
  onSuccess: () => void
}

export default function EditPaymentModal({ payment, students, onClose, onSuccess }: Props) {
  const plans = usePlans()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [studentId,   setStudentId]   = useState(payment.student_id)
  const [status,      setStatus]      = useState<PaymentStatus>(payment.status)
  const [method,      setMethod]      = useState<string>(payment.payment_method ?? '')
  const [paymentType, setPaymentType] = useState<PaymentType>(payment.payment_type)
  const [planName,    setPlanName]    = useState(payment.plan_name ?? '')
  const [periodMonth, setPeriodMonth] = useState(payment.period_month)
  const [periodYear,  setPeriodYear]  = useState(payment.period_year)
  const [originalAmt, setOriginalAmt] = useState(String(payment.original_amount))
  const [discountAmt, setDiscountAmt] = useState(String(payment.discount_amount ?? 0))
  const [discountReason, setDiscountReason] = useState(payment.discount_reason ?? '')
  const [dueDate,     setDueDate]     = useState(payment.due_date?.slice(0, 10) ?? '')
  const [paidAt,      setPaidAt]      = useState(payment.paid_at ? bogotaDateStr(new Date(payment.paid_at)) : '')
  const [notes,       setNotes]       = useState(payment.notes ?? '')

  const isPaid = status === 'paid' || status === 'partial'
  const orig   = parseFloat(originalAmt) || 0
  const disc   = parseFloat(discountAmt) || 0
  const years  = [...new Set([2024, 2025, 2026, 2027, payment.period_year])].sort()

  // El estudiante actual puede no estar en la lista (ej. inactivo)
  const studentOptions = students.map(s => ({ value: s.id, label: s.phone ? `${s.name} · ${s.phone}` : s.name }))
  if (!students.some(s => s.id === payment.student_id)) {
    studentOptions.unshift({ value: payment.student_id, label: payment.student_name })
  }
  const planOptions = plans.map(p => ({ value: p.name, label: p.label }))
  if (payment.plan_name && !plans.some(p => p.name === payment.plan_name)) {
    planOptions.unshift({ value: payment.plan_name, label: payment.plan_name })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (orig < 0 || disc < 0) { setError('Los valores no pueden ser negativos.'); return }
    if (disc > orig)          { setError('El descuento supera el valor original.'); return }
    if (isPaid && !method)    { setError('Selecciona el método de pago.'); return }
    if (!dueDate)             { setError('Indica la fecha de vencimiento.'); return }

    setError(null)
    startTransition(async () => {
      const res = await updatePayment(payment.id, {
        student_id:      studentId,
        period_year:     periodYear,
        period_month:    periodMonth,
        payment_type:    paymentType,
        status,
        original_amount: orig,
        discount_amount: disc,
        discount_reason: discountReason || null,
        payment_method:  (method || null) as PaymentMethod | null,
        due_date:        dueDate,
        paid_at:         isPaid ? paidAt || null : null,
        plan_name:       planName || null,
        notes:           notes.trim() || null,
      })
      if (res.error) setError(res.error)
      else { onSuccess(); onClose() }
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg bg-[#0f0f0f] border border-white/12 rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Editar cobro</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-white/40 hover:text-white transition-colors">
            <MdClose className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LBL}>Estudiante</label>
            <PopupSelect value={studentId} onChange={setStudentId} placeholder="Selecciona un estudiante" options={studentOptions} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Estado</label>
              <PopupSelect
                value={status}
                onChange={v => setStatus(v as PaymentStatus)}
                placeholder="Estado"
                options={(Object.keys(STATUS_LABEL) as PaymentStatus[]).map(s => ({ value: s, label: STATUS_LABEL[s] }))}
              />
            </div>
            <div>
              <label className={LBL}>Método de pago</label>
              <PopupSelect
                value={method}
                onChange={setMethod}
                placeholder="Sin método"
                options={METHODS}
              />
            </div>
          </div>

          {isPaid && (
            <div>
              <label className={LBL}>Fecha de pago</label>
              <input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} className={INPUT} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Tipo</label>
              <PopupSelect value={paymentType} onChange={v => setPaymentType(v as PaymentType)} placeholder="Tipo" options={TYPES} />
            </div>
            <div>
              <label className={LBL}>Plan</label>
              <PopupSelect value={planName} onChange={setPlanName} placeholder="Sin plan" options={planOptions} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Mes</label>
              <PopupSelect
                value={String(periodMonth)}
                onChange={v => setPeriodMonth(parseInt(v))}
                placeholder="Mes"
                options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
              />
            </div>
            <div>
              <label className={LBL}>Año</label>
              <PopupSelect
                value={String(periodYear)}
                onChange={v => setPeriodYear(parseInt(v))}
                placeholder="Año"
                options={years.map(y => ({ value: String(y), label: String(y) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Valor original (COP)</label>
              <input type="number" min="0" step="1000" value={originalAmt} onChange={e => setOriginalAmt(e.target.value)} className={INPUT} required />
            </div>
            <div>
              <label className={LBL}>Descuento ($)</label>
              <input type="number" min="0" step="1000" value={discountAmt} onChange={e => setDiscountAmt(e.target.value)} className={INPUT} />
            </div>
          </div>

          {disc > 0 && (
            <div>
              <label className={LBL}>Motivo del descuento</label>
              <PopupSelect
                value={discountReason}
                onChange={setDiscountReason}
                placeholder="Seleccionar…"
                options={REASONS.some(r => r.value === discountReason) || !discountReason
                  ? REASONS
                  : [{ value: discountReason, label: discountReason }, ...REASONS]}
              />
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/8">
            <span className="text-xs text-white/40 font-medium">Total</span>
            <span className="text-base font-bold text-white">{formatCOP(orig - disc)}</span>
          </div>

          <div>
            <label className={LBL}>Fecha vencimiento</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={INPUT} required />
          </div>

          <div>
            <label className={LBL}>Notas</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={`${INPUT} resize-none`} />
          </div>

          {error && <p className="text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-white/50 bg-white/5 hover:bg-white/8 rounded-xl transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50"
              style={{ backgroundColor: ORANGE }}
            >
              {pending ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    // page-animate usa transform y atrapa position:fixed
    document.querySelector('[data-admin-theme]') ?? document.body
  )
}

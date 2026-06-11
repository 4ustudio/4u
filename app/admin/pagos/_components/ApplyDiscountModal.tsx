'use client'

import { useState, useTransition } from 'react'
import { applyDiscount } from '../_actions'
import type { PaymentWithStudent } from '../_actions'

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function periodLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
}

interface Props {
  payment: PaymentWithStudent
  onClose: () => void
  onSuccess: () => void
}

export default function ApplyDiscountModal({ payment, onClose, onSuccess }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError]          = useState<string | null>(null)

  const [discountAmt,    setDiscountAmt]    = useState('0')
  const [discountPct,    setDiscountPct]    = useState('0')
  const [discountReason, setDiscountReason] = useState('')
  const [notes,          setNotes]          = useState('')

  const disc  = parseFloat(discountAmt) || 0
  const final = payment.original_amount - disc

  function handleDiscountAmt(val: string) {
    setDiscountAmt(val)
    const d = parseFloat(val) || 0
    if (payment.original_amount > 0)
      setDiscountPct(String(Math.round(d / payment.original_amount * 100)))
  }
  function handleDiscountPct(val: string) {
    setDiscountPct(val)
    const p = parseFloat(val) || 0
    setDiscountAmt(String(Math.round(payment.original_amount * p / 100)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (disc <= 0)            { setError('Ingresa un monto de descuento mayor a 0.'); return }
    if (disc > payment.original_amount) { setError('El descuento supera el valor original.'); return }
    if (!discountReason)      { setError('Selecciona el motivo del descuento.'); return }

    setError(null)
    startTransition(async () => {
      const res = await applyDiscount(payment.id, {
        discount_amount:  disc,
        discount_percent: parseFloat(discountPct) || 0,
        discount_reason:  discountReason,
        notes:            notes || undefined,
      })
      if (res.error) setError(res.error)
      else { onSuccess(); onClose() }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-[#0f0f0f] border border-white/12 rounded-t-2xl sm:rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Aplicar descuento</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Info del pago */}
        <div className="mb-4 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/8 space-y-0.5">
          <p className="text-sm font-semibold text-white">{payment.student_name}</p>
          <p className="text-xs text-white/40">{periodLabel(payment.period_year, payment.period_month)} · {payment.plan_name ?? '—'}</p>
          <p className="text-xs text-white/55">Valor original: <span className="text-white font-medium">{formatCOP(payment.original_amount)}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Descuento ($)</label>
              <input
                type="number" min="0" step="1000"
                value={discountAmt}
                onChange={e => handleDiscountAmt(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Descuento (%)</label>
              <input
                type="number" min="0" max="100"
                value={discountPct}
                onChange={e => handleDiscountPct(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Motivo</label>
            <select
              value={discountReason}
              onChange={e => setDiscountReason(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/40"
              required
            >
              <option value="">Seleccionar…</option>
              <option value="cumpleaños">Cumpleaños</option>
              <option value="beca">Beca</option>
              <option value="cortesía">Cortesía comercial</option>
              <option value="corrección">Corrección</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {/* Nuevo total */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/8">
            <span className="text-xs text-white/40 font-medium">Nuevo total</span>
            <span className={`text-base font-bold ${final < 0 ? 'text-red-400' : 'text-white'}`}>
              {disc > 0 ? formatCOP(final) : '—'}
            </span>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-white/35 mb-1.5">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-orange-500/40 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-white/50 bg-white/5 hover:bg-white/8 rounded-xl transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-green-700/80 hover:bg-green-700 rounded-xl transition-all disabled:opacity-50"
            >
              {pending ? 'Aplicando…' : 'Aplicar descuento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

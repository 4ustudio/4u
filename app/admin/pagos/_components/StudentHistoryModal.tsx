'use client'

import { useState, useEffect } from 'react'
import { getStudentPayments } from '../_actions'
import type { StudentPaymentRow } from '../_actions'
import { PaymentStatusPill } from './PaymentStatusPill'

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function periodLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
}

const METHOD_LABEL: Record<string, string> = {
  efectivo: 'Efectivo', transferencia: 'Transfer.', nequi: 'Nequi',
  daviplata: 'Daviplata', wompi: 'Wompi', pse: 'PSE', tarjeta: 'Tarjeta', otro: 'Otro',
}

interface Props {
  studentId: string
  studentName: string
  onClose: () => void
}

export default function StudentHistoryModal({ studentId, studentName, onClose }: Props) {
  const [payments, setPayments] = useState<StudentPaymentRow[] | null>(null)

  useEffect(() => {
    getStudentPayments(studentId).then(setPayments)
  }, [studentId])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-xl bg-[#0f0f0f] border border-white/12 rounded-t-2xl sm:rounded-2xl p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Historial de pagos</h2>
            <p className="text-xs text-white/40 mt-0.5">{studentName}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {payments === null ? (
            <p className="text-xs text-white/30 text-center py-8">Cargando…</p>
          ) : payments.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-8">Sin pagos registrados.</p>
          ) : (
            <div className="space-y-2">
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/8">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white capitalize">{periodLabel(p.period_year, p.period_month)}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-white/40">{formatCOP(p.final_amount)}</span>
                      {p.discount_amount > 0 && (
                        <span className="text-[10px] text-green-400">−{formatCOP(p.discount_amount)}</span>
                      )}
                      {p.payment_method && (
                        <span className="text-[10px] text-white/30">{METHOD_LABEL[p.payment_method] ?? p.payment_method}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PaymentStatusPill status={p.status} />
                    {p.has_activity_log && (
                      <a
                        href="/admin/actividad"
                        className="text-[10px] text-white/30 hover:text-orange-400 transition-colors underline underline-offset-2"
                        title="Ver en actividad"
                      >
                        Actividad
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-white/50 bg-white/5 hover:bg-white/8 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

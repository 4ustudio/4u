'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { PaymentStatusPill } from '@/app/admin/pagos/_components/PaymentStatusPill'
import GeneratePaymentModal from '@/app/admin/pagos/_components/GeneratePaymentModal'
import type { StudentPaymentRow, StudentOption } from '@/app/admin/pagos/_actions'

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
  studentId:   string
  studentName: string
  payments:    StudentPaymentRow[]
  /** Se pasa para el modal de GeneratePayment */
  studentAsOption: StudentOption
}

export default function StudentPaymentsPanel({ studentId, studentName, payments, studentAsOption }: Props) {
  const [showGenerate, setShowGenerate] = useState(false)
  const [, startTransition] = useTransition()

  return (
    <>
      <section className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Pagos</h2>
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-white px-3 py-1.5 rounded-lg transition-all hover:brightness-110"
            style={{ backgroundColor: '#ff7a00' }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Generar pago
          </button>
        </div>

        {payments.length === 0 ? (
          <p className="text-xs text-white/30 py-4 text-center">Sin pagos registrados.</p>
        ) : (
          <>
            {/* Encabezado desktop */}
            <div className="hidden sm:grid grid-cols-[1fr_90px_100px_80px_70px] gap-3 text-[10px] uppercase tracking-widest text-white/25 font-semibold pb-1 border-b border-white/[0.06]">
              <span>Periodo</span>
              <span>Estado</span>
              <span>Total</span>
              <span>Método</span>
              <span>Actividad</span>
            </div>

            <div className="space-y-1.5">
              {payments.map(p => (
                <div key={p.id} className="grid grid-cols-1 sm:grid-cols-[1fr_90px_100px_80px_70px] gap-1 sm:gap-3 items-center py-2.5 sm:py-2 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-sm text-white capitalize">{periodLabel(p.period_year, p.period_month)}</p>
                    {p.discount_amount > 0 && (
                      <p className="text-[10px] text-green-400">−{formatCOP(p.discount_amount)} descuento</p>
                    )}
                  </div>
                  <div><PaymentStatusPill status={p.status} /></div>
                  <p className="text-sm font-semibold text-white">{formatCOP(p.final_amount)}</p>
                  <p className="text-xs text-white/40">
                    {p.payment_method ? METHOD_LABEL[p.payment_method] ?? p.payment_method : '—'}
                  </p>
                  <div>
                    {p.has_activity_log ? (
                      <Link
                        href="/admin/actividad"
                        className="text-[10px] text-white/30 hover:text-orange-400 transition-colors underline underline-offset-2"
                      >
                        Ver
                      </Link>
                    ) : (
                      <span className="text-[10px] text-white/15">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/admin/pagos"
              className="block text-center text-[11px] text-white/30 hover:text-orange-400 transition-colors pt-1"
            >
              Ver todos en /admin/pagos →
            </Link>
          </>
        )}
      </section>

      {showGenerate && (
        <GeneratePaymentModal
          preselectedStudentId={studentId}
          students={[studentAsOption]}
          onClose={() => setShowGenerate(false)}
          onSuccess={() => {
            setShowGenerate(false)
            // Refresh vía next/navigation
            startTransition(() => { window.location.reload() })
          }}
        />
      )}
    </>
  )
}

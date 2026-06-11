import type { PaymentStatus } from '../_actions'

const PILL: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  paid:    'bg-green-500/10 text-green-400 border-green-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
  waived:  'bg-white/8 text-white/55 border-white/10',
  partial: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  voided:  'bg-white/5 text-white/25 border-white/8',
}

const LABEL: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  paid:    'Pagado',
  overdue: 'Vencido',
  waived:  'Condonado',
  partial: 'Parcial',
  voided:  'Anulado',
}

export function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap ${PILL[status]}`}>
      {LABEL[status]}
    </span>
  )
}

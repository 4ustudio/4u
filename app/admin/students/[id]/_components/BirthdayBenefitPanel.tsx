'use client'

import { useTransition } from 'react'
import { grantBirthdayBenefitAction, useBirthdayDiscountAction } from '../../../_actions/students'
import {
  getBirthdayBenefitStatus,
  formatBirthdayLabel,
  BENEFIT_STATUS_LABEL,
  BENEFIT_STATUS_CLS,
  type BirthdayStudent,
} from '@/lib/students/birthday'

export default function BirthdayBenefitPanel({ student }: { student: BirthdayStudent & { id: string } }) {
  const [pending, startTransition] = useTransition()
  const status = getBirthdayBenefitStatus(student)
  const birthdayLabel = formatBirthdayLabel(student.birth_date)
  const discount = student.birthday_discount_percent ?? 10

  function handleGrant() {
    startTransition(async () => {
      const res = await grantBirthdayBenefitAction(student.id)
      if (res.error) alert(res.error)
    })
  }

  function handleUse() {
    startTransition(async () => {
      const res = await useBirthdayDiscountAction(student.id)
      if (res.error) alert(res.error)
    })
  }

  return (
    <section className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">Beneficio de cumpleaños</h2>
        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${BENEFIT_STATUS_CLS[status]}`}>
          {BENEFIT_STATUS_LABEL[status]}
        </span>
      </div>

      {birthdayLabel ? (
        <p className="text-sm text-white/60">
          🎂 Cumpleaños: <span className="text-white font-medium">{birthdayLabel}</span>
        </p>
      ) : (
        <p className="text-xs text-white/30">Sin fecha de nacimiento registrada.</p>
      )}

      {(status === 'eligible' || status === 'granted') && (
        <p className="text-xs text-white/45">
          Descuento vigente: <span className="text-white font-semibold">{discount}%</span> sobre la mensualidad
        </p>
      )}

      <div className="flex gap-2 pt-1">
        {status === 'eligible' && (
          <button
            onClick={handleGrant}
            disabled={pending}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-pink-600/80 hover:bg-pink-600 disabled:opacity-50 transition-colors"
          >
            {pending ? 'Procesando…' : 'Otorgar beneficio'}
          </button>
        )}
        {status === 'granted' && (
          <button
            onClick={handleUse}
            disabled={pending}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-green-700/70 hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {pending ? 'Procesando…' : 'Marcar descuento usado'}
          </button>
        )}
        {status === 'used' && (
          <p className="text-xs text-white/30">Descuento utilizado este año.</p>
        )}
        {status === 'expired' && birthdayLabel && (
          <p className="text-xs text-white/25">No es el mes de cumpleaños.</p>
        )}
      </div>
    </section>
  )
}

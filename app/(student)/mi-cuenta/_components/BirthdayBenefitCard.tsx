import {
  getBirthdayBenefitStatus,
  formatBirthdayLabel,
  isBirthdayMonth,
  type BirthdayStudent,
} from '@/lib/students/birthday'

interface Props {
  student: BirthdayStudent
  compact?: boolean
}

function lastDayOfCurrentMonth(): string {
  const now = new Date()
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return last.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
}

export default function BirthdayBenefitCard({ student, compact = false }: Props) {
  const status   = getBirthdayBenefitStatus(student)
  const label    = formatBirthdayLabel(student.birth_date)
  const discount = student.birthday_discount_percent ?? 10

  // En modo compacto solo mostrar si hay algo relevante que decir
  if (compact && status === 'expired') return null

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-sm">
        <span className="text-base">🎂</span>
        <div className="min-w-0">
          <span className="font-semibold text-pink-700">
            {status === 'eligible'  && `Tienes un beneficio de cumpleaños disponible — ${discount}% de descuento`}
            {status === 'granted'   && `Beneficio otorgado — ${discount}% descuento. Vigente hasta el ${lastDayOfCurrentMonth()}`}
            {status === 'used'      && 'Descuento de cumpleaños ya utilizado este mes'}
          </span>
          {label && <span className="ml-2 text-xs text-pink-500">({label})</span>}
        </div>
      </div>
    )
  }

  // Card completo
  if (status === 'expired' && !isBirthdayMonth(student.birth_date)) {
    // Mostrar solo fecha si está registrada, sin caja prominente
    if (!label) return null
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Beneficio cumpleaños</p>
        <p className="mt-2 text-sm text-gray-500">
          🎂 Cumpleaños: <span className="font-medium text-gray-700">{label}</span>
        </p>
        <p className="mt-1 text-xs text-gray-400">El beneficio estará disponible durante tu mes de cumpleaños.</p>
        <StatusBadge status={status} />
      </div>
    )
  }

  const cardStyle =
    status === 'eligible' ? 'border-pink-300 bg-gradient-to-br from-pink-50 to-white shadow-pink-100/60' :
    status === 'granted'  ? 'border-green-300 bg-gradient-to-br from-green-50 to-white shadow-green-100/60' :
    status === 'used'     ? 'border-gray-200 bg-white' :
    'border-gray-200 bg-white'

  return (
    <section className={`rounded-xl border p-5 shadow-sm ${cardStyle}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Beneficio de cumpleaños</p>
          {label && (
            <p className="mt-1.5 text-sm font-medium text-gray-700">
              🎂 Cumpleaños: <span className="font-semibold">{label}</span>
            </p>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      {status === 'eligible' && (
        <>
          <p className="mt-3 text-2xl font-black text-pink-600">{discount}% de descuento</p>
          <p className="mt-1 text-sm text-pink-700 font-medium">
            ¡Feliz mes de cumpleaños! Tienes un descuento disponible sobre tu mensualidad.
          </p>
          <p className="mt-1 text-xs text-gray-400">Válido hasta el {lastDayOfCurrentMonth()}. Habla con un asesor para aplicarlo.</p>
        </>
      )}

      {status === 'granted' && (
        <>
          <p className="mt-3 text-2xl font-black text-green-600">{discount}% de descuento</p>
          <p className="mt-1 text-sm text-green-700 font-medium">
            ¡Tu beneficio fue otorgado! Aplica en tu próxima mensualidad.
          </p>
          <p className="mt-1 text-xs text-gray-400">Vigente hasta el {lastDayOfCurrentMonth()}.</p>
        </>
      )}

      {status === 'used' && (
        <p className="mt-3 text-sm text-gray-500">El descuento de cumpleaños ya fue aplicado este año. ¡Gracias por ser parte de 4U Studio!</p>
      )}
    </section>
  )
}

function StatusBadge({ status }: { status: ReturnType<typeof getBirthdayBenefitStatus> }) {
  const map = {
    eligible: 'bg-pink-100 text-pink-700 border-pink-200',
    granted:  'bg-green-100 text-green-700 border-green-200',
    used:     'bg-gray-100 text-gray-500 border-gray-200',
    expired:  'bg-gray-100 text-gray-400 border-gray-200',
  }
  const labels = {
    eligible: 'Disponible',
    granted:  'Otorgado',
    used:     'Utilizado',
    expired:  'No aplica',
  }
  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${map[status]}`}>
      {labels[status]}
    </span>
  )
}

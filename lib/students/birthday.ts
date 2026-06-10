export type BirthdayBenefitStatus = 'eligible' | 'granted' | 'used' | 'expired'

export interface BirthdayStudent {
  birth_date?:               string | null
  student_status?:           string | null
  birthday_benefit_year?:    number | null
  birthday_benefit_used?:    boolean | null
  birthday_discount_percent?: number | null
}

/** Retorna true si el mes de birth_date coincide con el mes actual */
export function isBirthdayMonth(birth_date?: string | null): boolean {
  if (!birth_date) return false
  const bMonth = new Date(birth_date + 'T12:00:00').getMonth()
  return bMonth === new Date().getMonth()
}

/**
 * Retorna el estado del beneficio de cumpleaños:
 * - eligible : cumple este mes, no otorgado este año
 * - granted  : otorgado este año, aún no usado
 * - used     : otorgado y ya utilizado este año
 * - expired  : no aplica (no es mes de cumpleaños y no hay beneficio activo)
 */
export function getBirthdayBenefitStatus(student: BirthdayStudent): BirthdayBenefitStatus {
  const currentYear = new Date().getFullYear()
  const grantedThisYear = student.birthday_benefit_year === currentYear

  if (grantedThisYear && student.birthday_benefit_used) return 'used'
  if (grantedThisYear && !student.birthday_benefit_used) return 'granted'
  if (isBirthdayMonth(student.birth_date) && student.student_status === 'activo') return 'eligible'
  return 'expired'
}

/** Formatea birth_date como "15 de agosto" */
export function formatBirthdayLabel(birth_date?: string | null): string | null {
  if (!birth_date) return null
  return new Date(birth_date + 'T12:00:00').toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
  })
}

export const BENEFIT_STATUS_LABEL: Record<BirthdayBenefitStatus, string> = {
  eligible: 'Elegible',
  granted:  'Otorgado',
  used:     'Utilizado',
  expired:  'No aplica',
}

export const BENEFIT_STATUS_CLS: Record<BirthdayBenefitStatus, string> = {
  eligible: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
  granted:  'bg-green-500/10 text-green-300 border-green-500/20',
  used:     'bg-white/5 text-white/35 border-white/10',
  expired:  'bg-white/5 text-white/25 border-white/10',
}

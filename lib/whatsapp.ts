// ── Tipos ──────────────────────────────────────────────────────────

export type WhatsAppTemplate =
  | 'lead_follow_up'
  | 'payment_overdue'
  | 'birthday_greeting'
  | 'class_cancelled'
  | 'student_reactivation'
  | 'general_message'

export interface WhatsAppVars {
  name?:       string
  course?:     string
  instructor?: string
  date?:       string   // "lunes 16 de junio"
  amount?:     string   // "$200.000"
  period?:     string   // "junio 2026"
}

// ── Normalización ──────────────────────────────────────────────────

/** Normaliza un teléfono colombiano a formato internacional (57XXXXXXXXXX). */
export function normalizeColombianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Quitar doble 57 si ya tiene prefijo
  const withoutPrefix = digits.startsWith('57') && digits.length >= 12
    ? digits.slice(2)
    : digits
  return `57${withoutPrefix}`
}

/** Construye URL wa.me con mensaje codificado. */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalized = normalizeColombianPhone(phone)
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

// ── Plantillas ─────────────────────────────────────────────────────

const FALLBACK = {
  name:       'estudiante',
  course:     'tu instrumento',
  instructor: 'tu instructor',
  date:       'la fecha acordada',
  amount:     'el valor pendiente',
  period:     'este mes',
}

function v(vars: WhatsAppVars, key: keyof WhatsAppVars): string {
  return (vars[key] ?? FALLBACK[key]) as string
}

const TEMPLATES: Record<WhatsAppTemplate, (vars: WhatsAppVars) => string> = {
  lead_follow_up: (vars) =>
    `Hola ${v(vars, 'name')} 👋\nTe contactamos desde 4U Studio Academy para darte seguimiento sobre tu interés en ${v(vars, 'course')}.\n¿Cuándo podríamos hablar?\n🎶 Equipo 4U Studio Academy`,

  payment_overdue: (vars) =>
    `Hola ${v(vars, 'name')} 👋\nTe recordamos que tienes un pago pendiente correspondiente a ${v(vars, 'period')} por un valor de ${v(vars, 'amount')}.\n¿Puedes confirmar cuándo realizarás el pago?\nQuedamos atentos.\n🎶 Equipo 4U Studio Academy`,

  birthday_greeting: (vars) =>
    `Hola ${v(vars, 'name')} 👋\n¡Feliz cumpleaños de parte de todo el equipo de 4U Studio Academy! 🎂🎶\nTenemos una sorpresa especial para ti este mes. ¡Escríbenos para reclamarla!\n🎶 Equipo 4U Studio Academy`,

  class_cancelled: (vars) =>
    `Hola ${v(vars, 'name')} 👋\nTe informamos que la clase de ${v(vars, 'course')} programada para el ${v(vars, 'date')} con ${v(vars, 'instructor')} ha sido cancelada.\nNos pondremos en contacto para reagendarla. Disculpa el inconveniente.\n🎶 Equipo 4U Studio Academy`,

  student_reactivation: (vars) =>
    `Hola ${v(vars, 'name')} 👋\nHace un tiempo no sabemos de ti en 4U Studio Academy y nos gustaría retomar tu proceso musical en ${v(vars, 'course')}.\n¿Estarías disponible para conversar?\n🎶 Equipo 4U Studio Academy`,

  general_message: (vars) =>
    `Hola ${v(vars, 'name')} 👋\n\nTe escribimos desde 4U Studio Academy.\n\nQueríamos comunicarnos contigo respecto a tu proceso académico.\n\nQuedamos atentos.\n\n🎶 Equipo 4U Studio Academy`,
}

/** Genera el texto del mensaje desde plantilla + variables. */
export function buildWhatsAppMessage(template: WhatsAppTemplate, vars: WhatsAppVars): string {
  return TEMPLATES[template](vars)
}

// ── Labels ─────────────────────────────────────────────────────────

export const TEMPLATE_LABEL: Record<WhatsAppTemplate, string> = {
  lead_follow_up:       'Seguimiento de lead',
  payment_overdue:      'Recordatorio de pago',
  birthday_greeting:    'Saludo de cumpleaños',
  class_cancelled:      'Clase cancelada',
  student_reactivation: 'Reactivación',
  general_message:      'Mensaje general',
}

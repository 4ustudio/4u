import type { AppointmentInsert, BookingFormState } from '@/types/booking'

const PHONE_RE = /^[+]?[\d\s\-().]{7,20}$/

export function validateBooking(
  data: Partial<AppointmentInsert>
): BookingFormState['errors'] | null {
  const errors: NonNullable<BookingFormState['errors']> = {}

  if (!data.name?.trim()) {
    errors.name = 'El nombre es obligatorio'
  } else if (data.name.trim().length < 2) {
    errors.name = 'Ingresa tu nombre completo'
  }

  if (!data.phone?.trim()) {
    errors.phone = 'El WhatsApp es obligatorio'
  } else if (!PHONE_RE.test(data.phone.trim())) {
    errors.phone = 'Ingresa un número válido (mín. 7 dígitos)'
  }

  if (!data.course?.trim()) {
    errors.course = 'Selecciona un curso de interés'
  }

  return Object.keys(errors).length > 0 ? errors : null
}

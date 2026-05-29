'use server'

import { createServerClient } from '@/lib/supabase/server'
import { validateBooking } from '@/lib/validations/booking'
import type { BookingFormState, AppointmentInsert, Modality } from '@/types/booking'

export async function createAppointment(
  _prevState: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const raw: Partial<AppointmentInsert> = {
    name:     (formData.get('name')     as string | null)?.trim() ?? '',
    phone:    (formData.get('phone')    as string | null)?.trim() ?? '',
    email:    (formData.get('email')    as string | null)?.trim() || undefined,
    course:   (formData.get('course')   as string | null)?.trim() ?? '',
    modality: ((formData.get('modality') as string | null) ?? 'presencial') as Modality,
    notes:    (formData.get('notes')    as string | null)?.trim() || undefined,
    source:   'agendar',
  }

  const ageRaw = (formData.get('age') as string | null)?.trim()
  if (ageRaw) {
    const parsed = parseInt(ageRaw, 10)
    if (!isNaN(parsed)) raw.age = parsed
  }

  const errors = validateBooking(raw)
  if (errors) {
    return { status: 'error', errors }
  }

  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('appointments')
      .insert(raw as AppointmentInsert)

    if (error) {
      console.error('Supabase insert error:', error.message)
      return {
        status: 'error',
        message: 'Error al guardar tu solicitud. Intenta de nuevo.',
      }
    }

    return {
      status: 'success',
      submittedName: raw.name,
      submittedCourse: raw.course,
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return {
      status: 'error',
      message: 'Error de conexión. Intenta de nuevo en un momento.',
    }
  }
}

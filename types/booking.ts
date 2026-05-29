export type AppointmentStatus = 'pending' | 'contacted' | 'scheduled' | 'cancelled'
export type Modality = 'presencial'

export interface AppointmentInsert {
  name: string
  phone: string
  email?: string
  age?: number
  course: string
  modality: Modality
  notes?: string
  source: string
}

export interface AppointmentRow extends AppointmentInsert {
  id: string
  created_at: string
  status: AppointmentStatus
}

export interface BookingFormState {
  status: 'idle' | 'success' | 'error'
  errors?: Partial<Record<'name' | 'phone' | 'course', string>>
  message?: string
  // Devueltos en éxito para construir el link de WhatsApp
  submittedName?: string
  submittedCourse?: string
}

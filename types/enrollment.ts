export type StudentType = 'self' | 'child'
export type Level = 'never' | 'beginner' | 'intermediate' | 'advanced'
export type EnrollmentStatus =
  | 'pending'
  | 'contacted'
  | 'clase_prueba'
  | 'scheduled'     // legacy alias de clase_prueba
  | 'perdido'
  | 'cancelled'     // legacy alias de perdido
  | 'converted'

export type EnrollmentSource =
  | 'inscripcion'                                       // formulario web /inscripcion
  | 'whatsapp' | 'instagram' | 'facebook' | 'google'
  | 'referido' | 'web' | 'presencial' | 'otro'

export type EnrollmentEventType =
  | 'form_received' | 'status_changed'
  | 'whatsapp_sent' | 'called' | 'email_sent'
  | 'note_added'   | 'converted'

export interface EnrollmentInsert {
  student_type:    StudentType
  student_name:    string
  student_age:     number
  guardian_name?:  string
  phone:           string
  email:           string
  course_interest: string
  level:           Level
  preferred_time:  string
  payment_method?: string
  music_genre?:    string
  notes?:          string
  source:          string
  terms_accepted?:    boolean
  terms_accepted_at?: string
  terms_version?:     string
  data_consent?:      boolean
  image_consent?:     boolean
  id_document?:       string
  city?:              string
  eps?:               string
  emergency_contact_name?:  string
  emergency_contact_phone?: string
}

export interface EnrollmentRow extends EnrollmentInsert {
  id:                    string
  created_at:            string
  status:                EnrollmentStatus
  internal_notes?:       string | null
  converted_at?:         string | null
  converted_student_id?: string | null
  // CRM Comercial V1
  source:                string | null
  assigned_to?:          string | null
  last_contact_at?:      string | null
  next_followup_at?:     string | null
  lost_reason?:          string | null
  // Consentimientos
  terms_accepted?:    boolean | null
  terms_accepted_at?: string | null
  terms_version?:     string | null
  data_consent?:      boolean | null
  image_consent?:     boolean | null
  id_document?:       string | null
  city?:              string | null
  eps?:               string | null
  emergency_contact_name?:  string | null
  emergency_contact_phone?: string | null
}

export interface EnrollmentEvent {
  id:            string
  created_at:    string
  enrollment_id: string
  type:          EnrollmentEventType
  description:   string
}

export interface EnrollmentFormState {
  status: 'idle' | 'success' | 'error'
  errors?: Partial<Record<
    | 'student_type' | 'student_name' | 'student_age' | 'guardian_name'
    | 'phone' | 'email' | 'course_interest' | 'level' | 'preferred_time'
    | 'terms' | 'data_consent' | 'id_document' | 'city' | 'signature',
    string
  >>
  message?: string
  fieldErrors?: Record<string, string[]>
}

export interface EnrollmentFunnelMetrics {
  totalMonth:      number
  pending:         number
  contacted:       number
  clasePrueba:     number  // clase_prueba + scheduled
  converted:       number
  perdido:         number  // perdido + cancelled
  conversionRate:  number  // converted / (converted + perdido) * 100
  topCourses:      { course: string; count: number }[]
  topSources:      { source: string; count: number }[]
  avgDaysToConvert: number | null
}

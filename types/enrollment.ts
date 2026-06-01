export type StudentType = 'self' | 'child'
export type Level = 'never' | 'beginner' | 'intermediate' | 'advanced'
export type EnrollmentStatus = 'pending' | 'contacted' | 'scheduled' | 'cancelled' | 'converted'
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
  notes?:          string
  source:          string
}

export interface EnrollmentRow extends EnrollmentInsert {
  id:                   string
  created_at:           string
  status:               EnrollmentStatus
  internal_notes?:      string | null
  converted_at?:        string | null
  converted_student_id?: string | null
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
    | 'phone' | 'email' | 'course_interest' | 'level' | 'preferred_time',
    string
  >>
  message?: string
  fieldErrors?: Record<string, string[]>
}

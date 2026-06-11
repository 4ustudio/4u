export type StudentStatus = 'active' | 'inactive' | 'suspended'
export type StudentType = 'new' | 'regular'
export type StudentLifecycleStatus = 'lead' | 'matriculado' | 'activo' | 'riesgo' | 'inactivo' | 'exalumno'
export type StudentActivityEventType =
  | 'lead_created' | 'enrolled' | 'plan_purchased' | 'plan_renewed'
  | 'class_booked' | 'class_completed' | 'class_cancelled'
  | 'class_rescheduled' | 'class_no_show' | 'login'
  | 'portal_activity' | 'follow_up' | 'status_changed'
  | 'reactivated' | 'archived' | 'phone_call'
export type SessionStatus =
  | 'pending' | 'confirmed' | 'completed'
  | 'cancelled' | 'rescheduled' | 'no_show'
export type AttendanceStatus =
  | 'pending' | 'confirmed' | 'declined' | 'rescheduled' | 'no_response'
export type ScheduleStatus = 'active' | 'paused' | 'cancelled'
export type Frequency = 'weekly' | 'biweekly'

export interface Student {
  id: string
  created_at: string
  updated_at: string
  name: string
  first_name: string | null
  last_name: string | null
  phone: string
  email: string | null
  address: string | null
  city: string | null
  birth_date: string | null
  profession: string | null
  music_genre: string | null
  document_type: string | null
  document_number: string | null
  status: StudentStatus
  student_type: StudentType
  enrolled_at: string
  student_status?: StudentLifecycleStatus
  last_activity_at?: string | null
  student_since?: string | null
  plan_name?: string | null
  plan_expires_at?: string | null
  next_payment_due_at?: string | null
  retention_score?: number | null
  primary_course_id?: string | null
  archived_at?: string | null
  archived_reason?: string | null
  reactivated_at?: string | null
  lead_id: string | null
  notes: string | null
  user_id: string | null
  birthday_benefit_year?:     number | null
  birthday_benefit_used?:     boolean | null
  birthday_discount_percent?: number | null
}

export interface StudentSchedule {
  id: string
  created_at: string
  updated_at: string
  student_id: string
  instructor_id: string | null
  course_id: string
  classroom_id: string
  day_of_week: number
  start_time: string
  frequency: Frequency
  active_from: string
  active_until: string | null
  status: ScheduleStatus
  notes: string | null
  course?: { name: string } | null
  classroom?: { name: string } | null
  instructor?: { name: string } | null
}

export interface Classroom {
  id: string
  name: string
  is_active: boolean
}

export interface AdminCourse {
  id: string
  name: string
  slug: string
  is_active: boolean
  category: string
}

export interface AdminInstructor {
  id: string
  name: string
  email: string | null
  status: string
}

export interface ClassSession {
  id: string
  created_at: string
  updated_at: string
  student_id: string
  classroom_id: string
  instructor_id: string | null
  course_id: string
  schedule_id: string | null
  scheduled_date: string
  start_time: string
  status: SessionStatus
  original_session_id: string | null
  rescheduled_to_id: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  cancelled_by: 'student' | 'instructor' | 'admin' | null
  late_cancellation: boolean
  attendance_status: AttendanceStatus
  attendance_confirmed_at: string | null
  attendance_confirmation_token: string | null
  attendance_reminder_sent_at: string | null
  second_reminder_sent_at: string | null
  notes: string | null
  // Relaciones (joins)
  student?: { name: string; phone: string } | null
  classroom?: { name: string } | null
  course?: { name: string } | null
  instructor?: { name: string } | null
}

export interface MonthlyUsage {
  quota_total: number
  classes_scheduled: number
  classes_completed: number
  late_cancellations: number
  classes_available: number
}

export interface AvailableSlot {
  slot_time: string
  classroom_id: string
  classroom_name: string
  is_available: boolean
}

export interface Lead {
  id: string
  created_at: string
  name: string
  phone: string
  email: string | null
  age: number | null
  course: string
  modality: string
  notes: string | null
  status: string
  source: string
}

export interface AdminStats {
  activeStudents: number
  todaySessions: ClassSession[]
  weekSessionCount: number
  roomOccupancy: { name: string; count: number }[]
}

export interface StudentActivityEvent {
  id: string
  student_id: string
  event_type: StudentActivityEventType
  occurred_at: string
  source: string
  description: string | null
  metadata: Record<string, unknown> | null
  created_by: string | null
}

export interface StudentAdminNote {
  id: string
  student_id: string
  note: string
  follow_up_at: string | null
  outcome: string | null
  created_at: string
  created_by: string | null
}

export interface RetentionAlert {
  id: string
  student_id: string | null
  alert_type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  status: 'open' | 'resolved' | 'dismissed'
  due_at: string | null
  created_at: string
}

export interface ReactivationTask {
  id: string
  student_id: string
  task_type: string
  status: 'pending' | 'done' | 'dismissed'
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string | null
  due_at: string | null
  completed_at: string | null
  created_at: string
}

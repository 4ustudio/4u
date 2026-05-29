export type StudentStatus = 'active' | 'inactive' | 'suspended'
export type StudentType = 'new' | 'regular'
export type SessionStatus =
  | 'pending' | 'confirmed' | 'completed'
  | 'cancelled' | 'rescheduled' | 'no_show'
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
  lead_id: string | null
  notes: string | null
  user_id: string | null
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
  late_cancellation: boolean
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

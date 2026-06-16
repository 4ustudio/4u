export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          age: number | null
          course: string
          created_at: string
          email: string | null
          enrollment_id: string | null
          id: string
          modality: string
          name: string
          notes: string | null
          phone: string
          source: string
          status: string
        }
        Insert: {
          age?: number | null
          course: string
          created_at?: string
          email?: string | null
          enrollment_id?: string | null
          id?: string
          modality?: string
          name: string
          notes?: string | null
          phone: string
          source?: string
          status?: string
        }
        Update: {
          age?: number | null
          course?: string
          created_at?: string
          email?: string | null
          enrollment_id?: string | null
          id?: string
          modality?: string
          name?: string
          notes?: string | null
          phone?: string
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_jobs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          payload: Json
          processed_at: string | null
          scheduled_for: string
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          scheduled_for?: string
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          scheduled_for?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      blocked_dates: {
        Row: {
          blocked_date: string
          classroom_id: string | null
          created_at: string
          created_by: string | null
          end_time: string | null
          id: string
          reason: string
          start_time: string | null
        }
        Insert: {
          blocked_date: string
          classroom_id?: string | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          reason: string
          start_time?: string | null
        }
        Update: {
          blocked_date?: string
          classroom_id?: string | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          reason?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_messages: {
        Row: {
          body: string
          campaign_key: string
          channel: string
          created_at: string
          id: string
          metadata: Json
          sent_at: string | null
          status: string
          student_id: string | null
          subject: string | null
        }
        Insert: {
          body: string
          campaign_key: string
          channel: string
          created_at?: string
          id?: string
          metadata?: Json
          sent_at?: string | null
          status?: string
          student_id?: string | null
          subject?: string | null
        }
        Update: {
          body?: string
          campaign_key?: string
          channel?: string
          created_at?: string
          id?: string
          metadata?: Json
          sent_at?: string | null
          status?: string
          student_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_academic_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "campaign_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_high_risk_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_retention_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["id"]
          },
        ]
      }
      class_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          metadata: Json
          new_status: Database["public"]["Enums"]["session_status_t"]
          old_status: Database["public"]["Enums"]["session_status_t"] | null
          reason: string | null
          session_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          new_status: Database["public"]["Enums"]["session_status_t"]
          old_status?: Database["public"]["Enums"]["session_status_t"] | null
          reason?: string | null
          session_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          new_status?: Database["public"]["Enums"]["session_status_t"]
          old_status?: Database["public"]["Enums"]["session_status_t"] | null
          reason?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          attendance_confirmation_token: string | null
          attendance_confirmed_at: string | null
          attendance_reminder_sent_at: string | null
          attendance_status: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          classroom_id: string
          course_id: string
          created_at: string
          id: string
          instructor_id: string
          late_cancellation: boolean
          notes: string | null
          original_session_id: string | null
          rescheduled_to_id: string | null
          schedule_id: string | null
          scheduled_date: string
          second_reminder_sent_at: string | null
          start_time: string
          status: Database["public"]["Enums"]["session_status_t"]
          student_id: string
          updated_at: string
        }
        Insert: {
          attendance_confirmation_token?: string | null
          attendance_confirmed_at?: string | null
          attendance_reminder_sent_at?: string | null
          attendance_status?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          classroom_id: string
          course_id: string
          created_at?: string
          id?: string
          instructor_id: string
          late_cancellation?: boolean
          notes?: string | null
          original_session_id?: string | null
          rescheduled_to_id?: string | null
          schedule_id?: string | null
          scheduled_date: string
          second_reminder_sent_at?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["session_status_t"]
          student_id: string
          updated_at?: string
        }
        Update: {
          attendance_confirmation_token?: string | null
          attendance_confirmed_at?: string | null
          attendance_reminder_sent_at?: string | null
          attendance_status?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          classroom_id?: string
          course_id?: string
          created_at?: string
          id?: string
          instructor_id?: string
          late_cancellation?: boolean
          notes?: string | null
          original_session_id?: string | null
          rescheduled_to_id?: string | null
          schedule_id?: string | null
          scheduled_date?: string
          second_reminder_sent_at?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["session_status_t"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_retention_by_instrument"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "class_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_retention_by_instructor"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "class_sessions_original_session_id_fkey"
            columns: ["original_session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_rescheduled_to_id_fkey"
            columns: ["rescheduled_to_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "student_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_academic_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "class_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_high_risk_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_retention_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_courses: {
        Row: {
          classroom_id: string
          course_id: string
        }
        Insert: {
          classroom_id: string
          course_id: string
        }
        Update: {
          classroom_id?: string
          course_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_courses_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_retention_by_instrument"
            referencedColumns: ["course_id"]
          },
        ]
      }
      classrooms: {
        Row: {
          allows_drums: boolean
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          allows_drums?: boolean
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          allows_drums?: boolean
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      credit_adjustments: {
        Row: {
          admin_user: string
          created_at: string
          delta: number
          id: string
          notes: string | null
          period_month: number
          period_year: number
          reason: string
          session_id: string | null
          student_id: string
        }
        Insert: {
          admin_user: string
          created_at?: string
          delta: number
          id?: string
          notes?: string | null
          period_month: number
          period_year: number
          reason: string
          session_id?: string | null
          student_id: string
        }
        Update: {
          admin_user?: string
          created_at?: string
          delta?: number
          id?: string
          notes?: string | null
          period_month?: number
          period_year?: number
          reason?: string
          session_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_adjustments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_adjustments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_academic_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "credit_adjustments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_high_risk_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_adjustments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_retention_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_adjustments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_credit_adj_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_events: {
        Row: {
          created_at: string
          description: string
          enrollment_id: string
          id: string
          type: string
        }
        Insert: {
          created_at?: string
          description: string
          enrollment_id: string
          id?: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string
          enrollment_id?: string
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_events_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          assigned_to: string | null
          city: string | null
          converted_at: string | null
          converted_student_id: string | null
          course_interest: string
          created_at: string
          data_consent: boolean
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          eps: string | null
          guardian_name: string | null
          id: string
          id_document: string | null
          image_consent: boolean
          internal_notes: string | null
          last_contact_at: string | null
          level: string
          lost_reason: string | null
          music_genre: string | null
          next_followup_at: string | null
          notes: string | null
          payment_method: string | null
          phone: string
          preferred_time: string | null
          source: string
          status: string
          student_age: number
          student_name: string
          student_type: string
          terms_accepted: boolean
          terms_accepted_at: string | null
          terms_version: string | null
        }
        Insert: {
          assigned_to?: string | null
          city?: string | null
          converted_at?: string | null
          converted_student_id?: string | null
          course_interest: string
          created_at?: string
          data_consent?: boolean
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          eps?: string | null
          guardian_name?: string | null
          id?: string
          id_document?: string | null
          image_consent?: boolean
          internal_notes?: string | null
          last_contact_at?: string | null
          level: string
          lost_reason?: string | null
          music_genre?: string | null
          next_followup_at?: string | null
          notes?: string | null
          payment_method?: string | null
          phone: string
          preferred_time?: string | null
          source?: string
          status?: string
          student_age: number
          student_name: string
          student_type: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          terms_version?: string | null
        }
        Update: {
          assigned_to?: string | null
          city?: string | null
          converted_at?: string | null
          converted_student_id?: string | null
          course_interest?: string
          created_at?: string
          data_consent?: boolean
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          eps?: string | null
          guardian_name?: string | null
          id?: string
          id_document?: string | null
          image_consent?: boolean
          internal_notes?: string | null
          last_contact_at?: string | null
          level?: string
          lost_reason?: string | null
          music_genre?: string | null
          next_followup_at?: string | null
          notes?: string | null
          payment_method?: string | null
          phone?: string
          preferred_time?: string | null
          source?: string
          status?: string
          student_age?: number
          student_name?: string
          student_type?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          terms_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_enrollments_converted_student"
            columns: ["converted_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_enrollments_converted_student"
            columns: ["converted_student_id"]
            isOneToOne: false
            referencedRelation: "v_academic_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fk_enrollments_converted_student"
            columns: ["converted_student_id"]
            isOneToOne: false
            referencedRelation: "v_high_risk_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_enrollments_converted_student"
            columns: ["converted_student_id"]
            isOneToOne: false
            referencedRelation: "v_retention_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_enrollments_converted_student"
            columns: ["converted_student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_availability: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          instructor_id: string
          notes: string | null
          start_time: string
          status: string
          updated_at: string | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          instructor_id: string
          notes?: string | null
          start_time: string
          status?: string
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          instructor_id?: string
          notes?: string | null
          start_time?: string
          status?: string
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_availability_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_availability_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_retention_by_instructor"
            referencedColumns: ["instructor_id"]
          },
        ]
      }
      instructor_availability_blocks: {
        Row: {
          blocked_date: string
          created_at: string
          created_by: string
          created_by_name: string | null
          end_time: string
          id: string
          instructor_id: string
          reason: string
          start_time: string
        }
        Insert: {
          blocked_date: string
          created_at?: string
          created_by?: string
          created_by_name?: string | null
          end_time: string
          id?: string
          instructor_id: string
          reason: string
          start_time: string
        }
        Update: {
          blocked_date?: string
          created_at?: string
          created_by?: string
          created_by_name?: string | null
          end_time?: string
          id?: string
          instructor_id?: string
          reason?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_availability_blocks_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_availability_blocks_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_retention_by_instructor"
            referencedColumns: ["instructor_id"]
          },
        ]
      }
      instructor_availability_log: {
        Row: {
          action: string
          availability_id: string | null
          block_end_time: string | null
          block_id: string | null
          block_reason: string | null
          block_start_time: string | null
          blocked_date: string | null
          changed_at: string
          changed_by: string | null
          changed_by_name: string | null
          day_of_week: number | null
          end_time: string | null
          id: string
          instructor_id: string
          notes: string | null
          prev_values: Json | null
          start_time: string | null
          status: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          action: string
          availability_id?: string | null
          block_end_time?: string | null
          block_id?: string | null
          block_reason?: string | null
          block_start_time?: string | null
          blocked_date?: string | null
          changed_at?: string
          changed_by?: string | null
          changed_by_name?: string | null
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          instructor_id: string
          notes?: string | null
          prev_values?: Json | null
          start_time?: string | null
          status?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          action?: string
          availability_id?: string | null
          block_end_time?: string | null
          block_id?: string | null
          block_reason?: string | null
          block_start_time?: string | null
          blocked_date?: string | null
          changed_at?: string
          changed_by?: string | null
          changed_by_name?: string | null
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          instructor_id?: string
          notes?: string | null
          prev_values?: Json | null
          start_time?: string | null
          status?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_availability_log_availability_id_fkey"
            columns: ["availability_id"]
            isOneToOne: false
            referencedRelation: "instructor_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_availability_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_availability_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_retention_by_instructor"
            referencedColumns: ["instructor_id"]
          },
        ]
      }
      instructor_courses: {
        Row: {
          course_id: string
          instructor_id: string
        }
        Insert: {
          course_id: string
          instructor_id: string
        }
        Update: {
          course_id?: string
          instructor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_retention_by_instrument"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "instructor_courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_retention_by_instructor"
            referencedColumns: ["instructor_id"]
          },
        ]
      }
      instructors: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      journey_events: {
        Row: {
          anon_key: string | null
          created_at: string
          event_type: string
          feature: string
          id: string
          journey_id: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          anon_key?: string | null
          created_at?: string
          event_type: string
          feature: string
          id?: string
          journey_id?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          anon_key?: string | null
          created_at?: string
          event_type?: string
          feature?: string
          id?: string
          journey_id?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_events_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "music_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_quotas: {
        Row: {
          created_at: string
          id: string
          late_cancellations: number
          period_month: number
          period_year: number
          quota_total: number
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          late_cancellations?: number
          period_month: number
          period_year: number
          quota_total?: number
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          late_cancellations?: number
          period_month?: number
          period_year?: number
          quota_total?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_quotas_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_quotas_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_academic_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "monthly_quotas_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_high_risk_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_quotas_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_retention_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_quotas_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["id"]
          },
        ]
      }
      music_journeys: {
        Row: {
          anon_key: string | null
          career_type: string | null
          created_at: string
          feature: string
          id: string
          input_data: Json
          music_score: Json
          recommended_courses: string[] | null
          result_data: Json
          user_id: string | null
        }
        Insert: {
          anon_key?: string | null
          career_type?: string | null
          created_at?: string
          feature: string
          id?: string
          input_data?: Json
          music_score?: Json
          recommended_courses?: string[] | null
          result_data?: Json
          user_id?: string | null
        }
        Update: {
          anon_key?: string | null
          career_type?: string | null
          created_at?: string
          feature?: string
          id?: string
          input_data?: Json
          music_score?: Json
          recommended_courses?: string[] | null
          result_data?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          active: boolean
          channel: string
          created_at: string
          id: string
          template: string
          type: string
        }
        Insert: {
          active?: boolean
          channel?: string
          created_at?: string
          id?: string
          template: string
          type: string
        }
        Update: {
          active?: boolean
          channel?: string
          created_at?: string
          id?: string
          template?: string
          type?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          created_at: string
          currency: string
          discount_amount: number
          discount_percent: number | null
          discount_reason: string | null
          due_date: string
          external_ref: string | null
          final_amount: number
          gateway_response: Json | null
          id: string
          metadata: Json | null
          notes: string | null
          original_amount: number
          paid_at: string | null
          payment_method: string | null
          payment_type: string
          period_month: number
          period_year: number
          plan_name: string | null
          registered_by: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          discount_amount?: number
          discount_percent?: number | null
          discount_reason?: string | null
          due_date: string
          external_ref?: string | null
          final_amount: number
          gateway_response?: Json | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          original_amount: number
          paid_at?: string | null
          payment_method?: string | null
          payment_type?: string
          period_month: number
          period_year: number
          plan_name?: string | null
          registered_by?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          discount_amount?: number
          discount_percent?: number | null
          discount_reason?: string | null
          due_date?: string
          external_ref?: string | null
          final_amount?: number
          gateway_response?: Json | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          original_amount?: number
          paid_at?: string | null
          payment_method?: string | null
          payment_type?: string
          period_month?: number
          period_year?: number
          plan_name?: string | null
          registered_by?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_academic_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_high_risk_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_retention_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["id"]
          },
        ]
      }
      reactivation_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          metadata: Json
          priority: string
          status: string
          student_id: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          metadata?: Json
          priority?: string
          status?: string
          student_id: string
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          metadata?: Json
          priority?: string
          status?: string
          student_id?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactivation_tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactivation_tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_academic_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "reactivation_tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_high_risk_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactivation_tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_retention_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactivation_tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["id"]
          },
        ]
      }
      retention_alerts: {
        Row: {
          alert_type: string
          created_at: string
          due_at: string | null
          id: string
          message: string
          metadata: Json
          resolved_at: string | null
          severity: string
          status: string
          student_id: string | null
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          due_at?: string | null
          id?: string
          message: string
          metadata?: Json
          resolved_at?: string | null
          severity?: string
          status?: string
          student_id?: string | null
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          due_at?: string | null
          id?: string
          message?: string
          metadata?: Json
          resolved_at?: string | null
          severity?: string
          status?: string
          student_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "retention_alerts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_alerts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_academic_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "retention_alerts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_high_risk_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_alerts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_retention_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_alerts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["id"]
          },
        ]
      }
      retention_snapshots: {
        Row: {
          churn_rate: number | null
          created_at: string | null
          id: string
          reactivation_rate: number | null
          retention_rate: number | null
          snapshot_date: string
          total_activo: number | null
          total_exalumno: number | null
          total_inactivo: number | null
          total_reactivated_month: number | null
          total_riesgo: number | null
        }
        Insert: {
          churn_rate?: number | null
          created_at?: string | null
          id?: string
          reactivation_rate?: number | null
          retention_rate?: number | null
          snapshot_date: string
          total_activo?: number | null
          total_exalumno?: number | null
          total_inactivo?: number | null
          total_reactivated_month?: number | null
          total_riesgo?: number | null
        }
        Update: {
          churn_rate?: number | null
          created_at?: string | null
          id?: string
          reactivation_rate?: number | null
          retention_rate?: number | null
          snapshot_date?: string
          total_activo?: number | null
          total_exalumno?: number | null
          total_inactivo?: number | null
          total_reactivated_month?: number | null
          total_riesgo?: number | null
        }
        Relationships: []
      }
      student_activity_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_type: string
          id: string
          metadata: Json
          occurred_at: string
          source: string
          student_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          source?: string
          student_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          source?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_activity_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_activity_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_academic_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_activity_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_high_risk_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_activity_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_retention_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_activity_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["id"]
          },
        ]
      }
      student_admin_notes: {
        Row: {
          created_at: string
          created_by: string | null
          follow_up_at: string | null
          id: string
          metadata: Json
          note: string
          note_type: string
          outcome: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          follow_up_at?: string | null
          id?: string
          metadata?: Json
          note: string
          note_type?: string
          outcome?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          follow_up_at?: string | null
          id?: string
          metadata?: Json
          note?: string
          note_type?: string
          outcome?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_admin_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_admin_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_academic_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_admin_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_high_risk_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_admin_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_retention_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_admin_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          created_at: string | null
          document_hash: string | null
          document_type: string
          document_version: string
          enrollment_id: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          pdf_url: string | null
          signature_url: string | null
          signed_at: string
          student_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          document_hash?: string | null
          document_type: string
          document_version: string
          enrollment_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          pdf_url?: string | null
          signature_url?: string | null
          signed_at?: string
          student_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          document_hash?: string | null
          document_type?: string
          document_version?: string
          enrollment_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          pdf_url?: string | null
          signature_url?: string | null
          signed_at?: string
          student_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_academic_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_high_risk_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_retention_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["id"]
          },
        ]
      }
      student_followups: {
        Row: {
          created_at: string
          created_by: string | null
          followup_type: string
          id: string
          next_action_date: string | null
          notes: string | null
          result: string | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          followup_type: string
          id?: string
          next_action_date?: string | null
          notes?: string | null
          result?: string | null
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          followup_type?: string
          id?: string
          next_action_date?: string | null
          notes?: string | null
          result?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_followups_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_followups_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_academic_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_followups_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_high_risk_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_followups_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_retention_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_followups_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["id"]
          },
        ]
      }
      student_schedules: {
        Row: {
          active_from: string
          active_until: string | null
          classroom_id: string
          course_id: string
          created_at: string
          day_of_week: number
          id: string
          instructor_id: string | null
          notes: string | null
          start_time: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          active_from?: string
          active_until?: string | null
          classroom_id: string
          course_id: string
          created_at?: string
          day_of_week: number
          id?: string
          instructor_id?: string | null
          notes?: string | null
          start_time: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          active_from?: string
          active_until?: string | null
          classroom_id?: string
          course_id?: string
          created_at?: string
          day_of_week?: number
          id?: string
          instructor_id?: string | null
          notes?: string | null
          start_time?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_schedules_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_retention_by_instrument"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "student_schedules_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_schedules_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_retention_by_instructor"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "student_schedules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_schedules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_academic_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_schedules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_high_risk_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_schedules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_retention_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_schedules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["id"]
          },
        ]
      }
      student_status_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          days_inactive: number | null
          id: string
          new_status: string
          old_status: string | null
          reason: string | null
          retention_score: number | null
          student_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          days_inactive?: number | null
          id?: string
          new_status: string
          old_status?: string | null
          reason?: string | null
          retention_score?: number | null
          student_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          days_inactive?: number | null
          id?: string
          new_status?: string
          old_status?: string | null
          reason?: string | null
          retention_score?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_status_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_status_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_academic_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_status_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_high_risk_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_status_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_retention_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_status_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          archived_at: string | null
          archived_reason: string | null
          birth_date: string | null
          birthday_benefit_used: boolean
          birthday_benefit_year: number | null
          birthday_discount_percent: number
          city: string | null
          created_at: string
          document_number: string | null
          document_type: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          enrolled_at: string
          eps: string | null
          first_name: string | null
          id: string
          last_activity_at: string | null
          last_completed_class_at: string | null
          last_name: string | null
          lead_id: string | null
          music_genre: string | null
          name: string
          next_payment_due_at: string | null
          notes: string | null
          payment_method: string | null
          phone: string
          plain_password: string | null
          plan_expires_at: string | null
          plan_name: string | null
          primary_course_id: string | null
          profession: string | null
          reactivated_at: string | null
          retention_score: number
          risk_level: string | null
          risk_reason: string | null
          status: Database["public"]["Enums"]["student_status_t"]
          student_since: string | null
          student_status: string
          student_type: Database["public"]["Enums"]["student_type_t"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          archived_reason?: string | null
          birth_date?: string | null
          birthday_benefit_used?: boolean
          birthday_benefit_year?: number | null
          birthday_discount_percent?: number
          city?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          enrolled_at?: string
          eps?: string | null
          first_name?: string | null
          id?: string
          last_activity_at?: string | null
          last_completed_class_at?: string | null
          last_name?: string | null
          lead_id?: string | null
          music_genre?: string | null
          name: string
          next_payment_due_at?: string | null
          notes?: string | null
          payment_method?: string | null
          phone: string
          plain_password?: string | null
          plan_expires_at?: string | null
          plan_name?: string | null
          primary_course_id?: string | null
          profession?: string | null
          reactivated_at?: string | null
          retention_score?: number
          risk_level?: string | null
          risk_reason?: string | null
          status?: Database["public"]["Enums"]["student_status_t"]
          student_since?: string | null
          student_status?: string
          student_type?: Database["public"]["Enums"]["student_type_t"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          archived_reason?: string | null
          birth_date?: string | null
          birthday_benefit_used?: boolean
          birthday_benefit_year?: number | null
          birthday_discount_percent?: number
          city?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          enrolled_at?: string
          eps?: string | null
          first_name?: string | null
          id?: string
          last_activity_at?: string | null
          last_completed_class_at?: string | null
          last_name?: string | null
          lead_id?: string | null
          music_genre?: string | null
          name?: string
          next_payment_due_at?: string | null
          notes?: string | null
          payment_method?: string | null
          phone?: string
          plain_password?: string | null
          plan_expires_at?: string | null
          plan_name?: string | null
          primary_course_id?: string | null
          profession?: string | null
          reactivated_at?: string | null
          retention_score?: number
          risk_level?: string | null
          risk_reason?: string | null
          status?: Database["public"]["Enums"]["student_status_t"]
          student_since?: string | null
          student_status?: string
          student_type?: Database["public"]["Enums"]["student_type_t"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_primary_course_id_fkey"
            columns: ["primary_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_primary_course_id_fkey"
            columns: ["primary_course_id"]
            isOneToOne: false
            referencedRelation: "v_retention_by_instrument"
            referencedColumns: ["course_id"]
          },
        ]
      }
      system_activity_log: {
        Row: {
          action: string
          actor_name: string | null
          actor_role: string | null
          actor_user_id: string | null
          created_at: string | null
          created_by_system: boolean | null
          description: string | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          severity: string
          source: string | null
        }
        Insert: {
          action: string
          actor_name?: string | null
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string | null
          created_by_system?: boolean | null
          description?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          severity?: string
          source?: string | null
        }
        Update: {
          action?: string
          actor_name?: string | null
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string | null
          created_by_system?: boolean | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          severity?: string
          source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_academic_attendance: {
        Row: {
          absent: number | null
          attendance_rate: number | null
          attended: number | null
          cancelled: number | null
          completed: number | null
          course_id: string | null
          instructor_id: string | null
          no_shows: number | null
          total_sessions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_retention_by_instrument"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "class_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_retention_by_instructor"
            referencedColumns: ["instructor_id"]
          },
        ]
      }
      v_academic_risk: {
        Row: {
          attendance_rate_90d: number | null
          completed_90d: number | null
          recent_no_shows: number | null
          retention_score: number | null
          risk_level: string | null
          student_id: string | null
          student_name: string | null
          student_status: string | null
          total_90d: number | null
        }
        Relationships: []
      }
      v_high_risk_students: {
        Row: {
          archived_at: string | null
          archived_reason: string | null
          cancelled_classes: number | null
          completed_classes: number | null
          days_since_activity: number | null
          email: string | null
          enrolled_at: string | null
          first_name: string | null
          id: string | null
          instructor_name: string | null
          instructors_count: number | null
          instruments_count: number | null
          last_activity_at: string | null
          last_completed_class_at: string | null
          last_name: string | null
          name: string | null
          next_payment_due_at: string | null
          no_response_30d: number | null
          no_shows_30d: number | null
          operational_status:
            | Database["public"]["Enums"]["student_status_t"]
            | null
          phone: string | null
          plan_expires_at: string | null
          primary_course_id: string | null
          primary_course_name: string | null
          reactivated_at: string | null
          retention_score: number | null
          risk_level: string | null
          risk_reason: string | null
          student_since: string | null
          student_status: string | null
          upcoming_classes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "students_primary_course_id_fkey"
            columns: ["primary_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_primary_course_id_fkey"
            columns: ["primary_course_id"]
            isOneToOne: false
            referencedRelation: "v_retention_by_instrument"
            referencedColumns: ["course_id"]
          },
        ]
      }
      v_journey_funnel: {
        Row: {
          appointments: number | null
          career_type: string | null
          completed: number | null
          conversion_pct: number | null
          cta_clicks: number | null
          feature: string | null
          total_journeys: number | null
        }
        Relationships: []
      }
      v_monthly_recovery_rate: {
        Row: {
          at_risk_total: number | null
          month: string | null
          recovered: number | null
          recovery_rate_pct: number | null
        }
        Relationships: []
      }
      v_retention_by_instructor: {
        Row: {
          activos: number | null
          avg_score: number | null
          en_riesgo: number | null
          instructor_id: string | null
          instructor_name: string | null
          perdidos: number | null
          retention_rate_pct: number | null
          total_students: number | null
        }
        Relationships: []
      }
      v_retention_by_instrument: {
        Row: {
          activos: number | null
          avg_score: number | null
          course_id: string | null
          en_riesgo: number | null
          instrument_name: string | null
          perdidos: number | null
          retention_rate_pct: number | null
          total_students: number | null
        }
        Relationships: []
      }
      v_retention_by_source: {
        Row: {
          activos: number | null
          avg_lifetime_days: number | null
          en_riesgo: number | null
          exalumnos: number | null
          inactivos: number | null
          reactivados: number | null
          retention_rate_pct: number | null
          source: string | null
          total_students: number | null
        }
        Relationships: []
      }
      v_retention_dashboard: {
        Row: {
          active_students: number | null
          alumni_students: number | null
          inactive_students: number | null
          plans_expiring_week: number | null
          reactivated_this_month: number | null
          reactivation_rate: number | null
          retention_rate: number | null
          risk_students: number | null
          total_students: number | null
          without_upcoming_sessions: number | null
        }
        Relationships: []
      }
      v_retention_students: {
        Row: {
          archived_at: string | null
          archived_reason: string | null
          cancelled_classes: number | null
          completed_classes: number | null
          days_since_activity: number | null
          email: string | null
          enrolled_at: string | null
          first_name: string | null
          id: string | null
          instructor_name: string | null
          instructors_count: number | null
          instruments_count: number | null
          last_activity_at: string | null
          last_completed_class_at: string | null
          last_name: string | null
          name: string | null
          next_payment_due_at: string | null
          no_response_30d: number | null
          no_shows_30d: number | null
          operational_status:
            | Database["public"]["Enums"]["student_status_t"]
            | null
          phone: string | null
          plan_expires_at: string | null
          primary_course_id: string | null
          primary_course_name: string | null
          reactivated_at: string | null
          retention_score: number | null
          risk_level: string | null
          risk_reason: string | null
          student_since: string | null
          student_status: string | null
          upcoming_classes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "students_primary_course_id_fkey"
            columns: ["primary_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_primary_course_id_fkey"
            columns: ["primary_course_id"]
            isOneToOne: false
            referencedRelation: "v_retention_by_instrument"
            referencedColumns: ["course_id"]
          },
        ]
      }
      v_student_instruments_history: {
        Row: {
          cancelled_classes: number | null
          completed_classes: number | null
          course_id: string | null
          course_name: string | null
          last_session_at: string | null
          no_show_classes: number | null
          rescheduled_classes: number | null
          student_id: string | null
          total_sessions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_retention_by_instrument"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "class_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_academic_risk"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "class_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_high_risk_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_retention_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_risk"
            referencedColumns: ["id"]
          },
        ]
      }
      v_student_risk: {
        Row: {
          computed_risk_level: string | null
          days_since_last_activity: number | null
          days_since_last_class: number | null
          email: string | null
          full_name: string | null
          id: string | null
          last_activity_at: string | null
          last_completed_class_at: string | null
          next_payment_due_at: string | null
          overdue_amount: number | null
          overdue_payments_count: number | null
          pending_amount: number | null
          pending_payments_count: number | null
          phone: string | null
          plan_expires_at: string | null
          plan_name: string | null
          retention_score: number | null
          risk_level: string | null
          risk_reason: string | null
          student_status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      compute_overdue_payments: { Args: never; Returns: number }
      fn_available_slots: {
        Args: {
          p_date: string
          p_instructor_id?: string
          p_student_id?: string
        }
        Returns: {
          classroom_id: string
          classroom_name: string
          is_available: boolean
          slot_time: string
        }[]
      }
      fn_book_session: {
        Args: {
          p_classroom_id: string
          p_course_id: string
          p_date: string
          p_instructor_id?: string
          p_notes?: string
          p_schedule_id?: string
          p_start_time: string
          p_student_id: string
        }
        Returns: Json
      }
      fn_cancel_session: {
        Args: { p_reason?: string; p_session_id: string }
        Returns: Json
      }
      fn_generate_monthly_sessions: {
        Args: { p_month: number; p_student_id: string; p_year: number }
        Returns: Json
      }
      fn_generate_retention_alerts: { Args: never; Returns: number }
      fn_instructor_free: {
        Args: {
          p_date: string
          p_exclude_id?: string
          p_instructor_id: string
          p_start_time: string
        }
        Returns: string
      }
      fn_is_blocked: {
        Args: { p_classroom_id?: string; p_date: string; p_start_time: string }
        Returns: boolean
      }
      fn_latest_followup_per_student: {
        Args: never
        Returns: {
          created_at: string
          created_by: string | null
          followup_type: string
          id: string
          next_action_date: string | null
          notes: string | null
          result: string | null
          status: string
          student_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "student_followups"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      fn_monthly_usage: {
        Args: { p_month: number; p_student_id: string; p_year: number }
        Returns: {
          classes_available: number
          classes_completed: number
          classes_scheduled: number
          late_cancellations: number
          quota_total: number
        }[]
      }
      fn_record_student_activity: {
        Args: {
          p_description?: string
          p_event_type: string
          p_metadata?: Json
          p_source?: string
          p_student_id: string
        }
        Returns: undefined
      }
      fn_reschedule_session: {
        Args: {
          p_new_classroom_id: string
          p_new_date: string
          p_new_start_time: string
          p_session_id: string
        }
        Returns: Json
      }
      fn_restore_credit: {
        Args: {
          p_admin_user: string
          p_delta?: number
          p_month: number
          p_notes?: string
          p_reason: string
          p_session_id?: string
          p_student_id: string
          p_year: number
        }
        Returns: Json
      }
      fn_slot_available: {
        Args: {
          p_classroom_id: string
          p_date: string
          p_exclude_id?: string
          p_start_time: string
        }
        Returns: boolean
      }
      fn_student_free: {
        Args: {
          p_date: string
          p_exclude_id?: string
          p_start_time: string
          p_student_id: string
        }
        Returns: boolean
      }
      fn_update_student_risk_levels: {
        Args: never
        Returns: {
          log_msg: string
          updated_count: number
        }[]
      }
      fn_validate_schedule_rules: {
        Args: { p_date: string; p_start_time: string; p_student_id: string }
        Returns: string
      }
      sync_student_payment_fields: {
        Args: { p_student_id: string }
        Returns: undefined
      }
    }
    Enums: {
      session_status_t:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "rescheduled"
        | "no_show"
      student_status_t: "active" | "inactive" | "suspended"
      student_type_t: "new" | "regular"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      session_status_t: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "rescheduled",
        "no_show",
      ],
      student_status_t: ["active", "inactive", "suspended"],
      student_type_t: ["new", "regular"],
    },
  },
} as const

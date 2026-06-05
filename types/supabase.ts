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
          cancellation_reason: string | null
          cancelled_at: string | null
          classroom_id: string
          course_id: string
          created_at: string
          id: string
          instructor_id: string | null
          late_cancellation: boolean
          notes: string | null
          original_session_id: string | null
          rescheduled_to_id: string | null
          schedule_id: string | null
          scheduled_date: string
          start_time: string
          status: Database["public"]["Enums"]["session_status_t"]
          student_id: string
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          classroom_id: string
          course_id: string
          created_at?: string
          id?: string
          instructor_id?: string | null
          late_cancellation?: boolean
          notes?: string | null
          original_session_id?: string | null
          rescheduled_to_id?: string | null
          schedule_id?: string | null
          scheduled_date: string
          start_time: string
          status?: Database["public"]["Enums"]["session_status_t"]
          student_id: string
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          classroom_id?: string
          course_id?: string
          created_at?: string
          id?: string
          instructor_id?: string | null
          late_cancellation?: boolean
          notes?: string | null
          original_session_id?: string | null
          rescheduled_to_id?: string | null
          schedule_id?: string | null
          scheduled_date?: string
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
            foreignKeyName: "class_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
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
          converted_at: string | null
          converted_student_id: string | null
          course_interest: string
          created_at: string
          email: string
          guardian_name: string | null
          id: string
          internal_notes: string | null
          last_contact_at: string | null
          level: string
          lost_reason: string | null
          next_followup_at: string | null
          notes: string | null
          phone: string
          preferred_time: string | null
          source: string
          status: string
          student_age: number
          student_name: string
          student_type: string
        }
        Insert: {
          assigned_to?: string | null
          converted_at?: string | null
          converted_student_id?: string | null
          course_interest: string
          created_at?: string
          email: string
          guardian_name?: string | null
          id?: string
          internal_notes?: string | null
          last_contact_at?: string | null
          level: string
          lost_reason?: string | null
          next_followup_at?: string | null
          notes?: string | null
          phone: string
          preferred_time?: string | null
          source?: string
          status?: string
          student_age: number
          student_name: string
          student_type: string
        }
        Update: {
          assigned_to?: string | null
          converted_at?: string | null
          converted_student_id?: string | null
          course_interest?: string
          created_at?: string
          email?: string
          guardian_name?: string | null
          id?: string
          internal_notes?: string | null
          last_contact_at?: string | null
          level?: string
          lost_reason?: string | null
          next_followup_at?: string | null
          notes?: string | null
          phone?: string
          preferred_time?: string | null
          source?: string
          status?: string
          student_age?: number
          student_name?: string
          student_type?: string
        }
        Relationships: []
      }
      instructor_availability: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          instructor_id: string
          start_time: string
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          instructor_id: string
          start_time: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          instructor_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_availability_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
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
            foreignKeyName: "instructor_courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
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
        ]
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
            foreignKeyName: "student_schedules_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
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
        ]
      }
      students: {
        Row: {
          address: string | null
          archived_at: string | null
          archived_reason: string | null
          birth_date: string | null
          city: string | null
          created_at: string
          document_number: string | null
          document_type: string | null
          email: string | null
          enrolled_at: string
          first_name: string | null
          id: string
          last_activity_at: string | null
          last_name: string | null
          lead_id: string | null
          music_genre: string | null
          name: string
          next_payment_due_at: string | null
          notes: string | null
          phone: string
          plain_password: string | null
          plan_expires_at: string | null
          primary_course_id: string | null
          profession: string | null
          reactivated_at: string | null
          retention_score: number
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
          city?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          enrolled_at?: string
          first_name?: string | null
          id?: string
          last_activity_at?: string | null
          last_name?: string | null
          lead_id?: string | null
          music_genre?: string | null
          name: string
          next_payment_due_at?: string | null
          notes?: string | null
          phone: string
          plain_password?: string | null
          plan_expires_at?: string | null
          primary_course_id?: string | null
          profession?: string | null
          reactivated_at?: string | null
          retention_score?: number
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
          city?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          enrolled_at?: string
          first_name?: string | null
          id?: string
          last_activity_at?: string | null
          last_name?: string | null
          lead_id?: string | null
          music_genre?: string | null
          name?: string
          next_payment_due_at?: string | null
          notes?: string | null
          phone?: string
          plain_password?: string | null
          plan_expires_at?: string | null
          primary_course_id?: string | null
          profession?: string | null
          reactivated_at?: string | null
          retention_score?: number
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
        ]
      }
    }
    Views: {
      v_high_risk_students: {
        Row: {
          archived_at: string | null
          archived_reason: string | null
          cancelled_classes: number | null
          completed_classes: number | null
          days_since_activity: number | null
          email: string | null
          enrolled_at: string | null
          id: string | null
          instructors_count: number | null
          instruments_count: number | null
          last_activity_at: string | null
          name: string | null
          next_payment_due_at: string | null
          operational_status:
            | Database["public"]["Enums"]["student_status_t"]
            | null
          phone: string | null
          plan_expires_at: string | null
          primary_course_id: string | null
          primary_course_name: string | null
          reactivated_at: string | null
          retention_score: number | null
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
          id: string | null
          instructors_count: number | null
          instruments_count: number | null
          last_activity_at: string | null
          name: string | null
          next_payment_due_at: string | null
          operational_status:
            | Database["public"]["Enums"]["student_status_t"]
            | null
          phone: string | null
          plan_expires_at: string | null
          primary_course_id: string | null
          primary_course_name: string | null
          reactivated_at: string | null
          retention_score: number | null
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
        ]
      }
    }
    Functions: {
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
      fn_validate_schedule_rules: {
        Args: { p_date: string; p_start_time: string; p_student_id: string }
        Returns: string
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

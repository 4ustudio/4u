export type IAFeature = 'perfil' | 'sueno' | 'carrera'

export type IAEventType =
  | 'journey_started'
  | 'journey_completed'
  | 'cta_clicked'
  | 'appointment_created'

export interface MusicJourneyInsert {
  user_id?:             string | null
  anon_key?:            string | null
  feature:              IAFeature
  input_data:           Record<string, unknown>
  result_data:          Record<string, unknown>
  music_score:          Record<string, number>
  career_type?:         string | null
  recommended_courses?: string[]
}

export interface MusicJourneyRow extends MusicJourneyInsert {
  id:         string
  created_at: string
}

export interface JourneyEventInsert {
  journey_id?: string | null
  user_id?:    string | null
  anon_key?:   string | null
  event_type:  IAEventType
  feature:     IAFeature
  metadata?:   Record<string, unknown>
}

export interface JourneyEventRow extends JourneyEventInsert {
  id:         string
  created_at: string
}

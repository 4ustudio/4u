'use client'

import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/supabase'
import type { IAFeature, IAEventType } from '@/types/ia'

type MusicJourneyInsert  = Database['public']['Tables']['music_journeys']['Insert']
type JourneyEventInsert  = Database['public']['Tables']['journey_events']['Insert']

function makeClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

type IAClient = ReturnType<typeof makeClient>
let _client: IAClient | null = null

function getClient(): IAClient {
  if (!_client) _client = makeClient()
  return _client
}

function getAnonKey(): string {
  if (typeof window === 'undefined') return ''
  let key = localStorage.getItem('music_anon_key')
  if (!key) {
    key = crypto.randomUUID()
    localStorage.setItem('music_anon_key', key)
  }
  return key
}

export async function trackEvent(
  event_type: IAEventType,
  feature:    IAFeature,
  journey_id?: string,
  metadata?:   Record<string, unknown>
): Promise<void> {
  try {
    const supabase = getClient()
    const payload: JourneyEventInsert = {
      journey_id: journey_id ?? null,
      anon_key:   getAnonKey(),
      event_type,
      feature,
      metadata: (metadata ?? {}) as Json,
    }
    await supabase.from('journey_events').insert(payload)
  } catch {
    // eventos no deben romper la UX
  }
}

export type JourneySaveParams = {
  feature:              IAFeature
  input_data:           Record<string, unknown>
  result_data:          Record<string, unknown>
  music_score:          Record<string, number>
  career_type?:         string | null
  recommended_courses?: string[]
}

export async function saveJourney(params: JourneySaveParams): Promise<string | null> {
  try {
    const supabase = getClient()
    const payload: MusicJourneyInsert = {
      feature:             params.feature,
      input_data:          params.input_data  as Json,
      result_data:         params.result_data as Json,
      music_score:         params.music_score as Json,
      career_type:         params.career_type ?? null,
      recommended_courses: params.recommended_courses ?? [],
      anon_key:            getAnonKey(),
    }
    const { data, error } = await supabase
      .from('music_journeys')
      .insert(payload)
      .select('id')
      .single()
    if (error || !data) return null
    return data.id
  } catch {
    return null
  }
}

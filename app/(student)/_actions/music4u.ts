'use server'

import { createAuthServerClient } from '@/lib/supabase/server'
import type { MusicScore } from '@/lib/ia/scoring'

export type JourneyRow = {
  id: string
  feature: string
  music_score: MusicScore
  result_data: Record<string, unknown>
  input_data:  Record<string, unknown>
  career_type: string | null
  recommended_courses: string[] | null
  created_at: string
}

export type Music4UMetrics = {
  total:     number
  ctaClicks: number
  favorite:  string | null
}

export async function getUserJourneys(userId: string): Promise<JourneyRow[]> {
  const supabase = await createAuthServerClient()
  const { data } = await supabase
    .from('music_journeys')
    .select('id, feature, music_score, result_data, input_data, career_type, recommended_courses, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return (data ?? []) as JourneyRow[]
}

export async function getMusic4UMetrics(userId: string): Promise<Music4UMetrics> {
  const supabase = await createAuthServerClient()

  const [{ data: journeys }, { data: events }] = await Promise.all([
    supabase.from('music_journeys').select('feature').eq('user_id', userId),
    supabase.from('journey_events').select('event_type').eq('user_id', userId).eq('event_type', 'cta_clicked'),
  ])

  const total = journeys?.length ?? 0
  const ctaClicks = events?.length ?? 0

  const counts: Record<string, number> = {}
  for (const j of journeys ?? []) {
    counts[j.feature] = (counts[j.feature] ?? 0) + 1
  }
  const favorite = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return { total, ctaClicks, favorite }
}

export async function linkAnonJourneys(userId: string, anonKey: string): Promise<void> {
  const supabase = await createAuthServerClient()
  await Promise.all([
    supabase.from('music_journeys').update({ user_id: userId }).eq('anon_key', anonKey).is('user_id', null),
    supabase.from('journey_events').update({ user_id: userId }).eq('anon_key', anonKey).is('user_id', null),
  ])
}

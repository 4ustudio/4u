'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Severity } from '@/lib/activity'

// ── Tipos ─────────────────────────────────────────────────────────

export interface ActivityLogRow {
  id: string
  created_at: string
  actor_user_id: string | null
  actor_name: string | null
  actor_role: string | null
  entity_type: string
  entity_id: string | null
  action: string
  description: string | null
  metadata: Record<string, unknown> | null
  source: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  created_by_system: boolean
  severity: Severity
}

export type ActivityModule = 'all' | 'crm' | 'ventas' | 'academico' | 'retencion' | 'sistema'

export interface ActivityFilters {
  module?: ActivityModule
  severity?: Severity | 'all'
  date_from?: string
  date_to?: string
  actor_user_id?: string
  search?: string
  page?: number
}

export interface PeriodMetrics {
  label: string
  enrollments: number
  payments: number
  sessions: number
  cancellations: number
  leads_created: number
  leads_converted: number
  no_shows: number
  at_risk: number
  total: number
}

export interface DashboardMetrics {
  today: PeriodMetrics
  week: PeriodMetrics
}

// ── Mapeo módulo → entity_types / flags ──────────────────────────

const MODULE_ENTITY_TYPES: Record<Exclude<ActivityModule, 'all' | 'sistema'>, string[]> = {
  crm:       ['lead', 'enrollment'],
  ventas:    ['payment', 'enrollment'],
  academico: ['session', 'attendance'],
  retencion: ['retention', 'student'],
}

const PAGE_SIZE = 50

// ── Queries ───────────────────────────────────────────────────────

export async function getActivityLogs(filters: ActivityFilters = {}): Promise<{
  data: ActivityLogRow[]
  total: number
  error: string | null
}> {
  try {
    const db = createAdminClient()
    const page = filters.page ?? 1
    const from = (page - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let query = db
      .from('system_activity_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    // Filtro de módulo
    const mod = filters.module ?? 'all'
    if (mod === 'sistema') {
      query = query.eq('created_by_system', true)
    } else if (mod !== 'all') {
      const types = MODULE_ENTITY_TYPES[mod]
      query = query.in('entity_type', types)
    }

    if (filters.severity && filters.severity !== 'all') {
      query = query.eq('severity', filters.severity)
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }
    if (filters.date_to) {
      const end = new Date(filters.date_to)
      end.setDate(end.getDate() + 1)
      query = query.lt('created_at', end.toISOString())
    }
    if (filters.actor_user_id) {
      query = query.eq('actor_user_id', filters.actor_user_id)
    }
    if (filters.search) {
      query = query.ilike('description', `%${filters.search}%`)
    }

    const { data, error, count } = await query
    if (error) return { data: [], total: 0, error: error.message }
    return { data: (data ?? []) as ActivityLogRow[], total: count ?? 0, error: null }
  } catch (e) {
    return { data: [], total: 0, error: String(e) }
  }
}

function buildMetrics(rows: { action: string }[], label: string): PeriodMetrics {
  return {
    label,
    enrollments:     rows.filter(r => r.action === 'enrollment.completed').length,
    payments:        rows.filter(r => r.action === 'payment.received').length,
    sessions:        rows.filter(r => r.action === 'session.created').length,
    cancellations:   rows.filter(r => r.action === 'session.cancelled').length,
    leads_created:   rows.filter(r => r.action === 'lead.created').length,
    leads_converted: rows.filter(r => r.action === 'lead.converted').length,
    no_shows:        rows.filter(r => r.action === 'attendance.no_show').length,
    at_risk:         rows.filter(r => r.action === 'retention.status_changed').length,
    total:           rows.length,
  }
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const db = createAdminClient()

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)

    const { data } = await db
      .from('system_activity_log')
      .select('action, created_at')
      .gte('created_at', weekStart.toISOString())

    const rows = (data ?? []) as { action: string; created_at: string }[]
    const todayIso = todayStart.toISOString()

    const todayRows = rows.filter(r => r.created_at >= todayIso)
    const weekRows  = rows

    return {
      today: buildMetrics(todayRows, 'Hoy'),
      week:  buildMetrics(weekRows,  'Últimos 7 días'),
    }
  } catch {
    const empty: PeriodMetrics = {
      label: '', enrollments: 0, payments: 0, sessions: 0,
      cancellations: 0, leads_created: 0, leads_converted: 0,
      no_shows: 0, at_risk: 0, total: 0,
    }
    return { today: { ...empty, label: 'Hoy' }, week: { ...empty, label: 'Últimos 7 días' } }
  }
}

export async function getActivityActors(): Promise<{ id: string; name: string }[]> {
  try {
    const db = createAdminClient()
    const { data } = await db
      .from('system_activity_log')
      .select('actor_user_id, actor_name')
      .not('actor_user_id', 'is', null)
      .not('actor_name', 'is', null)
      .order('actor_name')

    if (!data) return []
    const seen = new Set<string>()
    const result: { id: string; name: string }[] = []
    for (const row of data as { actor_user_id: string; actor_name: string }[]) {
      if (!seen.has(row.actor_user_id)) {
        seen.add(row.actor_user_id)
        result.push({ id: row.actor_user_id, name: row.actor_name })
      }
    }
    return result
  } catch {
    return []
  }
}

'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/supabase/server'
import { resolveRole, isAdmin } from '@/lib/auth/roles'

export interface BellSeedEvent {
  id: string
  entity_type: string
  action: string
  description: string | null
  severity: 'info' | 'warning' | 'critical'
  created_at: string
}

export interface BellSeedAlert {
  id: string
  alert_type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  created_at: string
}

// Carga inicial de la campana de notificaciones — solo admin/super_admin/owner.
// "Bell-worthy": severity warning/critical, o asistencia confirmada (que por
// defecto es 'info' pero es justo el caso "instructor tomó clase" pedido).
export async function getInitialBellFeed(): Promise<{ events: BellSeedEvent[]; alerts: BellSeedAlert[] }> {
  const { data: { user } } = await getAuthUser()
  if (!isAdmin(resolveRole(user))) return { events: [], alerts: [] }

  const admin = createAdminClient()
  const [{ data: events }, { data: alerts }] = await Promise.all([
    admin.from('system_activity_log')
      .select('id, entity_type, action, description, severity, created_at')
      .or('severity.in.(warning,critical),action.in.(attendance.confirmed,instructor.availability_changed,instructor.date_blocked,instructor.class_assigned)')
      .order('created_at', { ascending: false })
      .limit(30),
    admin.from('retention_alerts')
      .select('id, alert_type, severity, title, message, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  return { events: (events ?? []) as BellSeedEvent[], alerts: (alerts ?? []) as BellSeedAlert[] }
}

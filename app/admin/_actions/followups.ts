'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAuthServerClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/types/supabase'

type FollowupRow = Database['public']['Tables']['student_followups']['Row']
type StudentRiskRow = Database['public']['Views']['v_student_risk']['Row']

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export type StudentAtRisk = {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  student_status: string
  plan_name: string | null
  overdue_payments_count: number
  overdue_amount: number
  pending_payments_count: number
  pending_amount: number
  days_since_last_class: number | null
  days_since_last_activity: number | null
  computed_risk_level: RiskLevel
  risk_reason: string | null
}

export type Followup = {
  id: string
  created_at: string
  student_id: string
  followup_type: 'llamada' | 'whatsapp' | 'email' | 'reunión' | 'observación'
  notes: string | null
  next_action_date: string | null
  status: 'pendiente' | 'completado' | 'sin_respuesta'
  result: string | null
}

export type FollowupMetrics = {
  seguimientosMes: number
  pendientes: number
  completadosMes: number
  accionesVencidas: number
  estudiantesConSeguimiento: number
  recuperadosMes: number
}

const RISK_SORT: Record<RiskLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

function toStudentAtRisk(row: StudentRiskRow): StudentAtRisk {
  return {
    id: row.id ?? '',
    full_name: row.full_name ?? '—',
    phone: row.phone,
    email: row.email,
    student_status: row.student_status ?? '',
    plan_name: row.plan_name,
    overdue_payments_count: row.overdue_payments_count ?? 0,
    overdue_amount: row.overdue_amount ?? 0,
    pending_payments_count: row.pending_payments_count ?? 0,
    pending_amount: row.pending_amount ?? 0,
    days_since_last_class: row.days_since_last_class,
    days_since_last_activity: row.days_since_last_activity,
    computed_risk_level: (row.computed_risk_level as RiskLevel) ?? 'LOW',
    risk_reason: row.risk_reason,
  }
}

function toFollowup(row: FollowupRow): Followup {
  return {
    id: row.id,
    created_at: row.created_at,
    student_id: row.student_id,
    followup_type: row.followup_type as Followup['followup_type'],
    notes: row.notes,
    next_action_date: row.next_action_date,
    status: row.status as Followup['status'],
    result: row.result,
  }
}

async function writeActivityLog(params: {
  actorUserId?: string | null
  entityType: string
  entityId: string
  action: string
  description: string
  newData?: Json
  severity?: 'info' | 'warning' | 'critical'
}) {
  try {
    const db = createAdminClient()
    await db.from('system_activity_log').insert({
      actor_user_id: params.actorUserId ?? null,
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: params.action,
      description: params.description,
      new_data: params.newData ?? null,
      severity: params.severity ?? 'info',
      source: 'admin_panel',
      created_by_system: false,
    })
  } catch {
    // No interrumpir flujo por fallo en logging
  }
}

// ── Queries ───────────────────────────────────────────────────

export async function getStudentsAtRisk(): Promise<StudentAtRisk[]> {
  const db = createAdminClient()
  const { data, error } = await db.from('v_student_risk').select('*')
  if (error || !data) return []
  return data
    .map(toStudentAtRisk)
    .filter(s => s.id)
    .sort((a, b) => RISK_SORT[a.computed_risk_level] - RISK_SORT[b.computed_risk_level])
}

export async function getStudentFollowups(studentId: string): Promise<Followup[]> {
  const db = createAdminClient()
  const { data } = await db
    .from('student_followups')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(toFollowup)
}

export async function getLatestFollowupPerStudent(): Promise<Record<string, Followup>> {
  const db = createAdminClient()
  // DISTINCT ON en SQL: trae solo el último seguimiento por estudiante sin cargar todo
  const { data } = await db.rpc('fn_latest_followup_per_student' as never)

  const map: Record<string, Followup> = {}
  if (!data) return map

  for (const row of data as FollowupRow[]) {
    map[row.student_id] = toFollowup(row)
  }
  return map
}

export async function getFollowupMetrics(): Promise<FollowupMetrics> {
  const db = createAdminClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data } = await db
    .from('student_followups')
    .select('student_id, status, created_at, next_action_date, result')

  const rows = data ?? []
  const today = now.toISOString().slice(0, 10)

  return {
    seguimientosMes: rows.filter(r => r.created_at >= monthStart).length,
    pendientes: rows.filter(r => r.status === 'pendiente').length,
    completadosMes: rows.filter(r => r.created_at >= monthStart && r.status === 'completado').length,
    accionesVencidas: rows.filter(
      r => r.next_action_date != null && r.next_action_date < today && r.status === 'pendiente'
    ).length,
    estudiantesConSeguimiento: new Set(rows.map(r => r.student_id)).size,
    recuperadosMes: rows.filter(r => r.created_at >= monthStart && r.result === 'Recuperado').length,
  }
}

// ── Mutations ─────────────────────────────────────────────────

export async function createFollowup(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const studentId = formData.get('student_id') as string
  const followupType = formData.get('followup_type') as string
  const notes = (formData.get('notes') as string) || null
  const nextActionDate = (formData.get('next_action_date') as string) || null
  const status = (formData.get('status') as string) || 'completado'
  const result = (formData.get('result') as string) || null

  if (!studentId || !followupType) {
    return { ok: false, error: 'Faltan campos requeridos' }
  }

  const db = createAdminClient()
  const { error } = await db.from('student_followups').insert({
    student_id: studentId,
    created_by: user?.id ?? null,
    followup_type: followupType,
    notes,
    next_action_date: nextActionDate,
    status,
    result,
  })

  if (error) return { ok: false, error: error.message }

  await writeActivityLog({
    actorUserId: user?.id,
    entityType: 'student',
    entityId: studentId,
    action: 'followup_created',
    description: `Seguimiento registrado: ${followupType}${notes ? ` — ${notes.slice(0, 80)}` : ''}`,
    newData: { followup_type: followupType, status, result },
    severity: 'info',
  })

  revalidatePath('/admin/retencion')
  return { ok: true }
}

export async function markStudentRecovered(studentId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createAdminClient()

  // Leer estado previo para el log
  const { data: prevStudent } = await db
    .from('students')
    .select('student_status, risk_level, name')
    .eq('id', studentId)
    .single()

  const { error: updateError } = await db
    .from('students')
    .update({ student_status: 'activo', reactivated_at: new Date().toISOString() })
    .eq('id', studentId)

  if (updateError) return { ok: false, error: updateError.message }

  await db.from('student_followups').insert({
    student_id: studentId,
    created_by: user?.id ?? null,
    followup_type: 'observación',
    notes: 'Estudiante marcado como recuperado.',
    status: 'completado',
    result: 'Recuperado',
  })

  await writeActivityLog({
    actorUserId: user?.id,
    entityType: 'student',
    entityId: studentId,
    action: 'student_recovered',
    description: `Estudiante ${prevStudent?.name ?? studentId} marcado como recuperado`,
    newData: {
      prev_status: prevStudent?.student_status,
      new_status: 'activo',
      prev_risk_level: prevStudent?.risk_level,
    },
    severity: 'info',
  })

  revalidatePath('/admin/retencion')
  return { ok: true }
}

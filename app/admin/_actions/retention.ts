'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { StudentActivityEventType, StudentLifecycleStatus } from '@/types/admin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

type Severity = 'info' | 'warning' | 'critical'
type TaskPriority = 'low' | 'medium' | 'high'

export interface RetentionPreview {
  dryRun: boolean
  generatedAt: string
  studentsReviewed: number
  summary: {
    statusChanges: number
    alerts: number
    tasks: number
    campaignDrafts: number
  }
  statusChanges: Array<{
    student_id: string
    name: string
    from: StudentLifecycleStatus | null
    to: StudentLifecycleStatus
    daysSinceActivity: number
    retentionScore: number
  }>
  alerts: Array<{
    student_id: string
    alert_type: string
    severity: Severity
    title: string
    message: string
  }>
  tasks: Array<{
    student_id: string
    task_type: string
    priority: TaskPriority
    title: string
    description: string
    due_at: string
  }>
  campaignDrafts: Array<{
    student_id: string
    channel: 'email' | 'whatsapp' | 'internal'
    campaign_key: string
    subject: string
    body: string
  }>
}

const LIFECYCLE_LABEL: Record<StudentLifecycleStatus, string> = {
  lead: 'Lead',
  matriculado: 'Matriculado',
  activo: 'Activo',
  riesgo: 'En riesgo',
  inactivo: 'Inactivo',
  exalumno: 'Exalumno',
}

function isoNow() {
  return new Date().toISOString()
}

function addDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function daysSince(value: string | null | undefined) {
  if (!value) return 999
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return 999
  return Math.max(0, Math.floor((Date.now() - time) / 86400000))
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function computeLifecycle(current: StudentLifecycleStatus | null | undefined, days: number): StudentLifecycleStatus {
  if (days >= 90) return 'exalumno'
  if (days >= 60) return 'inactivo'
  if (days >= 30) return 'riesgo'
  if (current === 'lead' || current === 'matriculado') return current
  return 'activo'
}

function computeRetentionScore(input: {
  days: number
  completedRecent: number
  cancelledRecent: number
  noShowRecent: number
  noShows30d: number
  noShows60d: number
  noResponse30d: number
  consecutiveNoShows: number
  upcoming: number
}) {
  let score = 100

  // Penalización por inactividad (max -60 a los 90 días)
  score -= Math.min(60, Math.floor(input.days / 1.5))

  // Penalización por comportamiento reciente
  score -= Math.min(30, input.noShows30d * 10)
  score -= Math.min(24, input.noResponse30d * 8)
  score -= Math.min(15, input.cancelledRecent * 5)

  // Patrones de comportamiento (penalización adicional)
  if (input.consecutiveNoShows >= 2) score -= 15
  if (input.noShows60d >= 3) score -= 20

  // Bonificaciones por actividad reciente
  score += Math.min(20, input.completedRecent * 5)
  if (input.upcoming > 0) score += 5

  return clampScore(score)
}

function computeRiskLevel(score: number): 'bajo' | 'medio' | 'alto' | 'critico' {
  if (score >= 80) return 'bajo'
  if (score >= 50) return 'medio'
  if (score >= 20) return 'alto'
  return 'critico'
}

function computeRiskReason(signals: {
  consecutiveNoShows: number
  noShows60d: number
  noResponse30d: number
}, days: number, status: StudentLifecycleStatus): string | null {
  if (signals.consecutiveNoShows >= 3 || signals.noShows60d >= 3) return 'no_show_frecuente'
  if (signals.consecutiveNoShows >= 2) return 'no_show_consecutivo'
  if (signals.noResponse30d >= 2) return 'no_response_frecuente'
  if (days >= 90) return 'sin_actividad_90d'
  if (days >= 60) return 'sin_actividad_60d'
  if (days >= 30) return 'sin_actividad_30d'
  if (status === 'activo') return null
  return null
}

export async function safeRecordStudentActivity(
  studentId: string | null | undefined,
  eventType: StudentActivityEventType,
  description?: string,
  metadata?: Record<string, unknown>
) {
  if (!studentId) return

  try {
    await db().rpc('fn_record_student_activity', {
      p_student_id: studentId,
      p_event_type: eventType,
      p_source: 'system',
      p_description: description ?? null,
      p_metadata: metadata ?? {},
    })
  } catch {
    // La app no debe romper flujos existentes si la migracion de retencion aun no fue aplicada.
  }
}

interface StudentSignals {
  completedRecent: number
  cancelledRecent: number
  noShowRecent: number
  noShows30d: number
  noShows60d: number
  noResponse30d: number
  upcoming: number
  lastCompletedDate: string | null
  consecutiveNoShows: number
}

async function getSessionSignals(studentIds: string[]) {
  const empty = (): StudentSignals => ({
    completedRecent: 0,
    cancelledRecent: 0,
    noShowRecent: 0,
    noShows30d: 0,
    noShows60d: 0,
    noResponse30d: 0,
    upcoming: 0,
    lastCompletedDate: null,
    consecutiveNoShows: 0,
  })

  const signals = new Map<string, StudentSignals>()
  for (const id of studentIds) signals.set(id, empty())

  if (studentIds.length === 0) return signals

  const since = new Date()
  since.setDate(since.getDate() - 120)
  const sinceStr = since.toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]
  const d30 = new Date(); d30.setDate(d30.getDate() - 30); const d30str = d30.toISOString().split('T')[0]
  const d60 = new Date(); d60.setDate(d60.getDate() - 60); const d60str = d60.toISOString().split('T')[0]

  const { data } = await db()
    .from('class_sessions')
    .select('student_id, status, attendance_status, scheduled_date')
    .in('student_id', studentIds)
    .gte('scheduled_date', sinceStr)
    .order('scheduled_date', { ascending: false })

  // Agrupar por estudiante (las sesiones ya vienen ordenadas desc)
  const byStudent = new Map<string, typeof data>()
  for (const session of data ?? []) {
    const arr = byStudent.get(session.student_id) ?? []
    arr.push(session)
    byStudent.set(session.student_id, arr)
  }

  for (const [studentId, sessions] of byStudent) {
    const item = signals.get(studentId)
    if (!item) continue

    let consecutiveNoShows = 0
    let streakDone = false

    for (const session of sessions) {
      // Racha de no_shows al inicio (más recientes)
      if (!streakDone) {
        if (session.status === 'no_show') consecutiveNoShows++
        else streakDone = true
      }

      if (session.status === 'completed') {
        item.completedRecent++
        if (!item.lastCompletedDate) item.lastCompletedDate = session.scheduled_date
      }
      if (session.status === 'cancelled') item.cancelledRecent++
      if (session.status === 'no_show') {
        item.noShowRecent++
        if (session.scheduled_date >= d30str) item.noShows30d++
        if (session.scheduled_date >= d60str) item.noShows60d++
      }
      if (session.attendance_status === 'no_response' && session.scheduled_date >= d30str) {
        item.noResponse30d++
      }
      if (session.scheduled_date >= today && !['cancelled', 'rescheduled', 'no_show'].includes(session.status)) {
        item.upcoming++
      }
    }

    item.consecutiveNoShows = consecutiveNoShows
  }

  return signals
}

function buildAlert(student: { id: string; name: string }, status: StudentLifecycleStatus, days: number) {
  const config: Record<StudentLifecycleStatus, { severity: Severity; title: string; message: string } | null> = {
    lead: null,
    matriculado: null,
    activo: null,
    riesgo: {
      severity: 'warning',
      title: `${student.name} lleva mas de 30 dias sin actividad`,
      message: 'Activar seguimiento preventivo antes de que abandone el proceso.',
    },
    inactivo: {
      severity: 'critical',
      title: `${student.name} lleva mas de 60 dias sin actividad`,
      message: 'Priorizar contacto comercial y propuesta de reactivacion.',
    },
    exalumno: {
      severity: 'info',
      title: `${student.name} cumple perfil de exalumno`,
      message: 'Preparar campana de recuperacion para retomar su proceso musical.',
    },
  }

  const item = config[status]
  if (!item) return null

  return {
    student_id: student.id,
    alert_type: status === 'exalumno' ? 'exstudent_90_days' : status === 'inactivo' ? 'inactive_60_days' : 'risk_30_days',
    severity: item.severity,
    title: item.title,
    message: item.message,
  }
}

function buildTask(student: { id: string; name: string }, status: StudentLifecycleStatus) {
  if (!['riesgo', 'inactivo', 'exalumno'].includes(status)) return null

  const priority: TaskPriority = status === 'riesgo' ? 'medium' : status === 'inactivo' ? 'high' : 'medium'
  return {
    student_id: student.id,
    task_type: `reactivation_${status}`,
    priority,
    title: `Seguimiento a ${student.name}`,
    description: `Estado actual: ${LIFECYCLE_LABEL[status]}. Registrar contacto, observacion y siguiente paso.`,
    due_at: addDays(status === 'riesgo' ? 3 : 1),
  }
}

function buildCampaignDraft(student: { id: string; name: string }, status: StudentLifecycleStatus) {
  if (status === 'riesgo') {
    return {
      student_id: student.id,
      channel: 'email' as const,
      campaign_key: 'risk_30d',
      subject: 'Te extranamos en 4U Studio Academy',
      body: 'Tu proceso musical sigue vivo. Agenda una clase y vuelve a conectar con tu talento.',
    }
  }
  if (status === 'inactivo') {
    return {
      student_id: student.id,
      channel: 'whatsapp' as const,
      campaign_key: 'inactive_60d',
      subject: 'Tu proceso musical sigue esperandote',
      body: 'Queremos ayudarte a retomar clases con un horario que se ajuste a ti.',
    }
  }
  if (status === 'exalumno') {
    return {
      student_id: student.id,
      channel: 'email' as const,
      campaign_key: 'alumni_90d',
      subject: 'Vuelve a estudiar con nosotros',
      body: 'Retoma tu proceso musical en 4U Studio Academy y continua donde lo dejaste.',
    }
  }
  return null
}

export async function runRetentionDailyJob(options: { dryRun?: boolean } = {}): Promise<RetentionPreview> {
  const dryRun = !!options.dryRun
  const generatedAt = isoNow()

  const { data: students, error } = await db()
    .from('students')
    .select('id, name, email, phone, student_status, last_activity_at, student_since, enrolled_at, retention_score, archived_at')
    .is('archived_at', null)

  if (error) throw new Error(error.message)

  const list = (students ?? []) as Array<{
    id: string
    name: string
    email: string | null
    phone: string | null
    student_status: StudentLifecycleStatus | null
    last_activity_at: string | null
    student_since: string | null
    enrolled_at: string | null
    retention_score: number | null
  }>

  const signals = await getSessionSignals(list.map((s) => s.id))

  const preview: RetentionPreview = {
    dryRun,
    generatedAt,
    studentsReviewed: list.length,
    summary: { statusChanges: 0, alerts: 0, tasks: 0, campaignDrafts: 0 },
    statusChanges: [],
    alerts: [],
    tasks: [],
    campaignDrafts: [],
  }

  for (const student of list) {
    const signal = signals.get(student.id) ?? {
      completedRecent: 0, cancelledRecent: 0, noShowRecent: 0,
      noShows30d: 0, noShows60d: 0, noResponse30d: 0,
      upcoming: 0, lastCompletedDate: null, consecutiveNoShows: 0,
    }
    // Fuente de verdad: última clase completada, luego last_activity_at, luego matricula
    const activityDate = signal.lastCompletedDate ?? student.last_activity_at ?? student.student_since ?? student.enrolled_at
    const days = daysSince(activityDate)
    const nextStatus = computeLifecycle(student.student_status, days)
    const score = computeRetentionScore({ days, ...signal })

    if (nextStatus !== student.student_status || score !== student.retention_score) {
      preview.statusChanges.push({
        student_id: student.id,
        name: student.name,
        from: student.student_status,
        to: nextStatus,
        daysSinceActivity: days,
        retentionScore: score,
      })
    }

    const alert = buildAlert(student, nextStatus, days)
    if (alert) preview.alerts.push(alert)

    const task = buildTask(student, nextStatus)
    if (task) preview.tasks.push(task)

    const campaign = buildCampaignDraft(student, nextStatus)
    if (campaign) preview.campaignDrafts.push(campaign)
  }

  preview.summary = {
    statusChanges: preview.statusChanges.length,
    alerts: preview.alerts.length,
    tasks: preview.tasks.length,
    campaignDrafts: preview.campaignDrafts.length,
  }

  if (dryRun) return preview

  // Actualizar todos los estudiantes con nuevos campos (score, risk_reason, risk_level, last_completed_class_at)
  for (const student of list) {
    const signal = signals.get(student.id) ?? {
      completedRecent: 0, cancelledRecent: 0, noShowRecent: 0,
      noShows30d: 0, noShows60d: 0, noResponse30d: 0,
      upcoming: 0, lastCompletedDate: null, consecutiveNoShows: 0,
    }
    const activityDate = signal.lastCompletedDate ?? student.last_activity_at ?? student.student_since ?? student.enrolled_at
    const days = daysSince(activityDate)
    const nextStatus = computeLifecycle(student.student_status, days)
    const score = computeRetentionScore({ days, ...signal })
    const riskReason = computeRiskReason(signal, days, nextStatus)
    const riskLevel = computeRiskLevel(score)

    const statusChanged = nextStatus !== student.student_status

    await db()
      .from('students')
      .update({
        student_status: nextStatus,
        retention_score: score,
        risk_level: riskLevel,
        risk_reason: riskReason,
        last_completed_class_at: signal.lastCompletedDate ?? undefined,
        ...(signal.lastCompletedDate ? { last_activity_at: new Date(signal.lastCompletedDate + 'T12:00:00').toISOString() } : {}),
        updated_at: isoNow(),
      })
      .eq('id', student.id)

    if (statusChanged) {
      await db().from('student_status_history').insert({
        student_id: student.id,
        old_status: student.student_status,
        new_status: nextStatus,
        reason: riskReason,
        days_inactive: days,
        retention_score: score,
      })
      await safeRecordStudentActivity(student.id, 'status_changed', `Estado actualizado a ${LIFECYCLE_LABEL[nextStatus]}`, {
        from: student.student_status,
        to: nextStatus,
        daysSinceActivity: days,
        retentionScore: score,
      })
    }
  }

  // Snapshot diario
  const counts = list.reduce(
    (acc, s) => {
      const signal = signals.get(s.id) ?? { lastCompletedDate: null, completedRecent: 0, cancelledRecent: 0, noShowRecent: 0, noShows30d: 0, noShows60d: 0, noResponse30d: 0, upcoming: 0, consecutiveNoShows: 0 }
      const days = daysSince(signal.lastCompletedDate ?? s.last_activity_at ?? s.student_since ?? s.enrolled_at)
      const st = computeLifecycle(s.student_status, days)
      acc[st] = (acc[st] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  const totalNonEx = (counts.activo ?? 0) + (counts.riesgo ?? 0) + (counts.inactivo ?? 0) + (counts.exalumno ?? 0)
  const reactivatedMonth = list.filter((s) => {
    const r = (s as any).reactivated_at
    return r && new Date(r) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  }).length

  await db().from('retention_snapshots').upsert({
    snapshot_date: new Date().toISOString().split('T')[0],
    total_activo:  counts.activo  ?? 0,
    total_riesgo:  counts.riesgo  ?? 0,
    total_inactivo: counts.inactivo ?? 0,
    total_exalumno: counts.exalumno ?? 0,
    total_reactivated_month: reactivatedMonth,
    retention_rate:     totalNonEx ? Math.round((counts.activo ?? 0) / totalNonEx * 1000) / 10 : null,
    churn_rate:         totalNonEx ? Math.round((counts.exalumno ?? 0) / totalNonEx * 1000) / 10 : null,
    reactivation_rate:  totalNonEx ? Math.round(reactivatedMonth / totalNonEx * 1000) / 10 : null,
  }, { onConflict: 'snapshot_date' })

  if (preview.alerts.length > 0) {
    const { data: openAlerts } = await db()
      .from('retention_alerts')
      .select('student_id, alert_type, status')
      .eq('status', 'open')
      .in('student_id', preview.alerts.map((a) => a.student_id))

    const existing = new Set((openAlerts ?? []).map((a: any) => `${a.student_id}:${a.alert_type}`))
    const inserts = preview.alerts
      .filter((a) => !existing.has(`${a.student_id}:${a.alert_type}`))
      .map((a) => ({ ...a, status: 'open' }))

    if (inserts.length) await db().from('retention_alerts').insert(inserts)
  }

  if (preview.tasks.length > 0) {
    const { data: pendingTasks } = await db()
      .from('reactivation_tasks')
      .select('student_id, task_type, status')
      .eq('status', 'pending')
      .in('student_id', preview.tasks.map((t) => t.student_id))

    const existing = new Set((pendingTasks ?? []).map((t: any) => `${t.student_id}:${t.task_type}`))
    const inserts = preview.tasks
      .filter((t) => !existing.has(`${t.student_id}:${t.task_type}`))
      .map((t) => ({ ...t, status: 'pending' }))

    if (inserts.length) await db().from('reactivation_tasks').insert(inserts)
  }

  if (preview.campaignDrafts.length > 0) {
    const { data: drafts } = await db()
      .from('campaign_messages')
      .select('student_id, campaign_key, channel')
      .in('student_id', preview.campaignDrafts.map((c) => c.student_id))

    const existing = new Set((drafts ?? []).map((c: any) => `${c.student_id}:${c.campaign_key}:${c.channel}`))
    const inserts = preview.campaignDrafts
      .filter((c) => !existing.has(`${c.student_id}:${c.campaign_key}:${c.channel}`))
      .map((c) => ({ ...c, status: 'draft', scheduled_for: null }))

    if (inserts.length) await db().from('campaign_messages').insert(inserts)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/reactivacion')
  revalidatePath('/admin/students')
  return preview
}

export async function runRetentionPreviewAction(): Promise<{ error?: string; preview?: RetentionPreview }> {
  try {
    return { preview: await runRetentionDailyJob({ dryRun: true }) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No se pudo simular el job diario.' }
  }
}

export async function getRetentionDashboardData() {
  try {
    const [{ data: dashboard }, { data: highRisk }, { data: alerts }, { data: students }] = await Promise.all([
      db().from('v_retention_dashboard').select('*').maybeSingle(),
      db().from('v_high_risk_students').select('*').limit(8),
      db().from('retention_alerts').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(6),
      db()
        .from('v_retention_students')
        .select('*')
        .or('student_status.in.(riesgo,inactivo,exalumno),retention_score.lte.55,upcoming_classes.eq.0')
        .order('retention_score', { ascending: true })
        .limit(80),
    ])

    return {
      dashboard: dashboard ?? null,
      highRisk: highRisk ?? [],
      alerts: alerts ?? [],
      students: students ?? [],
      migrationMissing: false,
    }
  } catch (error) {
    return {
      dashboard: null,
      highRisk: [],
      alerts: [],
      students: [],
      migrationMissing: error instanceof Error ? error.message : 'Migracion pendiente',
    }
  }
}

export async function getStudentRetentionProfile(studentId: string) {
  try {
    const [{ data: events }, { data: notes }, { data: instruments }, { data: tasks }] = await Promise.all([
      db().from('student_activity_events').select('*').eq('student_id', studentId).order('occurred_at', { ascending: false }).limit(30),
      db().from('student_admin_notes').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(20),
      db().from('v_student_instruments_history').select('*').eq('student_id', studentId).order('last_session_at', { ascending: false }),
      db().from('reactivation_tasks').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(10),
    ])

    return {
      events: events ?? [],
      notes: notes ?? [],
      instruments: instruments ?? [],
      tasks: tasks ?? [],
      migrationMissing: false,
    }
  } catch (error) {
    return {
      events: [],
      notes: [],
      instruments: [],
      tasks: [],
      migrationMissing: error instanceof Error ? error.message : 'Migracion pendiente',
    }
  }
}

export async function recordStudentFollowUpAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const student_id = formData.get('student_id') as string
  const note = (formData.get('note') as string | null)?.trim()
  const outcome = (formData.get('outcome') as string | null)?.trim() || null
  const follow_up_at = (formData.get('follow_up_at') as string | null)?.trim() || null

  if (!student_id || !note) return { error: 'Escribe una observacion para guardar el seguimiento.' }

  const { error } = await db().from('student_admin_notes').insert({
    student_id,
    note,
    outcome,
    follow_up_at: follow_up_at || null,
  })

  if (error) return { error: error.message }

  await safeRecordStudentActivity(student_id, 'follow_up', note, { outcome, follow_up_at })
  revalidatePath('/admin/reactivacion')
  revalidatePath(`/admin/students/${student_id}`)
  return { success: true }
}

export async function recordPhoneCallAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const student_id = formData.get('student_id') as string
  const note = (formData.get('note') as string | null)?.trim() || 'Llamada registrada desde administración.'
  if (!student_id) return { error: 'ID de estudiante requerido.' }

  await safeRecordStudentActivity(student_id, 'phone_call', note, { channel: 'phone' })
  revalidatePath('/admin/reactivacion')
  revalidatePath(`/admin/students/${student_id}`)
  return { success: true }
}

export async function markStudentReactivatedAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const student_id = formData.get('student_id') as string
  if (!student_id) return { error: 'ID de estudiante requerido.' }

  const now = isoNow()
  const { error } = await db()
    .from('students')
    .update({
      student_status: 'activo',
      last_activity_at: now,
      reactivated_at: now,
      retention_score: 85,
    })
    .eq('id', student_id)

  if (error) return { error: error.message }

  await db()
    .from('reactivation_tasks')
    .update({ status: 'done', completed_at: now })
    .eq('student_id', student_id)
    .eq('status', 'pending')

  await safeRecordStudentActivity(student_id, 'reactivated', 'Alumno marcado como reactivado desde administracion.')
  revalidatePath('/admin/reactivacion')
  revalidatePath(`/admin/students/${student_id}`)
  return { success: true }
}

export async function getRetentionStats() {
  try {
    const [{ data: bySource }, { data: byInstructor }, { data: byInstrument }] = await Promise.all([
      db().from('v_retention_by_source').select('*'),
      db().from('v_retention_by_instructor').select('*'),
      db().from('v_retention_by_instrument').select('*'),
    ])
    return { bySource: bySource ?? [], byInstructor: byInstructor ?? [], byInstrument: byInstrument ?? [] }
  } catch {
    return { bySource: [], byInstructor: [], byInstrument: [] }
  }
}

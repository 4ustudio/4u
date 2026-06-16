'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity, type ActivityAction } from '@/lib/activity'

export type AutomationJobType =
  | 'class_reminder_24h'
  | 'class_reminder_2h'
  | 'payment_due_tomorrow'
  | 'payment_overdue_3d'
  | 'payment_overdue_7d'
  | 'attendance_risk'
  | 'low_attendance_risk'
  | 'high_risk_student'

export type AutomationJobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface AutomationJob {
  id: string
  type: AutomationJobType
  status: AutomationJobStatus
  payload: Record<string, unknown>
  scheduled_for: string
  processed_at: string | null
  error: string | null
  created_at: string
}

export type AutomationCategory = 'clases' | 'pagos' | 'retencion' | 'sistema'

const JOB_CATEGORY: Record<AutomationJobType, AutomationCategory> = {
  class_reminder_24h:   'clases',
  class_reminder_2h:    'clases',
  payment_due_tomorrow: 'pagos',
  payment_overdue_3d:   'pagos',
  payment_overdue_7d:   'pagos',
  attendance_risk:      'retencion',
  low_attendance_risk:  'retencion',
  high_risk_student:    'retencion',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toDateStr(d: Date) { return d.toISOString().split('T')[0] }

// Evita duplicados: solo crea job si no existe uno pending/processing del mismo tipo+payload hoy
async function upsertJob(type: AutomationJobType, payload: Record<string, unknown>) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Buscar referencia en payload para deduplicar (student_id o payment_id + tipo)
  const refKey = payload.payment_id ?? payload.student_id ?? payload.session_id ?? null

  if (refKey) {
    const { data: existing } = await db()
      .from('automation_jobs')
      .select('id')
      .eq('type', type)
      .gte('created_at', todayStart.toISOString())
      .contains('payload', { ...(payload.payment_id ? { payment_id: refKey } : payload.student_id ? { student_id: refKey } : { session_id: refKey }) })
      .in('status', ['pending', 'processing'])
      .maybeSingle()

    if (existing) return null
  }

  const { data } = await db().from('automation_jobs').insert({ type, payload }).select('id').single()
  return data?.id ?? null
}

// ── Reglas: Recordatorios de Clase ───────────────────────────────────────────

async function runClassReminders(now: Date): Promise<number> {
  let created = 0

  const tomorrow = toDateStr(addDays(now, 1))
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  // 24h — sesiones de mañana sin recordatorio
  const { data: sessions24h } = await db()
    .from('class_sessions')
    .select('id, student_id, scheduled_date, start_time, student:students(name, phone), classroom:classrooms(name)')
    .eq('scheduled_date', tomorrow)
    .eq('attendance_status', 'scheduled')
    .is('attendance_reminder_sent_at', null)

  for (const s of sessions24h ?? []) {
    const student = Array.isArray(s.student) ? s.student[0] : s.student
    const classroom = Array.isArray(s.classroom) ? s.classroom[0] : s.classroom
    const id = await upsertJob('class_reminder_24h', {
      session_id:   s.id,
      student_id:   s.student_id,
      student_name: student?.name ?? '',
      student_phone: student?.phone ?? '',
      date:         s.scheduled_date,
      time:         s.start_time,
      salon:        classroom?.name ?? '',
    })
    if (id) created++
  }

  // 2h — sesiones de hoy que empiezan en ~2h sin segundo recordatorio
  const todayStr = toDateStr(now)
  const windowStart = twoHoursLater.toTimeString().slice(0, 5)
  const windowEnd   = new Date(twoHoursLater.getTime() + 15 * 60 * 1000).toTimeString().slice(0, 5)

  const { data: sessions2h } = await db()
    .from('class_sessions')
    .select('id, student_id, scheduled_date, start_time, student:students(name, phone), classroom:classrooms(name)')
    .eq('scheduled_date', todayStr)
    .eq('attendance_status', 'scheduled')
    .is('second_reminder_sent_at', null)
    .gte('start_time', windowStart)
    .lte('start_time', windowEnd)

  for (const s of sessions2h ?? []) {
    const student = Array.isArray(s.student) ? s.student[0] : s.student
    const classroom = Array.isArray(s.classroom) ? s.classroom[0] : s.classroom
    const id = await upsertJob('class_reminder_2h', {
      session_id:    s.id,
      student_id:    s.student_id,
      student_name:  student?.name ?? '',
      student_phone: student?.phone ?? '',
      date:          s.scheduled_date,
      time:          s.start_time,
      salon:         classroom?.name ?? '',
    })
    if (id) created++
  }

  return created
}

// ── Reglas: Cobranza ──────────────────────────────────────────────────────────

async function runPaymentRules(now: Date): Promise<number> {
  let created = 0

  const tomorrow = toDateStr(addDays(now, 1))
  const minus3   = toDateStr(addDays(now, -3))
  const minus7   = toDateStr(addDays(now, -7))

  // Pago vence mañana
  const { data: dueTomorrow } = await db()
    .from('payments')
    .select('id, student_id, due_date, final_amount, currency, student:students(name, phone)')
    .eq('due_date', tomorrow)
    .in('status', ['pending', 'overdue'])

  for (const p of dueTomorrow ?? []) {
    const student = Array.isArray(p.student) ? p.student[0] : p.student
    const id = await upsertJob('payment_due_tomorrow', {
      payment_id:    p.id,
      student_id:    p.student_id,
      student_name:  student?.name ?? '',
      student_phone: student?.phone ?? '',
      amount:        p.final_amount,
      currency:      p.currency,
      due_date:      p.due_date,
    })
    if (id) created++
  }

  // Pago vencido 3 días
  const { data: overdue3 } = await db()
    .from('payments')
    .select('id, student_id, due_date, final_amount, currency, student:students(name, phone)')
    .eq('due_date', minus3)
    .in('status', ['pending', 'overdue'])

  for (const p of overdue3 ?? []) {
    const student = Array.isArray(p.student) ? p.student[0] : p.student
    const id = await upsertJob('payment_overdue_3d', {
      payment_id:    p.id,
      student_id:    p.student_id,
      student_name:  student?.name ?? '',
      student_phone: student?.phone ?? '',
      amount:        p.final_amount,
      currency:      p.currency,
      due_date:      p.due_date,
    })
    if (id) created++
  }

  // Pago vencido 7 días
  const { data: overdue7 } = await db()
    .from('payments')
    .select('id, student_id, due_date, final_amount, currency, student:students(name, phone)')
    .eq('due_date', minus7)
    .in('status', ['pending', 'overdue'])

  for (const p of overdue7 ?? []) {
    const student = Array.isArray(p.student) ? p.student[0] : p.student
    const id = await upsertJob('payment_overdue_7d', {
      payment_id:    p.id,
      student_id:    p.student_id,
      student_name:  student?.name ?? '',
      student_phone: student?.phone ?? '',
      amount:        p.final_amount,
      currency:      p.currency,
      due_date:      p.due_date,
    })
    if (id) created++
  }

  return created
}

// ── Reglas: Retención ─────────────────────────────────────────────────────────

async function runRetentionRules(now: Date): Promise<number> {
  let created = 0
  const todayStr = toDateStr(now)

  // Estudiantes activos con datos de riesgo
  const { data: students } = await db()
    .from('students')
    .select('id, name, phone, risk_level, retention_score, last_activity_at')
    .eq('student_status', 'active')
    .not('risk_level', 'is', null)

  for (const s of students ?? []) {
    // HIGH risk
    if (s.risk_level === 'high') {
      const id = await upsertJob('high_risk_student', {
        student_id:      s.id,
        student_name:    s.name,
        student_phone:   s.phone,
        risk_level:      s.risk_level,
        retention_score: s.retention_score,
        date:            todayStr,
      })
      if (id) created++
    }
  }

  // 3 ausencias consecutivas + asistencia < 50% → buscar en class_sessions
  const thirtyDaysAgo = toDateStr(addDays(now, -30))
  const { data: sessions } = await db()
    .from('class_sessions')
    .select('student_id, attendance_status, scheduled_date')
    .gte('scheduled_date', thirtyDaysAgo)
    .lte('scheduled_date', todayStr)
    .in('attendance_status', ['scheduled', 'no_show', 'confirmed'])
    .order('student_id')
    .order('scheduled_date', { ascending: true })

  if (sessions && sessions.length > 0) {
    // Agrupar por student_id
    const byStudent: Record<string, typeof sessions> = {}
    for (const row of sessions) {
      if (!byStudent[row.student_id]) byStudent[row.student_id] = []
      byStudent[row.student_id].push(row)
    }

    for (const [studentId, rows] of Object.entries(byStudent)) {
      const total = rows.length
      const attended = rows.filter(r => r.attendance_status === 'confirmed').length
      const attendancePct = total > 0 ? attended / total : 1

      // 3 ausencias consecutivas al final
      const last3 = rows.slice(-3)
      const consecutiveAbsences = last3.filter(r => r.attendance_status === 'no_show').length

      if (consecutiveAbsences >= 3) {
        const student = students?.find(s => s.id === studentId)
        const id = await upsertJob('attendance_risk', {
          student_id:            studentId,
          student_name:          student?.name ?? '',
          student_phone:         student?.phone ?? '',
          consecutive_absences:  consecutiveAbsences,
          date:                  todayStr,
        })
        if (id) created++
      } else if (attendancePct < 0.5 && total >= 4) {
        const student = students?.find(s => s.id === studentId)
        const id = await upsertJob('low_attendance_risk', {
          student_id:      studentId,
          student_name:    student?.name ?? '',
          student_phone:   student?.phone ?? '',
          attendance_pct:  Math.round(attendancePct * 100),
          total_sessions:  total,
          attended,
          date:            todayStr,
        })
        if (id) created++
      }
    }
  }

  return created
}

// ── Runner principal ──────────────────────────────────────────────────────────

export interface RunResult {
  ran_at: string
  jobs_created: number
  breakdown: { class_reminders: number; payment_rules: number; retention_rules: number }
  error?: string
}

export async function runAutomationRules(): Promise<RunResult> {
  const now = new Date()
  const result: RunResult = {
    ran_at: now.toISOString(),
    jobs_created: 0,
    breakdown: { class_reminders: 0, payment_rules: 0, retention_rules: 0 },
  }

  try {
    const [classCount, paymentCount, retentionCount] = await Promise.all([
      runClassReminders(now),
      runPaymentRules(now),
      runRetentionRules(now),
    ])

    result.breakdown.class_reminders  = classCount
    result.breakdown.payment_rules    = paymentCount
    result.breakdown.retention_rules  = retentionCount
    result.jobs_created = classCount + paymentCount + retentionCount

    await logActivity({
      action:           'automation.rules_ran' as ActivityAction,
      entity_type:      'student' as const,
      description:      `Motor de automatizaciones: ${result.jobs_created} jobs creados`,
      metadata:         result as unknown as Record<string, unknown>,
      created_by_system: true,
    })
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err)
  }

  return result
}

// ── Queries para dashboard ────────────────────────────────────────────────────

export async function getAutomationJobs(
  statusFilter: AutomationJobStatus | 'all' = 'all',
  categoryFilter: AutomationCategory | 'all' = 'all',
  limit = 100
): Promise<AutomationJob[]> {
  let query = db()
    .from('automation_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  if (categoryFilter !== 'all') {
    const types = Object.entries(JOB_CATEGORY)
      .filter(([, cat]) => cat === categoryFilter)
      .map(([type]) => type)
    query = query.in('type', types)
  }

  const { data } = await query
  return (data ?? []) as AutomationJob[]
}

export async function getAutomationMetrics() {
  const { data: counts } = await db()
    .from('automation_jobs')
    .select('status')

  const metrics = {
    pending:   0,
    processing: 0,
    completed: 0,
    failed:    0,
    total:     0,
    avg_processing_ms: null as number | null,
  }

  for (const row of counts ?? []) {
    metrics[row.status as AutomationJobStatus]++
    metrics.total++
  }

  // Tiempo promedio (procesados hoy)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data: processed } = await db()
    .from('automation_jobs')
    .select('created_at, processed_at')
    .eq('status', 'completed')
    .gte('processed_at', today.toISOString())
    .not('processed_at', 'is', null)

  if (processed && processed.length > 0) {
    const totalMs = processed.reduce((acc, r) => {
      return acc + (new Date(r.processed_at!).getTime() - new Date(r.created_at).getTime())
    }, 0)
    metrics.avg_processing_ms = Math.round(totalMs / processed.length)
  }

  return metrics
}

export { JOB_CATEGORY }

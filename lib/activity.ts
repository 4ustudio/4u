import { createAdminClient } from '@/lib/supabase/admin'

// ── Tipos ─────────────────────────────────────────────────────────

export type ActivityAction =
  | 'enrollment.completed'
  | 'lead.created'
  | 'lead.converted'
  | 'payment.received'
  | 'payment.discount_applied'
  | 'payment.overdue'
  | 'payment.bold_link_created'
  | 'payment.bold_webhook_received'
  | 'payment.bold_webhook_failed'
  | 'session.created'
  | 'session.cancelled'
  | 'session.rescheduled'
  | 'attendance.confirmed'
  | 'attendance.no_show'
  | 'retention.status_changed'
  | 'student.reactivated'
  | 'student.profile_updated'
  | 'birthday.benefit_granted'
  | 'birthday.discount_used'
  | 'contract.signed'
  | 'whatsapp.opened'
  | 'whatsapp.payment_reminder'
  | 'whatsapp.birthday'
  | 'whatsapp.reactivation'

export type EntityType =
  | 'enrollment'
  | 'lead'
  | 'payment'
  | 'session'
  | 'student'
  | 'attendance'
  | 'retention'

export type Severity = 'info' | 'warning' | 'critical'

const SEVERITY_BY_ACTION: Partial<Record<ActivityAction, Severity>> = {
  'attendance.no_show':       'warning',
  'session.cancelled':        'warning',
  'session.rescheduled':      'warning',
  'retention.status_changed': 'warning',
  'payment.overdue':               'warning',
  'payment.bold_webhook_failed':   'warning',
}

export interface LogActivityInput {
  actor_user_id?: string
  actor_name?: string
  actor_role?: string
  entity_type: EntityType
  entity_id?: string
  action: ActivityAction
  description?: string
  metadata?: Record<string, unknown>
  source?: string
  old_data?: Record<string, unknown>
  new_data?: Record<string, unknown>
  created_by_system?: boolean
  severity?: Severity
}

// ── Core ──────────────────────────────────────────────────────────

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any
    const severity = input.severity ?? SEVERITY_BY_ACTION[input.action] ?? 'info'
    await supabase.from('system_activity_log').insert({
      ...input,
      severity,
      created_by_system: input.created_by_system ?? false,
    })
  } catch {
    console.error('[logActivity] Error registrando actividad:', input.action)
  }
}

// ── Wrappers por dominio ──────────────────────────────────────────

export const activity = {

  // Leads
  async leadCreated(params: {
    lead_id: string
    lead_name: string
    instrument?: string
    actor_name?: string
    actor_user_id?: string
    actor_role?: string
    source?: string
    created_by_system?: boolean
  }) {
    return logActivity({
      entity_type: 'lead',
      entity_id: params.lead_id,
      action: 'lead.created',
      description: `Nuevo lead: ${params.lead_name}${params.instrument ? ` — ${params.instrument}` : ''}`,
      source: params.source ?? 'web',
      actor_name: params.actor_name,
      actor_user_id: params.actor_user_id,
      actor_role: params.actor_role,
      new_data: { name: params.lead_name, instrument: params.instrument },
      created_by_system: !params.actor_user_id,
    })
  },

  async leadConverted(params: {
    lead_id: string
    lead_name: string
    student_id?: string
    actor_name?: string
    actor_user_id?: string
    actor_role?: string
    source?: string
    created_by_system?: boolean
  }) {
    return logActivity({
      entity_type: 'lead',
      entity_id: params.lead_id,
      action: 'lead.converted',
      description: `Lead convertido a estudiante: ${params.lead_name}`,
      source: params.source ?? 'admin',
      actor_name: params.actor_name,
      actor_user_id: params.actor_user_id,
      actor_role: params.actor_role,
      created_by_system: params.created_by_system,
      new_data: { student_id: params.student_id },
    })
  },

  // Inscripciones
  async enrollmentCompleted(params: {
    enrollment_id: string
    student_name: string
    instrument?: string
    plan?: string
    actor_name?: string
    actor_user_id?: string
    actor_role?: string
    source?: string
    created_by_system?: boolean
  }) {
    return logActivity({
      entity_type: 'enrollment',
      entity_id: params.enrollment_id,
      action: 'enrollment.completed',
      description: `Inscripción completada: ${params.student_name}${params.instrument ? ` — ${params.instrument}` : ''}`,
      source: params.source ?? 'admin',
      actor_name: params.actor_name,
      actor_user_id: params.actor_user_id,
      actor_role: params.actor_role,
      created_by_system: params.created_by_system,
      new_data: { instrument: params.instrument, plan: params.plan },
    })
  },

  // Pagos
  async paymentReceived(params: {
    payment_id: string
    student_name: string
    amount: number
    currency?: string
    method?: string
    actor_name?: string
    actor_user_id?: string
    actor_role?: string
    source?: string
    created_by_system?: boolean
  }) {
    const currency = params.currency ?? 'COP'
    const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 })
    return logActivity({
      entity_type: 'payment',
      entity_id: params.payment_id,
      action: 'payment.received',
      description: `Pago recibido de ${params.student_name}: ${fmt.format(params.amount)}`,
      source: params.source ?? 'admin',
      actor_name: params.actor_name,
      actor_user_id: params.actor_user_id,
      actor_role: params.actor_role,
      created_by_system: params.created_by_system,
      new_data: { amount: params.amount, currency, method: params.method },
    })
  },

  async paymentDiscountApplied(params: {
    payment_id: string
    student_name: string
    discount_amount: number
    discount_reason?: string
    currency?: string
    actor_name?: string
    actor_user_id?: string
    actor_role?: string
    source?: string
    created_by_system?: boolean
  }) {
    const currency = params.currency ?? 'COP'
    const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 })
    return logActivity({
      entity_type: 'payment',
      entity_id: params.payment_id,
      action: 'payment.discount_applied',
      description: `Descuento aplicado a ${params.student_name}: ${fmt.format(params.discount_amount)}${params.discount_reason ? ` (${params.discount_reason})` : ''}`,
      source: params.source ?? 'admin',
      actor_name: params.actor_name,
      actor_user_id: params.actor_user_id,
      actor_role: params.actor_role,
      created_by_system: params.created_by_system,
      new_data: { discount_amount: params.discount_amount, reason: params.discount_reason },
    })
  },

  async paymentOverdue(params: {
    payment_id: string
    student_name: string
    period_year: number
    period_month: number
    final_amount: number
    currency?: string
    actor_name?: string
    actor_user_id?: string
    actor_role?: string
    source?: string
    created_by_system?: boolean
  }) {
    const currency = params.currency ?? 'COP'
    const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 })
    const period = new Date(params.period_year, params.period_month - 1, 1)
      .toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    return logActivity({
      entity_type: 'payment',
      entity_id: params.payment_id,
      action: 'payment.overdue',
      description: `Pago vencido — ${params.student_name} · ${period} · ${fmt.format(params.final_amount)}`,
      source: params.source ?? 'admin',
      actor_name: params.actor_name,
      actor_user_id: params.actor_user_id,
      actor_role: params.actor_role,
      created_by_system: params.created_by_system ?? true,
      new_data: { period_year: params.period_year, period_month: params.period_month, amount: params.final_amount },
    })
  },

  // Sesiones / Clases
  async sessionCreated(params: {
    session_id: string
    instructor_name: string
    student_name?: string
    scheduled_at?: string
    actor_name?: string
    actor_user_id?: string
    actor_role?: string
    source?: string
    created_by_system?: boolean
  }) {
    return logActivity({
      entity_type: 'session',
      entity_id: params.session_id,
      action: 'session.created',
      description: `Clase creada con ${params.instructor_name}${params.student_name ? ` para ${params.student_name}` : ''}`,
      source: params.source ?? 'admin',
      actor_name: params.actor_name,
      actor_user_id: params.actor_user_id,
      actor_role: params.actor_role,
      created_by_system: params.created_by_system,
      new_data: { scheduled_at: params.scheduled_at },
    })
  },

  async sessionCancelled(params: {
    session_id: string
    instructor_name?: string
    student_name?: string
    reason?: string
    scheduled_at?: string
    actor_name?: string
    actor_user_id?: string
    actor_role?: string
    source?: string
    created_by_system?: boolean
  }) {
    return logActivity({
      entity_type: 'session',
      entity_id: params.session_id,
      action: 'session.cancelled',
      description: `Clase cancelada${params.student_name ? ` — ${params.student_name}` : ''}${params.reason ? `: ${params.reason}` : ''}`,
      source: params.source ?? 'admin',
      actor_name: params.actor_name,
      actor_user_id: params.actor_user_id,
      actor_role: params.actor_role,
      created_by_system: params.created_by_system,
      old_data: { scheduled_at: params.scheduled_at },
      new_data: { reason: params.reason },
    })
  },

  async sessionRescheduled(params: {
    session_id: string
    instructor_name?: string
    old_time?: string
    new_time?: string
    actor_name?: string
    actor_user_id?: string
    actor_role?: string
    source?: string
    created_by_system?: boolean
  }) {
    return logActivity({
      entity_type: 'session',
      entity_id: params.session_id,
      action: 'session.rescheduled',
      description: `Horario cambiado${params.instructor_name ? ` — ${params.instructor_name}` : ''}`,
      source: params.source ?? 'admin',
      actor_name: params.actor_name,
      actor_user_id: params.actor_user_id,
      actor_role: params.actor_role,
      created_by_system: params.created_by_system,
      old_data: { scheduled_at: params.old_time },
      new_data: { scheduled_at: params.new_time },
    })
  },

  // Asistencia
  async attendanceConfirmed(params: {
    session_id: string
    student_name: string
    actor_name?: string
    actor_user_id?: string
    actor_role?: string
    source?: string
    created_by_system?: boolean
  }) {
    return logActivity({
      entity_type: 'attendance',
      entity_id: params.session_id,
      action: 'attendance.confirmed',
      description: `Asistencia confirmada: ${params.student_name}`,
      source: params.source ?? 'admin',
      actor_name: params.actor_name,
      actor_user_id: params.actor_user_id,
      actor_role: params.actor_role,
      created_by_system: params.created_by_system,
    })
  },

  async attendanceNoShow(params: {
    session_id: string
    student_name: string
    actor_name?: string
    actor_user_id?: string
    actor_role?: string
    source?: string
    created_by_system?: boolean
  }) {
    return logActivity({
      entity_type: 'attendance',
      entity_id: params.session_id,
      action: 'attendance.no_show',
      description: `No show: ${params.student_name}`,
      source: params.source ?? 'admin',
      actor_name: params.actor_name,
      actor_user_id: params.actor_user_id,
      actor_role: params.actor_role,
      created_by_system: params.created_by_system,
    })
  },

  // Retención
  async retentionStatusChanged(params: {
    student_id: string
    student_name: string
    old_status?: string
    new_status: string
    actor_name?: string
    actor_user_id?: string
    actor_role?: string
    source?: string
    created_by_system?: boolean
  }) {
    return logActivity({
      entity_type: 'retention',
      entity_id: params.student_id,
      action: 'retention.status_changed',
      description: `Estado de retención cambiado: ${params.student_name} → ${params.new_status}`,
      source: params.source ?? 'admin',
      actor_name: params.actor_name,
      actor_user_id: params.actor_user_id,
      actor_role: params.actor_role,
      created_by_system: params.created_by_system,
      old_data: { status: params.old_status },
      new_data: { status: params.new_status },
    })
  },

  async whatsappOpened(params: {
    entity_type:   'student' | 'lead' | 'payment' | 'retention'
    entity_id:     string
    contact_name:  string
    template:      string
    action?:       ActivityAction
    actor_name?:   string
    actor_user_id?: string
    actor_role?:   string
    source?:       string
  }) {
    const action = params.action ?? 'whatsapp.opened'
    return logActivity({
      entity_type:   params.entity_type,
      entity_id:     params.entity_id,
      action,
      description:   `WhatsApp abierto — ${params.contact_name} (${params.template})`,
      source:        params.source ?? 'admin',
      actor_name:    params.actor_name,
      actor_user_id: params.actor_user_id,
      actor_role:    params.actor_role,
      new_data:      { template: params.template, contact_name: params.contact_name },
    })
  },

  async studentReactivated(params: {
    student_id: string
    student_name: string
    actor_name?: string
    actor_user_id?: string
    actor_role?: string
    source?: string
    created_by_system?: boolean
  }) {
    return logActivity({
      entity_type: 'student',
      entity_id: params.student_id,
      action: 'student.reactivated',
      description: `Estudiante reactivado: ${params.student_name}`,
      source: params.source ?? 'admin',
      actor_name: params.actor_name,
      actor_user_id: params.actor_user_id,
      actor_role: params.actor_role,
      created_by_system: params.created_by_system,
    })
  },

  async contractSigned(params: {
    enrollment_id: string
    student_name:  string
    student_id?:   string
    document_version: string
    signed_at:     string
    document_hash?: string
  }) {
    return logActivity({
      entity_type: 'enrollment',
      entity_id:   params.enrollment_id,
      action:      'contract.signed',
      description: `Contrato firmado: ${params.student_name} — v${params.document_version}`,
      source:      'inscripcion',
      created_by_system: true,
      new_data: {
        student_id:       params.student_id,
        enrollment_id:    params.enrollment_id,
        document_version: params.document_version,
        signed_at:        params.signed_at,
        document_hash:    params.document_hash,
      },
    })
  },

  // Bold
  async boldLinkCreated(params: {
    payment_id: string
    student_name: string
    amount: number
    checkout_url?: string
    actor_name?: string
    actor_user_id?: string
    actor_role?: string
  }) {
    const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
    return logActivity({
      entity_type: 'payment',
      entity_id: params.payment_id,
      action: 'payment.bold_link_created',
      description: `Link Bold generado — ${params.student_name}: ${fmt.format(params.amount)}`,
      source: 'admin',
      actor_name: params.actor_name,
      actor_user_id: params.actor_user_id,
      actor_role: params.actor_role,
      new_data: { checkout_url: params.checkout_url, amount: params.amount },
    })
  },

  async boldWebhookReceived(params: {
    payment_id: string
    bold_event: string
    bold_payment_id?: string
    amount?: number
  }) {
    return logActivity({
      entity_type: 'payment',
      entity_id: params.payment_id,
      action: 'payment.bold_webhook_received',
      description: `Webhook Bold recibido: ${params.bold_event}${params.bold_payment_id ? ` — ${params.bold_payment_id}` : ''}`,
      source: 'bold_webhook',
      created_by_system: true,
      new_data: { event: params.bold_event, bold_payment_id: params.bold_payment_id, amount: params.amount },
    })
  },

  async boldWebhookFailed(params: {
    payment_id?: string
    reason: string
    bold_event?: string
  }) {
    return logActivity({
      entity_type: 'payment',
      entity_id: params.payment_id,
      action: 'payment.bold_webhook_failed',
      description: `Webhook Bold fallido: ${params.reason}${params.bold_event ? ` (${params.bold_event})` : ''}`,
      source: 'bold_webhook',
      created_by_system: true,
      severity: 'warning',
      new_data: { reason: params.reason, event: params.bold_event },
    })
  },

  async studentProfileUpdated(params: {
    student_id: string
    student_name: string
    changed_fields?: string[]
    old_data?: Record<string, unknown>
    new_data?: Record<string, unknown>
    actor_name?: string
    actor_user_id?: string
    actor_role?: string
    source?: string
    created_by_system?: boolean
  }) {
    return logActivity({
      entity_type: 'student',
      entity_id: params.student_id,
      action: 'student.profile_updated',
      description: `Perfil actualizado: ${params.student_name}${params.changed_fields?.length ? ` (${params.changed_fields.join(', ')})` : ''}`,
      source: params.source ?? 'admin',
      actor_name: params.actor_name,
      actor_user_id: params.actor_user_id,
      actor_role: params.actor_role,
      old_data: params.old_data,
      new_data: params.new_data,
    })
  },
}

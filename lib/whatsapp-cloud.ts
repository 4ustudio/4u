import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity, type EntityType } from '@/lib/activity'
import { normalizeColombianPhone } from '@/lib/whatsapp'
import type {
  SendTemplateOptions,
  SendTemplateResult,
  TemplateComponent,
  GraphSendResponse,
} from '@/types/whatsapp-cloud'

// ── Config ────────────────────────────────────────────────────────

const ENABLED       = process.env.WHATSAPP_CLOUD_ENABLED === 'true'
const PHONE_ID      = process.env.WHATSAPP_PHONE_NUMBER_ID ?? ''
const ACCESS_TOKEN  = process.env.WHATSAPP_ACCESS_TOKEN ?? ''
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION ?? 'v21.0'
const CORPORATE     = process.env.WHATSAPP_CORPORATE_PHONE ?? ''
const LANG          = 'es'

/** Nombres de plantillas aprobadas en Meta. No cambiar sin re-aprobar en WhatsApp Manager. */
export const TEMPLATES_META = {
  enrollment_received: 'enrollment_received',
  payment_confirmed:   'payment_confirmed',
  account_activated:   'account_activated',
  class_reminder:      'class_reminder',
  class_rescheduled:   'class_rescheduled',
  internal_alert:      'internal_alert',
} as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

function body(...values: string[]): TemplateComponent[] {
  return [{ type: 'body', parameters: values.map((text) => ({ type: 'text', text })) }]
}

// ── Núcleo ────────────────────────────────────────────────────────

/**
 * Envía un template message a la Graph API de Meta. Fire-and-forget — nunca lanza.
 * Idempotente por (entity_id, template): si ya se envió, no reenvía.
 * Registra en whatsapp_messages + system_activity_log.
 */
async function sendTemplate(opts: SendTemplateOptions): Promise<SendTemplateResult> {
  if (!ENABLED || !PHONE_ID || !ACCESS_TOKEN) return { ok: false, error: 'disabled' }

  const { entity_type, entity_id, event } = opts.context ?? {}

  // Idempotencia
  if (entity_id) {
    const { data: existing } = await db()
      .from('whatsapp_messages')
      .select('id')
      .eq('entity_id', entity_id)
      .eq('template', opts.template)
      .maybeSingle()
    if (existing) return { ok: true }
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: opts.to,
          type: 'template',
          template: {
            name: opts.template,
            language: { code: opts.languageCode ?? LANG },
            components: opts.components ?? [],
          },
        }),
        signal: AbortSignal.timeout(10000),
      },
    )

    const json = (await res.json().catch(() => ({}))) as GraphSendResponse

    if (!res.ok || json.error) {
      throw new Error(json.error?.message ?? `HTTP ${res.status}`)
    }

    const wamid = json.messages?.[0]?.id

    await db().from('whatsapp_messages').insert({
      to_phone:    opts.to,
      template:    opts.template,
      wamid,
      status:      'sent',
      entity_type: entity_type ?? null,
      entity_id:   entity_id ?? null,
    })

    await logActivity({
      action:            'whatsapp.message_sent',
      entity_type:       entity_type ?? 'enrollment',
      entity_id,
      description:       event ?? `WhatsApp enviado (${opts.template})`,
      metadata:          { template: opts.template, wamid },
      created_by_system: true,
      source:            'system',
    }).catch(() => {})

    return { ok: true, wamid }
  } catch (err) {
    const error = String(err).slice(0, 200)
    console.error('[whatsapp-cloud] Error enviando plantilla:', opts.template, error)

    await db().from('whatsapp_messages').insert({
      to_phone:    opts.to,
      template:    opts.template,
      status:      'failed',
      entity_type: entity_type ?? null,
      entity_id:   entity_id ?? null,
      error,
    }).then(() => {}, () => {})

    await logActivity({
      action:            'whatsapp.message_failed',
      entity_type:       entity_type ?? 'enrollment',
      entity_id,
      description:       `Fallo WhatsApp (${opts.template}): ${error}`,
      created_by_system: true,
      source:            'system',
      severity:          'warning',
    }).catch(() => {})

    return { ok: false, error }
  }
}

// ── Funciones de dominio ──────────────────────────────────────────

export async function sendEnrollmentReceived(p: {
  phone: string; name: string; course: string; enrollmentId: string
}): Promise<void> {
  await sendTemplate({
    to:         normalizeColombianPhone(p.phone),
    template:   TEMPLATES_META.enrollment_received,
    components: body(p.name, p.course),
    context:    { entity_type: 'enrollment', entity_id: p.enrollmentId, event: 'Inscripción recibida (WhatsApp)' },
  })
}

export async function sendPaymentConfirmed(p: {
  phone: string; name: string; amount: string; period: string; paymentId: string
}): Promise<void> {
  await sendTemplate({
    to:         normalizeColombianPhone(p.phone),
    template:   TEMPLATES_META.payment_confirmed,
    components: body(p.name, p.amount, p.period),
    context:    { entity_type: 'payment', entity_id: p.paymentId, event: 'Pago confirmado (WhatsApp)' },
  })
}

export async function sendAccountActivated(p: {
  phone: string; name: string; studentId: string
}): Promise<void> {
  await sendTemplate({
    to:         normalizeColombianPhone(p.phone),
    template:   TEMPLATES_META.account_activated,
    components: body(p.name),
    context:    { entity_type: 'student', entity_id: p.studentId, event: 'Cuenta activada (WhatsApp)' },
  })
}

export async function sendClassReminder(p: {
  phone: string; name: string; course: string; date: string; instructor: string; sessionId: string
}): Promise<void> {
  await sendTemplate({
    to:         normalizeColombianPhone(p.phone),
    template:   TEMPLATES_META.class_reminder,
    components: body(p.name, p.course, p.date, p.instructor),
    context:    { entity_type: 'session', entity_id: p.sessionId, event: 'Recordatorio de clase (WhatsApp)' },
  })
}

export async function sendClassRescheduled(p: {
  phone: string; name: string; course: string; date: string; instructor: string; sessionId: string
}): Promise<void> {
  await sendTemplate({
    to:         normalizeColombianPhone(p.phone),
    template:   TEMPLATES_META.class_rescheduled,
    components: body(p.name, p.course, p.date, p.instructor),
    context:    { entity_type: 'session', entity_id: p.sessionId, event: 'Clase reprogramada (WhatsApp)' },
  })
}

/** Alerta interna al equipo. Sustituye sendCorporateWhatsApp (CallMeBot). */
export async function sendInternalAlert(
  message: string,
  context?: { entity_type?: EntityType; entity_id?: string; event?: string },
): Promise<void> {
  if (!CORPORATE) return
  await sendTemplate({
    to:         normalizeColombianPhone(CORPORATE),
    template:   TEMPLATES_META.internal_alert,
    components: body(message),
    context,
  })
}

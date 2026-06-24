import type { EntityType } from '@/lib/activity'

// ── Graph API: envío de plantillas ────────────────────────────────

/** Parámetro de variable {{n}} dentro de un componente de plantilla. */
export interface TemplateParameter {
  type: 'text'
  text: string
}

/** Componente de plantilla (body/header). Solo usamos body por ahora. */
export interface TemplateComponent {
  type: 'body' | 'header'
  parameters: TemplateParameter[]
}

export interface SendTemplateOptions {
  to: string                       // teléfono normalizado (57XXXXXXXXXX)
  template: string                 // nombre aprobado en Meta
  languageCode?: string            // 'es' | 'es_CO' — default 'es'
  components?: TemplateComponent[]
  context?: {
    entity_type?: EntityType
    entity_id?: string
    event?: string
  }
}

export interface SendTemplateResult {
  ok: boolean
  wamid?: string
  error?: string
}

/** Respuesta de Graph API a POST /messages. */
export interface GraphSendResponse {
  messages?: { id: string }[]
  error?: { message: string; code: number; type: string }
}

// ── Webhook entrante de Meta ──────────────────────────────────────

export interface WhatsAppStatus {
  id: string                       // wamid
  status: 'sent' | 'delivered' | 'read' | 'failed'
  recipient_id: string
  errors?: { code: number; title: string }[]
}

export interface WhatsAppInboundMessage {
  id: string
  from: string                     // teléfono del estudiante
  timestamp: string
  type: string
  text?: { body: string }
}

export interface WhatsAppWebhookValue {
  messaging_product: 'whatsapp'
  statuses?: WhatsAppStatus[]
  messages?: WhatsAppInboundMessage[]
}

export interface WhatsAppWebhookPayload {
  object: string
  entry: {
    id: string
    changes: { value: WhatsAppWebhookValue; field: string }[]
  }[]
}

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/activity'
import type { WhatsAppWebhookPayload } from '@/types/whatsapp-cloud'

export const dynamic = 'force-dynamic'

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? ''
const APP_SECRET   = process.env.WHATSAPP_APP_SECRET ?? ''

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

/** Verificación de suscripción de Meta (handshake). */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  if (sp.get('hub.mode') === 'subscribe' && sp.get('hub.verify_token') === VERIFY_TOKEN) {
    return new NextResponse(sp.get('hub.challenge') ?? '', { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

function verifySignature(rawBody: string, signature: string): boolean {
  if (!APP_SECRET) return false
  const expected = 'sha256=' + createHmac('sha256', APP_SECRET).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  const rawBody   = await req.text()
  const signature = req.headers.get('x-hub-signature-256') ?? ''

  if (!verifySignature(rawBody, signature)) {
    console.warn('[whatsapp-webhook] Firma inválida')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: WhatsAppWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value

      // Status callbacks → actualizar whatsapp_messages
      for (const st of value.statuses ?? []) {
        await db()
          .from('whatsapp_messages')
          .update({
            status:     st.status,
            error:      st.errors?.[0]?.title ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('wamid', st.id)

        if (st.status === 'failed') {
          await logActivity({
            action:            'whatsapp.message_failed',
            entity_type:       'student',
            description:       `Entrega fallida WhatsApp: ${st.errors?.[0]?.title ?? 'desconocido'}`,
            metadata:          { wamid: st.id },
            created_by_system: true,
            source:            'system',
            severity:          'warning',
          }).catch(() => {})
        }
      }

      // Mensajes entrantes de estudiantes → registrar (abre ventana 24h)
      for (const msg of value.messages ?? []) {
        await logActivity({
          action:            'whatsapp.opened',
          entity_type:       'student',
          description:       `Mensaje entrante de ${msg.from}: ${msg.text?.body?.slice(0, 120) ?? msg.type}`,
          metadata:          { from: msg.from, wamid: msg.id },
          created_by_system: true,
          source:            'system',
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ received: true })
}

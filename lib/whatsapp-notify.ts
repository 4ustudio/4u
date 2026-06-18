import { logActivity } from '@/lib/activity'

const CORPORATE_PHONE = process.env.WHATSAPP_CORPORATE_PHONE ?? ''
const CALLMEBOT_KEY   = process.env.CALLMEBOT_API_KEY ?? ''
const ENABLED         = process.env.WHATSAPP_NOTIFICATIONS_ENABLED === 'true'

/**
 * Envía un mensaje WhatsApp al número corporativo vía CallMeBot.
 * Fire-and-forget — nunca bloquea el flujo principal.
 *
 * Setup único: enviar "I allow callmebot to send me messages" al +34 644 65 21 69
 * y guardar el apikey en CALLMEBOT_API_KEY.
 */
export async function sendCorporateWhatsApp(
  message: string,
  context?: { entity_type?: string; entity_id?: string; event?: string }
): Promise<void> {
  if (!ENABLED || !CORPORATE_PHONE || !CALLMEBOT_KEY) return

  const url =
    `https://api.callmebot.com/whatsapp.php` +
    `?phone=${encodeURIComponent(CORPORATE_PHONE)}` +
    `&text=${encodeURIComponent(message)}` +
    `&apikey=${encodeURIComponent(CALLMEBOT_KEY)}`

  try {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000) })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`CallMeBot HTTP ${res.status}: ${body.slice(0, 100)}`)
    }

    await logActivity({
      action:            'whatsapp.notification_sent',
      entity_type:       (context?.entity_type as any) ?? 'enrollment',
      entity_id:         context?.entity_id,
      description:       context?.event ?? 'Notificación corporativa enviada',
      created_by_system: true,
      source:            'system',
    }).catch(() => {})
  } catch (err) {
    console.error('[whatsapp-notify] Error enviando notificación corporativa:', err)

    await logActivity({
      action:            'whatsapp.notification_failed',
      entity_type:       (context?.entity_type as any) ?? 'enrollment',
      entity_id:         context?.entity_id,
      description:       `Fallo notificación corporativa: ${String(err).slice(0, 200)}`,
      created_by_system: true,
      source:            'system',
      severity:          'warning',
    }).catch(() => {})
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyBoldSignature } from '@/lib/bold/verify-signature'
import type { BoldWebhookPayload } from '@/lib/bold/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { activity } from '@/lib/activity'

// No usar caché — siempre procesar en tiempo real
export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

function getWebhookSecret(): string {
  // Bold firma con "" en sandbox — en producción usa BOLD_SECRET_KEY
  const isSandbox = process.env.BOLD_SANDBOX === 'true'
  if (isSandbox) return ''
  return process.env.BOLD_SECRET_KEY ?? ''
}

export async function POST(req: NextRequest) {
  // 1. Leer raw body como texto (necesario para HMAC)
  const rawBody = await req.text()

  // 2. Validar firma (sandbox no firma webhooks — skip)
  const isSandboxEnv = process.env.BOLD_SANDBOX === 'true'
  if (!isSandboxEnv) {
    const signature = req.headers.get('x-bold-signature') ?? ''
    const secret    = getWebhookSecret()
    if (!verifyBoldSignature(rawBody, signature, secret)) {
      console.warn('[bold-webhook] Firma inválida')
      await activity.boldWebhookFailed({ reason: 'firma_invalida' })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // 3. Parsear payload
  let payload: BoldWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, data } = payload
  const boldPaymentId   = data.payment_id
  const ourPaymentId    = data.metadata?.reference  // Nuestro payments.id

  console.info(`[bold-webhook] Evento=${type} bold_id=${boldPaymentId} ref=${ourPaymentId}`)

  // Solo procesamos eventos de venta; VOID_* se ignoran por ahora
  if (type !== 'SALE_APPROVED' && type !== 'SALE_REJECTED') {
    return NextResponse.json({ received: true, action: 'ignored' })
  }

  // 4. Buscar el payment en nuestra DB
  if (!ourPaymentId) {
    console.warn('[bold-webhook] Sin reference en metadata')
    await activity.boldWebhookFailed({ reason: 'sin_referencia', bold_event: type })
    return NextResponse.json({ received: true, action: 'no_reference' })
  }

  const { data: payment, error: fetchError } = await db()
    .from('payments')
    .select('id, student_id, final_amount, status, payment_method')
    .eq('id', ourPaymentId)
    .single()

  if (fetchError || !payment) {
    console.warn('[bold-webhook] Payment no encontrado:', ourPaymentId)
    await activity.boldWebhookFailed({ payment_id: ourPaymentId, reason: 'payment_no_encontrado', bold_event: type })
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  // Log recepción del webhook
  await activity.boldWebhookReceived({
    payment_id: ourPaymentId,
    bold_event: type,
    bold_payment_id: boldPaymentId,
    amount: payment.final_amount,
  })

  // Idempotencia: no re-procesar si ya está pagado
  if (payment.status === 'paid' && type === 'SALE_APPROVED') {
    return NextResponse.json({ received: true, action: 'already_paid' })
  }

  // 5. Actualizar según estado Bold
  const now = new Date().toISOString()

  if (type === 'SALE_APPROVED') {
    const { error: updateError } = await db()
      .from('payments')
      .update({
        status:          'paid',
        paid_at:         now,
        payment_method:  'bold',
        external_ref:    boldPaymentId,
        gateway_response: payload,
        updated_at:      now,
      })
      .eq('id', ourPaymentId)

    if (updateError) {
      console.error('[bold-webhook] Error en update payment:', ourPaymentId, updateError)
      await activity.boldWebhookFailed({ payment_id: ourPaymentId, reason: 'db_update_failed', bold_event: type })
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }

    // Solo sync y activity si el update fue exitoso
    await db().rpc('sync_student_payment_fields', { p_student_id: payment.student_id })

    const { data: student } = await db()
      .from('students')
      .select('name')
      .eq('id', payment.student_id)
      .single()

    await activity.paymentReceived({
      payment_id:    ourPaymentId,
      student_name:  student?.name ?? '—',
      amount:        payment.final_amount,
      method:        'bold',
      source:        'bold_webhook',
    })
  }

  if (type === 'SALE_REJECTED') {
    await db()
      .from('payments')
      .update({
        gateway_response: payload,
        external_ref:     boldPaymentId,
        updated_at:       now,
      })
      .eq('id', ourPaymentId)
  }

  return NextResponse.json({ received: true, type })
}

'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createAuthServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { activity } from '@/lib/activity'
import { getBirthdayBenefitStatus } from '@/lib/students/birthday'
import { createBoldPaymentLink } from '@/lib/bold/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

// ── Tipos ──────────────────────────────────────────────────────────

export type PaymentStatus   = 'pending' | 'paid' | 'overdue' | 'waived' | 'partial' | 'voided'
export type PaymentType     = 'monthly_fee' | 'partial_payment' | 'adjustment' | 'scholarship' | 'refund'
export type PaymentMethod   = 'efectivo' | 'transferencia' | 'nequi' | 'daviplata' | 'wompi' | 'pse' | 'tarjeta' | 'bold' | 'otro'
export type PaymentTab      = 'all' | 'pending' | 'paid' | 'overdue'

export interface PaymentWithStudent {
  id: string
  created_at: string
  updated_at: string
  student_id: string
  period_year: number
  period_month: number
  payment_type: PaymentType
  currency: string
  original_amount: number
  discount_amount: number
  final_amount: number
  discount_percent: number
  discount_reason: string | null
  status: PaymentStatus
  due_date: string
  paid_at: string | null
  payment_method: PaymentMethod | null
  external_ref: string | null
  plan_name: string | null
  notes: string | null
  metadata: { bold_checkout_url?: string; bold_link_id?: string } | null
  gateway_response: unknown | null
  // joined from students
  student_name: string
  student_phone: string
  student_plan_name: string | null
  birth_date: string | null
  birthday_benefit_used: boolean | null
  birthday_benefit_year: number | null
  birthday_discount_percent: number | null
  student_status: string | null
}

export interface PaymentMetrics {
  recaudado:  number
  pendientes: number
  vencidos:   number
  descuentos: number
  mora_total: number
}

export interface BoldMetrics {
  pagos_hoy:       number
  recaudacion_hoy: number
  ultimo_webhook:  string | null
  webhooks_fallidos_hoy: number
}

export interface RegisterPaymentInput {
  student_id: string
  period_year: number
  period_month: number
  payment_type: PaymentType
  original_amount: number
  discount_amount: number
  discount_percent?: number
  discount_reason?: string
  due_date: string
  paid_at?: string
  payment_method?: PaymentMethod
  plan_name?: string
  notes?: string
  apply_birthday_benefit?: boolean
}

export interface ApplyDiscountInput {
  discount_amount: number
  discount_percent?: number
  discount_reason: string
  notes?: string
}

export interface StudentPaymentRow {
  id: string
  period_year: number
  period_month: number
  status: PaymentStatus
  final_amount: number
  original_amount: number
  discount_amount: number
  payment_method: PaymentMethod | null
  paid_at: string | null
  due_date: string
  plan_name: string | null
  has_activity_log: boolean
}

export interface StudentPaymentDefaults {
  student_id: string
  student_name: string
  plan_name: string | null
  period_year: number
  period_month: number
  due_date: string
  birth_date: string | null
  birthday_benefit_used: boolean | null
  birthday_benefit_year: number | null
  birthday_discount_percent: number | null
  student_status: string | null
}

export interface StudentOption {
  id: string
  name: string
  phone: string
  plan_name: string | null
  birth_date: string | null
  birthday_benefit_used: boolean | null
  birthday_benefit_year: number | null
  birthday_discount_percent: number | null
  student_status: string | null
}

// ── Helpers ────────────────────────────────────────────────────────

async function getActorInfo(): Promise<{ actor_name: string; actor_user_id: string; actor_role: string } | null> {
  try {
    const supabase = await createAuthServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    return {
      actor_user_id: user.id,
      actor_name: (user.user_metadata?.name as string) ?? user.email ?? 'Admin',
      actor_role:  (user.user_metadata?.role as string) ?? 'admin',
    }
  } catch { return null }
}

async function updateStudentRiskFromOverdue(student_id: string): Promise<void> {
  const { count } = await db()
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', student_id)
    .eq('status', 'overdue')

  const overdue = count ?? 0
  let risk_level: string | null = null
  if (overdue >= 3)      risk_level = 'critico'
  else if (overdue >= 2) risk_level = 'alto'
  else if (overdue >= 1) risk_level = 'medio'

  await db().from('students').update({ risk_level, updated_at: new Date().toISOString() }).eq('id', student_id)
}

// ── Queries ────────────────────────────────────────────────────────

export async function getPayments(tab: PaymentTab = 'all', search = '', page = 1): Promise<{
  data: PaymentWithStudent[]
  total: number
  error: string | null
}> {
  try {
    const PAGE_SIZE = 50
    const from = (page - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let query = db()
      .from('payments')
      .select(`
        *,
        student:students(
          name, phone, plan_name, birth_date,
          birthday_benefit_used, birthday_benefit_year,
          birthday_discount_percent, student_status
        )
      `, { count: 'exact' })
      .order('due_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (tab !== 'all') query = query.eq('status', tab)

    const { data, error, count } = await query
    if (error) return { data: [], total: 0, error: error.message }

    const rows: PaymentWithStudent[] = (data ?? []).map((p: any) => ({
      ...p,
      student_name:              p.student?.name ?? '—',
      student_phone:             p.student?.phone ?? '',
      student_plan_name:         p.student?.plan_name ?? null,
      birth_date:                p.student?.birth_date ?? null,
      birthday_benefit_used:     p.student?.birthday_benefit_used ?? null,
      birthday_benefit_year:     p.student?.birthday_benefit_year ?? null,
      birthday_discount_percent: p.student?.birthday_discount_percent ?? null,
      student_status:            p.student?.student_status ?? null,
    }))

    const filtered = search.trim()
      ? rows.filter(r => r.student_name.toLowerCase().includes(search.toLowerCase()) || r.student_phone.includes(search))
      : rows

    return { data: filtered, total: count ?? 0, error: null }
  } catch (e) {
    return { data: [], total: 0, error: String(e) }
  }
}

export async function getPaymentMetrics(): Promise<PaymentMetrics> {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const [recaudadoRes, pendientesRes, vencidosRes, descuentosRes, moraRes] = await Promise.all([
      db().from('payments').select('final_amount').eq('status', 'paid').eq('period_year', year).eq('period_month', month),
      db().from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      db().from('payments').select('id', { count: 'exact', head: true }).eq('status', 'overdue'),
      db().from('payments').select('id', { count: 'exact', head: true }).gt('discount_amount', 0),
      db().from('payments').select('final_amount').eq('status', 'overdue'),
    ])

    const recaudado  = (recaudadoRes.data ?? []).reduce((s: number, r: any) => s + (r.final_amount ?? 0), 0)
    const mora_total = (moraRes.data ?? []).reduce((s: number, r: any) => s + (r.final_amount ?? 0), 0)

    return {
      recaudado,
      pendientes: pendientesRes.count ?? 0,
      vencidos:   vencidosRes.count   ?? 0,
      descuentos: descuentosRes.count ?? 0,
      mora_total,
    }
  } catch {
    return { recaudado: 0, pendientes: 0, vencidos: 0, descuentos: 0, mora_total: 0 }
  }
}

export async function getBoldMetrics(): Promise<BoldMetrics> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const [pagosHoyRes, lastWebhookRes, failedRes] = await Promise.all([
      db().from('payments')
        .select('final_amount')
        .eq('payment_method', 'bold')
        .eq('status', 'paid')
        .gte('paid_at', `${today}T00:00:00`),
      db().from('system_activity_log')
        .select('created_at')
        .eq('action', 'payment.bold_webhook_received')
        .order('created_at', { ascending: false })
        .limit(1),
      db().from('system_activity_log')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'payment.bold_webhook_failed')
        .gte('created_at', `${today}T00:00:00`),
    ])

    const recaudacion_hoy = (pagosHoyRes.data ?? []).reduce((s: number, r: any) => s + (r.final_amount ?? 0), 0)

    return {
      pagos_hoy:            (pagosHoyRes.data ?? []).length,
      recaudacion_hoy,
      ultimo_webhook:       lastWebhookRes.data?.[0]?.created_at ?? null,
      webhooks_fallidos_hoy: failedRes.count ?? 0,
    }
  } catch {
    return { pagos_hoy: 0, recaudacion_hoy: 0, ultimo_webhook: null, webhooks_fallidos_hoy: 0 }
  }
}

export async function getStudentPayments(student_id: string): Promise<StudentPaymentRow[]> {
  try {
    const { data: payments, error } = await db()
      .from('payments')
      .select('id, period_year, period_month, status, final_amount, original_amount, discount_amount, payment_method, paid_at, due_date, plan_name')
      .eq('student_id', student_id)
      .order('period_year',  { ascending: false })
      .order('period_month', { ascending: false })
      .order('created_at',   { ascending: false })

    if (error || !payments?.length) return []

    const paymentIds = payments.map((p: any) => p.id)
    const { data: logEntries } = await db()
      .from('system_activity_log')
      .select('entity_id')
      .eq('entity_type', 'payment')
      .in('entity_id', paymentIds)

    const loggedIds = new Set((logEntries ?? []).map((e: any) => e.entity_id))

    return payments.map((p: any) => ({ ...p, has_activity_log: loggedIds.has(p.id) }))
  } catch { return [] }
}

export async function getStudentPaymentDefaults(student_id: string): Promise<StudentPaymentDefaults | null> {
  try {
    const { data: student } = await db()
      .from('students')
      .select('id, name, plan_name, birth_date, birthday_benefit_used, birthday_benefit_year, birthday_discount_percent, student_status')
      .eq('id', student_id)
      .single()

    if (!student) return null

    const now   = new Date()
    const year  = now.getFullYear()
    const month = now.getMonth() + 1
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

    return {
      student_id,
      student_name:              student.name,
      plan_name:                 student.plan_name,
      period_year:               year,
      period_month:              month,
      due_date:                  lastDay,
      birth_date:                student.birth_date,
      birthday_benefit_used:     student.birthday_benefit_used,
      birthday_benefit_year:     student.birthday_benefit_year,
      birthday_discount_percent: student.birthday_discount_percent,
      student_status:            student.student_status,
    }
  } catch { return null }
}

export async function getStudentsForSearch(): Promise<StudentOption[]> {
  try {
    const { data } = await db()
      .from('students')
      .select('id, name, phone, plan_name, birth_date, birthday_benefit_used, birthday_benefit_year, birthday_discount_percent, student_status')
      .is('archived_at', null)
      .order('name')
    return (data ?? []) as StudentOption[]
  } catch { return [] }
}

// ── Mutaciones ─────────────────────────────────────────────────────

export async function registerPayment(input: RegisterPaymentInput): Promise<{ error: string | null; id?: string }> {
  try {
    const actor = await getActorInfo()
    const final_amount = input.original_amount - input.discount_amount

    if (final_amount < 0) return { error: 'El descuento no puede superar el valor original.' }

    const paid_at = input.paid_at ?? new Date().toISOString()
    const status: PaymentStatus = 'paid'

    const { data, error } = await db()
      .from('payments')
      .insert({
        student_id:      input.student_id,
        period_year:     input.period_year,
        period_month:    input.period_month,
        payment_type:    input.payment_type,
        original_amount: input.original_amount,
        discount_amount: input.discount_amount,
        final_amount,
        discount_percent: input.discount_percent ?? 0,
        discount_reason:  input.discount_reason ?? null,
        status,
        due_date:         input.due_date,
        paid_at,
        payment_method:   input.payment_method ?? null,
        plan_name:        input.plan_name ?? null,
        notes:            input.notes ?? null,
        registered_by:    actor?.actor_user_id ?? null,
      })
      .select('id')
      .single()

    if (error) return { error: error.message }

    // Sincronizar campos en students
    await db().rpc('sync_student_payment_fields', { p_student_id: input.student_id })

    // Aplicar beneficio de cumpleaños si corresponde
    if (input.apply_birthday_benefit) {
      await db().from('students').update({
        birthday_benefit_used:  true,
        birthday_benefit_year:  new Date().getFullYear(),
        updated_at:             new Date().toISOString(),
      }).eq('id', input.student_id)
    }

    // Activity log
    const { data: student } = await db().from('students').select('name').eq('id', input.student_id).single()
    await activity.paymentReceived({
      payment_id:   data.id,
      student_name: student?.name ?? '—',
      amount:       final_amount,
      method:       input.payment_method,
      actor_name:   actor?.actor_name,
      actor_user_id: actor?.actor_user_id,
      actor_role:   actor?.actor_role,
      source:       'admin',
    })

    if (input.apply_birthday_benefit && input.discount_amount > 0) {
      await activity.paymentDiscountApplied({
        payment_id:      data.id,
        student_name:    student?.name ?? '—',
        discount_amount: input.discount_amount,
        discount_reason: 'cumpleaños',
        actor_name:      actor?.actor_name,
        actor_user_id:   actor?.actor_user_id,
        actor_role:      actor?.actor_role,
      })
    }

    revalidatePath('/admin/pagos')
    revalidatePath(`/admin/students/${input.student_id}`)
    return { error: null, id: data.id }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function applyDiscount(payment_id: string, input: ApplyDiscountInput): Promise<{ error: string | null }> {
  try {
    const actor = await getActorInfo()

    const { data: payment } = await db()
      .from('payments')
      .select('student_id, original_amount, status, students(name)')
      .eq('id', payment_id)
      .single()

    if (!payment) return { error: 'Pago no encontrado.' }
    if (payment.status === 'paid') return { error: 'No se puede aplicar descuento a un pago ya registrado.' }
    if (payment.status === 'voided') return { error: 'El pago está anulado.' }

    const final_amount = payment.original_amount - input.discount_amount
    if (final_amount < 0) return { error: 'El descuento supera el valor original.' }

    const { error } = await db()
      .from('payments')
      .update({
        discount_amount: input.discount_amount,
        discount_percent: input.discount_percent ?? 0,
        discount_reason:  input.discount_reason,
        final_amount,
        notes:       input.notes ?? null,
        updated_at:  new Date().toISOString(),
      })
      .eq('id', payment_id)

    if (error) return { error: error.message }

    // Marcar beneficio de cumpleaños si aplica
    if (input.discount_reason === 'cumpleaños') {
      await db().from('students').update({
        birthday_benefit_used:  true,
        birthday_benefit_year:  new Date().getFullYear(),
        updated_at:             new Date().toISOString(),
      }).eq('id', payment.student_id)
    }

    const studentName = (payment.students as any)?.name ?? '—'
    await activity.paymentDiscountApplied({
      payment_id,
      student_name:    studentName,
      discount_amount: input.discount_amount,
      discount_reason: input.discount_reason,
      actor_name:      actor?.actor_name,
      actor_user_id:   actor?.actor_user_id,
      actor_role:      actor?.actor_role,
    })

    revalidatePath('/admin/pagos')
    revalidatePath(`/admin/students/${payment.student_id}`)
    return { error: null }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function markPaymentOverdue(payment_id: string): Promise<{ error: string | null }> {
  try {
    const actor = await getActorInfo()

    const { data: payment } = await db()
      .from('payments')
      .select('student_id, final_amount, period_year, period_month, status, students(name)')
      .eq('id', payment_id)
      .single()

    if (!payment) return { error: 'Pago no encontrado.' }
    if (payment.status !== 'pending') return { error: 'Solo los pagos pendientes pueden marcarse como vencidos.' }

    const { error } = await db()
      .from('payments')
      .update({ status: 'overdue', updated_at: new Date().toISOString() })
      .eq('id', payment_id)

    if (error) return { error: error.message }

    await updateStudentRiskFromOverdue(payment.student_id)

    const studentName = (payment.students as any)?.name ?? '—'
    await activity.paymentOverdue({
      payment_id,
      student_name: studentName,
      period_year:  payment.period_year,
      period_month: payment.period_month,
      final_amount: payment.final_amount,
      actor_name:   actor?.actor_name,
      actor_user_id: actor?.actor_user_id,
      actor_role:   actor?.actor_role,
      source:       'admin',
      created_by_system: false,
    })

    revalidatePath('/admin/pagos')
    revalidatePath(`/admin/students/${payment.student_id}`)
    return { error: null }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function processOverduePayments(): Promise<{ processed: number; error: string | null }> {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Capturar los que serán afectados antes de actualizarlos
    const { data: toProcess } = await db()
      .from('payments')
      .select('id, student_id, final_amount, period_year, period_month, students(name)')
      .eq('status', 'pending')
      .lt('due_date', today)

    if (!toProcess?.length) return { processed: 0, error: null }

    // Llamar función DB (UPDATE masivo)
    await db().rpc('compute_overdue_payments')

    // Procesar cada uno: risk + log
    const processed = toProcess.length
    const studentIds = [...new Set(toProcess.map((p: any) => p.student_id))]

    await Promise.all([
      // Actualizar risk_level por estudiante
      ...studentIds.map((sid: string) => updateStudentRiskFromOverdue(sid)),
      // Registrar eventos
      ...toProcess.map((p: any) =>
        activity.paymentOverdue({
          payment_id:        p.id,
          student_name:      (p.students as any)?.name ?? '—',
          period_year:       p.period_year,
          period_month:      p.period_month,
          final_amount:      p.final_amount,
          created_by_system: true,
          source:            'system',
        })
      ),
    ])

    revalidatePath('/admin/pagos')
    return { processed, error: null }
  } catch (e) {
    return { processed: 0, error: String(e) }
  }
}

export interface CreateCobroInput {
  student_id: string
  period_year: number
  period_month: number
  original_amount: number
  discount_amount: number
  discount_percent?: number
  discount_reason?: string
  due_date: string
  plan_name?: string
  notes?: string
}

export async function createPendingPayment(input: CreateCobroInput): Promise<{ error: string | null; id?: string }> {
  try {
    const actor = await getActorInfo()
    const final_amount = input.original_amount - input.discount_amount
    if (final_amount < 0) return { error: 'El descuento no puede superar el valor original.' }

    const { data, error } = await db()
      .from('payments')
      .insert({
        student_id:       input.student_id,
        period_year:      input.period_year,
        period_month:     input.period_month,
        payment_type:     'monthly_fee',
        original_amount:  input.original_amount,
        discount_amount:  input.discount_amount,
        final_amount,
        discount_percent: input.discount_percent ?? 0,
        discount_reason:  input.discount_reason ?? null,
        status:           'pending',
        due_date:         input.due_date,
        plan_name:        input.plan_name ?? null,
        notes:            input.notes ?? null,
        registered_by:    actor?.actor_user_id ?? null,
      })
      .select('id')
      .single()

    if (error) return { error: error.message }

    revalidatePath('/admin/pagos')
    revalidatePath(`/admin/students/${input.student_id}`)
    return { error: null, id: data.id }
  } catch (e) {
    return { error: String(e) }
  }
}

// ── Bold Checkout ──────────────────────────────────────────────────

export async function generateBoldCheckout(payment_id: string): Promise<{
  url: string | null
  error: string | null
}> {
  try {
    const { data: payment, error: fetchError } = await db()
      .from('payments')
      .select('id, student_id, final_amount, status, period_year, period_month, students(name)')
      .eq('id', payment_id)
      .single()

    if (fetchError || !payment) return { url: null, error: 'Pago no encontrado.' }
    if (payment.status === 'paid') return { url: null, error: 'El pago ya fue registrado.' }

    const studentName = (payment.students as any)?.name ?? ''
    const mes = new Date(payment.period_year, payment.period_month - 1).toLocaleString('es-CO', { month: 'long' })
    const description = `Mensualidad ${mes} ${payment.period_year}${studentName ? ` — ${studentName}` : ''}`

    const boldRes = await createBoldPaymentLink({
      paymentId:   payment_id,
      amount:      payment.final_amount,
      description,
    })

    const checkoutUrl = boldRes.payload?.url
    if (!checkoutUrl) return { url: null, error: 'Bold no retornó URL de pago.' }

    // Guardar link en metadata para trazabilidad
    await db()
      .from('payments')
      .update({
        metadata:   { bold_checkout_url: checkoutUrl, bold_link_id: boldRes.payload.payment_link },
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment_id)

    // Activity log
    const actor = await getActorInfo()
    await activity.boldLinkCreated({
      payment_id,
      student_name: studentName,
      amount: payment.final_amount,
      checkout_url: checkoutUrl,
      actor_name: actor?.actor_name,
      actor_user_id: actor?.actor_user_id,
      actor_role: actor?.actor_role,
    })

    return { url: checkoutUrl, error: null }
  } catch (e) {
    return { url: null, error: String(e) }
  }
}

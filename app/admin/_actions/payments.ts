'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/supabase'

type PaymentRow = Database['public']['Tables']['payments']['Row']

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const PLAN_COLORS: Record<string, string> = {
  'Plan New Talent': '#3b82f6',
  'Plan Fast Talent': '#60a5fa',
  'Plan Artista': '#f97316',
  'Plan Artista Premium': '#fb7185',
  'Plan Profesional': '#8b5cf6',
  'Plan Bandas': '#facc15',
  'Plan Premium Kids & Teens': '#22c55e',
}
const FALLBACK_COLORS = ['#3b82f6', '#f97316', '#22c55e', '#8b5cf6', '#60a5fa', '#fb7185', '#facc15']

export type PaymentMetrics = {
  billedMonth: number
  cobradoMonth: number
  pendienteTotal: number
  pendienteCount: number
  overdueTotal: number
  overdueCount: number
  cobradoPct: number
  pendientePct: number
  moraPct: number
  salesGrowth: number | null
  monthlyTrend: Array<{ label: string; billed: number; cobrado: number }>
  byPlan: Array<{ label: string; value: number; color: string }>
  hasRealData: boolean
}

export async function getPaymentMetrics(): Promise<PaymentMetrics> {
  const db = createAdminClient()
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const today = now.toISOString().slice(0, 10)

  const { data: payments, error } = await db
    .from('payments')
    .select('period_year, period_month, final_amount, status, due_date, plan_name, paid_at')

  const empty: PaymentMetrics = {
    billedMonth: 0, cobradoMonth: 0, pendienteTotal: 0, pendienteCount: 0,
    overdueTotal: 0, overdueCount: 0, cobradoPct: 0, pendientePct: 0, moraPct: 0,
    salesGrowth: null, monthlyTrend: [], byPlan: [], hasRealData: false,
  }

  if (error || !payments || payments.length === 0) return empty

  const rows = payments as PaymentRow[]

  // ── Mes actual ────────────────────────────────────────────────
  const monthPayments = rows.filter(
    p => p.period_year === currentYear && p.period_month === currentMonth
  )
  const billedMonth = monthPayments.reduce((s, p) => s + p.final_amount, 0)
  const cobradoMonth = monthPayments
    .filter(p => p.status === 'paid')
    .reduce((s, p) => s + p.final_amount, 0)

  // ── Vencidos (todo el tiempo) ──────────────────────────────────
  const overduePayments = rows.filter(p => p.status !== 'paid' && p.due_date < today)
  const overdueTotal = overduePayments.reduce((s, p) => s + p.final_amount, 0)
  const overdueCount = overduePayments.length

  // ── Pendientes (no vencidos) ───────────────────────────────────
  const pendingPayments = rows.filter(p => p.status !== 'paid' && p.due_date >= today)
  const pendienteTotal = pendingPayments.reduce((s, p) => s + p.final_amount, 0)
  const pendienteCount = pendingPayments.length

  // ── Porcentajes de cobranza ────────────────────────────────────
  const totalPendingAndOverdue = pendienteTotal + overdueTotal
  const billedBase = billedMonth > 0 ? billedMonth : (cobradoMonth + totalPendingAndOverdue)
  const cobradoPct = billedBase > 0 ? Math.round((cobradoMonth / billedBase) * 100) : 0
  const moraPct = billedBase > 0 ? Math.round((overdueTotal / billedBase) * 100) : 0
  const pendientePct = Math.max(0, 100 - cobradoPct - moraPct)

  // ── Crecimiento vs mes anterior ───────────────────────────────
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const prevBilled = rows
    .filter(p => p.period_year === prevYear && p.period_month === prevMonth)
    .reduce((s, p) => s + p.final_amount, 0)
  const salesGrowth = prevBilled > 0 ? ((billedMonth - prevBilled) / prevBilled) * 100 : null

  // ── Tendencia mensual (últimos 6 meses) ───────────────────────
  const monthlyMap = new Map<string, { billed: number; cobrado: number }>()
  for (const p of rows) {
    const key = `${p.period_year}-${String(p.period_month).padStart(2, '0')}`
    const prev = monthlyMap.get(key) ?? { billed: 0, cobrado: 0 }
    monthlyMap.set(key, {
      billed: prev.billed + p.final_amount,
      cobrado: prev.cobrado + (p.status === 'paid' ? p.final_amount : 0),
    })
  }

  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const data = monthlyMap.get(key) ?? { billed: 0, cobrado: 0 }
    return { label: MONTH_LABELS[d.getMonth()], billed: data.billed, cobrado: data.cobrado }
  })

  // ── Por plan (solo pagos confirmados) ─────────────────────────
  const planMap = new Map<string, number>()
  for (const p of rows.filter(p => p.status === 'paid')) {
    const plan = p.plan_name ?? 'Sin plan'
    planMap.set(plan, (planMap.get(plan) ?? 0) + p.final_amount)
  }
  const byPlan = Array.from(planMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({
      label,
      value,
      color: PLAN_COLORS[label] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    }))

  return {
    billedMonth, cobradoMonth, pendienteTotal, pendienteCount,
    overdueTotal, overdueCount, cobradoPct, pendientePct, moraPct,
    salesGrowth, monthlyTrend, byPlan, hasRealData: true,
  }
}

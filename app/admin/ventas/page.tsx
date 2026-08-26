import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/server'
import { canAccessSalesDashboard, resolveRole } from '@/lib/auth/roles'
import { getRetentionStats } from '@/app/admin/_actions/retention'
import { getPaymentMetrics } from '@/app/admin/_actions/payments'
import { getFollowupMetrics } from '@/app/admin/_actions/followups'
import { getExecutiveData } from './_data'
import { parseMonthParam } from './_utils'
import VentasClient, { type TabKey } from './VentasClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard Ejecutivo — 4U Studio Academy' }

const VALID_TABS: TabKey[] = ['finanzas', 'comercial', 'retencion', 'operacion']

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; tab?: string }>
}) {
  const { data: { user } } = await getAuthUser()
  const role = resolveRole(user)
  if (!canAccessSalesDashboard(role)) redirect('/admin')

  const { month, tab } = await searchParams
  const refMonth = parseMonthParam(month)
  const initialTab = VALID_TABS.includes(tab as TabKey) ? (tab as TabKey) : undefined

  const [data, retentionStats, pm, fm] = await Promise.all([
    getExecutiveData(refMonth),
    getRetentionStats(),
    getPaymentMetrics(refMonth),
    getFollowupMetrics(),
  ])

  // KPI valores reales
  const billedMonth = pm.billedMonth
  const cobradoMonth = pm.cobradoMonth
  const pendienteTotal = pm.pendienteTotal + pm.overdueTotal
  const pendienteCount = pm.pendienteCount + pm.overdueCount
  const cobradoPct = pm.cobradoPct

  const salesGrowthLabel = pm.salesGrowth !== null
    ? `${pm.salesGrowth >= 0 ? '↑' : '↓'} ${Math.abs(pm.salesGrowth).toFixed(1)}% vs. mes anterior`
    : 'Primer mes registrado'

  // Alertas operativas con datos reales
  const alertas = {
    pagosVencidos: pm.overdueCount,
    montoVencido: pm.overdueTotal,
    alumnosRiesgo: data.riskStudents,
    leadsSinSeguimiento: data.leadsSinSeguimiento,
    matriculasPendientes: data.matriculasPendientes,
  }

  return (
    <VentasClient
      data={data}
      retentionStats={retentionStats}
      pm={pm}
      fm={fm}
      billedMonth={billedMonth}
      cobradoMonth={cobradoMonth}
      pendienteTotal={pendienteTotal}
      pendienteCount={pendienteCount}
      cobradoPct={cobradoPct}
      salesGrowthLabel={salesGrowthLabel}
      alertas={alertas}
      refMonth={refMonth}
      initialTab={initialTab}
    />
  )
}

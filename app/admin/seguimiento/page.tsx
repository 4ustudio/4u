import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/server'
import { hasAcademicAccess, resolveRole } from '@/lib/auth/roles'
import { getStudentsAtRisk, getLatestFollowupPerStudent, getFollowupMetrics } from '@/app/admin/_actions/followups'
import { getRetentionDashboardData } from '@/app/admin/_actions/retention'
import SeguimientoClient from './SeguimientoClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Seguimiento de Alumnos — 4U Studio Academy' }

export default async function SeguimientoPage() {
  const { data: { user } } = await getAuthUser()
  const role = resolveRole(user)
  if (!hasAcademicAccess(role)) redirect('/admin')

  const [students, latestFollowups, followupMetrics, retentionData] = await Promise.all([
    getStudentsAtRisk(),
    getLatestFollowupPerStudent(),
    getFollowupMetrics(),
    getRetentionDashboardData(),
  ])

  const dashboard = (retentionData.dashboard ?? {}) as Record<string, number | null>

  const stats = {
    active: dashboard.active_students ?? 0,
    risk: dashboard.risk_students ?? 0,
    critical: dashboard.inactive_students ?? 0,
    recoveredMonth: dashboard.reactivated_this_month ?? 0,
    totalManaged:
      (dashboard.active_students ?? 0) +
      (dashboard.risk_students ?? 0) +
      (dashboard.inactive_students ?? 0) +
      (dashboard.alumni_students ?? 0),
  }

  // Recovery Rate real: recuperados via followups / total estudiantes con seguimiento
  const recoveryBase = followupMetrics.estudiantesConSeguimiento
  const recoveryRate = recoveryBase > 0
    ? Math.round((followupMetrics.recuperadosMes / recoveryBase) * 100)
    : (stats.recoveredMonth > 0 ? Math.round((stats.recoveredMonth / Math.max(stats.risk + stats.critical, 1)) * 100) : 0)

  return (
    <SeguimientoClient
      students={students}
      latestFollowups={latestFollowups}
      followupMetrics={followupMetrics}
      stats={{ ...stats, recoveryRate }}
      dashboard={retentionData.dashboard}
      highRisk={retentionData.highRisk}
      alerts={retentionData.alerts}
      birthdayThisMonth={retentionData.birthdayThisMonth}
      overduePaymentsTotal={(retentionData as any).overduePaymentsTotal ?? 0}
      overduePaymentsCount={(retentionData as any).overduePaymentsCount ?? 0}
      migrationMissing={retentionData.migrationMissing as string | false}
    />
  )
}

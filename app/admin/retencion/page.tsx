import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasAcademicAccess, parseRole } from '@/lib/auth/roles'
import { getStudentsAtRisk, getLatestFollowupPerStudent, getFollowupMetrics } from '@/app/admin/_actions/followups'
import RetentionCRMClient from './RetentionCRMClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Retención de Estudiantes — 4U Studio Academy' }

export default async function RetentionPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = parseRole(user?.user_metadata ?? null)
  if (!hasAcademicAccess(role)) redirect('/admin')

  const db = createAdminClient()

  const [students, latestFollowups, followupMetrics, { data: retentionDash }] = await Promise.all([
    getStudentsAtRisk(),
    getLatestFollowupPerStudent(),
    getFollowupMetrics(),
    db.from('v_retention_dashboard').select('*').maybeSingle(),
  ])

  const rd = (retentionDash ?? {}) as Record<string, number | null>

  const stats = {
    active: rd.active_students ?? 0,
    risk: rd.risk_students ?? 0,
    critical: rd.inactive_students ?? 0,
    recoveredMonth: rd.reactivated_this_month ?? 0,
    totalManaged: (rd.active_students ?? 0) + (rd.risk_students ?? 0) + (rd.inactive_students ?? 0) + (rd.alumni_students ?? 0),
  }

  // Recovery Rate real: recuperados via followups / total estudiantes con seguimiento
  const recoveryBase = followupMetrics.estudiantesConSeguimiento
  const recoveryRate = recoveryBase > 0
    ? Math.round((followupMetrics.recuperadosMes / recoveryBase) * 100)
    : (stats.recoveredMonth > 0 ? Math.round((stats.recoveredMonth / Math.max(stats.risk + stats.critical, 1)) * 100) : 0)

  return (
    <RetentionCRMClient
      students={students}
      latestFollowups={latestFollowups}
      followupMetrics={followupMetrics}
      stats={{ ...stats, recoveryRate }}
    />
  )
}

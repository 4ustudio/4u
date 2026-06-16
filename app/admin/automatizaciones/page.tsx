import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase/server'
import { isSuperAdmin, parseRole } from '@/lib/auth/roles'
import { getAutomationJobs, getAutomationMetrics } from '@/app/admin/_actions/automations'
import AutomatizacionesClient from './AutomatizacionesClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Automatizaciones — 4U Studio Academy' }

export default async function AutomatizacionesPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = parseRole(user?.user_metadata ?? null)
  if (!isSuperAdmin(role)) redirect('/admin')

  const [jobs, metrics] = await Promise.all([
    getAutomationJobs('all', 'all', 200),
    getAutomationMetrics(),
  ])

  return (
    <AutomatizacionesClient
      initialJobs={jobs}
      metrics={metrics}
    />
  )
}

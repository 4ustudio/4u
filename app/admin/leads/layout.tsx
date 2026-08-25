import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/server'
import { resolveRole, canAccessLeads } from '@/lib/auth/roles'

export const metadata = { title: 'Pipeline Comercial — 4U Studio Academy' }

export default async function LeadsLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await getAuthUser()
  const role = resolveRole(user)
  if (!canAccessLeads(role)) redirect('/admin')
  return <>{children}</>
}

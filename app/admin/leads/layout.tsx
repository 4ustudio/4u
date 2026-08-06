import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase/server'
import { resolveRole, canAccessLeads } from '@/lib/auth/roles'

export const metadata = { title: 'Pipeline Comercial — 4U Studio Academy' }

export default async function LeadsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = resolveRole(user)
  if (!canAccessLeads(role)) redirect('/admin')
  return <>{children}</>
}

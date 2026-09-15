import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/server'
import { resolveRole, canAccessLeads } from '@/lib/auth/roles'

export const metadata = { title: 'Estudiantes Interesados — 4U Studio Academy' }

export default async function InteresadosLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await getAuthUser()
  const role = resolveRole(user)
  if (!canAccessLeads(role)) redirect('/admin')
  return <>{children}</>
}

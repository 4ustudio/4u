import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase/server'
import AdminSidebar from './_components/AdminSidebar'
import { signOutAction } from './_actions/auth'

export const metadata = { title: 'Panel Admin — 4U Studio Academy' }

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-gray-950 flex text-white">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-12 shrink-0 flex items-center justify-between px-6 border-b border-white/10 bg-gray-900">
          <span className="text-xs text-white/40">{user.email}</span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-xs text-white/50 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5"
            >
              Cerrar sesión
            </button>
          </form>
        </header>

        {/* Contenido */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

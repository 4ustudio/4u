import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase/server'
import AdminSidebar, { MobileBottomNav } from './_components/AdminSidebar'
import { signOutAction } from './_actions/auth'
import { RealtimeProvider } from '@/components/admin/RealtimeProvider'
import NotificationBell from '@/components/admin/NotificationBell'
import PageWrapper from './_components/PageWrapper'
import { parseRole } from '@/lib/auth/roles'

export const metadata = { title: 'Panel Admin — 4U Studio Academy' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/mi-cuenta/login')
  }

  const role = parseRole(user.user_metadata)

  return (
    <RealtimeProvider>
      <div className="min-h-screen bg-gray-950 flex text-white">
        {/* Sidebar desktop */}
        <AdminSidebar role={role} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-12 shrink-0 flex items-center gap-3 px-4 lg:px-6 border-b border-white/10 bg-gray-900">
            {/* Logo móvil */}
            <p className="text-sm font-extrabold text-white lg:hidden">
              <span style={{ color: '#ff7a00' }}>4U</span> STUDIO
            </p>

            <span className="text-xs text-white/40 hidden lg:block truncate">{user.email}</span>

            <div className="ml-auto flex items-center gap-2">
              {/* Centro de notificaciones */}
              <NotificationBell />

              {/* Sign out */}
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-xs text-white/50 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5"
                >
                  Salir
                </button>
              </form>
            </div>
          </header>

          {/* Contenido principal */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto pb-20 lg:pb-6">
            <PageWrapper>{children}</PageWrapper>
          </main>
        </div>

        {/* Nav inferior móvil */}
        <MobileBottomNav role={role} />
      </div>
    </RealtimeProvider>
  )
}

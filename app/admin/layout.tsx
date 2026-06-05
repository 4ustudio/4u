import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase/server'
import AdminSidebar, { MobileBottomNav } from './_components/AdminSidebar'
import { signOutAction } from './_actions/auth'
import { RealtimeProvider } from '@/components/admin/RealtimeProvider'
import NotificationBell from '@/components/admin/NotificationBell'
import PageWrapper from './_components/PageWrapper'
import { getRoleLabel, parseRole } from '@/lib/auth/roles'

export const metadata = { title: 'Panel Admin — 4U Studio Academy' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/mi-cuenta/login')
  }

  const role = parseRole(user.user_metadata)
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ??
    'Admin 4U'
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '4U'

  return (
    <RealtimeProvider>
      <div className="min-h-screen bg-[#050505] flex text-white">
        {/* Sidebar desktop */}
        <AdminSidebar role={role} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-30 h-20 shrink-0 flex items-center gap-3 px-4 lg:px-7 border-b border-white/8 bg-[#0a0a0a]/95 backdrop-blur-xl">
            {/* Logo móvil */}
            <p className="text-sm font-extrabold text-white lg:hidden">
              <span style={{ color: '#ff7a00' }}>4U</span> STUDIO
            </p>

            <button
              type="button"
              className="hidden lg:grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-white/65"
              aria-label="Menú"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>

            <div className="ml-auto flex items-center gap-2">
              {/* Centro de notificaciones */}
              <NotificationBell />

              <div className="hidden md:flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <div className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-white/10 bg-[#171717] text-sm font-bold text-white">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#0a0a0a] bg-[#ff7a00]" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                  <p className="text-xs text-white/45">{getRoleLabel(role)}</p>
                </div>
              </div>

              {/* Sign out */}
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-xs text-white/55 hover:text-white transition-colors px-3 py-2 rounded-xl border border-white/8 hover:bg-white/5"
                >
                  Salir
                </button>
              </form>
            </div>
          </header>

          {/* Contenido principal */}
          <main className="flex-1 p-4 lg:p-7 overflow-auto pb-20 lg:pb-7">
            <PageWrapper>{children}</PageWrapper>
          </main>
        </div>

        {/* Nav inferior móvil */}
        <MobileBottomNav role={role} />
      </div>
    </RealtimeProvider>
  )
}

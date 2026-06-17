import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase/server'
import AdminSidebar, { MobileMenuDrawer } from './_components/AdminSidebar'
import { RealtimeProvider } from '@/components/admin/RealtimeProvider'
import NotificationBell from '@/components/admin/NotificationBell'
import PageWrapper from './_components/PageWrapper'
import UserMenu from './_components/UserMenu'
import AdminThemeProvider from './_components/AdminThemeProvider'
import ThemeToggle from './_components/ThemeToggle'
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
      <AdminThemeProvider className="min-h-screen flex">
        {/* Sidebar desktop */}
        <AdminSidebar role={role} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header
            className="sticky top-0 z-30 h-20 shrink-0 flex items-center gap-3 px-4 lg:px-7 border-b backdrop-blur-xl"
            style={{ background: 'var(--adm-surface-2)', borderBottomColor: 'var(--adm-border)' }}
          >
            {/* Hamburguesa móvil + drawer */}
            <MobileMenuDrawer role={role} />

            {/* Logo móvil */}
            <Image
              src="/images/icons/Recurso 1.png"
              alt="4U Studio Academy"
              width={90}
              height={28}
              className="object-contain lg:hidden"
              style={{ filter: 'var(--adm-logo-filter)' } as React.CSSProperties}
            />

            <div className="ml-auto flex items-center gap-3">
              <ThemeToggle />
              <NotificationBell />
              <UserMenu
                displayName={displayName}
                roleLabel={getRoleLabel(role)}
                avatarUrl={avatarUrl}
                initials={initials}
              />
            </div>
          </header>

          {/* Contenido principal */}
          <main className="flex-1 p-4 lg:p-7 overflow-auto">
            <PageWrapper>{children}</PageWrapper>
          </main>
        </div>

      </AdminThemeProvider>
    </RealtimeProvider>
  )
}

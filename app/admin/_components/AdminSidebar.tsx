'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { AppRole } from '@/lib/auth/roles'
import { hasAcademicAccess, canAccessSalesDashboard } from '@/lib/auth/roles'

// ── Iconos ────────────────────────────────────────────────────────

const Icon = {
  dashboard: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  agenda: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    </svg>
  ),
  students: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  retention: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 15.5-6.2M21 12a9 9 0 0 1-15.5 6.2" />
      <path d="M18 3v5h-5M6 21v-5h5M12 8v4l3 2" />
    </svg>
  ),
  instructors: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7M18 3l2 2-5 5" />
    </svg>
  ),
  enrollments: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  ventas: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 5h14M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    </svg>
  ),
  leads: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  ),
}

// ── Definición de nav por área ────────────────────────────────────
// Estructura desacoplada: cada item declara qué áreas lo muestran.
// Al migrar /admin/ventas a /business, solo cambia el `href`.

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  area: 'academic' | 'executive' | 'shared'
}

const NAV_ITEMS: NavItem[] = [
  // Shared — visible para todos los roles con acceso al panel
  { href: '/admin',              label: 'Dashboard',    icon: Icon.dashboard,   area: 'shared' },
  // Academic
  { href: '/admin/agenda',       label: 'Agenda',       icon: Icon.agenda,      area: 'academic' },
  { href: '/admin/students',     label: 'Estudiantes',  icon: Icon.students,    area: 'academic' },
  { href: '/admin/reactivacion', label: 'Retención',    icon: Icon.retention,   area: 'academic' },
  { href: '/admin/instructors',  label: 'Instructores', icon: Icon.instructors, area: 'academic' },
  { href: '/admin/enrollments',  label: 'Inscripciones',icon: Icon.enrollments, area: 'academic' },
  // Executive — desacoplado para futura migración a /business o /executive
  { href: '/admin/leads',        label: 'Leads',        icon: Icon.leads,       area: 'executive' },
  { href: '/admin/ventas',       label: 'Ventas',       icon: Icon.ventas,      area: 'executive' },
]

function getVisibleNav(role: AppRole | null): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (item.area === 'shared') return true
    if (item.area === 'academic') return hasAcademicAccess(role)
    if (item.area === 'executive') return canAccessSalesDashboard(role)
    return false
  })
}

// ── Componentes ───────────────────────────────────────────────────

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.href === '/admin'
    ? pathname === '/admin'
    : pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-orange-500/15 text-orange-400' : 'text-white/55 hover:text-white hover:bg-white/5'
      }`}
    >
      {item.icon}
      {item.label}
    </Link>
  )
}

export default function AdminSidebar({ role }: { role: AppRole | null }) {
  const pathname = usePathname()
  const nav = getVisibleNav(role)

  return (
    <aside className="hidden lg:flex w-52 shrink-0 bg-gray-900 border-r border-white/10 flex-col min-h-screen">
      <div className="px-5 py-5 border-b border-white/10">
        <p className="text-base font-extrabold text-white leading-none">
          <span style={{ color: '#ff7a00' }}>4U</span> STUDIO
        </p>
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/35 mt-1">Admin</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
    </aside>
  )
}

export function MobileBottomNav({ role }: { role: AppRole | null }) {
  const pathname = usePathname()
  // Móvil: máximo 5 items — academic primero, executive al final
  const nav = getVisibleNav(role).slice(0, 5)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-white/10 flex safe-area-pb">
      {nav.map((item) => {
        const active = item.href === '/admin'
          ? pathname === '/admin'
          : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-center transition-colors ${
              active ? 'text-orange-400' : 'text-white/40 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { AppRole } from '@/lib/auth/roles'
import { canAccessSalesDashboard, getRoleLabel, hasAcademicAccess, isSuperAdmin } from '@/lib/auth/roles'

const Icon = {
  dashboard: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 13h6V5H4zm10 6h6V5h-6zM4 19h6v-4H4z" />
    </svg>
  ),
  agenda: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M8 2v4M16 2v4M4 9h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    </svg>
  ),
  students: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  retention: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 15.5-6.2" />
      <path d="M21 12a9 9 0 0 1-15.5 6.2" />
      <path d="M18 3v5h-5M6 21v-5h5M12 8v4l3 2" />
    </svg>
  ),
  instructors: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7M18 3l2 2-5 5" />
    </svg>
  ),
  enrollments: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  ),
  ventas: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2 6h13" />
      <circle cx="9" cy="19" r="1.2" />
      <circle cx="18" cy="19" r="1.2" />
    </svg>
  ),
  leads: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="m18 2 4 4-14 14H4v-4Z" />
      <path d="M14 6l4 4" />
    </svg>
  ),
}

type NavItem = {
  href: string
  label: string
  compactLabel: string
  icon: ReactNode
  area: 'academic' | 'executive' | 'shared'
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin',              label: 'Dashboard',    compactLabel: 'Inicio',        icon: Icon.dashboard,   area: 'shared' },
  { href: '/admin/ventas',       label: 'Ventas',       compactLabel: 'Ventas',        icon: Icon.ventas,      area: 'executive' },
  { href: '/admin/leads',        label: 'Leads',        compactLabel: 'Leads',         icon: Icon.leads,       area: 'executive' },
  { href: '/admin/agenda',       label: 'Clases',       compactLabel: 'Clases',        icon: Icon.agenda,      area: 'academic' },
  { href: '/admin/students',     label: 'Estudiantes',  compactLabel: 'Alumnos',       icon: Icon.students,    area: 'academic' },
  { href: '/admin/reactivacion', label: 'Retención',    compactLabel: 'Retención',     icon: Icon.retention,   area: 'academic' },
  { href: '/admin/instructors',  label: 'Instructores', compactLabel: 'Profesores',    icon: Icon.instructors, area: 'academic' },
  { href: '/admin/enrollments',  label: 'Inscripciones',compactLabel: 'Leads nuevos',  icon: Icon.enrollments, area: 'academic' },
]

function getVisibleNav(role: AppRole | null): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (item.area === 'shared') return true
    if (item.area === 'academic') return hasAcademicAccess(role)
    if (item.area === 'executive') return canAccessSalesDashboard(role)
    return false
  })
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.href === '/admin'
    ? pathname === '/admin'
    : pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
      className={[
        'group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all',
        active
          ? 'border-[#ff7a00]/20 bg-[#2a1b12] text-[#ff8a1d] shadow-[0_0_0_1px_rgba(255,122,0,0.08)]'
          : 'border-transparent text-white/78 hover:border-white/10 hover:bg-white/[0.04] hover:text-white',
      ].join(' ')}
    >
      <span className={[
        'grid h-9 w-9 place-items-center rounded-xl border transition-colors',
        active
          ? 'border-[#ff7a00]/25 bg-[#ff7a00]/12 text-[#ff8a1d]'
          : 'border-white/10 bg-white/[0.03] text-white/65 group-hover:text-white',
      ].join(' ')}>
        {item.icon}
      </span>

      <div className="min-w-0">
        <p className="truncate font-medium">{item.label}</p>
        <p className="truncate text-[11px] text-white/32">{item.compactLabel}</p>
      </div>
    </Link>
  )
}

export default function AdminSidebar({ role }: { role: AppRole | null }) {
  const pathname = usePathname()
  const nav = getVisibleNav(role)
  const executiveMode = canAccessSalesDashboard(role)

  return (
    <aside className="hidden lg:flex w-[250px] shrink-0 border-r border-white/8 bg-[#070707] flex-col min-h-screen">
      <div className="px-7 pt-8 pb-6 border-b border-white/8">
        <p className="text-[22px] font-black tracking-tight text-white leading-none">
          <span className="text-[#ff7a00]">4U</span> STUDIO
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.42em] text-white/42">Academy</p>
      </div>

      <div className="px-4 pt-5">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">Acceso</p>
          <p className="mt-1 text-sm font-semibold text-white">{getRoleLabel(role)}</p>
          <p className="text-xs text-white/42">
            {executiveMode ? 'Panel comercial y retención' : 'Panel académico 4U'}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-5 space-y-2">
        {nav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      <div className="px-4 pb-5">
        <div className="overflow-hidden rounded-[26px] border border-white/12 bg-[#0d0d0d]">
          <div className="relative h-44">
            <Image
              src="/images/hero/Banner-principal-2.jpg.jpeg"
              alt="4U Studio Academy"
              fill
              className="object-cover object-[48%_35%] opacity-85"
              sizes="250px"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/75" />
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#ff7a00]/80">4U Studio Academy</p>
            <p className="mt-2 text-sm leading-6 text-white/88">
              {isSuperAdmin(role)
                ? 'Vista ejecutiva para seguir ventas, retención y reactivación.'
                : 'Seguimiento claro para la operación académica y comercial.'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export function MobileBottomNav({ role }: { role: AppRole | null }) {
  const pathname = usePathname()
  const nav = getVisibleNav(role).slice(0, 5)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0b0b0b]/95 backdrop-blur-xl flex safe-area-pb">
      {nav.map((item) => {
        const active = item.href === '/admin'
          ? pathname === '/admin'
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-center transition-colors ${
              active ? 'text-[#ff7a00]' : 'text-white/40 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.compactLabel}</span>
          </Link>
        )
      })}
    </nav>
  )
}

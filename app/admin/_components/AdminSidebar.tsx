'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { AppRole } from '@/lib/auth/roles'
import { canAccessSalesDashboard, getRoleLabel, hasAcademicAccess, isSuperAdmin } from '@/lib/auth/roles'
import { useAdminTheme } from './AdminThemeProvider'

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
  activity: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  pagos: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  ),
  automations: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  metrics: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 4 4 4-6" />
    </svg>
  ),
  reactivacion: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  ),
}

type NavGroup = 'general' | 'comercial' | 'academico' | 'sistema'

type NavItem = {
  href: string
  label: string
  compactLabel: string
  icon: ReactNode
  area: 'academic' | 'executive' | 'shared'
  group: NavGroup
}

const GROUP_LABELS: Record<NavGroup, string> = {
  general:   '',
  comercial: 'Comercial',
  academico: 'Académico',
  sistema:   'Sistema',
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin',                   label: 'Dashboard',      compactLabel: 'Inicio',       icon: Icon.dashboard,    area: 'shared',     group: 'general' },
  { href: '/admin/ventas',            label: 'Comercial',      compactLabel: 'Ingresos',     icon: Icon.ventas,       area: 'executive',  group: 'comercial' },
  { href: '/admin/leads',             label: 'Leads',          compactLabel: 'Prospectos',   icon: Icon.leads,        area: 'executive',  group: 'comercial' },
  { href: '/admin/enrollments',       label: 'Inscripciones',  compactLabel: 'Matrículas',   icon: Icon.enrollments,  area: 'academic',   group: 'comercial' },
  { href: '/admin/pagos',             label: 'Pagos',          compactLabel: 'Cobros',       icon: Icon.pagos,        area: 'executive',  group: 'comercial' },
  { href: '/admin/agenda',            label: 'Clases',         compactLabel: 'Agenda',       icon: Icon.agenda,       area: 'academic',   group: 'academico' },
  { href: '/admin/students',          label: 'Estudiantes',    compactLabel: 'Alumnos',      icon: Icon.students,     area: 'academic',   group: 'academico' },
  { href: '/admin/instructors',       label: 'Instructores',   compactLabel: 'Profesores',   icon: Icon.instructors,  area: 'academic',   group: 'academico' },
  { href: '/admin/retencion',         label: 'Retención',      compactLabel: 'En riesgo',    icon: Icon.retention,    area: 'academic',   group: 'academico' },
  { href: '/admin/reactivacion',      label: 'Recuperación',   compactLabel: 'Inactivos',    icon: Icon.reactivacion, area: 'academic',   group: 'academico' },
  { href: '/admin/academico',         label: 'Indicadores',    compactLabel: 'Métricas',     icon: Icon.metrics,      area: 'academic',   group: 'academico' },
  { href: '/admin/automatizaciones',  label: 'Automatizaciones', compactLabel: 'Automático', icon: Icon.automations,  area: 'shared',     group: 'sistema' },
  { href: '/admin/actividad',         label: 'Actividad',      compactLabel: 'Auditoría',    icon: Icon.activity,     area: 'shared',     group: 'sistema' },
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
      className="group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all"
      style={active ? {
        borderColor: 'var(--adm-accent-border)',
        background: 'var(--adm-nav-active-bg)',
        color: 'var(--adm-accent)',
        boxShadow: '0 0 0 1px var(--adm-accent-shadow)',
      } : {
        borderColor: 'transparent',
        color: 'var(--adm-text-muted)',
      }}
    >
      <span
        className="grid h-9 w-9 place-items-center rounded-xl border transition-colors"
        style={active ? {
          borderColor: 'var(--adm-accent-border)',
          background: 'var(--adm-accent-soft)',
          color: 'var(--adm-accent)',
        } : {
          borderColor: 'var(--adm-border)',
          background: 'var(--adm-card)',
          color: 'var(--adm-text-muted)',
        }}
      >
        {item.icon}
      </span>

      <div className="min-w-0">
        <p className="truncate font-medium">{item.label}</p>
        <p className="truncate text-[11px]" style={{ color: 'var(--adm-text-faint)' }}>{item.compactLabel}</p>
      </div>
    </Link>
  )
}

export default function AdminSidebar({ role }: { role: AppRole | null }) {
  const pathname = usePathname()
  const nav = getVisibleNav(role)
  const executiveMode = canAccessSalesDashboard(role)

  return (
    <aside
      className="hidden lg:flex sticky top-0 h-screen w-[250px] shrink-0 border-r flex-col"
      style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)', boxShadow: 'var(--adm-sidebar-shadow)' }}
    >
      <div className="px-7 pt-8 pb-6 border-b" style={{ borderColor: 'var(--adm-border)' }}>
        <div
          className="inline-flex rounded-2xl px-2 py-1"
          style={{ background: 'var(--adm-logo-bg)', border: '1px solid var(--adm-logo-border)' }}
        >
          <Image
            src="/images/icons/Recurso 1.png"
            alt="4U Studio Academy"
            width={130}
            height={40}
            className="object-contain"
            style={{ filter: 'var(--adm-logo-filter)' } as React.CSSProperties}
          />
        </div>
      </div>

      <div className="px-4 pt-5">
        <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-card)' }}>
          <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: 'var(--adm-text-faint)' }}>Acceso</p>
          <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>{getRoleLabel(role)}</p>
          <p className="text-xs" style={{ color: 'var(--adm-text-muted)' }}>
            {executiveMode ? 'Panel comercial y retención' : 'Panel académico 4U'}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
        {nav.map((item, i) => {
          const prevGroup = i > 0 ? nav[i - 1].group : null
          const showHeader = item.group !== 'general' && item.group !== prevGroup
          return (
            <div key={item.href}>
              {showHeader && (
                <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--adm-text-faint)' }}>
                  {GROUP_LABELS[item.group]}
                </p>
              )}
              <NavLink item={item} pathname={pathname} />
            </div>
          )
        })}
      </nav>

      <div className="mt-auto px-4 pb-5 pt-3">
        <div className="overflow-hidden rounded-[22px] border flex" style={{ borderColor: 'var(--adm-border-2)', background: 'var(--adm-surface-3)' }}>
          <div className="relative w-28 shrink-0">
            <Image
              src="/images/hero/Banner-principal-2.jpg.jpeg"
              alt="4U Studio Academy"
              fill
              className="object-cover object-[48%_35%] opacity-85"
              sizes="112px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent" style={{ '--tw-gradient-to': 'var(--adm-gradient-stop)' } as React.CSSProperties} />
          </div>
          <div className="px-4 py-4">
            <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'var(--adm-brand-muted)' }}>4U Studio Academy</p>
            <p className="mt-1.5 text-xs leading-5" style={{ color: 'var(--adm-text-muted)' }}>
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

export function MobileMenuDrawer({ role }: { role: AppRole | null }) {
  const pathname = usePathname()
  const nav = getVisibleNav(role)
  const { theme } = useAdminTheme()
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])
  React.useEffect(() => { setOpen(false) }, [pathname])

  const portal = mounted ? (
    <div data-admin-theme={theme} style={{ color: 'var(--adm-text)', colorScheme: theme }}>
      {/* Overlay — fuera del header para evitar el stacking context de backdrop-blur */}
      {open && (
        <div
          className="fixed inset-0 z-[100] backdrop-blur-sm lg:hidden"
          style={{ background: 'var(--adm-overlay)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={[
          'fixed inset-y-0 left-0 z-[101] w-[280px] flex flex-col border-r transition-transform duration-300 lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ background: 'var(--adm-surface)', borderColor: 'var(--adm-border)', boxShadow: 'var(--adm-drawer-shadow)' }}
      >
        {/* Header del drawer */}
        <div className="flex items-center justify-between px-6 pt-7 pb-5 border-b" style={{ borderColor: 'var(--adm-border)' }}>
          <div
            className="inline-flex rounded-2xl px-2 py-1"
            style={{ background: 'var(--adm-logo-bg)', border: '1px solid var(--adm-logo-border)' }}
          >
            <Image
              src="/images/icons/Recurso 1.png"
              alt="4U Studio Academy"
              width={110}
              height={34}
              className="object-contain"
              style={{ filter: 'var(--adm-logo-filter)' } as React.CSSProperties}
            />
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-xl border transition-colors"
            style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-card)', color: 'var(--adm-text-muted)' }}
            aria-label="Cerrar menú"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Rol */}
        <div className="px-4 pt-4">
          <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-card)' }}>
            <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: 'var(--adm-text-faint)' }}>Acceso</p>
            <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>{getRoleLabel(role)}</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {nav.map((item, i) => {
            const active = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
            const prevGroup = i > 0 ? nav[i - 1].group : null
            const showHeader = item.group !== 'general' && item.group !== prevGroup

            return (
              <div key={item.href}>
              {showHeader && (
                <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--adm-text-faint)' }}>
                  {GROUP_LABELS[item.group]}
                </p>
              )}
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all"
                style={active ? {
                  borderColor: 'var(--adm-accent-border)',
                  background: 'var(--adm-nav-active-bg)',
                  color: 'var(--adm-accent)',
                } : {
                  borderColor: 'transparent',
                  color: 'var(--adm-text-muted)',
                }}
              >
                <span
                  className="grid h-9 w-9 place-items-center rounded-xl border transition-colors shrink-0"
                  style={active ? {
                    borderColor: 'var(--adm-accent-border)',
                    background: 'var(--adm-accent-soft)',
                    color: 'var(--adm-accent)',
                  } : {
                    borderColor: 'var(--adm-border)',
                    background: 'var(--adm-card)',
                    color: 'var(--adm-text-muted)',
                  }}
                >
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.label}</p>
                  <p className="truncate text-[11px]" style={{ color: 'var(--adm-text-faint)' }}>{item.compactLabel}</p>
                </div>
              </Link>
              </div>
            )
          })}
        </nav>

        {/* Card inferior */}
        <div className="px-4 pb-5 pt-3 border-t" style={{ borderColor: 'var(--adm-border)' }}>
          <div className="overflow-hidden rounded-[18px] border flex" style={{ borderColor: 'var(--adm-border-2)', background: 'var(--adm-surface-3)' }}>
            <div className="relative w-24 shrink-0">
              <Image
                src="/images/hero/Banner-principal-2.jpg.jpeg"
                alt="4U Studio Academy"
                fill
                className="object-cover object-[48%_35%] opacity-85"
                sizes="96px"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent" style={{ '--tw-gradient-to': 'var(--adm-gradient-stop)' } as React.CSSProperties} />
            </div>
            <div className="px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--adm-brand-muted)' }}>4U Studio Academy</p>
              <p className="mt-1 text-[11px] leading-[1.45]" style={{ color: 'var(--adm-text-muted)' }}>
                {isSuperAdmin(role)
                  ? 'Vista ejecutiva para ventas, retención y reactivación.'
                  : 'Seguimiento claro para la operación académica.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      {/* Botón hamburguesa — solo móvil, va en el header */}
      <button
        type="button"
        className="lg:hidden grid h-10 w-10 place-items-center rounded-xl border transition-colors"
        style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-card)', color: 'var(--adm-text-muted)' }}
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {/* Portal: overlay + drawer fuera del header para evitar stacking context */}
      {mounted && createPortal(portal, document.body)}
    </>
  )
}

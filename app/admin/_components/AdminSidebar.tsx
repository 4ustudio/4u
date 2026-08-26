'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { AppRole } from '@/lib/auth/roles'
import { canAccessSalesDashboard, getRoleLabel, hasAcademicAccess } from '@/lib/auth/roles'
import { useAdminTheme } from './AdminThemeProvider'
import {
  MdSpaceDashboard,
  MdCalendarMonth,
  MdGroup,
  MdAutorenew,
  MdSchool,
  MdShoppingCart,
  MdPersonAddAlt,
  MdShowChart,
  MdCreditCard,
  MdBolt,
  MdBarChart,
  MdClose,
  MdMenu,
} from 'react-icons/md'

const Icon = {
  dashboard:    <MdSpaceDashboard className="h-5 w-5" aria-hidden="true" />,
  agenda:       <MdCalendarMonth className="h-5 w-5" aria-hidden="true" />,
  students:     <MdGroup className="h-5 w-5" aria-hidden="true" />,
  retention:    <MdAutorenew className="h-5 w-5" aria-hidden="true" />,
  instructors:  <MdSchool className="h-5 w-5" aria-hidden="true" />,
  ventas:       <MdShoppingCart className="h-5 w-5" aria-hidden="true" />,
  leads:        <MdPersonAddAlt className="h-5 w-5" aria-hidden="true" />,
  activity:     <MdShowChart className="h-5 w-5" aria-hidden="true" />,
  pagos:        <MdCreditCard className="h-5 w-5" aria-hidden="true" />,
  automations:  <MdBolt className="h-5 w-5" aria-hidden="true" />,
  metrics:      <MdBarChart className="h-5 w-5" aria-hidden="true" />,
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
  { href: '/admin/leads',             label: 'Matrículas',     compactLabel: 'Matrículas',   icon: Icon.leads,        area: 'executive',  group: 'comercial' },
  { href: '/admin/pagos',             label: 'Pagos',          compactLabel: 'Cobros',       icon: Icon.pagos,        area: 'executive',  group: 'comercial' },
  { href: '/admin/agenda',            label: 'Clases',         compactLabel: 'Agenda',       icon: Icon.agenda,       area: 'academic',   group: 'academico' },
  { href: '/admin/students',          label: 'Estudiantes',    compactLabel: 'Alumnos',      icon: Icon.students,     area: 'academic',   group: 'academico' },
  { href: '/admin/instructors',       label: 'Instructores',   compactLabel: 'Profesores',   icon: Icon.instructors,  area: 'academic',   group: 'academico' },
  { href: '/admin/seguimiento',       label: 'Seguimiento',    compactLabel: 'Alumnos',      icon: Icon.retention,    area: 'academic',   group: 'academico' },
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
        <Link
          href="/"
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
        </Link>
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
          <Link
            href="/"
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
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-xl border transition-colors"
            style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-card)', color: 'var(--adm-text-muted)' }}
            aria-label="Cerrar menú"
          >
            <MdClose className="h-4 w-4" aria-hidden="true" />
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
        <MdMenu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Portal: overlay + drawer fuera del header para evitar stacking context */}
      {mounted && createPortal(portal, document.body)}
    </>
  )
}

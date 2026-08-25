'use client'

import { useState, useRef, useEffect } from 'react'
import { MdExpandMore, MdLogout } from 'react-icons/md'
import { signOutAction } from '@/app/admin/_actions/auth'

interface Props {
  displayName: string
  roleLabel: string
  avatarUrl: string | null
  initials: string
}

export default function UserMenu({ displayName, roleLabel, avatarUrl, initials }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 rounded-2xl border px-3 py-2 transition-colors"
        style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-surface)', boxShadow: 'var(--adm-card-shadow)' }}
      >
        {/* Avatar */}
        <div
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border text-sm font-bold grid place-items-center"
          style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-surface-3)', color: 'var(--adm-text)' }}
        >
          {avatarUrl
            ? <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            : initials}
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2" style={{ borderColor: 'var(--adm-status-dot)', background: 'var(--adm-accent)' }} />
        </div>

        {/* Nombre + rol */}
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-semibold leading-tight" style={{ color: 'var(--adm-text)' }}>{displayName}</p>
          <p className="text-xs leading-tight" style={{ color: 'var(--adm-text-muted)' }}>{roleLabel}</p>
        </div>

        {/* Chevron */}
        <MdExpandMore
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--adm-text-faint)' }}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-48 rounded-2xl border overflow-hidden z-50"
          style={{
            borderColor: 'var(--adm-border)',
            background: 'var(--adm-surface)',
            boxShadow: 'var(--adm-shadow)',
          }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--adm-border)' }}>
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--adm-text)' }}>{displayName}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--adm-text-faint)' }}>{roleLabel}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors text-left"
              style={{ color: 'var(--adm-text-muted)' }}
            >
              <MdLogout className="h-4 w-4" aria-hidden="true" />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

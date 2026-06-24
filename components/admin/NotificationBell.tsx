'use client'

import { useState, useEffect, useRef } from 'react'
import { useRealtime, type AdminNotif, type ConnectionStatus } from './RealtimeProvider'

// ── Utilidades ────────────────────────────────────────────────

function timeAgo(d: Date): string {
  const m = Math.floor((Date.now() - d.getTime()) / 60000)
  if (m < 1)  return 'Ahora mismo'
  if (m < 60) return `Hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  return `Hace ${Math.floor(h / 24)}d`
}

// ── Icono por tipo ────────────────────────────────────────────

const TYPE_CONFIG = {
  enrollment: {
    dot: 'var(--adm-accent)',
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    bg: { background: 'var(--adm-accent-soft)', color: 'var(--adm-accent)' },
  },
  session: {
    dot: 'var(--adm-text-muted)',
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
      </svg>
    ),
    bg: { background: 'var(--adm-neutral-soft)', color: 'var(--adm-text-muted)' },
  },
  conversion: {
    dot: 'var(--adm-info)',
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <polyline points="16 11 18 13 22 9"/>
      </svg>
    ),
    bg: { background: 'var(--adm-info-soft)', color: 'var(--adm-info)' },
  },
  student: {
    dot: 'var(--adm-success)',
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
        <path d="M20 8v4M18 10h4"/>
      </svg>
    ),
    bg: { background: 'var(--adm-success-soft)', color: 'var(--adm-success)' },
  },
  payment: {
    dot: 'var(--adm-accent)',
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
    bg: { background: 'var(--adm-accent-soft)', color: 'var(--adm-accent)' },
  },
} as const

// ── ConnectionDot ─────────────────────────────────────────────

export function ConnectionDot({ status }: { status: ConnectionStatus }) {
  const cfg = {
    connected:    { dot: 'var(--adm-success)', pulse: 'var(--adm-success)', label: 'En línea' },
    connecting:   { dot: 'var(--adm-warning)', pulse: 'var(--adm-warning)', label: 'Conectando' },
    disconnected: { dot: 'var(--adm-danger)', pulse: '', label: 'Desconectado' },
  }[status]

  return (
    <span title={cfg.label} className="relative flex h-2 w-2">
      {cfg.pulse && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: cfg.pulse }} />}
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: cfg.dot }} />
    </span>
  )
}

// ── Notification item ─────────────────────────────────────────

function NotifItem({ n }: { n: AdminNotif }) {
  const cfg = TYPE_CONFIG[n.type]
  return (
    <div className={`flex gap-3 px-4 py-3 transition-colors ${n.read ? 'opacity-60' : ''}`}>
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={cfg.bg}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold" style={{ color: n.read ? 'var(--adm-text-muted)' : 'var(--adm-title)' }}>{n.title}</p>
          <span className="shrink-0 whitespace-nowrap text-[10px]" style={{ color: 'var(--adm-text-faint)' }}>{timeAgo(n.timestamp)}</span>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--adm-text-muted)' }}>{n.body}</p>
      </div>
      {!n.read && <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: cfg.dot }} />}
    </div>
  )
}

// ── Bell principal ────────────────────────────────────────────

export default function NotificationBell() {
  const { notifications, unreadCount, connectionStatus, soundEnabled, markAllRead, toggleSound, clearAll } = useRealtime()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function handleOpen() {
    setOpen(v => !v)
    if (!open) markAllRead()
  }

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      {/* Dot de conexión */}
      <ConnectionDot status={connectionStatus} />

      {/* Campana */}
      <button
        onClick={handleOpen}
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} nuevas)` : ''}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all"
        style={{ color: 'var(--adm-text-muted)', borderColor: 'var(--adm-border)', background: 'var(--adm-surface)', boxShadow: 'var(--adm-card-shadow)' }}
      >
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ backgroundColor: 'var(--adm-accent)' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="fixed inset-x-3 top-16 z-[70] w-auto overflow-hidden rounded-2xl border sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[340px]"
          style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-surface)', boxShadow: 'var(--adm-shadow)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--adm-border)' }}>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--adm-title)' }}>Notificaciones</p>
              <p className="mt-0.5 text-[10px]" style={{ color: 'var(--adm-text-faint)' }}>
                {notifications.length === 0 ? 'Sin actividad' : `${notifications.length} evento${notifications.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {/* Sonido */}
              <button
                onClick={toggleSound}
                title={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                style={{ color: 'var(--adm-text-faint)' }}
              >
                {soundEnabled ? (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                  </svg>
                )}
              </button>
              {/* Limpiar */}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  title="Limpiar todo"
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                  style={{ color: 'var(--adm-text-faint)' }}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Lista */}
          <div className="overflow-y-auto max-h-[60vh] sm:max-h-[420px]">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div
                  className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: 'var(--adm-neutral-soft)', color: 'var(--adm-text-faint)' }}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <p className="text-xs font-medium" style={{ color: 'var(--adm-text-muted)' }}>Sin notificaciones</p>
                <p className="mt-1 text-[10px]" style={{ color: 'var(--adm-text-faint)' }}>Los eventos aparecerán aquí en tiempo real</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                {notifications.map(n => <NotifItem key={n.id} n={n} />)}
              </div>
            )}
          </div>

          {/* Footer con estado */}
          <div className="flex items-center gap-2 border-t px-4 py-2.5" style={{ borderColor: 'var(--adm-border)' }}>
            <ConnectionDot status={connectionStatus} />
            <span className="text-[10px]" style={{ color: 'var(--adm-text-faint)' }}>
              {connectionStatus === 'connected'    ? 'Actualización en tiempo real activa' :
               connectionStatus === 'connecting'   ? 'Conectando al servidor…' :
               'Sin conexión — actualizando…'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

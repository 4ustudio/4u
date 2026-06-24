'use client'

import { useRealtime, type AdminNotif } from '@/components/admin/RealtimeProvider'

// ── Utilidades ────────────────────────────────────────────────

function timeAgo(d: Date): string {
  const m = Math.floor((Date.now() - d.getTime()) / 60000)
  if (m < 1) return 'Ahora mismo'
  if (m < 60) return `Hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  return `Hace ${Math.floor(h / 24)}d`
}

const ICON_BG: Record<AdminNotif['type'], string> = {
  enrollment: 'adm-activity-icon enrollment',
  session:    'adm-activity-icon session',
  conversion: 'adm-activity-icon conversion',
  student:    'adm-activity-icon student',
  payment:    'adm-activity-icon payment',
}

const ICONS: Record<AdminNotif['type'], React.ReactNode> = {
  enrollment: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  session: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
    </svg>
  ),
  conversion: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
    </svg>
  ),
  student: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M20 8v4M18 10h4"/>
    </svg>
  ),
  payment: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
    </svg>
  ),
}

// ── ActivityFeed ──────────────────────────────────────────────

export function ActivityFeed() {
  const { notifications } = useRealtime()

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div
          className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: 'var(--adm-neutral-soft)', color: 'var(--adm-text-faint)' }}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <p className="text-xs font-medium" style={{ color: 'var(--adm-text-muted)' }}>Sin actividad reciente</p>
        <p className="mt-1 text-[10px]" style={{ color: 'var(--adm-text-faint)' }}>Los eventos aparecerán aquí en tiempo real</p>
      </div>
    )
  }

  return (
    <div className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
      {notifications.slice(0, 20).map(n => (
        <div key={n.id} className="flex items-start gap-3 px-4 py-3">
          <div
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${ICON_BG[n.type]}`}
            style={n.type === 'enrollment'
              ? { background: 'var(--adm-accent-soft)', color: 'var(--adm-accent)' }
              : n.type === 'session'
                ? { background: 'var(--adm-neutral-soft)', color: 'var(--adm-text-muted)' }
                : n.type === 'conversion'
                  ? { background: 'var(--adm-info-soft)', color: 'var(--adm-info)' }
                  : { background: 'var(--adm-success-soft)', color: 'var(--adm-success)' }}
          >
            {ICONS[n.type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--adm-title)' }}>{n.title}</p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--adm-text-muted)' }}>{n.body}</p>
          </div>
          <span className="shrink-0 whitespace-nowrap text-[10px]" style={{ color: 'var(--adm-text-faint)' }}>{timeAgo(n.timestamp)}</span>
        </div>
      ))}
    </div>
  )
}

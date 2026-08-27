'use client'

import { MdDescription, MdCalendarMonth, MdPersonAddAlt, MdGroupAdd, MdCreditCard, MdHistory, MdCheckCircle, MdWarningAmber, MdErrorOutline } from 'react-icons/md'
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
  enrollment:    'adm-activity-icon enrollment',
  session:       'adm-activity-icon session',
  conversion:    'adm-activity-icon conversion',
  student:       'adm-activity-icon student',
  payment:       'adm-activity-icon payment',
  attendance:    'adm-activity-icon session',
  risk:          'adm-activity-icon payment',
  payment_alert: 'adm-activity-icon payment',
}

const ICONS: Record<AdminNotif['type'], React.ReactNode> = {
  enrollment:    <MdDescription className="h-3.5 w-3.5" />,
  session:       <MdCalendarMonth className="h-3.5 w-3.5" />,
  conversion:    <MdPersonAddAlt className="h-3.5 w-3.5" />,
  student:       <MdGroupAdd className="h-3.5 w-3.5" />,
  payment:       <MdCreditCard className="h-3.5 w-3.5" />,
  attendance:    <MdCheckCircle className="h-3.5 w-3.5" />,
  risk:          <MdWarningAmber className="h-3.5 w-3.5" />,
  payment_alert: <MdErrorOutline className="h-3.5 w-3.5" />,
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
          <MdHistory className="h-5 w-5" />
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
              : n.type === 'session' || n.type === 'attendance'
                ? { background: 'var(--adm-neutral-soft)', color: 'var(--adm-text-muted)' }
                : n.type === 'conversion'
                  ? { background: 'var(--adm-info-soft)', color: 'var(--adm-info)' }
                  : n.severity === 'critical'
                    ? { background: 'var(--adm-danger-soft)', color: 'var(--adm-danger)' }
                    : n.severity === 'warning'
                      ? { background: 'var(--adm-warning-soft)', color: 'var(--adm-warning)' }
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

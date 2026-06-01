'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useRealtime, type AdminNotif } from '@/components/admin/RealtimeProvider'

// ── DashboardRefresher ────────────────────────────────────────
// Escucha cambios en tablas clave y dispara router.refresh()
// para que el Server Component padre obtenga datos frescos.

export function DashboardRefresher() {
  const router = useRouter()

  useEffect(() => {
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    let timer: ReturnType<typeof setTimeout>

    function scheduleRefresh() {
      clearTimeout(timer)
      timer = setTimeout(() => router.refresh(), 800)
    }

    const ch = sb
      .channel('dashboard-data-refresh')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'enrollments' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_sessions' }, scheduleRefresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'students' }, scheduleRefresh)
      .subscribe()

    return () => {
      clearTimeout(timer)
      sb.removeChannel(ch)
    }
  }, [router])

  return null
}

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
  enrollment: 'bg-orange-500/10 text-orange-400',
  session:    'bg-blue-500/10 text-blue-400',
  conversion: 'bg-purple-500/10 text-purple-400',
  student:    'bg-green-500/10 text-green-400',
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
}

// ── ActivityFeed ──────────────────────────────────────────────

export function ActivityFeed() {
  const { notifications } = useRealtime()

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <svg className="h-5 w-5 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <p className="text-xs text-white/30">Sin actividad reciente</p>
        <p className="text-[10px] text-white/20 mt-1">Los eventos aparecerán aquí en tiempo real</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-white/[0.05]">
      {notifications.slice(0, 20).map(n => (
        <div key={n.id} className="flex items-start gap-3 px-4 py-3">
          <div className={`mt-0.5 h-7 w-7 shrink-0 rounded-full flex items-center justify-center ${ICON_BG[n.type]}`}>
            {ICONS[n.type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/80">{n.title}</p>
            <p className="text-xs text-white/45 mt-0.5">{n.body}</p>
          </div>
          <span className="text-[10px] text-white/25 shrink-0 whitespace-nowrap">{timeAgo(n.timestamp)}</span>
        </div>
      ))}
    </div>
  )
}

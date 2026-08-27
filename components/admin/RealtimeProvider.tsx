'use client'

import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, type ReactNode,
} from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { isAdmin, type AppRole } from '@/lib/auth/roles'
import { getInitialBellFeed } from '@/app/admin/_actions/notification-feed'

// ── Tipos ─────────────────────────────────────────────────────

export type NotifType = 'enrollment' | 'session' | 'conversion' | 'student' | 'payment' | 'attendance' | 'risk' | 'payment_alert'
export type Severity = 'info' | 'warning' | 'critical'

const copFmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const LAST_SEEN_KEY = '4u_admin_last_seen'

export interface AdminNotif {
  id:        string
  kind:      'event' | 'alert'  // event = efímero (system_activity_log), alert = persiste hasta resolverse (retention_alerts)
  type:      NotifType
  title:     string
  body:      string
  timestamp: Date
  read:      boolean
  severity?: Severity
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

interface RealtimeCtx {
  notifications:    AdminNotif[]
  unreadCount:      number
  connectionStatus: ConnectionStatus
  soundEnabled:     boolean
  markAllRead:      () => void
  toggleSound:      () => void
  clearAll:         () => void
}

// ── Contexto ──────────────────────────────────────────────────

const Ctx = createContext<RealtimeCtx>({
  notifications: [], unreadCount: 0, connectionStatus: 'connecting',
  soundEnabled: true, markAllRead: () => {}, toggleSound: () => {}, clearAll: () => {},
})

export function useRealtime() { return useContext(Ctx) }

function readSoundPreference() {
  try {
    return window.localStorage.getItem('4u_admin_sound')
  } catch {
    return null
  }
}

function writeSoundPreference(value: boolean) {
  try {
    window.localStorage.setItem('4u_admin_sound', String(value))
  } catch {
    // Ignore storage issues in embedded/private browsing contexts.
  }
}

function readLastSeen(): number {
  try {
    const raw = window.localStorage.getItem(LAST_SEEN_KEY)
    return raw ? new Date(raw).getTime() : 0
  } catch {
    return 0
  }
}

function writeLastSeen(ms: number) {
  try {
    window.localStorage.setItem(LAST_SEEN_KEY, new Date(ms).toISOString())
  } catch {
    // Ignore storage issues in embedded/private browsing contexts.
  }
}

// ── Mapeo action/alert_type → tipo + título humano ─────────────

const ACTION_TITLE: Record<string, string> = {
  'attendance.confirmed':       'Clase completada',
  'attendance.no_show':         'Inasistencia registrada',
  'payment.overdue':            'Pago vencido',
  'payment.received':           'Pago recibido',
  'retention.status_changed':   'Cambio de estado de riesgo',
}

function typeForAction(action: string): NotifType {
  if (action.startsWith('attendance.')) return 'attendance'
  if (action.startsWith('payment.'))    return 'payment'
  if (action.startsWith('retention.'))  return 'risk'
  return 'session'
}

function titleForAction(action: string): string {
  return ACTION_TITLE[action] ?? action
}

// ── Audio: ping suave vía Web Audio API ───────────────────────

function playPing() {
  try {
    const ac   = new AudioContext()
    const osc  = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ac.currentTime)
    osc.frequency.exponentialRampToValueAtTime(660, ac.currentTime + 0.12)
    gain.gain.setValueAtTime(0, ac.currentTime)
    gain.gain.linearRampToValueAtTime(0.1, ac.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.45)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + 0.5)
    setTimeout(() => ac.close(), 600)
  } catch { /* AudioContext no disponible (SSR / test) */ }
}

// ── Provider ──────────────────────────────────────────────────

export function RealtimeProvider({ children, role }: { children: ReactNode; role: AppRole | null }) {
  const [notifications, setNotifications] = useState<AdminNotif[]>([])
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [soundEnabled, setSoundEnabled]         = useState(true)
  const soundRef    = useRef(true)
  const lastSeenRef = useRef(0)

  // Cargar preferencias desde localStorage
  useEffect(() => {
    const pref = readSoundPreference()
    const on   = pref !== 'false'
    setSoundEnabled(on)
    soundRef.current = on
    lastSeenRef.current = readLastSeen()
  }, [])

  const addNotif = useCallback((n: Omit<AdminNotif, 'read'>) => {
    setNotifications(prev => {
      if (prev.some(x => x.id === n.id)) return prev
      const read = n.timestamp.getTime() <= lastSeenRef.current
      return [{ ...n, read }, ...prev].slice(0, 50)
    })
    if (soundRef.current) playPing()
  }, [])

  // ── Supabase Realtime: eventos generales (todo el staff) ────
  useEffect(() => {
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = sb
      .channel('admin-global-notifications')
      // Nueva inscripción
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'enrollments' },
        ({ new: row }) => {
          addNotif({
            id:        crypto.randomUUID(),
            kind:      'event',
            type:      'enrollment',
            title:     'Nueva inscripción',
            body:      `${row.student_name} quiere estudiar ${row.course_interest}`,
            timestamp: new Date(),
          })
        }
      )
      // Lead convertido a estudiante
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'enrollments' },
        ({ new: row }) => {
          if (row.status === 'converted') {
            addNotif({
              id:        crypto.randomUUID(),
              kind:      'event',
              type:      'conversion',
              title:     'Lead convertido',
              body:      `${row.student_name} es ahora estudiante activo`,
              timestamp: new Date(),
            })
          }
        }
      )
      // Nueva clase agendada
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'class_sessions' },
        ({ new: row }) => {
          const dateStr = row.scheduled_date
            ? new Date(row.scheduled_date + 'T12:00:00').toLocaleDateString('es-CO', {
                weekday: 'short', day: 'numeric', month: 'short',
              })
            : ''
          addNotif({
            id:        crypto.randomUUID(),
            kind:      'event',
            type:      'session',
            title:     'Clase agendada',
            body:      `Nueva clase el ${dateStr} a las ${(row.start_time ?? '').slice(0, 5)}`,
            timestamp: new Date(),
          })
        }
      )
      // Nuevo estudiante creado
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'students' },
        ({ new: row }) => {
          addNotif({
            id:        crypto.randomUUID(),
            kind:      'event',
            type:      'student',
            title:     'Nuevo estudiante',
            body:      `${row.name} fue registrado en el sistema`,
            timestamp: new Date(),
          })
        }
      )
      // Nuevo cobro generado
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' },
        ({ new: row }) => {
          addNotif({
            id:        crypto.randomUUID(),
            kind:      'event',
            type:      'payment',
            title:     'Nuevo cobro generado',
            body:      `${copFmt.format(Number(row.final_amount))}${row.plan_name ? ` · ${row.plan_name}` : ''}`,
            timestamp: new Date(),
          })
        }
      )
      // Pago registrado (status → paid)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'payments' },
        ({ new: row, old }) => {
          if (row.status === 'paid' && old?.status !== 'paid') {
            addNotif({
              id:        crypto.randomUUID(),
              kind:      'event',
              type:      'payment',
              title:     'Pago recibido',
              body:      `${copFmt.format(Number(row.final_amount))}${row.payment_method ? ` vía ${row.payment_method}` : ''}`,
              timestamp: new Date(),
            })
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED')    setConnectionStatus('connected')
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')
          setConnectionStatus('disconnected')
        else setConnectionStatus('connecting')
      })

    return () => { sb.removeChannel(channel) }
  }, [addNotif])

  // ── Alertas admin: carga inicial + Realtime sobre system_activity_log
  // y retention_alerts. Solo admin/super_admin/owner — pago pendiente,
  // estudiante en riesgo, instructor tomó clase.
  useEffect(() => {
    if (!isAdmin(role)) return

    let cancelled = false
    getInitialBellFeed().then(({ events, alerts }) => {
      if (cancelled) return
      const seeded: Array<Omit<AdminNotif, 'read'>> = [
        ...events.map(e => ({
          id:        e.id,
          kind:      'event' as const,
          type:      typeForAction(e.action),
          title:     titleForAction(e.action),
          body:      e.description ?? '',
          timestamp: new Date(e.created_at),
          severity:  e.severity,
        })),
        ...alerts.map(a => ({
          id:        a.id,
          kind:      'alert' as const,
          type:      (a.alert_type.startsWith('payment_') ? 'payment_alert' : 'risk') as NotifType,
          title:     a.title,
          body:      a.message,
          timestamp: new Date(a.created_at),
          severity:  a.severity,
        })),
      ].sort((x, y) => y.timestamp.getTime() - x.timestamp.getTime())

      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id))
        const merged = [
          ...seeded
            .filter(n => !existingIds.has(n.id))
            .map(n => ({ ...n, read: n.timestamp.getTime() <= lastSeenRef.current })),
          ...prev,
        ]
        return merged.slice(0, 80)
      })
    })

    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = sb
      .channel('admin-bell-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_activity_log' },
        ({ new: row }) => {
          const bellWorthy = row.severity === 'warning' || row.severity === 'critical' || row.action === 'attendance.confirmed'
          if (!bellWorthy) return
          addNotif({
            id:        row.id,
            kind:      'event',
            type:      typeForAction(row.action),
            title:     titleForAction(row.action),
            body:      row.description ?? '',
            timestamp: new Date(row.created_at),
            severity:  row.severity,
          })
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'retention_alerts' },
        ({ new: row }) => {
          if (row.status !== 'open') return
          addNotif({
            id:        row.id,
            kind:      'alert',
            type:      row.alert_type?.startsWith('payment_') ? 'payment_alert' : 'risk',
            title:     row.title,
            body:      row.message,
            timestamp: new Date(row.created_at),
            severity:  row.severity,
          })
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'retention_alerts' },
        ({ new: row }) => {
          if (row.status === 'open') return
          setNotifications(prev => prev.filter(n => n.id !== row.id))
        }
      )
      .subscribe()

    return () => { cancelled = true; sb.removeChannel(channel) }
  }, [role, addNotif])

  const markAllRead = useCallback(() => {
    const now = Date.now()
    lastSeenRef.current = now
    writeLastSeen(now)
    setNotifications(p => p.map(n => ({ ...n, read: true })))
  }, [])

  // Las alertas persistentes (kind 'alert') solo desaparecen al resolverse
  // en servidor — "limpiarlas" localmente daría falsa sensación de que ya
  // no hay riesgo/mora.
  const clearAll = useCallback(() => setNotifications(p => p.filter(n => n.kind === 'alert')), [])

  const toggleSound  = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev
      soundRef.current = next
      writeSoundPreference(next)
      return next
    })
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Ctx.Provider value={{
      notifications, unreadCount, connectionStatus,
      soundEnabled, markAllRead, toggleSound, clearAll,
    }}>
      {children}
    </Ctx.Provider>
  )
}

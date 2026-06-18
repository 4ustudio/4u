'use client'

import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, type ReactNode,
} from 'react'
import { createBrowserClient } from '@supabase/ssr'

// ── Tipos ─────────────────────────────────────────────────────

export type NotifType = 'enrollment' | 'session' | 'conversion' | 'student'

export interface AdminNotif {
  id:        string
  type:      NotifType
  title:     string
  body:      string
  timestamp: Date
  read:      boolean
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

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AdminNotif[]>([])
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [soundEnabled, setSoundEnabled]         = useState(true)
  const soundRef = useRef(true)

  // Cargar preferencia de sonido desde localStorage
  useEffect(() => {
    const pref = readSoundPreference()
    const on   = pref !== 'false'
    setSoundEnabled(on)
    soundRef.current = on
  }, [])

  const addNotif = useCallback((n: Omit<AdminNotif, 'id' | 'read'>) => {
    setNotifications(prev => [
      { ...n, id: crypto.randomUUID(), read: false },
      ...prev,
    ].slice(0, 50))
    if (soundRef.current) playPing()
  }, [])

  // ── Supabase Realtime ──────────────────────────────────────
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
            type:      'student',
            title:     'Nuevo estudiante',
            body:      `${row.name} fue registrado en el sistema`,
            timestamp: new Date(),
          })
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

  const markAllRead  = useCallback(() => setNotifications(p => p.map(n => ({ ...n, read: true }))), [])
  const clearAll     = useCallback(() => setNotifications([]), [])
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

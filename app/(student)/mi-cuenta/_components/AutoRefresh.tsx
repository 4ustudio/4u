'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AutoRefresh({ studentId }: { studentId?: string }) {
  const router = useRouter()

  const refresh = useCallback(() => router.refresh(), [router])

  useEffect(() => {
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    let disposed = false
    let retry: ReturnType<typeof setTimeout> | undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any

    const subscribe = () => {
      if (disposed) return
      // Nombre único por suscripción: evita reutilizar un canal ya suscrito
      // (causa de "cannot add postgres_changes callbacks after subscribe()").
      const name = `student-sessions-${studentId ?? 'all'}-${Date.now()}`
      channel = sb
        .channel(name)
        .on('postgres_changes', {
          event:  '*',
          schema: 'public',
          table:  'class_sessions',
          ...(studentId ? { filter: `student_id=eq.${studentId}` } : {}),
        }, () => refresh())
        .subscribe((status) => {
          // Solo reintentar ante fallos reales; 'CLOSED' ocurre en el
          // desmontaje normal y no debe disparar una re-suscripción.
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(retry)
            retry = setTimeout(() => {
              if (disposed) return
              if (channel) sb.removeChannel(channel)
              subscribe()
            }, 3000)
          }
        })
    }

    subscribe()

    // Fallback polling cada 20s
    const timer = setInterval(refresh, 20_000)

    // Refresh al volver al tab
    const onVisible = () => { if (!document.hidden) refresh() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      disposed = true
      clearTimeout(retry)
      if (channel) sb.removeChannel(channel)
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh, studentId])

  return null
}

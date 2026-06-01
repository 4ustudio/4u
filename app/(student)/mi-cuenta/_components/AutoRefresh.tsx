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

    let retry: ReturnType<typeof setTimeout> | undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any

    const subscribe = () => {
      channel = sb
        .channel('student-sessions-refresh')
        .on('postgres_changes', {
          event:  '*',
          schema: 'public',
          table:  'class_sessions',
          ...(studentId ? { filter: `student_id=eq.${studentId}` } : {}),
        }, () => refresh())
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            clearTimeout(retry)
            retry = setTimeout(() => {
              sb.removeChannel(channel)
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
      clearTimeout(retry)
      if (channel) sb.removeChannel(channel)
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh, studentId])

  return null
}

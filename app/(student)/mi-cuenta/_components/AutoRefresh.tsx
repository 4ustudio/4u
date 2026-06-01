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

    // Realtime: escuchar cambios en class_sessions del estudiante
    const channel = sb
      .channel('student-sessions-refresh')
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'class_sessions',
        ...(studentId ? { filter: `student_id=eq.${studentId}` } : {}),
      }, () => refresh())
      .subscribe()

    // Fallback polling cada 30s
    const timer = setInterval(refresh, 30_000)

    // Refresh al volver al tab
    const onVisible = () => { if (!document.hidden) refresh() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      sb.removeChannel(channel)
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh, studentId])

  return null
}

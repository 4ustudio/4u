'use client'

import { useEffect } from 'react'
import { linkAnonJourneys } from '@/app/(student)/_actions/music4u'

export default function LinkAnonJourneys({ userId }: { userId: string }) {
  useEffect(() => {
    const key = localStorage.getItem('music_anon_key')
    if (!key) return
    linkAnonJourneys(userId, key).catch(() => null)
  }, [userId])

  return null
}

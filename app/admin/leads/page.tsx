import { Suspense } from 'react'
import { getEnrollments } from '../_actions/enrollments'
import LeadsClient from './LeadsClient'
import type { EnrollmentRow } from '@/types/enrollment'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const { data } = await getEnrollments()

  return (
    <Suspense>
      <LeadsClient initialEnrollments={(data ?? []) as EnrollmentRow[]} />
    </Suspense>
  )
}

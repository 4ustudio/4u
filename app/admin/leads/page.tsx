import { Suspense } from 'react'
import { getEnrollments, getActiveInstructorsLite } from '../_actions/enrollments'
import LeadsClient from './LeadsClient'
import type { EnrollmentRow } from '@/types/enrollment'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const [{ data }, instructors] = await Promise.all([
    getEnrollments(),
    getActiveInstructorsLite(),
  ])

  return (
    <Suspense>
      <LeadsClient initialEnrollments={(data ?? []) as EnrollmentRow[]} instructors={instructors} />
    </Suspense>
  )
}

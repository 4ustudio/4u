import { Suspense } from 'react'
import { getEnrollments, getActiveInstructorsLite } from '../_actions/enrollments'
import { getCachedClassrooms } from '@/lib/cache/catalogs'
import LeadsClient from './LeadsClient'
import type { EnrollmentRow } from '@/types/enrollment'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const [{ data }, instructors, classrooms] = await Promise.all([
    getEnrollments(),
    getActiveInstructorsLite(),
    getCachedClassrooms(),
  ])

  return (
    <Suspense>
      <LeadsClient
        initialEnrollments={(data ?? []) as EnrollmentRow[]}
        instructors={instructors}
        classrooms={classrooms}
      />
    </Suspense>
  )
}

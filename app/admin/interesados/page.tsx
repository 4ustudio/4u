import { Suspense } from 'react'
import { getInterestedLeads, getActiveInstructorsLite } from '../_actions/enrollments'
import { getCachedClassrooms } from '@/lib/cache/catalogs'
import { bogotaDateStr } from '@/lib/tz'
import InterestedClient from './InterestedClient'

export const dynamic = 'force-dynamic'

export default async function InteresadosPage() {
  const [{ data }, instructors, classrooms] = await Promise.all([
    getInterestedLeads(),
    getActiveInstructorsLite(),
    getCachedClassrooms(),
  ])

  return (
    <Suspense>
      <InterestedClient
        leads={data}
        instructors={instructors}
        classrooms={classrooms}
        today={bogotaDateStr()}
      />
    </Suspense>
  )
}

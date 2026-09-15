import { Suspense } from 'react'
import { getInterestedLeads, getActiveInstructorsLite } from '../_actions/enrollments'
import { bogotaDateStr } from '@/lib/tz'
import InterestedClient from './InterestedClient'

export const dynamic = 'force-dynamic'

export default async function InteresadosPage() {
  const [{ data }, instructors] = await Promise.all([
    getInterestedLeads(),
    getActiveInstructorsLite(),
  ])

  return (
    <Suspense>
      <InterestedClient leads={data} instructors={instructors} today={bogotaDateStr()} />
    </Suspense>
  )
}

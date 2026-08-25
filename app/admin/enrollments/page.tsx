import { getEnrollments } from '../_actions/enrollments'
import EnrollmentsClient from './EnrollmentsClient'
import type { EnrollmentRow } from '@/types/enrollment'

export const dynamic = 'force-dynamic'

export default async function EnrollmentsPage() {
  const { data } = await getEnrollments()

  return <EnrollmentsClient initialEnrollments={(data ?? []) as EnrollmentRow[]} />
}

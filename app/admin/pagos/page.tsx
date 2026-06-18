import { getPayments, getPaymentMetrics, getBoldMetrics, getStudentsForSearch, getEnrollmentsForSearch } from './_actions'
import PagosClient from './PagosClient'
import PageWrapper from '../_components/PageWrapper'

export const dynamic = 'force-dynamic'

export default async function PagosPage() {
  const [paymentsResult, metrics, boldMetrics, students, enrollments] = await Promise.all([
    getPayments('all', '', 1),
    getPaymentMetrics(),
    getBoldMetrics(),
    getStudentsForSearch(),
    getEnrollmentsForSearch(),
  ])

  return (
    <PageWrapper>
      <div className="mx-auto max-w-7xl space-y-2 px-2 py-3 sm:px-4 lg:px-6">
        <PagosClient
          initialPayments={paymentsResult.data}
          initialTotal={paymentsResult.total}
          initialMetrics={metrics}
          boldMetrics={boldMetrics}
          students={students}
          enrollments={enrollments}
        />
      </div>
    </PageWrapper>
  )
}

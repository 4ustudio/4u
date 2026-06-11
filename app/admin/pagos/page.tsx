import { getPayments, getPaymentMetrics, getStudentsForSearch } from './_actions'
import PagosClient from './PagosClient'
import PageWrapper from '../_components/PageWrapper'

export const dynamic = 'force-dynamic'

export default async function PagosPage() {
  const [paymentsResult, metrics, students] = await Promise.all([
    getPayments('all', '', 1),
    getPaymentMetrics(),
    getStudentsForSearch(),
  ])

  return (
    <PageWrapper>
      <div className="px-6 py-7 max-w-6xl mx-auto space-y-2">
        <PagosClient
          initialPayments={paymentsResult.data}
          initialTotal={paymentsResult.total}
          initialMetrics={metrics}
          students={students}
        />
      </div>
    </PageWrapper>
  )
}

import { getPlans } from './_actions'
import PlanesClient from './PlanesClient'
import PageWrapper from '../_components/PageWrapper'

export const dynamic = 'force-dynamic'

export default async function PlanesPage() {
  const plans = await getPlans(true)
  return (
    <PageWrapper>
      <div className="mx-auto max-w-5xl space-y-2 px-2 py-3 sm:px-4 lg:px-6">
        <PlanesClient plans={plans} />
      </div>
    </PageWrapper>
  )
}

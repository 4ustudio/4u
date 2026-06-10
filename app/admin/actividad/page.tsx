import { getActivityLogs, getDashboardMetrics, getActivityActors } from './_actions'
import ActivityClient from './ActivityClient'
import PageWrapper from '../_components/PageWrapper'

export const dynamic = 'force-dynamic'

export default async function ActivityPage() {
  const [logsResult, metrics, actors] = await Promise.all([
    getActivityLogs({ module: 'all', page: 1 }),
    getDashboardMetrics(),
    getActivityActors(),
  ])

  return (
    <PageWrapper>
      <div className="px-6 py-7 max-w-5xl mx-auto space-y-2">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Centro de Actividad</h1>
          <p className="mt-1 text-sm text-white/35">Auditoría operativa en tiempo real — 4U Studio Academy.</p>
        </div>

        <ActivityClient
          initialData={logsResult.data}
          initialTotal={logsResult.total}
          metrics={metrics}
          actors={actors}
        />
      </div>
    </PageWrapper>
  )
}

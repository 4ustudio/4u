import type { Metadata } from 'next'
import Link from 'next/link'
import { getAcademicDashboardData } from '@/app/admin/_actions/academic'
import { AcademicDashboardClient } from './_components/AcademicDashboardClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Dashboard Académico — Admin 4U Studio' }

export default async function AcademicDashboardPage() {
  const data = await getAcademicDashboardData()
  return <AcademicDashboardClient data={data} />
}

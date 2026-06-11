import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getInstructors } from '../../../_actions/instructors'
import { getInstructorAvailability, getAvailabilityLog } from '../../../_actions/instructor-availability'
import AvailabilityManager from './_components/AvailabilityManager'
import AvailabilityLog from './_components/AvailabilityLog'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Disponibilidad Instructor — Admin 4U Studio' }

export default async function InstructorAvailabilityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const instructors = await getInstructors()
  const instructor = instructors.find((i: { id: string }) => i.id === id)
  if (!instructor) notFound()

  const [availability, log] = await Promise.all([
    getInstructorAvailability(id),
    getAvailabilityLog(id),
  ])

  return (
    <div className="space-y-6 w-full page-animate">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/35 mb-1">
            <Link href="/admin/instructors" className="hover:text-white/60 transition-colors">Instructores</Link>
            <span>/</span>
            <span>{instructor.name}</span>
            <span>/</span>
            <span className="text-white/60">Disponibilidad</span>
          </div>
          <h1 className="text-xl font-bold text-white">Disponibilidad — {instructor.name}</h1>
          <p className="text-sm text-white/40 mt-0.5">Gestiona los horarios disponibles y bloqueados</p>
        </div>
        <Link
          href="/admin/instructors"
          className="px-4 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
        >
          Volver
        </Link>
      </div>

      <AvailabilityManager instructorId={id} availability={availability} />
      <AvailabilityLog log={log} />
    </div>
  )
}

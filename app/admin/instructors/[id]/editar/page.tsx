import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getInstructorById } from '../../../_actions/instructors'
import EditInstructorForm from './_form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Editar instructor — Admin 4U Studio' }

export default async function EditInstructorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let instructor: any
  try {
    instructor = await getInstructorById(id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-5 w-full page-animate max-w-2xl">
      <div>
        <Link href="/admin/instructors" className="text-xs text-white/40 hover:text-white/70 transition-colors">
          ← Instructores
        </Link>
        <h1 className="text-xl font-bold text-white mt-1">Editar instructor</h1>
        <p className="text-sm text-white/40 mt-0.5">{instructor.name}</p>
      </div>
      <EditInstructorForm instructor={{ ...instructor, availability: instructor.availability ?? [] }} />
    </div>
  )
}

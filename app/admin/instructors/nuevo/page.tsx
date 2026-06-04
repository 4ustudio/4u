import type { Metadata } from 'next'
import NewInstructorForm from './_form'

export const metadata: Metadata = { title: 'Nuevo Instructor — Admin 4U Studio' }

export default function NuevoInstructorPage() {
  return (
    <div className="space-y-5 w-full page-animate">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Nuevo instructor</h1>
          <p className="text-sm text-white/40 mt-0.5">Crea la cuenta de acceso y el perfil del instructor.</p>
        </div>
        <a href="/admin/instructors" className="text-sm text-white/40 hover:text-white transition-colors">
          ← Volver
        </a>
      </div>
      <NewInstructorForm />
    </div>
  )
}

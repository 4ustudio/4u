import type { Metadata } from 'next'
import Link from 'next/link'
import { getInstructors } from '../_actions/instructors'
import DeleteInstructorButton from './_components/DeleteInstructorButton'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Instructores — Admin 4U Studio' }

export default async function InstructorsPage() {
  const instructors = await getInstructors()

  return (
    <div className="space-y-5 w-full page-animate">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Instructores</h1>
          <p className="text-sm text-white/40 mt-0.5">{instructors.length} instructor{instructors.length !== 1 ? 'es' : ''} activo{instructors.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/instructors/nuevo"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: '#ff7a00' }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nuevo instructor
        </Link>
      </div>

      {instructors.length === 0 ? (
        <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-10 text-center">
          <p className="text-white/35 text-sm">No hay instructores registrados.</p>
          <Link href="/admin/instructors/nuevo" className="inline-block mt-3 text-xs text-orange-400 hover:underline">
            Crear el primer instructor →
          </Link>
        </div>
      ) : (
        <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-5 py-3 text-xs text-white/35 font-semibold uppercase tracking-wider">Nombre</th>
                <th className="text-left px-5 py-3 text-xs text-white/35 font-semibold uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs text-white/35 font-semibold uppercase tracking-wider">Teléfono</th>
                <th className="text-left px-5 py-3 text-xs text-white/35 font-semibold uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {instructors.map((inst: any) => (
                <tr key={inst.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">
                        {inst.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                      <span className="font-medium text-white">{inst.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-white/60">{inst.email}</td>
                  <td className="px-5 py-3.5 text-white/60">{inst.phone ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      inst.status === 'active'
                        ? 'bg-green-900/40 text-green-400'
                        : 'bg-[#141414] text-white/40'
                    }`}>
                      {inst.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/instructors/${inst.id}/editar`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
                      >
                        Editar
                      </Link>
                      <DeleteInstructorButton id={inst.id} email={inst.email} name={inst.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

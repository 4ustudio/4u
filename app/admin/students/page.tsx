import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { Student } from '@/types/admin'

export const dynamic = 'force-dynamic'

async function getStudents(): Promise<Student[]> {
  const { data, error } = await createAdminClient()
    .from('students')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

const STATUS_LABEL: Record<string, string> = {
  active:    'Activo',
  inactive:  'Inactivo',
  suspended: 'Suspendido',
}
const STATUS_COLOR: Record<string, string> = {
  active:    'bg-green-900/40 text-green-400',
  inactive:  'bg-gray-800 text-gray-400',
  suspended: 'bg-red-900/40 text-red-400',
}
const TYPE_LABEL: Record<string, string> = {
  new:     'Nuevo',
  regular: 'Regular',
}

export default async function StudentsPage() {
  const students = await getStudents()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Estudiantes</h1>
          <p className="text-sm text-white/40 mt-0.5">{students.length} registros</p>
        </div>
        <Link
          href="/admin/students/nuevo"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: '#ff7a00' }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nuevo estudiante
        </Link>
      </div>

      {students.length === 0 ? (
        <div className="bg-gray-900 border border-white/10 rounded-xl px-6 py-12 text-center">
          <p className="text-white/40 text-sm">No hay estudiantes registrados aún.</p>
          <Link href="/admin/students/nuevo" className="mt-3 inline-block text-orange-400 text-sm hover:underline">
            Crear el primero →
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Nombre</th>
                <th className="px-5 py-3 text-left font-medium hidden sm:table-cell">Teléfono</th>
                <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Tipo</th>
                <th className="px-5 py-3 text-left font-medium">Estado</th>
                <th className="px-5 py-3 text-left font-medium hidden lg:table-cell">Inscripción</th>
                <th className="px-5 py-3 text-right font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-white font-medium">{s.name}</p>
                    {s.email && <p className="text-white/40 text-xs">{s.email}</p>}
                  </td>
                  <td className="px-5 py-3 text-white/60 hidden sm:table-cell">{s.phone}</td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.student_type === 'regular' ? 'bg-blue-900/40 text-blue-400' : 'bg-white/5 text-white/50'}`}>
                      {TYPE_LABEL[s.student_type]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[s.status] ?? 'bg-gray-800 text-gray-400'}`}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white/40 text-xs hidden lg:table-cell">
                    {new Date(s.enrolled_at).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/students/${s.id}`}
                      className="text-xs text-orange-400 hover:text-orange-300"
                    >
                      Ver →
                    </Link>
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

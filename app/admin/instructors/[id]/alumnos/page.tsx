import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getInstructorById, getInstructorStudents } from '../../../_actions/instructors'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Alumnos del instructor — Admin 4U Studio' }

/* eslint-disable @typescript-eslint/no-explicit-any */

const DOW = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const hhmm = (t?: string | null) => (t ? t.slice(0, 5) : '—')

function fecha(iso?: string | null) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function diasDesde(iso?: string | null) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  const diff = Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / 86_400_000)
  return diff < 0 ? 0 : diff
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Tomada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
  rescheduled: 'Reagendada',
}

const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-green-900/40 text-green-400',
  confirmed: 'bg-blue-900/40 text-blue-400',
  pending: 'bg-orange-900/40 text-orange-400',
  cancelled: 'bg-red-900/40 text-red-400',
  no_show: 'bg-red-900/40 text-red-400',
  rescheduled: 'bg-[#141414] text-white/40',
}

export default async function InstructorStudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let instructor: any
  try {
    instructor = await getInstructorById(id)
  } catch {
    notFound()
  }

  const { students, totals } = await getInstructorStudents(id)

  const cards = [
    { label: 'Alumnos', value: totals.students },
    { label: 'Con horario fijo', value: totals.withSchedule },
    { label: 'Clases tomadas', value: totals.completed },
    { label: 'Canceladas', value: totals.cancelled },
    { label: 'No asistió', value: totals.noShow },
  ]

  return (
    <div className="space-y-5 w-full page-animate">
      <div>
        <Link href="/admin/instructors" className="text-xs text-white/40 hover:text-white/70 transition-colors">
          ← Instructores
        </Link>
        <h1 className="text-xl font-bold text-white mt-1">Alumnos de {instructor.name}</h1>
        <p className="text-sm text-white/40 mt-0.5">
          {totals.students} alumno{totals.students !== 1 ? 's' : ''} · {totals.sessions} clase{totals.sessions !== 1 ? 's' : ''} registrada{totals.sessions !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.map(c => (
          <div key={c.label} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-xs text-white/40 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {students.length === 0 ? (
        <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-10 text-center">
          <p className="text-white/35 text-sm">Este instructor no tiene alumnos asignados ni clases registradas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((row: any) => {
            const dias = diasDesde(row.lastAttended?.scheduled_date)
            return (
              <details key={row.student.id} className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden group">
                <summary className="cursor-pointer list-none px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">
                        {String(row.student.name).split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{row.student.name}</p>
                        <p className="text-xs text-white/40 truncate">
                          {row.schedules.length > 0
                            ? row.schedules.map((s: any) => `${DOW[s.day_of_week]} ${hhmm(s.start_time)} · ${s.course?.name ?? 'Sin curso'}`).join(' | ')
                            : 'Sin horario fijo asignado'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
                      <div>
                        <p className="text-white/35">Última asistencia</p>
                        <p className="text-white/80 font-medium">
                          {fecha(row.lastAttended?.scheduled_date)}
                          {dias !== null && <span className="text-white/35"> · hace {dias}d</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/35">Próxima clase</p>
                        <p className="text-white/80 font-medium">
                          {row.nextSession
                            ? `${fecha(row.nextSession.scheduled_date)} ${hhmm(row.nextSession.start_time)}`
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/35">Tomadas / Total</p>
                        <p className="text-white/80 font-medium">{row.completed} / {row.totalSessions}</p>
                      </div>
                    </div>
                  </div>
                </summary>

                <div className="border-t border-white/10 px-5 py-4">
                  {row.sessions.length === 0 ? (
                    <p className="text-xs text-white/35">Sin clases registradas todavía.</p>
                  ) : (
                    <>
                      <p className="text-xs text-white/35 mb-2 uppercase tracking-wider font-semibold">
                        Últimas clases ({row.sessions.length} de {row.totalSessions})
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[420px]">
                          <tbody className="divide-y divide-white/5">
                            {row.sessions.map((s: any) => (
                              <tr key={s.id}>
                                <td className="py-2 pr-4 text-white/70 whitespace-nowrap">{fecha(s.scheduled_date)}</td>
                                <td className="py-2 pr-4 text-white/50 whitespace-nowrap">{hhmm(s.start_time)}</td>
                                <td className="py-2 pr-4 text-white/50">{s.course?.name ?? '—'}</td>
                                <td className="py-2 text-right whitespace-nowrap">
                                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[s.status] ?? 'bg-[#141414] text-white/40'}`}>
                                    {STATUS_LABEL[s.status] ?? s.status}
                                  </span>
                                  {s.late_cancellation && (
                                    <span className="ml-2 text-xs text-red-400/70">tardía</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    {row.student.phone && <span className="text-white/40">Tel: {row.student.phone}</span>}
                    {row.student.email && <span className="text-white/40">{row.student.email}</span>}
                    <Link href={`/admin/students/${row.student.id}`} className="text-orange-400 hover:underline">
                      Ver ficha del alumno →
                    </Link>
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PrintButton from './_components/PrintButton'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

const STATUS_LABEL: Record<string, string> = {
  pending:     'Pendiente',
  confirmed:   'Confirmada',
  completed:   'Completada',
  cancelled:   'Cancelada',
  rescheduled: 'Reagendada',
  no_show:     'No asistió',
}

const STATUS_COLOR: Record<string, string> = {
  pending:     '#ca8a04',
  confirmed:   '#16a34a',
  completed:   '#2563eb',
  cancelled:   '#dc2626',
  rescheduled: '#9333ea',
  no_show:     '#6b7280',
}

function formatDateLong(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

export default async function ClasesMesPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/mi-cuenta/login')

  const { data: student } = await db()
    .from('students')
    .select('id, name, first_name, last_name, email')
    .eq('user_id', user.id)
    .single()

  if (!student) redirect('/admin')

  const now = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEnd   = `${year}-${String(month).padStart(2, '0')}-31`
  const monthLabel = now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  const { data: sessions } = await db()
    .from('class_sessions')
    .select('*, course:courses(name), classroom:classrooms(name), instructor:instructors(name)')
    .eq('student_id', student.id)
    .gte('scheduled_date', monthStart)
    .lte('scheduled_date', monthEnd)
    .order('scheduled_date', { ascending: true })
    .order('start_time',     { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clases = (sessions ?? []) as any[]
  const fullName = [student.first_name, student.last_name].filter(Boolean).join(' ') || student.name

  const totalCount     = clases.length
  const completedCount = clases.filter(s => s.status === 'completed').length
  const pendingCount   = clases.filter(s => ['pending', 'confirmed'].includes(s.status)).length
  const cancelledCount = clases.filter(s => ['cancelled', 'rescheduled', 'no_show'].includes(s.status)).length

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-page { padding: 24px !important; max-width: 100% !important; }
          .print-card { border: 1px solid #e5e7eb !important; background: white !important; }
          .print-table-row { border-bottom: 1px solid #e5e7eb !important; }
        }
        @page { margin: 1.5cm; }
      `}</style>

      <div className="print-page min-h-screen bg-black text-white max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="no-print flex items-center justify-between gap-4 flex-wrap">
          <a href="/mi-cuenta" className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1.5">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Volver al portal
          </a>
          <PrintButton />
        </div>

        {/* Encabezado del reporte */}
        <div className="print-card rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[#ff7a00]/80 font-semibold mb-1">4U Studio Academy</p>
              <h1 className="text-2xl font-bold text-white font-poppins">Clases del mes</h1>
              <p className="text-white/50 text-sm mt-1 capitalize">{monthLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{fullName}</p>
              {student.email && <p className="text-xs text-white/40 mt-0.5">{student.email}</p>}
              <p className="text-xs text-white/30 mt-1">
                Generado el {now.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
            {[
              { label: 'Total',      value: totalCount },
              { label: 'Completadas', value: completedCount },
              { label: 'Próximas',   value: pendingCount },
              { label: 'Canceladas', value: cancelledCount },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-white font-poppins">{value}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla de clases */}
        {clases.length === 0 ? (
          <div className="print-card rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-white/30 text-sm">No hay clases registradas para este mes.</p>
          </div>
        ) : (
          <div className="print-card rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-3">#</th>
                  <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">Fecha y hora</th>
                  <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">Curso · Aula</th>
                  <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Instructor</th>
                  <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {clases.map((s, i) => (
                  <tr key={s.id} className="print-table-row border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-white/30 text-xs">{i + 1}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-white font-medium capitalize text-sm">
                        {formatDateLong(s.scheduled_date)}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">{s.start_time?.slice(0, 5)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-white/80 text-sm">{s.course?.name ?? '—'}</p>
                      <p className="text-white/35 text-xs mt-0.5">{s.classroom?.name ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <p className="text-white/60 text-sm">{s.instructor?.name ?? 'Sin asignar'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          color: STATUS_COLOR[s.status] ?? '#6b7280',
                          backgroundColor: (STATUS_COLOR[s.status] ?? '#6b7280') + '18',
                        }}
                      >
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="no-print text-xs text-white/20 text-center pb-4">
          Usa "Descargar / Imprimir PDF" para guardar este reporte.
        </p>
      </div>
    </>
  )
}

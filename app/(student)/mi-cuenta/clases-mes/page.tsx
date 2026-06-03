import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createAuthServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PrintButton from './_components/PrintButton'
import { statusMeta, STATUS_LEGEND } from '../_components/statusMeta'
import { instrumentEmoji } from '../_components/instruments'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient() }

const DOW_HEAD = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

function formatDateLong(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function calendarDays(year: number, month: number) {
  const firstDow = new Date(year, month, 1).getDay()
  const total = new Date(year, month + 1, 0).getDate()
  const cells: { day: number; current: boolean }[] = []
  for (let i = 0; i < firstDow; i++) cells.push({ day: 0, current: false })
  for (let d = 1; d <= total; d++) cells.push({ day: d, current: true })
  while (cells.length % 7 !== 0) cells.push({ day: 0, current: false })
  return cells
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
  const nextYear   = month === 12 ? year + 1 : year
  const nextMonth  = month === 12 ? 1 : month + 1
  const nextStart  = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
  const monthLabel = now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  const [{ data: sessions }, usageResult] = await Promise.all([
    db()
      .from('class_sessions')
      .select('*, course:courses(name), classroom:classrooms(name), instructor:instructors(name)')
      .eq('student_id', student.id)
      .gte('scheduled_date', monthStart)
      .lt('scheduled_date', nextStart)
      .order('scheduled_date', { ascending: true })
      .order('start_time',     { ascending: true }),
    db().rpc('fn_monthly_usage', { p_student_id: student.id, p_year: year, p_month: month }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clases = (sessions ?? []) as any[]
  const usage = (usageResult as any).data?.[0] ?? null
  const fullName = [student.first_name, student.last_name].filter(Boolean).join(' ') || student.name

  // Resumen (4 categorías)
  const availableCount = usage?.classes_available ?? 0
  const scheduledCount = usage?.classes_scheduled ?? clases.filter(s => ['pending', 'confirmed'].includes(s.status)).length
  const completedCount = usage?.classes_completed ?? clases.filter(s => s.status === 'completed').length
  const reprogramCount = usage?.late_cancellations ?? clases.filter(s => ['cancelled', 'rescheduled', 'no_show'].includes(s.status)).length

  // Sesiones por día para el mini-calendario
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byDay: Record<number, any[]> = {}
  for (const s of clases) {
    const d = parseInt(s.scheduled_date.slice(8, 10), 10)
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(s)
  }
  const cells = calendarDays(year, month - 1)

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: #111 !important; }
          .print-page { padding: 24px !important; max-width: 100% !important; }
          .print-card { border: 1px solid #e5e7eb !important; background: white !important; border-radius: 12px !important; }
          .print-table-row { border-bottom: 1px solid #e5e7eb !important; }
          .print-text { color: #111 !important; }
          .print-muted { color: #555 !important; }
          .print-cell { border: 1px solid #e5e7eb !important; background: white !important; }
          .print-brand { display: flex !important; }
        }
        .print-brand { display: none; }
        @page { margin: 1.5cm; }
      `}</style>

      <div className="print-page min-h-screen bg-stone-50 text-gray-800 max-w-3xl mx-auto px-4 py-8 space-y-6 page-animate">

        {/* Header */}
        <div className="no-print flex items-center justify-between gap-4 flex-wrap">
          <a href="/mi-cuenta" className="text-sm text-gray-400 hover:text-[#ff7a00] transition-colors flex items-center gap-1.5">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Volver al portal
          </a>
          <PrintButton />
        </div>

        {/* Encabezado del reporte con branding */}
        <div className="print-card rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          {/* Branding — visible solo en impresión */}
          <div className="print-brand items-center gap-3 mb-4 pb-4 border-b border-gray-200">
            <Image
              src="/images/icons/Recurso 1.png"
              alt="4U Studio Academy"
              width={100}
              height={34}
              className="h-8 w-auto"
            />
            <span className="text-[11px] uppercase tracking-widest text-[#ff7a00] font-semibold">Reporte de clases</span>
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[#ff7a00] font-semibold mb-1">4U Studio Academy</p>
              <h1 className="text-2xl font-bold text-gray-900 font-poppins">Reporte de clases</h1>
              <p className="text-gray-500 text-sm mt-1 capitalize">{monthLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{fullName}</p>
              {student.email && <p className="text-xs text-gray-400 mt-0.5">{student.email}</p>}
              <p className="text-xs text-gray-400 mt-1">
                Generado el {now.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-200">
            {[
              { label: 'Disponibles',      value: availableCount, color: '#ff7a00' },
              { label: 'Agendadas',        value: scheduledCount, color: '#3b82f6' },
              { label: 'Completadas',      value: completedCount, color: '#16a34a' },
              { label: 'Para reprogramar', value: reprogramCount, color: '#dc2626' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold font-poppins" style={{ color }}>{value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mini-calendario + leyenda */}
        <div className="print-card rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Calendario del mes</p>
          <div className="grid grid-cols-7 gap-1">
            {DOW_HEAD.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-semibold text-gray-400 pb-1">{d}</div>
            ))}
            {cells.map((cell, i) => {
              if (!cell.current) return <div key={i} className="aspect-square" />
              const dayClasses = byDay[cell.day] ?? []
              return (
                <div key={i} className="print-cell aspect-square rounded-md border border-gray-200 bg-white p-1 flex flex-col">
                  <span className="text-[10px] text-gray-400 leading-none">{cell.day}</span>
                  <div className="flex flex-wrap gap-0.5 mt-auto justify-center">
                    {dayClasses.slice(0, 4).map(s => (
                      <span key={s.id} className="h-1.5 w-1.5 rounded-full" style={{ background: statusMeta(s.status).hex }} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-gray-200">
            {STATUS_LEGEND.map(m => (
              <span key={m.key} className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="h-2 w-2 rounded-full" style={{ background: m.hex }} />
                {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* Tabla de clases */}
        {clases.length === 0 ? (
          <div className="print-card rounded-2xl border border-gray-200 bg-white shadow-sm p-8 text-center">
            <p className="text-gray-400 text-sm">No hay clases registradas para este mes.</p>
          </div>
        ) : (
          <div className="print-card rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">#</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Fecha y hora</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Instrumento · Aula</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Instructor</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {clases.map((s, i) => {
                  const meta = statusMeta(s.status)
                  return (
                    <tr key={s.id} className="print-table-row border-b border-gray-100">
                      <td className="px-5 py-3.5 text-gray-300 text-xs">{i + 1}</td>
                      <td className="px-4 py-3.5">
                        <p className="text-gray-900 font-medium capitalize text-sm">{formatDateLong(s.scheduled_date)}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{s.start_time?.slice(0, 5)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-gray-800 text-sm">
                          <span className="mr-1">{instrumentEmoji(s.course?.name)}</span>
                          {s.course?.name ?? '—'}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">{s.classroom?.name ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <p className="text-gray-500 text-sm">{s.instructor?.name ?? 'Sin asignar'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ color: meta.hex, backgroundColor: meta.hex + '18' }}
                        >
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer branding */}
        <div className="print-brand flex items-center justify-between pt-4 border-t border-gray-200 text-[10px] text-gray-400">
          <div className="flex items-center gap-2">
            <Image
              src="/images/icons/Recurso 1.png"
              alt="4U Studio Academy"
              width={80}
              height={28}
              className="h-6 w-auto"
            />
            <span>4U Studio Academy</span>
          </div>
          <span>reporte-generado-{now.toISOString().slice(0, 10)}.pdf</span>
        </div>

        <p className="no-print text-xs text-gray-300 text-center pb-4">
          Usa &quot;Descargar / Imprimir PDF&quot; para guardar este reporte.
        </p>
      </div>
    </>
  )
}

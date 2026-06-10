'use client'

import { useState, useTransition } from 'react'
import { cancelInstructorSessionAction } from '../../_actions/student'

interface Session {
  id: string
  scheduled_date: string
  start_time: string
  status: string
  student?: { name?: string; phone?: string | null } | null
  course?: { name?: string } | null
  classroom?: { name?: string } | null
}

interface Props {
  upcomingSessions: Session[]
}

function formatDateShort(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function buildWaLink(phone: string, studentName: string, course: string, date: string, time: string) {
  const clean = phone.replace(/\D/g, '')
  const number = clean.startsWith('57') ? clean : `57${clean}`
  const dateStr = new Date(date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  const msg = encodeURIComponent(
    `Hola ${studentName}, te informamos que tu clase de ${course} del ${dateStr} a las ${time} ha sido cancelada por el instructor. Por favor comunícate con 4U Studio Academy para reprogramarla. Disculpa los inconvenientes.`
  )
  return `https://wa.me/${number}?text=${msg}`
}

export default function InstructorCancelSession({ upcomingSessions }: Props) {
  const [pending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState<Record<string, {
    studentName: string; studentPhone: string | null
    date: string; time: string; course: string; late: boolean
  }>>({})
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const activeSessions = upcomingSessions.filter(s =>
    !['cancelled', 'completed'].includes(s.status) && !cancelled[s.id]
  )

  function handleCancel(session: Session) {
    setError(null)
    setPendingId(session.id)
    setConfirmId(null)
    startTransition(async () => {
      const res = await cancelInstructorSessionAction(session.id)
      setPendingId(null)
      if (res.error) { setError(res.error); return }
      if (res.success) {
        setCancelled(prev => ({
          ...prev,
          [session.id]: {
            studentName: res.student?.name ?? 'Estudiante',
            studentPhone: res.student?.phone ?? null,
            date: res.session?.date ?? '',
            time: res.session?.time ?? '',
            course: res.session?.course ?? 'Clase',
            late: res.lateCancellation ?? false,
          },
        }))
      }
    })
  }

  if (activeSessions.length === 0 && Object.keys(cancelled).length === 0) return null

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-poppins text-lg font-extrabold text-gray-950">Cancelar clase</h3>
        <p className="text-sm text-gray-600 mt-0.5">Tus próximas clases confirmadas o pendientes.</p>
      </div>

      {/* Política */}
      <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 mb-4">
        <svg className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-bold">Política de asistencia — </span>
          Las clases <span className="font-bold">no canceladas con al menos 24 horas de anticipación</span> se contabilizan como tomadas y se descuentan del plan del estudiante.
        </p>
      </div>

      {error && (
        <p className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="space-y-3">
        {activeSessions.map(session => {
          const classDateTime = new Date(`${session.scheduled_date}T${session.start_time}`)
          const hoursUntil = (classDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
          const isLate = hoursUntil < 24
          const isConfirming = confirmId === session.id
          const isLoading = pending && pendingId === session.id

          return (
            <div key={session.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {session.course?.name ?? 'Clase'} · {session.start_time?.slice(0, 5)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDateShort(session.scheduled_date)} · {session.student?.name ?? 'Sin alumno'} · {session.classroom?.name ?? '—'}
                </p>
                {isLate && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                    ⚠ Menos de 24h de anticipación — notifica al estudiante
                  </p>
                )}
              </div>
              {!isConfirming ? (
                <button
                  onClick={() => setConfirmId(session.id)}
                  disabled={isLoading}
                  className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Cancelar clase
                </button>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-600">¿Confirmar cancelación?</span>
                  <button
                    onClick={() => handleCancel(session)}
                    disabled={isLoading}
                    className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-60"
                  >
                    {isLoading ? 'Cancelando…' : 'Sí, cancelar'}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    disabled={isLoading}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {/* Clases recién canceladas con botón de notificación WA */}
        {Object.entries(cancelled).map(([id, info]) => (
          <div key={id} className="rounded-xl border border-green-100 bg-green-50 p-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-green-800">
                  ✓ Cancelada — {info.course} · {info.time} del {formatDateShort(info.date)}
                </p>
                <p className="text-xs text-green-700 mt-0.5">Estudiante: {info.studentName}</p>
                {info.late && (
                  <p className="text-xs text-amber-700 font-semibold mt-0.5">
                    Cancelación con poco tiempo — recuerda notificar al estudiante
                  </p>
                )}
              </div>
              {info.studentPhone ? (
                <a
                  href={buildWaLink(info.studentPhone, info.studentName, info.course, info.date, info.time)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1ebe5a] transition-colors"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Notificar a {info.studentName.split(' ')[0]}
                </a>
              ) : (
                <span className="text-xs text-gray-500">Sin teléfono registrado</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

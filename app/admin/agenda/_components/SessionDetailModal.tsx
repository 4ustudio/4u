'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelSessionAction, rescheduleSessionAction } from '../../_actions/sessions'
import type { ClassSession } from '@/types/admin'

const initialCancel    = { error: undefined as string | undefined, success: undefined as boolean | undefined, late: undefined as boolean | undefined }
const initialReschedule = { error: undefined as string | undefined, success: undefined as boolean | undefined }

const inputClass = 'w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30 disabled:opacity-50'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada',
  cancelled: 'Cancelada', rescheduled: 'Reagendada', no_show: 'No asistió',
}
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-900/40 text-yellow-400', confirmed: 'bg-green-900/40 text-green-400',
  completed: 'bg-blue-900/40 text-blue-400',   cancelled: 'bg-red-900/40 text-red-400',
  rescheduled: 'bg-purple-900/40 text-purple-400', no_show: 'bg-gray-800 text-gray-400',
}

interface Props {
  session:    ClassSession
  classrooms: { id: string; name: string }[]
  onClose:    () => void
}

export default function SessionDetailModal({ session, classrooms, onClose }: Props) {
  const router    = useRouter()
  const [tab, setTab] = useState<'info' | 'cancel' | 'reschedule'>('info')

  const [cancelState, cancelAction, cancelPending] = useActionState(cancelSessionAction, initialCancel)
  const [reschedState, reschedAction, reschedPending] = useActionState(rescheduleSessionAction, initialReschedule)

  useEffect(() => {
    if (cancelState.success || reschedState.success) {
      router.refresh()
      onClose()
    }
  }, [cancelState.success, reschedState.success, router, onClose])

  const canModify = ['pending', 'confirmed'].includes(session.status)
  const dateLabel = new Date(session.scheduled_date + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white">{(session.student as any)?.name ?? '—'}</h2>
            <p className="text-xs text-white/40 capitalize mt-0.5">{dateLabel} · {session.start_time.slice(0, 5)}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white p-1" aria-label="Cerrar">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Detalles */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Detail label="Curso"      value={(session.course as any)?.name ?? '—'} />
          <Detail label="Salón"      value={(session.classroom as any)?.name ?? '—'} />
          <Detail label="Instructor" value={(session.instructor as any)?.name ?? 'Sin asignar'} />
          <Detail label="Estado">
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[session.status] ?? 'bg-gray-800 text-gray-400'}`}>
              {STATUS_LABEL[session.status] ?? session.status}
            </span>
          </Detail>
        </div>

        {/* Tabs de acciones */}
        {canModify && (
          <>
            <div className="flex gap-1 border-b border-white/10 pb-0">
              {(['info', 'cancel', 'reschedule'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-xs rounded-t-lg transition-colors ${tab === t ? 'bg-white/5 text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                  {t === 'info' ? 'Info' : t === 'cancel' ? 'Cancelar' : 'Reagendar'}
                </button>
              ))}
            </div>

            {tab === 'cancel' && (
              <form action={cancelAction} className="space-y-3">
                <input type="hidden" name="session_id" value={session.id} />
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Motivo de cancelación</label>
                  <textarea name="reason" rows={2} disabled={cancelPending} className={inputClass + ' resize-none'} placeholder="Opcional" />
                </div>
                <p className="text-xs text-yellow-400/70">
                  Si faltan menos de 24h, la clase se considera tomada.
                </p>
                {cancelState.error && <p className="text-red-400 text-xs">{cancelState.error}</p>}
                <button
                  type="submit" disabled={cancelPending}
                  className="w-full py-2 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {cancelPending ? 'Cancelando…' : 'Confirmar cancelación'}
                </button>
              </form>
            )}

            {tab === 'reschedule' && (
              <form action={reschedAction} className="space-y-3">
                <input type="hidden" name="session_id" value={session.id} />
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Nueva fecha</label>
                  <input type="date" name="new_date" required disabled={reschedPending} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">Nueva hora</label>
                    <input type="time" name="new_start_time" required disabled={reschedPending} className={inputClass} step="3600" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">Nuevo salón</label>
                    <select name="new_classroom_id" required disabled={reschedPending} className={inputClass + ' appearance-none'} defaultValue="">
                      <option value="" disabled>Salón</option>
                      {classrooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-white/40">Solo dentro del mismo mes. Requiere ≥24h de anticipación.</p>
                {reschedState.error && <p className="text-red-400 text-xs">{reschedState.error}</p>}
                <button
                  type="submit" disabled={reschedPending}
                  className="w-full py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                  style={{ backgroundColor: '#ff7a00' }}
                >
                  {reschedPending ? 'Reagendando…' : 'Confirmar reagendamiento'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Detail({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-white/35">{label}</p>
      {children ?? <p className="text-white/80 mt-0.5">{value}</p>}
    </div>
  )
}

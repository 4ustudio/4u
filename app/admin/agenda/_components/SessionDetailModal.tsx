'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  cancelSessionAction,
  adminRescheduleAction,
  adminUpdateStatusAction,
} from '../../_actions/sessions'
import type { ClassSession } from '@/types/admin'

const initialCancel     = { error: undefined as string | undefined, success: undefined as boolean | undefined, late: undefined as boolean | undefined }
const initialReschedule = { error: undefined as string | undefined, success: undefined as boolean | undefined }
const initialStatus     = { error: undefined as string | undefined, success: undefined as boolean | undefined }

const inputClass = 'w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30 disabled:opacity-50'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada',
  cancelled: 'Cancelada', rescheduled: 'Reagendada', no_show: 'No asistió',
}
const STATUS_COLOR: Record<string, string> = {
  pending:     'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30',
  confirmed:   'bg-green-900/40  text-green-300  border border-green-700/30',
  completed:   'bg-blue-900/40   text-blue-300   border border-blue-700/30',
  cancelled:   'bg-red-900/40    text-red-300    border border-red-700/30',
  rescheduled: 'bg-purple-900/40 text-purple-300 border border-purple-700/30',
  no_show:     'bg-gray-800      text-gray-400   border border-white/10',
}

type Action = 'attendance' | 'reschedule' | 'cancel' | null

interface Props {
  session:     ClassSession
  classrooms:  { id: string; name: string }[]
  instructors: { id: string; name: string }[]
  onClose:     () => void
}

export default function SessionDetailModal({ session, classrooms, instructors, onClose }: Props) {
  const router   = useRouter()
  const [action, setAction] = useState<Action>(null)

  const [cancelState,  cancelAction,  cancelPending]  = useActionState(cancelSessionAction,    initialCancel)
  const [reschedState, reschedAction, reschedPending] = useActionState(adminRescheduleAction,   initialReschedule)
  const [statusState,  statusAction,  statusPending]  = useActionState(adminUpdateStatusAction, initialStatus)

  useEffect(() => {
    if (cancelState.success || reschedState.success || statusState.success) {
      router.refresh()
      onClose()
    }
  }, [cancelState.success, reschedState.success, statusState.success, router, onClose])

  const dateLabel = new Date(session.scheduled_date + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const isActive = ['pending', 'confirmed'].includes(session.status)
  const isClosed = ['cancelled', 'rescheduled', 'completed', 'no_show'].includes(session.status)

  const toggleAction = (a: Action) => setAction(prev => prev === a ? null : a)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Encabezado de la clase ────────────────────────────── */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white leading-tight">
                {(session.student as any)?.name ?? '—'}
              </h2>
              <p className="text-sm text-white/50 capitalize mt-0.5">{dateLabel}</p>
              <p className="text-sm font-medium text-white/70">
                {session.start_time.slice(0, 5)} – {(() => {
                  const [h, m] = session.start_time.split(':').map(Number)
                  return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`
                })()} hs
              </p>
            </div>
            <button onClick={onClose} className="ml-3 text-white/30 hover:text-white p-1 shrink-0" aria-label="Cerrar">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Info rápida en pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            <Pill icon="🎵">{(session.course as any)?.name ?? 'Sin curso'}</Pill>
            <Pill icon="🚪">{(session.classroom as any)?.name ?? 'Sin salón'}</Pill>
            {(session.instructor as any)?.name && (
              <Pill icon="👤">{(session.instructor as any).name}</Pill>
            )}
          </div>

          {/* Estado actual */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-white/40">Estado actual:</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[session.status] ?? 'bg-gray-800 text-gray-400'}`}>
              {STATUS_LABEL[session.status] ?? session.status}
            </span>
          </div>

          {/* Info de cancelación si aplica */}
          {session.cancellation_reason && (
            <p className="mt-2 text-xs text-white/40 bg-white/5 rounded-lg px-3 py-2">
              Motivo: {session.cancellation_reason}
            </p>
          )}
          {session.late_cancellation && (
            <p className="mt-2 text-xs text-yellow-400/80 bg-yellow-900/20 rounded-lg px-3 py-2">
              ⚠ Cancelación tardía — esta clase consume cupo mensual del estudiante.
            </p>
          )}
        </div>

        {/* ── Acciones ─────────────────────────────────────────── */}
        <div className="p-5 space-y-2">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">
            ¿Qué necesitas hacer?
          </p>

          {/* Acción 1: Registrar asistencia */}
          <ActionCard
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            }
            title="Registrar asistencia"
            subtitle="¿El estudiante asistió? Marca el resultado de la clase."
            open={action === 'attendance'}
            color="green"
            onClick={() => toggleAction('attendance')}
          >
            <div className="space-y-2 pt-1">
              <p className="text-xs text-white/40 mb-3">Selecciona el estado que corresponde:</p>
              {([
                { status: 'completed', label: '✅  Completada — el estudiante asistió normalmente' },
                { status: 'no_show',   label: '🚫  No asistió — el estudiante no se presentó' },
                { status: 'confirmed', label: '🕐  Confirmar — la clase está confirmada (aún no ocurre)' },
                { status: 'pending',   label: '⏳  Pendiente — en espera de confirmación' },
              ] as const).map(({ status, label }) => (
                <form key={status} action={statusAction}>
                  <input type="hidden" name="session_id" value={session.id} />
                  <input type="hidden" name="new_status" value={status} />
                  <button
                    type="submit"
                    disabled={statusPending || session.status === status}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors disabled:opacity-40 border
                      ${session.status === status
                        ? 'bg-white/10 text-white/60 border-white/10 cursor-default'
                        : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    {label}
                    {session.status === status && <span className="ml-2 text-white/40">(estado actual)</span>}
                  </button>
                </form>
              ))}
              {statusState.error && <p className="text-red-400 text-xs mt-2">{statusState.error}</p>}
            </div>
          </ActionCard>

          {/* Acción 2: Cambiar horario */}
          <ActionCard
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
              </svg>
            }
            title="Cambiar horario"
            subtitle="Mover la clase a otra fecha, hora o salón diferente."
            open={action === 'reschedule'}
            color="orange"
            onClick={() => toggleAction('reschedule')}
          >
            <form action={reschedAction} className="space-y-3 pt-1">
              <input type="hidden" name="session_id" value={session.id} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Nueva fecha</label>
                  <input type="date" name="new_date" required defaultValue={session.scheduled_date} disabled={reschedPending} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Nueva hora</label>
                  <input type="time" name="new_start_time" required defaultValue={session.start_time.slice(0, 5)} disabled={reschedPending} className={inputClass} step="3600" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Salón</label>
                <select name="new_classroom_id" required disabled={reschedPending} className={inputClass + ' appearance-none'} defaultValue={session.classroom_id}>
                  <option value="" disabled>Seleccionar salón</option>
                  {classrooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Instructor</label>
                <select name="new_instructor_id" disabled={reschedPending} className={inputClass + ' appearance-none'} defaultValue={session.instructor_id ?? ''}>
                  <option value="">Sin asignar</option>
                  {instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              {reschedState.error && <p className="text-red-400 text-xs">{reschedState.error}</p>}
              <button type="submit" disabled={reschedPending} className="w-full py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-50 transition-opacity" style={{ backgroundColor: '#ff7a00' }}>
                {reschedPending ? 'Guardando cambios…' : 'Guardar nuevo horario'}
              </button>
            </form>
          </ActionCard>

          {/* Acción 3: Cancelar (solo si activa) */}
          {isActive && (
            <ActionCard
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
                </svg>
              }
              title="Cancelar clase"
              subtitle="Liberar este horario. Si faltan menos de 24 h, consume cupo del estudiante."
              open={action === 'cancel'}
              color="red"
              onClick={() => toggleAction('cancel')}
            >
              <form action={cancelAction} className="space-y-3 pt-1">
                <input type="hidden" name="session_id" value={session.id} />
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Motivo de cancelación (opcional)</label>
                  <textarea name="reason" rows={2} disabled={cancelPending} className={inputClass + ' resize-none'} placeholder="Ej: El estudiante llamó para cancelar..." />
                </div>
                <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-700/20 rounded-lg px-3 py-2">
                  <span className="text-yellow-400 text-base leading-none mt-0.5">⚠</span>
                  <p className="text-xs text-yellow-300/80">
                    Si faltan menos de 24 horas para la clase, la cancelación se considera tardía y la clase <strong>consume cupo mensual</strong> del estudiante.
                  </p>
                </div>
                {cancelState.error && <p className="text-red-400 text-xs">{cancelState.error}</p>}
                <button type="submit" disabled={cancelPending} className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {cancelPending ? 'Cancelando clase…' : 'Sí, cancelar esta clase'}
                </button>
              </form>
            </ActionCard>
          )}

          {/* Clase ya cerrada */}
          {isClosed && action === null && (
            <p className="text-center text-xs text-white/30 py-2">
              Esta clase ya está cerrada. Aún puedes cambiar su estado o reagendarla.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Tarjeta de acción expandible (tipo acordeón)
function ActionCard({
  icon, title, subtitle, open, color, onClick, children,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  open: boolean
  color: 'green' | 'orange' | 'red'
  onClick: () => void
  children: React.ReactNode
}) {
  const colors = {
    green:  { ring: 'border-green-500/40  bg-green-900/20',  icon: 'text-green-400',  hover: 'hover:border-green-500/40 hover:bg-green-900/10' },
    orange: { ring: 'border-orange-500/40 bg-orange-900/20', icon: 'text-orange-400', hover: 'hover:border-orange-500/40 hover:bg-orange-900/10' },
    red:    { ring: 'border-red-500/40    bg-red-900/20',    icon: 'text-red-400',    hover: 'hover:border-red-500/40 hover:bg-red-900/10' },
  }
  const c = colors[color]

  return (
    <div className={`rounded-xl border transition-colors ${open ? c.ring : 'border-white/10 bg-white/[0.02]'}`}>
      <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors rounded-xl ${!open ? c.hover : ''}`}
      >
        <span className={`shrink-0 ${open ? c.icon : 'text-white/40'}`}>{icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${open ? 'text-white' : 'text-white/80'}`}>{title}</p>
          <p className="text-xs text-white/40 mt-0.5 leading-snug">{subtitle}</p>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform text-white/30 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div className="border-t border-white/10 pt-3">{children}</div>
        </div>
      )}
    </div>
  )
}

function Pill({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-white/60">
      <span>{icon}</span>
      <span>{children}</span>
    </span>
  )
}

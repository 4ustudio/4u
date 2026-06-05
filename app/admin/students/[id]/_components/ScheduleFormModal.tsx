'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createScheduleAction, updateScheduleAction } from '../../../_actions/students'
import type { StudentSchedule } from '@/types/admin'

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
]

const inputClass = 'w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30 disabled:opacity-50'

const initial = { error: undefined as string | undefined, success: undefined as boolean | undefined }

interface Props {
  studentId:    string
  schedule?:    StudentSchedule
  courses:      { id: string; name: string }[]
  classrooms:   { id: string; name: string }[]
  instructors:  { id: string; name: string }[]
  onClose:      () => void
}

export default function ScheduleFormModal({ studentId, schedule, courses, classrooms, instructors, onClose }: Props) {
  const router = useRouter()
  const action = schedule ? updateScheduleAction : createScheduleAction
  const [state, formAction, isPending] = useActionState(action, initial)

  useEffect(() => {
    if (state.success) {
      router.refresh()
      onClose()
    }
  }, [state.success, router, onClose])

  const isEdit = !!schedule

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white">
              {isEdit ? 'Editar horario fijo' : 'Agregar horario fijo'}
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              {isEdit ? 'Modifica los datos del horario recurrente' : 'Nuevo horario recurrente para el estudiante'}
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white p-1" aria-label="Cerrar">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="student_id" value={studentId} />
          {isEdit && <input type="hidden" name="id" value={schedule!.id} />}
          {isEdit && <input type="hidden" name="status" value={schedule!.status} />}

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Curso *</label>
            <select name="course_id" required disabled={isPending} className={inputClass + ' appearance-none'} defaultValue={schedule?.course_id ?? ''}>
              <option value="" disabled>Selecciona un curso</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Día *</label>
              <select name="day_of_week" required disabled={isPending} className={inputClass + ' appearance-none'} defaultValue={schedule?.day_of_week ?? ''}>
                <option value="" disabled>Selecciona un día</option>
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Hora *</label>
              <input type="time" name="start_time" required disabled={isPending} className={inputClass} defaultValue={schedule?.start_time?.slice(0, 5) ?? '10:00'} step="3600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Salón *</label>
              <select name="classroom_id" required disabled={isPending} className={inputClass + ' appearance-none'} defaultValue={schedule?.classroom_id ?? ''}>
                <option value="" disabled>Selecciona un salón</option>
                {classrooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Instructor</label>
              <select name="instructor_id" disabled={isPending} className={inputClass + ' appearance-none'} defaultValue={schedule?.instructor_id ?? ''}>
                <option value="">Sin asignar</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Desde *</label>
              <input type="date" name="active_from" required disabled={isPending} className={inputClass} defaultValue={schedule?.active_from ?? new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Hasta</label>
              <input type="date" name="active_until" disabled={isPending} className={inputClass} defaultValue={schedule?.active_until ?? ''} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Frecuencia</label>
            <select name="frequency" disabled={isPending} className={inputClass + ' appearance-none'} defaultValue={schedule?.frequency ?? 'weekly'}>
              <option value="weekly">Semanal</option>
              <option value="biweekly">Quincenal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Notas</label>
            <textarea name="notes" rows={2} disabled={isPending} className={inputClass + ' resize-none'} placeholder="Opcional" defaultValue={schedule?.notes ?? ''} />
          </div>

          {state.error && <p className="text-red-400 text-xs">{state.error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit" disabled={isPending}
              className="flex-1 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: '#ff7a00' }}
            >
              {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear horario'}
            </button>
            <button
              type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white border border-white/10 hover:border-white/25 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

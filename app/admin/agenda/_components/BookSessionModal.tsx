'use client'

import { useActionState, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { MdClose } from 'react-icons/md'
import { useRouter } from 'next/navigation'
import { bookSessionAction, getAvailableInstructors } from '../../_actions/sessions'

const initial = { error: undefined as string | undefined, success: undefined as boolean | undefined }

const inputClass = 'w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30 disabled:opacity-50'

export interface Classroom {
  id:                string
  name:              string
  classroom_courses: { course_id: string }[]
}

interface Props {
  date:              string
  time:              string
  students:          { id: string; name: string; phone: string }[]
  courses:           { id: string; name: string }[]
  classrooms:        Classroom[]
  instructors:       { id: string; name: string }[]
  defaultStudentId?: string
  onClose:           () => void
}

export default function BookSessionModal({ date, time, students, courses, classrooms, instructors, defaultStudentId, onClose }: Props) {
  const router = useRouter()
  const [state, action, isPending] = useActionState(bookSessionAction, initial)
  const [selectedClassroomId, setSelectedClassroomId] = useState('')
  const [mounted, setMounted] = useState(false)
  const [selectedTime, setSelectedTime] = useState(time)
  const [selectedInstructorId, setSelectedInstructorId] = useState('')
  const [availableInstructors, setAvailableInstructors] = useState(instructors)
  const [loadingInstructors, setLoadingInstructors] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!selectedTime) return
    let cancelled = false
    setLoadingInstructors(true)
    getAvailableInstructors(date, selectedTime)
      .then(list => {
        if (cancelled) return
        setAvailableInstructors(list)
        setSelectedInstructorId(prev => (list.some(i => i.id === prev) ? prev : ''))
      })
      .finally(() => { if (!cancelled) setLoadingInstructors(false) })
    return () => { cancelled = true }
  }, [date, selectedTime])

  useEffect(() => {
    if (state.success) {
      router.refresh()
      onClose()
    }
  }, [state.success, router, onClose])

  if (!mounted) return null

  const selectedClassroom = classrooms.find(c => c.id === selectedClassroomId)
  const allowedCourseIds  = selectedClassroom?.classroom_courses.map(cc => cc.course_id)
  const visibleCourses    = allowedCourseIds
    ? courses.filter(c => allowedCourseIds.includes(c.id))
    : courses

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Crear clase</h2>
            <p className="text-xs text-white/40 capitalize mt-0.5">{dateLabel} · {selectedTime}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white p-1" aria-label="Cerrar">
            <MdClose className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form action={action} className="space-y-3">
          <input type="hidden" name="date" value={date} />

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Hora *</label>
            <input
              type="time" name="start_time" required disabled={isPending}
              value={selectedTime} onChange={e => setSelectedTime(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Estudiante *</label>
            <select name="student_id" required disabled={isPending} className={inputClass + ' appearance-none'} defaultValue={defaultStudentId ?? ''}>
              <option value="" disabled>Selecciona un estudiante</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} · {s.phone}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Estudio *</label>
              <select
                name="classroom_id"
                required
                disabled={isPending}
                className={inputClass + ' appearance-none'}
                value={selectedClassroomId}
                onChange={e => setSelectedClassroomId(e.target.value)}
              >
                <option value="" disabled>Estudio</option>
                {classrooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Instructor *</label>
              <select
                name="instructor_id" required disabled={isPending || loadingInstructors}
                className={inputClass + ' appearance-none'}
                value={selectedInstructorId} onChange={e => setSelectedInstructorId(e.target.value)}
              >
                <option value="" disabled>
                  {loadingInstructors
                    ? 'Buscando disponibles…'
                    : availableInstructors.length
                      ? 'Selecciona un instructor'
                      : 'Nadie disponible a esa hora'}
                </option>
                {availableInstructors.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Curso *</label>
            <select name="course_id" required disabled={isPending || !selectedClassroomId} className={inputClass + ' appearance-none'} defaultValue="">
              <option value="" disabled>
                {selectedClassroomId ? 'Selecciona un curso' : 'Primero selecciona un estudio'}
              </option>
              {visibleCourses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Notas</label>
            <textarea name="notes" rows={2} disabled={isPending} className={inputClass + ' resize-none'} placeholder="Opcional" />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Repetir semanalmente</label>
            <select name="repeat_weeks" disabled={isPending} defaultValue="0" className={inputClass + ' appearance-none'}>
              <option value="0">No repetir</option>
              <option value="3">3 semanas más (4 clases)</option>
              <option value="4">4 semanas más (5 clases)</option>
              <option value="7">7 semanas más (8 clases)</option>
            </select>
          </div>

          {state.error && <p className="text-red-400 text-xs">{state.error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit" disabled={isPending}
              className="flex-1 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: '#ff7a00' }}
            >
              {isPending ? 'Creando…' : 'Crear clase'}
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
    </div>,
    document.body
  )
}

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ScheduleFormModal from './ScheduleFormModal'
import { deleteScheduleAction } from '../../../_actions/students'
import type { StudentSchedule } from '@/types/admin'

const DAY_LABELS: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado',
}

const STATUS_STYLE: Record<string, string> = {
  active:    'bg-green-900/40 text-green-400',
  paused:    'bg-yellow-900/40 text-yellow-400',
  cancelled: 'bg-red-900/40 text-red-400',
}

const STATUS_LABEL: Record<string, string> = {
  active:    'Activo',
  paused:    'Pausado',
  cancelled: 'Cancelado',
}

interface Props {
  schedules:   StudentSchedule[]
  studentId:   string
  courses:     { id: string; name: string }[]
  classrooms:  { id: string; name: string }[]
  instructors: { id: string; name: string }[]
}

export default function ScheduleSection({ schedules, studentId, courses, classrooms, instructors }: Props) {
  const router = useRouter()
  const [editingSchedule, setEditingSchedule] = useState<StudentSchedule | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = useCallback(async (schedule: StudentSchedule) => {
    if (!confirm(`¿Eliminar el horario de ${DAY_LABELS[schedule.day_of_week]} ${schedule.start_time?.slice(0, 5)}?`)) return
    setDeletingId(schedule.id)

    const formData = new FormData()
    formData.set('id', schedule.id)
    formData.set('student_id', studentId)

    await deleteScheduleAction({ error: undefined, success: undefined }, formData)
    setDeletingId(null)
    router.refresh()
  }, [studentId, router])

  return (
    <section className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">
          Horarios fijos
          <span className="ml-2 text-xs text-white/40 font-normal">{schedules.length}</span>
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: '#ff7a00' }}
        >
          + Agregar
        </button>
      </div>

      {schedules.length === 0 ? (
        <p className="px-5 py-8 text-center text-white/35 text-sm">
          Sin horarios fijos.
        </p>
      ) : (
        <div className="divide-y divide-white/5">
          {schedules.map((s) => (
            <div key={s.id} className="px-5 py-3 flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-white font-medium">
                    {DAY_LABELS[s.day_of_week]} {s.start_time?.slice(0, 5)}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_STYLE[s.status] ?? 'bg-[#141414] text-white/40'}`}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  {s.course?.name ?? '—'} · {s.classroom?.name ?? '—'}
                  {s.instructor?.name ? ` · ${s.instructor.name}` : ''}
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  Desde {new Date(s.active_from).toLocaleDateString('es-CO')}
                  {s.active_until ? ` · Hasta ${new Date(s.active_until).toLocaleDateString('es-CO')}` : ' · Indefinido'}
                  {s.frequency === 'biweekly' && ' · Quincenal'}
                </p>
              </div>
              <div className="flex gap-2 shrink-0 pt-0.5">
                <button
                  onClick={() => setEditingSchedule(s)}
                  className="text-[11px] px-2.5 py-1 rounded-md text-white/40 hover:text-white border border-white/10 hover:border-white/25 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(s)}
                  disabled={deletingId === s.id}
                  className="text-[11px] px-2.5 py-1 rounded-md text-red-400/60 hover:text-red-400 border border-red-900/30 hover:border-red-500/40 transition-colors disabled:opacity-50"
                >
                  {deletingId === s.id ? '…' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <ScheduleFormModal
          studentId={studentId}
          courses={courses}
          classrooms={classrooms}
          instructors={instructors}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingSchedule && (
        <ScheduleFormModal
          studentId={studentId}
          schedule={editingSchedule}
          courses={courses}
          classrooms={classrooms}
          instructors={instructors}
          onClose={() => setEditingSchedule(null)}
        />
      )}
    </section>
  )
}

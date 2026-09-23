'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MdClose, MdEvent, MdPerson, MdMeetingRoom, MdSchool, MdArrowForward } from 'react-icons/md'
import { scheduleTrialClassAction } from '../../_actions/enrollments'
import TrialClassModal from '../../_components/TrialClassModal'
import WhatsAppButton from '@/components/admin/WhatsAppButton'
import type { TrialSession } from '@/types/admin'

export default function TrialDetailModal({
  trial, instructors, classrooms, onClose,
}: {
  trial: TrialSession
  instructors: { id: string; name: string }[]
  classrooms: { id: string; name: string }[]
  onClose: () => void
}) {
  const router = useRouter()
  const [rescheduling, setRescheduling] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const dateLabel = new Date(trial.trial_date + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  async function handleReschedule(date: string, time: string, instructorId: string, classroomId: string): Promise<string | void> {
    const fd = new FormData()
    fd.set('id', trial.id)
    fd.set('trial_date', date)
    fd.set('trial_time', time)
    fd.set('instructor_id', instructorId)
    fd.set('classroom_id', classroomId)
    const r = await scheduleTrialClassAction({}, fd)
    if (r.error) return r.error
    setRescheduling(false)
    onClose()
    router.refresh()
  }

  if (rescheduling) {
    return (
      <TrialClassModal
        studentName={trial.student_name}
        instructors={instructors}
        classrooms={classrooms}
        initial={{
          date: trial.trial_date,
          time: trial.trial_time,
          instructorId: trial.trial_instructor_id,
          classroomId: trial.trial_classroom_id,
        }}
        onCancel={() => setRescheduling(false)}
        onSchedule={handleReschedule}
      />
    )
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Sesión de reconocimiento de ${trial.student_name}`}
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white truncate">{trial.student_name}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border border-sky-500/25 bg-sky-500/10 text-sky-300">
                Reconocimiento
              </span>
            </div>
            <p className="text-xs text-white/40 capitalize mt-0.5">{dateLabel} · {trial.trial_time.slice(0, 5)}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 text-white/30 hover:text-white/70 transition-colors p-1.5 rounded-lg hover:bg-white/5"
          >
            <MdClose className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2">
          <Row icon={<MdSchool className="h-4 w-4" aria-hidden="true" />} label="Interés" value={trial.course_interest} />
          <Row icon={<MdPerson className="h-4 w-4" aria-hidden="true" />} label="Instructor" value={trial.instructor?.name ?? 'Sin asignar'} />
          <Row icon={<MdMeetingRoom className="h-4 w-4" aria-hidden="true" />} label="Salón" value={trial.classroom?.name ?? 'Sin asignar'} />
        </div>

        <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <span className="text-sm text-white/70 font-mono truncate">{trial.phone}</span>
          <WhatsAppButton
            phone={trial.phone}
            template="lead_follow_up"
            vars={{ name: trial.student_name, course: trial.course_interest }}
            entityType="lead"
            entityId={trial.id}
            variant="pill"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setRescheduling(true)}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
            style={{ background: '#ff7a00' }}
          >
            <MdEvent className="h-4 w-4" aria-hidden="true" />
            Reagendar
          </button>
          <Link
            href="/admin/interesados"
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white/70 border border-white/10 hover:border-white/25 hover:text-white transition-colors"
          >
            Ver interesado
            <MdArrowForward className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>,
    document.body
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <span className="text-white/30 shrink-0">{icon}</span>
      <span className="text-[11px] text-white/35 w-20 shrink-0">{label}</span>
      <span className="text-sm text-white/75 truncate">{value}</span>
    </div>
  )
}

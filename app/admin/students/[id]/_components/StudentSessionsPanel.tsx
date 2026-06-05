'use client'

import { useState } from 'react'
import SessionDetailModal from '@/app/admin/agenda/_components/SessionDetailModal'
import BookSessionModal from '@/app/admin/agenda/_components/BookSessionModal'

const STATUS_COLOR: Record<string, string> = {
  pending:     'bg-yellow-900/40 text-yellow-400',
  confirmed:   'bg-green-900/40 text-green-400',
  completed:   'bg-green-900/40 text-green-400',
  cancelled:   'bg-red-900/40 text-red-400',
  rescheduled: 'bg-purple-900/40 text-[#ff9a3b]',
  no_show:     'bg-[#141414] text-white/40',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada',
  cancelled: 'Cancelada', rescheduled: 'Reagendada', no_show: 'No asistió',
}

const inputClass = 'w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30'

interface Props {
  studentId:   string
  student:     { id: string; name: string; phone: string }
  upcoming:    any[]
  past:        any[]
  students:    { id: string; name: string; phone: string }[]
  classrooms:  { id: string; name: string; classroom_courses: { course_id: string }[] }[]
  instructors: { id: string; name: string }[]
  courses:     { id: string; name: string }[]
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function SessionRow({ session, onClick }: { session: any; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-white/[0.03] transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white group-hover:text-orange-300 transition-colors">
          {new Date(session.scheduled_date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })} · {session.start_time.slice(0, 5)}
        </p>
        <p className="text-xs text-white/40">{session.course?.name} · {session.classroom?.name}</p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[session.status] ?? 'bg-[#141414] text-white/40'}`}>
        {STATUS_LABEL[session.status] ?? session.status}
      </span>
    </button>
  )
}

// Mini modal para elegir fecha/hora antes de abrir BookSessionModal
function QuickDatePicker({ onConfirm, onClose }: { onConfirm: (date: string, time: string) => void; onClose: () => void }) {
  const [date, setDate] = useState(todayStr())
  const [time, setTime] = useState('10:00')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xs bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Fecha y hora de la clase</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Fecha *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Hora *</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} step="3600" className={inputClass} />
          </div>
        </div>
        <button
          onClick={() => date && time && onConfirm(date, time)}
          className="w-full py-2 rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: '#ff7a00' }}
        >
          Continuar →
        </button>
      </div>
    </div>
  )
}

export default function StudentSessionsPanel({ studentId, student, upcoming, past, students, classrooms, instructors, courses }: Props) {
  const [selected, setSelected]   = useState<any | null>(null)
  const [datePicker, setDatePicker] = useState(false)
  const [booking, setBooking]     = useState<{ date: string; time: string } | null>(null)

  return (
    <>
      {upcoming.length > 0 && (
        <section className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Próximas clases</h2>
          </div>
          <div className="divide-y divide-white/5">
            {upcoming.map((s: any) => (
              <SessionRow key={s.id} session={s} onClick={() => setSelected(s)} />
            ))}
          </div>
        </section>
      )}

      <section className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white">
            {past.length > 0 ? 'Últimas clases' : 'Historial de clases'}
          </h2>
          <button
            onClick={() => setDatePicker(true)}
            className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nueva clase
          </button>
        </div>
        {past.length === 0 && upcoming.length === 0 ? (
          <p className="px-5 py-8 text-center text-white/35 text-sm">Sin historial de clases.</p>
        ) : past.length === 0 ? (
          <p className="px-5 py-8 text-center text-white/35 text-sm">Sin clases anteriores.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {past.map((s: any) => (
              <SessionRow key={s.id} session={s} onClick={() => setSelected(s)} />
            ))}
          </div>
        )}
      </section>

      {selected && (
        <SessionDetailModal
          session={selected}
          classrooms={classrooms}
          instructors={instructors}
          onClose={() => setSelected(null)}
        />
      )}

      {datePicker && !booking && (
        <QuickDatePicker
          onConfirm={(date, time) => { setDatePicker(false); setBooking({ date, time }) }}
          onClose={() => setDatePicker(false)}
        />
      )}

      {booking && (
        <BookSessionModal
          date={booking.date}
          time={booking.time}
          students={students}
          courses={courses}
          classrooms={classrooms}
          instructors={instructors}
          defaultStudentId={studentId}
          onClose={() => setBooking(null)}
        />
      )}
    </>
  )
}

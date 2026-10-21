'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import PopupSelect from './PopupSelect'
import { inputClass } from './leadConstants'

export default function TrialClassModal({
  studentName, leads, withNotes, instructors, classrooms, initial, reschedule, onCancel, onSchedule,
}: {
  studentName?: string
  /** Si se pasa, el modal pide elegir el interesado (agendar desde un hueco libre). */
  leads?: { id: string; name: string; notes?: string | null }[]
  /** Muestra el campo de observaciones de la clase de prueba. */
  withNotes?: boolean
  instructors: { id: string; name: string }[]
  classrooms: { id: string; name: string }[]
  initial?: { date?: string | null; time?: string | null; instructorId?: string | null; classroomId?: string | null; notes?: string | null }
  /** Fuerza el copy: al agendar desde el calendario la fecha viene precargada
   *  del slot, pero no es un reagendamiento. */
  reschedule?: boolean
  onCancel: () => void
  onSchedule: (date: string, time: string, instructorId: string, classroomId: string, extra: { leadId: string; notes: string }) => Promise<string | void>
}) {
  const isReschedule = reschedule ?? Boolean(initial?.date)

  const [mounted, setMounted]           = useState(false)
  const [date, setDate]                 = useState(initial?.date ?? '')
  const [time, setTime]                 = useState(initial?.time?.slice(0, 5) ?? '')
  const [instructorId, setInstructorId] = useState(initial?.instructorId ?? '')
  const [classroomId, setClassroomId]   = useState(initial?.classroomId ?? '')
  const [leadId, setLeadId]             = useState('')
  const [notes, setNotes]               = useState(initial?.notes ?? '')
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (leads && !leadId) { setError('Selecciona el interesado.'); return }
    if (!date || !time || !instructorId || !classroomId) {
      setError('Completa fecha, hora, instructor y salón.'); return
    }
    setSubmitting(true); setError(null)
    const err = await onSchedule(date, time, instructorId, classroomId, { leadId, notes: notes.trim() })
    setSubmitting(false)
    if (err) setError(err)
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-6" onClick={onCancel}>
      <form
        onClick={ev => ev.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-2xl bg-[#141414] border border-white/10 p-5 shadow-2xl space-y-3"
      >
        <div>
          <h3 className="text-sm font-bold text-white">
            {isReschedule ? 'Reagendar clase de prueba' : 'Agendar clase de prueba'}
          </h3>
          <p className="text-xs text-white/40 mt-0.5">{studentName ? `${studentName} · ` : ''}primera sesión de reconocimiento</p>
        </div>

        {leads && (
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Interesado *</label>
            <PopupSelect
              value={leadId}
              onChange={id => { setLeadId(id); setNotes(leads.find(l => l.id === id)?.notes ?? '') }}
              placeholder={leads.length ? 'Selecciona un interesado' : 'No hay interesados activos'}
              options={leads.map(l => ({ value: l.id, label: l.name }))}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="trial-date" className="block text-xs text-white/50 mb-1.5">Fecha *</label>
            <input id="trial-date" type="date" required disabled={submitting} value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="trial-time" className="block text-xs text-white/50 mb-1.5">Hora *</label>
            <input id="trial-time" type="time" required disabled={submitting} value={time} onChange={e => setTime(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Instructor *</label>
          <PopupSelect
            value={instructorId}
            onChange={setInstructorId}
            placeholder="Selecciona un instructor"
            options={instructors.map(i => ({ value: i.id, label: i.name }))}
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Salón *</label>
          <PopupSelect
            value={classroomId}
            onChange={setClassroomId}
            placeholder="Selecciona un salón"
            options={classrooms.map(c => ({ value: c.id, label: c.name }))}
          />
        </div>

        {withNotes && (
          <div>
            <label htmlFor="trial-notes" className="block text-xs text-white/50 mb-1.5">Observaciones</label>
            <textarea
              id="trial-notes"
              rows={3}
              disabled={submitting}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Nivel, instrumento, qué busca, cómo llegó…"
              className={`${inputClass} resize-none`}
            />
          </div>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} disabled={submitting} className="text-xs px-4 py-2 rounded-lg font-semibold text-white/60 border border-white/10 hover:border-white/25 hover:text-white transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={submitting} className="text-xs px-4 py-2 rounded-lg font-semibold text-white transition-colors disabled:opacity-50" style={{ background: '#ff7a00' }}>
            {submitting ? 'Agendando…' : isReschedule ? 'Reagendar' : 'Agendar'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  )
}

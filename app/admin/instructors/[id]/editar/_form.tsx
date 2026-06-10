'use client'

import { useActionState, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateInstructorAction, saveAdminInstructorAvailabilityAction } from '../../../_actions/instructors'

const inputClass = 'w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30'
const initial = { error: undefined as string | undefined, success: undefined as boolean | undefined }

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const DEFAULT_START = '10:00'
const DEFAULT_END = '18:00'

interface Slot { day_of_week: number; start_time: string; end_time: string }
interface TimeRange { start: string; end: string }

interface Props {
  instructor: {
    id: string
    name: string
    email: string
    phone: string | null
    status: string
    notes: string | null
    availability: Slot[]
  }
}

export default function EditInstructorForm({ instructor }: Props) {
  const router = useRouter()
  const [state, action, isPending] = useActionState(updateInstructorAction, initial)

  // Disponibilidad
  const [slots, setSlots] = useState<Record<number, TimeRange[]>>(() => {
    const init: Record<number, TimeRange[]> = {}
    for (let d = 1; d <= 5; d++) {
      const existing = instructor.availability.filter(s => s.day_of_week === d)
      init[d] = existing.length > 0
        ? existing.map(s => ({ start: s.start_time.slice(0, 5), end: s.end_time.slice(0, 5) }))
        : []
    }
    return init
  })
  const [availPending, startAvailTransition] = useTransition()
  const [availError, setAvailError] = useState<string | null>(null)
  const [availSaved, setAvailSaved] = useState(false)

  if (state.success) {
    router.push('/admin/instructors')
    return null
  }

  const [firstName, ...rest] = instructor.name.split(' ')
  const lastName = rest.join(' ')

  function toggleDay(day: number) {
    setSlots(prev => ({ ...prev, [day]: prev[day].length > 0 ? [] : [{ start: DEFAULT_START, end: DEFAULT_END }] }))
    setAvailSaved(false)
  }
  function addSlot(day: number) {
    setSlots(prev => ({ ...prev, [day]: [...prev[day], { start: DEFAULT_START, end: DEFAULT_END }] }))
    setAvailSaved(false)
  }
  function removeSlot(day: number, idx: number) {
    setSlots(prev => ({ ...prev, [day]: prev[day].filter((_, i) => i !== idx) }))
    setAvailSaved(false)
  }
  function setTime(day: number, idx: number, field: 'start' | 'end', value: string) {
    setSlots(prev => {
      const ranges = prev[day].map((r, i) => i === idx ? { ...r, [field]: value } : r)
      return { ...prev, [day]: ranges }
    })
    setAvailSaved(false)
  }

  function handleSaveAvailability() {
    setAvailError(null)
    const payload: Slot[] = []
    for (let d = 1; d <= 5; d++) {
      for (const r of slots[d]) {
        if (r.start >= r.end) { setAvailError(`${DAY_NAMES[d - 1]}: el inicio debe ser antes del fin.`); return }
        payload.push({ day_of_week: d, start_time: r.start + ':00', end_time: r.end + ':00' })
      }
    }
    startAvailTransition(async () => {
      const result = await saveAdminInstructorAvailabilityAction(instructor.id, payload)
      if (result.error) { setAvailError(result.error); return }
      setAvailSaved(true)
    })
  }

  return (
    <div className="space-y-5">
      {/* Info general */}
      <form action={action} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5 space-y-4">
        <input type="hidden" name="id" value={instructor.id} />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Nombres *</label>
            <input type="text" name="first_name" required disabled={isPending} defaultValue={firstName} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Apellidos</label>
            <input type="text" name="last_name" disabled={isPending} defaultValue={lastName} className={inputClass} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Email</label>
            <input type="email" name="email" required disabled={isPending} defaultValue={instructor.email} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">WhatsApp</label>
            <input type="tel" name="phone" disabled={isPending} defaultValue={instructor.phone ?? ''} className={inputClass} placeholder="3001234567" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Estado</label>
            <select name="status" disabled={isPending} defaultValue={instructor.status} className={inputClass}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Nueva contraseña <span className="text-white/30">(dejar vacío para no cambiar)</span></label>
            <input type="password" name="password" minLength={6} disabled={isPending} className={inputClass} placeholder="••••••••" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Notas internas</label>
          <textarea name="notes" rows={3} disabled={isPending} defaultValue={instructor.notes ?? ''} className={inputClass + ' resize-none'} placeholder="Notas visibles solo para admins..." />
        </div>

        {state.error && (
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{state.error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit" disabled={isPending}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
            style={{ backgroundColor: '#ff7a00' }}
          >
            {isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <a
            href="/admin/instructors"
            className="px-5 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
          >
            Cancelar
          </a>
        </div>
      </form>

      {/* Disponibilidad */}
      <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">Horario disponible</h2>
          <p className="text-xs text-white/40 mt-0.5">Días y franjas en los que puede dar clases.</p>
        </div>

        <div className="space-y-2">
          {DAY_NAMES.map((name, i) => {
            const day = i + 1
            const active = slots[day].length > 0
            return (
              <div key={day} className={`rounded-xl border px-4 py-3 transition-colors ${active ? 'border-orange-500/25 bg-orange-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={active}
                    onClick={() => toggleDay(day)}
                    className={`relative flex-none h-5 w-9 rounded-full transition-colors overflow-hidden ${active ? 'bg-[#ff7a00]' : 'bg-white/10'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${active ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                  <span className={`flex-none w-24 font-bold text-sm ${active ? 'text-white' : 'text-white/30'}`}>{name}</span>
                  {!active && <span className="ml-auto text-xs text-white/25">No disponible</span>}
                  {active && (
                    <button
                      type="button"
                      onClick={() => addSlot(day)}
                      className="ml-auto flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                      Agregar franja
                    </button>
                  )}
                </div>

                {active && slots[day].map((range, idx) => (
                  <div key={idx} className="flex items-center gap-2 mt-2 pl-12 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-white/40">De</span>
                      <input
                        type="time" value={range.start} min="07:00" max="22:00" step="3600"
                        onChange={e => setTime(day, idx, 'start', e.target.value)}
                        className="rounded-lg border border-white/10 bg-[#1a1a1a] px-2 py-1.5 text-xs font-semibold text-white focus:border-orange-500/50 focus:outline-none w-[88px]"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-white/40">a</span>
                      <input
                        type="time" value={range.end} min="07:00" max="22:00" step="3600"
                        onChange={e => setTime(day, idx, 'end', e.target.value)}
                        className="rounded-lg border border-white/10 bg-[#1a1a1a] px-2 py-1.5 text-xs font-semibold text-white focus:border-orange-500/50 focus:outline-none w-[88px]"
                      />
                    </div>
                    {slots[day].length > 1 && (
                      <button type="button" onClick={() => removeSlot(day, idx)} className="ml-1 text-white/30 hover:text-red-400 transition-colors" aria-label="Eliminar franja">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {availError && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{availError}</p>}
        {availSaved && <p className="text-green-400 text-xs bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">Horario guardado correctamente.</p>}

        <button
          type="button"
          onClick={handleSaveAvailability}
          disabled={availPending}
          className="px-5 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: '#ff7a00' }}
        >
          {availPending ? 'Guardando…' : 'Guardar horario'}
        </button>
      </div>
    </div>
  )
}

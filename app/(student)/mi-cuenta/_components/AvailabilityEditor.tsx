'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { saveInstructorAvailabilityAction } from '../../_actions/student'

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const DEFAULT_START = '10:00'
const DEFAULT_END   = '18:00'

interface Slot {
  day_of_week: number
  start_time: string
  end_time: string
}

interface TimeRange {
  start: string
  end: string
}

interface Props {
  initialAvailability: Slot[]
}

export default function AvailabilityEditor({ initialAvailability }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Agrupar slots por día para la vista
  const slotsByDay = (day: number) => initialAvailability.filter(a => a.day_of_week === day)

  return (
    <div id="disponibilidad" className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-poppins text-lg font-extrabold text-gray-950">Tu horario disponible</h3>
          <p className="text-sm text-gray-600 mt-0.5">Días y horas en los que puedes dar clases.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl border border-[#ff7a00]/35 px-4 py-2 text-sm font-bold text-[#ff7a00] hover:bg-[#ff7a00] hover:text-white transition-colors"
        >
          Editar horario
        </button>
      </div>

      {/* Política de asistencia */}
      <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 mb-4">
        <svg className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-bold">Política de asistencia — </span>
          Las clases a las que no asististe y que <span className="font-bold">no fueron canceladas con al menos 24 horas de anticipación</span> se contabilizan como clases tomadas y se descuentan de tu plan mensual.
        </p>
      </div>

      {/* Vista actual */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {DAY_NAMES.map((name, i) => {
          const daySlots = slotsByDay(i + 1)
          const hasSlots = daySlots.length > 0
          return (
            <div key={name} className={`rounded-xl border p-3 text-xs ${hasSlots ? 'border-[#ff7a00]/25 bg-orange-50/40' : 'border-gray-100 bg-gray-50'}`}>
              <p className={`font-bold font-poppins mb-1 ${hasSlots ? 'text-gray-900' : 'text-gray-400'}`}>{name.slice(0, 3)}</p>
              {hasSlots
                ? daySlots.map((slot, idx) => (
                    <p key={idx} className="text-[#ff7a00] font-semibold leading-tight">
                      {slot.start_time.slice(0,5)}–{slot.end_time.slice(0,5)}
                    </p>
                  ))
                : <p className="text-gray-400">No disp.</p>
              }
            </div>
          )
        })}
      </div>

      {initialAvailability.length === 0 && (
        <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          No has configurado tu disponibilidad. Haz clic en &quot;Editar horario&quot; para definir tus días y horas.
        </p>
      )}

      {mounted && open && createPortal(
        <AvailabilityModal
          initialSlots={initialAvailability}
          onClose={() => setOpen(false)}
          onSaved={() => setOpen(false)}
        />,
        document.body
      )}
    </div>
  )
}

/* ── Modal de edición ─────────────────────────────────────────────── */
function AvailabilityModal({ initialSlots, onClose, onSaved }: {
  initialSlots: Slot[]
  onClose: () => void
  onSaved: () => void
}) {
  // Estado: array de rangos por día (vacío = no disponible)
  const [slots, setSlots] = useState<Record<number, TimeRange[]>>(() => {
    const init: Record<number, TimeRange[]> = {}
    for (let d = 1; d <= 5; d++) {
      const existing = initialSlots.filter(s => s.day_of_week === d)
      init[d] = existing.length > 0
        ? existing.map(s => ({ start: s.start_time.slice(0,5), end: s.end_time.slice(0,5) }))
        : []
    }
    return init
  })

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  function toggleDay(day: number) {
    setSlots(prev => ({
      ...prev,
      [day]: prev[day].length > 0 ? [] : [{ start: DEFAULT_START, end: DEFAULT_END }]
    }))
  }

  function addSlot(day: number) {
    setSlots(prev => ({
      ...prev,
      [day]: [...prev[day], { start: DEFAULT_START, end: DEFAULT_END }]
    }))
  }

  function removeSlot(day: number, idx: number) {
    setSlots(prev => {
      const next = prev[day].filter((_, i) => i !== idx)
      return { ...prev, [day]: next }
    })
  }

  function setTime(day: number, idx: number, field: 'start' | 'end', value: string) {
    setSlots(prev => {
      const ranges = prev[day].map((r, i) => i === idx ? { ...r, [field]: value } : r)
      return { ...prev, [day]: ranges }
    })
  }

  function handleSave() {
    setError(null)
    const payload: Slot[] = []
    for (let d = 1; d <= 5; d++) {
      for (const r of slots[d]) {
        if (r.start >= r.end) {
          setError(`${DAY_NAMES[d-1]}: cada rango debe tener inicio antes del fin.`)
          return
        }
        payload.push({ day_of_week: d, start_time: r.start + ':00', end_time: r.end + ':00' })
      }
    }
    startTransition(async () => {
      const result = await saveInstructorAvailabilityAction(payload)
      if (result.error) { setError(result.error); return }
      onSaved()
    })
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-poppins text-xl font-extrabold text-gray-950">Editar horario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Días */}
        <div className="px-6 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {DAY_NAMES.map((name, i) => {
            const day = i + 1
            const active = slots[day].length > 0
            return (
              <div key={day} className={`rounded-xl border px-4 py-3 transition-colors ${active ? 'border-[#ff7a00]/30 bg-orange-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
                {/* Fila del día */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={active}
                    onClick={() => toggleDay(day)}
                    aria-label={active ? `Desactivar ${name}` : `Activar ${name}`}
                    className={`relative flex-none h-6 w-11 rounded-full transition-colors overflow-hidden ${active ? 'bg-[#ff7a00]' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${active ? 'translate-x-5' : 'translate-x-0'}`}/>
                  </button>
                  <span className={`flex-none w-24 font-poppins font-bold text-sm ${active ? 'text-gray-900' : 'text-gray-400'}`}>{name}</span>
                  {!active && <span className="ml-auto text-xs text-gray-400">No disponible</span>}
                  {active && (
                    <button
                      type="button"
                      onClick={() => addSlot(day)}
                      className="ml-auto flex items-center gap-1 text-xs font-semibold text-[#ff7a00] hover:text-orange-600 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                      Agregar franja
                    </button>
                  )}
                </div>

                {/* Franjas horarias */}
                {active && slots[day].map((range, idx) => (
                  <div key={idx} className="flex items-center gap-2 mt-2 pl-14 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">De</span>
                      <input
                        type="time"
                        value={range.start}
                        min="07:00" max="22:00" step="3600"
                        onChange={e => setTime(day, idx, 'start', e.target.value)}
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-800 focus:border-[#ff7a00]/50 focus:outline-none bg-white w-[88px]"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">a</span>
                      <input
                        type="time"
                        value={range.end}
                        min="07:00" max="22:00" step="3600"
                        onChange={e => setTime(day, idx, 'end', e.target.value)}
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-800 focus:border-[#ff7a00]/50 focus:outline-none bg-white w-[88px]"
                      />
                    </div>
                    {slots[day].length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSlot(day, idx)}
                        className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Eliminar franja"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {error && <p className="text-xs text-red-600 flex-1">{error}</p>}
          {!error && <span className="text-xs text-gray-400 flex-1">Los cambios se guardan inmediatamente.</span>}
          <div className="flex gap-2 shrink-0">
            <button onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={isPending}
              className="px-6 py-2 rounded-xl bg-[#ff7a00] text-sm font-bold text-white hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-wait">
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { saveInstructorAvailabilityAction } from '../../_actions/student'

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DEFAULT_START = '08:00'
const DEFAULT_END   = '20:00'

interface Slot {
  day_of_week: number   // 1=Lunes … 7=Domingo
  start_time: string
  end_time: string
}

interface Props {
  initialAvailability: Slot[]
}

export default function AvailabilityEditor({ initialAvailability }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

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

      {/* Vista actual */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {DAY_NAMES.map((name, i) => {
          const slot = initialAvailability.find(a => a.day_of_week === i + 1)
          return (
            <div key={name} className={`rounded-xl border p-3 text-xs ${slot ? 'border-[#ff7a00]/25 bg-orange-50/40' : 'border-gray-100 bg-gray-50'}`}>
              <p className={`font-bold font-poppins mb-1 ${slot ? 'text-gray-900' : 'text-gray-400'}`}>{name.slice(0, 3)}</p>
              {slot
                ? <p className="text-[#ff7a00] font-semibold">{slot.start_time.slice(0,5)}<br/>{slot.end_time.slice(0,5)}</p>
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
  // Estado: un objeto por día (1-7), null = no disponible
  const [slots, setSlots] = useState<Record<number, { start: string; end: string } | null>>(() => {
    const init: Record<number, { start: string; end: string } | null> = {}
    for (let d = 1; d <= 7; d++) {
      const existing = initialSlots.find(s => s.day_of_week === d)
      init[d] = existing
        ? { start: existing.start_time.slice(0,5), end: existing.end_time.slice(0,5) }
        : null
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
      [day]: prev[day] ? null : { start: DEFAULT_START, end: DEFAULT_END }
    }))
  }

  function setTime(day: number, field: 'start' | 'end', value: string) {
    setSlots(prev => {
      const current = prev[day]
      if (!current) return prev
      return { ...prev, [day]: { ...current, [field]: value } }
    })
  }

  function handleSave() {
    setError(null)
    const payload: Slot[] = []
    for (let d = 1; d <= 7; d++) {
      const s = slots[d]
      if (!s) continue
      if (s.start >= s.end) {
        setError(`${DAY_NAMES[d-1]}: la hora de inicio debe ser antes de la hora de fin.`)
        return
      }
      payload.push({ day_of_week: d, start_time: s.start + ':00', end_time: s.end + ':00' })
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
            const active = slots[day] !== null
            return (
              <div key={day} className={`rounded-xl border p-3 transition-colors ${active ? 'border-[#ff7a00]/30 bg-orange-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
                <div className="flex items-center gap-3">
                  {/* Toggle */}
                  <button
                    onClick={() => toggleDay(day)}
                    className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${active ? 'bg-[#ff7a00]' : 'bg-gray-200'}`}
                    aria-label={active ? `Desactivar ${name}` : `Activar ${name}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-0.5'}`}/>
                  </button>
                  <span className={`font-poppins font-bold text-sm min-w-[80px] ${active ? 'text-gray-900' : 'text-gray-400'}`}>{name}</span>

                  {active && slots[day] && (
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs text-gray-500">De</label>
                        <input
                          type="time"
                          value={slots[day]!.start}
                          onChange={e => setTime(day, 'start', e.target.value)}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-800 focus:border-[#ff7a00]/50 focus:outline-none bg-white"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs text-gray-500">a</label>
                        <input
                          type="time"
                          value={slots[day]!.end}
                          onChange={e => setTime(day, 'end', e.target.value)}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-800 focus:border-[#ff7a00]/50 focus:outline-none bg-white"
                        />
                      </div>
                    </div>
                  )}
                  {!active && <span className="ml-auto text-xs text-gray-400">No disponible</span>}
                </div>
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

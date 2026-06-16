'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { saveInstructorAvailabilityAction, createInstructorAvailabilityAction, updateInstructorAvailabilityAction, deleteInstructorAvailabilityAction, extendInstructorAvailabilityAction, blockDateForInstructorAction, unblockDateForInstructorAction, getInstructorBlocksAction, getInstructorAvailabilityLogAction } from '../../_actions/student'

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const DAY_NAMES_FULL = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DEFAULT_START = '10:00'
const DEFAULT_END = '18:00'

interface Slot {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface TimeRange {
  start: string
  end: string
}

interface BlockEntry {
  id: string
  blocked_date: string
  start_time: string
  end_time: string
  reason: string
  created_at: string
}

interface LogEntry {
  id: string
  action: string
  day_of_week: number | null
  start_time: string | null
  end_time: string | null
  status: string | null
  notes: string | null
  changed_by: string
  changed_by_name: string | null
  created_at: string
  blocked_date: string | null
  block_reason: string | null
  block_start_time: string | null
  block_end_time: string | null
  valid_from: string | null
  valid_until: string | null
}

interface Props {
  initialAvailability: Slot[]
}

export default function AvailabilityEditor({ initialAvailability }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const slotsByDay = (day: number) => initialAvailability.filter(a => a.day_of_week === day)

  const activeSlots = initialAvailability.length
  const blockCount = 0
  const lastMod = initialAvailability.length > 0 ? 'Hoy' : '—'

  return (
    <div id="disponibilidad" className="mt-6 space-y-4">
      {/* Resumen */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
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
      </div>

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

/* ── Modal de edición completo ──────────────────────────────────── */
function AvailabilityModal({ initialSlots, onClose, onSaved }: {
  initialSlots: Slot[]
  onClose: () => void
  onSaved: () => void
}) {
  const [tab, setTab] = useState<'horarios' | 'bloqueos' | 'historial'>('horarios')
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-poppins text-xl font-extrabold text-gray-950">Editar horario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 shrink-0">
          {[
            { key: 'horarios' as const, label: 'Horarios', desc: 'Gestiona tus franjas' },
            { key: 'bloqueos' as const, label: 'Bloqueos', desc: 'Fechas específicas' },
            { key: 'historial' as const, label: 'Historial', desc: 'Cambios recientes' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-[#ff7a00] text-[#ff7a00]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tab === 'horarios' && <HorariosTab initialSlots={initialSlots} onSaved={onSaved} />}
          {tab === 'bloqueos' && <BloqueosTab />}
          {tab === 'historial' && <HistorialTab />}
        </div>
      </div>
    </div>
  )
}

/* ── Tab: Horarios (CRUD individual + ampliar) ──────────────────── */
function HorariosTab({ initialSlots, onSaved }: { initialSlots: Slot[]; onSaved: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [slots, setSlots] = useState<Record<number, TimeRange[]>>(() => {
    const init: Record<number, TimeRange[]> = {}
    for (let d = 1; d <= 5; d++) {
      const existing = initialSlots.filter(s => s.day_of_week === d)
      init[d] = existing.length > 0
        ? existing.map(s => ({ start: s.start_time.slice(0,5), end: s.end_time.slice(0,5), id: s.id }))
        : []
    }
    return init
  })
  const [editingSlot, setEditingSlot] = useState<{ day: number; idx: number } | null>(null)
  const [editValue, setEditValue] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [extendingSlot, setExtendingSlot] = useState<{ day: number; idx: number } | null>(null)
  const [extendValue, setExtendValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
    const slot = slots[day][idx]
    if (!window.confirm(`¿Eliminar ${slot.start}–${slot.end}?`)) return
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

  function isOverlapping(day: number): boolean {
    const ranges = slots[day]
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        if (ranges[i].start < ranges[j].end && ranges[j].start < ranges[i].end) return true
      }
    }
    return false
  }

  function handleSave() {
    setError(null)
    setSuccess(null)

    for (let d = 1; d <= 5; d++) {
      if (isOverlapping(d)) {
        setError(`${DAY_NAMES[d-1]}: los horarios no pueden solaparse.`)
        return
      }
      for (const r of slots[d]) {
        if (r.start >= r.end) {
          setError(`${DAY_NAMES[d-1]}: cada rango debe tener inicio antes del fin.`)
          return
        }
      }
    }

    startTransition(async () => {
      const payload: { day_of_week: number; start_time: string; end_time: string }[] = []
      for (let d = 1; d <= 5; d++) {
        for (const r of slots[d]) {
          payload.push({ day_of_week: d, start_time: r.start + ':00', end_time: r.end + ':00' })
        }
      }
      const result = await saveInstructorAvailabilityAction(payload)
      if (result.error) { setError(result.error); return }
      setSuccess('Horarios guardados correctamente.')
      setTimeout(onSaved, 1000)
    })
  }

  function handleEditStart(day: number, idx: number) {
    const slot = slots[day][idx]
    setEditingSlot({ day, idx })
    setEditValue({ start: slot.start, end: slot.end })
  }

  function handleEditSave() {
    if (!editingSlot) return
    const { day, idx } = editingSlot
    if (editValue.start >= editValue.end) {
      setError('La hora de inicio debe ser anterior a la de fin.')
      return
    }
    setSlots(prev => {
      const ranges = prev[day].map((r, i) => i === idx ? { start: editValue.start, end: editValue.end } : r)
      return { ...prev, [day]: ranges }
    })
    setEditingSlot(null)
  }

  function handleExtendStart(day: number, idx: number) {
    const slot = slots[day][idx]
    setExtendingSlot({ day, idx })
    setExtendValue(slot.end)
  }

  function handleExtendSave() {
    if (!extendingSlot) return
    const { day, idx } = extendingSlot
    const current = slots[day][idx]
    if (extendValue <= current.end) {
      setError('La nueva hora debe ser mayor a la actual.')
      return
    }
    setSlots(prev => {
      const ranges = prev[day].map((r, i) => i === idx ? { ...r, end: extendValue } : r)
      return { ...prev, [day]: ranges }
    })
    setExtendingSlot(null)
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">{success}</p>}

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
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addSlot(day)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#ff7a00] hover:text-orange-600 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                    Agregar
                  </button>
                </div>
              )}
            </div>

            {/* Franjas horarias con acciones individuales */}
            {active && slots[day].map((range, idx) => (
              <div key={idx} className="mt-2 pl-14">
                {editingSlot?.day === day && editingSlot?.idx === idx ? (
                  /* Modo edición */
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">De</span>
                    <input type="time" value={editValue.start} min="07:00" max="22:00" step="3600"
                      onChange={e => setEditValue(p => ({ ...p, start: e.target.value }))}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-800 focus:border-[#ff7a00]/50 focus:outline-none bg-white w-[88px]"
                    />
                    <span className="text-xs text-gray-500">a</span>
                    <input type="time" value={editValue.end} min="07:00" max="22:00" step="3600"
                      onChange={e => setEditValue(p => ({ ...p, end: e.target.value }))}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-800 focus:border-[#ff7a00]/50 focus:outline-none bg-white w-[88px]"
                    />
                    <button onClick={handleEditSave} className="text-xs font-bold text-green-600 hover:text-green-700 px-2">Guardar</button>
                    <button onClick={() => setEditingSlot(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancelar</button>
                  </div>
                ) : extendingSlot?.day === day && extendingSlot?.idx === idx ? (
                  /* Modo ampliar */
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">Ampliar hasta</span>
                    <input type="time" value={extendValue} min={range.end} max="22:00" step="3600"
                      onChange={e => setExtendValue(e.target.value)}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-800 focus:border-[#ff7a00]/50 focus:outline-none bg-white w-[88px]"
                    />
                    <button onClick={handleExtendSave} className="text-xs font-bold text-green-600 hover:text-green-700 px-2">Guardar</button>
                    <button onClick={() => setExtendingSlot(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancelar</button>
                  </div>
                ) : (
                  /* Modo vista */
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-700 min-w-[90px]">{range.start} – {range.end}</span>
                    <button onClick={() => handleEditStart(day, idx)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Editar</button>
                    <button onClick={() => handleExtendStart(day, idx)} className="text-xs text-green-600 hover:text-green-700 font-medium">Ampliar</button>
                    {slots[day].length > 1 && (
                      <button onClick={() => removeSlot(day, idx)} className="text-xs text-red-500 hover:text-red-600 font-medium">Eliminar</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      })}

      <div className="pt-3 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-[#ff7a00] text-sm font-bold text-white hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

/* ── Tab: Bloqueos por fecha específica ────────────────────────── */
function BloqueosTab() {
  const [isPending, startTransition] = useTransition()
  const [blocks, setBlocks] = useState<BlockEntry[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ blocked_date: '', start_time: '08:00', end_time: '10:00', reason: '' })
  const [error, setError] = useState<string | null>(null)

  const loadBlocks = useCallback(() => {
    startTransition(async () => {
      const data = await getInstructorBlocksAction()
      setBlocks(data ?? [])
      setLoaded(true)
    })
  }, [])

  useEffect(() => { loadBlocks() }, [loadBlocks])

  function handleCreate() {
    setError(null)
    if (!form.blocked_date || !form.reason) { setError('Completa todos los campos.'); return }
    if (form.start_time >= form.end_time) { setError('La hora de inicio debe ser anterior a la de fin.'); return }
    startTransition(async () => {
      const result = await blockDateForInstructorAction(form)
      if (result.error) { setError(result.error); return }
      setShowForm(false)
      setForm({ blocked_date: '', start_time: '08:00', end_time: '10:00', reason: '' })
      loadBlocks()
    })
  }

  function handleUnblock(id: string) {
    if (!window.confirm('¿Desbloquear esta fecha?')) return
    startTransition(async () => {
      const result = await unblockDateForInstructorAction(id)
      if (result.error) { setError(result.error); return }
      loadBlocks()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Bloquea fechas específicas en las que no puedas dar clases.</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
          style={{ backgroundColor: '#ff7a00' }}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Bloquear fecha
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {/* Formulario de bloqueo */}
      {showForm && (
        <div className="border border-[#ff7a00]/30 rounded-xl p-4 bg-orange-50/30 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha *</label>
              <input type="date" value={form.blocked_date}
                onChange={e => setForm(p => ({ ...p, blocked_date: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#ff7a00]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Motivo *</label>
              <input type="text" value={form.reason} placeholder="Ej: Vacaciones, Concierto, Incapacidad..."
                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#ff7a00]/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hora inicio</label>
              <input type="time" value={form.start_time}
                onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#ff7a00]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hora fin</label>
              <input type="time" value={form.end_time}
                onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#ff7a00]/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button onClick={handleCreate} disabled={isPending}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: '#ff7a00' }}
            >
              {isPending ? 'Guardando...' : 'Bloquear'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de bloqueos */}
      {loaded && blocks.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 text-center py-8">No hay fechas bloqueadas.</p>
      )}
      {blocks.length > 0 && (
        <div className="divide-y divide-gray-100">
          {blocks.map(b => (
            <div key={b.id} className="flex items-center gap-4 py-3">
              <span className="flex-none w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center font-bold text-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(b.blocked_date + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-xs text-gray-500">
                  {b.start_time.slice(0,5)} – {b.end_time.slice(0,5)}
                  <span className="ml-2 text-red-500">· {b.reason}</span>
                </p>
              </div>
              <button onClick={() => handleUnblock(b.id)} className="text-xs text-red-500 hover:text-red-600 font-medium shrink-0">Desbloquear</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Tab: Historial (timeline) ──────────────────────────────────── */
function HistorialTab() {
  const [isPending, startTransition] = useTransition()
  const [log, setLog] = useState<LogEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    startTransition(async () => {
      const data = await getInstructorAvailabilityLogAction()
      setLog(data ?? [])
      setLoaded(true)
    })
  }, [])

  const ACTION_META: Record<string, { label: string; icon: string; color: string }> = {
    created:   { label: 'Agregado',   icon: 'plus',    color: 'bg-green-100 text-green-600' },
    updated:   { label: 'Modificado', icon: 'edit',    color: 'bg-blue-100 text-blue-600' },
    deleted:   { label: 'Eliminado',  icon: 'trash',   color: 'bg-red-100 text-red-600' },
    extended:  { label: 'Ampliado',   icon: 'expand',  color: 'bg-purple-100 text-purple-600' },
    blocked:   { label: 'Bloqueado',  icon: 'lock',    color: 'bg-yellow-100 text-yellow-600' },
    unblocked: { label: 'Desbloqueado', icon: 'unlock', color: 'bg-gray-100 text-gray-600' },
  }

  if (!loaded) {
    return <div className="flex items-center justify-center py-12"><div className="h-6 w-6 rounded-full border-2 border-[#ff7a00] border-t-transparent animate-spin" /></div>
  }

  if (log.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-12">Aún no hay cambios registrados.</p>
  }

  return (
    <div className="relative">
      {/* Línea vertical */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />

      <div className="space-y-0">
        {log.map((entry, i) => {
          const meta = ACTION_META[entry.action] ?? { label: entry.action, icon: 'circle', color: 'bg-gray-100 text-gray-600' }
          const isFirst = i === 0

          return (
            <div key={entry.id} className="relative pl-14 pb-6">
              {/* Círculo en la línea */}
              <div className={`absolute left-3.5 top-1 w-3.5 h-3.5 rounded-full ring-4 ring-white ${isFirst ? 'bg-[#ff7a00]' : 'bg-gray-300'}`} />

              {/* Card */}
              <div className={`rounded-xl border p-4 ${isFirst ? 'border-[#ff7a00]/30 bg-orange-50/30' : 'border-gray-100 bg-white'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${meta.color}`}>
                    {meta.label}
                  </span>
                  <time className="text-xs text-gray-400">
                    {new Date(entry.created_at).toLocaleDateString('es-CO', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </time>
                </div>
                <p className="text-sm text-gray-700">
                  {entry.changed_by_name && <span className="font-semibold">{entry.changed_by_name}</span>}
                  {entry.day_of_week && DAY_NAMES_FULL[entry.day_of_week] && (
                    <span> · {DAY_NAMES_FULL[entry.day_of_week]}</span>
                  )}
                  {entry.start_time && entry.end_time && (
                    <span className="font-mono text-xs ml-1">{entry.start_time.slice(0,5)}–{entry.end_time.slice(0,5)}</span>
                  )}
                  {entry.status && (
                    <span className="text-xs ml-1 text-gray-400">({entry.status === 'available' ? 'disponible' : 'bloqueado'})</span>
                  )}
                </p>
                {entry.notes && <p className="text-xs text-gray-500 mt-1">{entry.notes}</p>}
                {entry.blocked_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Fecha: {new Date(entry.blocked_date + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
                    {entry.block_reason && <span className="ml-1 text-red-500">· {entry.block_reason}</span>}
                  </p>
                )}
                {entry.block_start_time && entry.block_end_time && (
                  <p className="text-xs text-gray-400 mt-0.5">{entry.block_start_time.slice(0,5)}–{entry.block_end_time.slice(0,5)}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

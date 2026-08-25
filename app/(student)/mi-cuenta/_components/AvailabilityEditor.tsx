'use client'

import { useState, useTransition, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { saveInstructorAvailabilityAction, createInstructorAvailabilityAction, updateInstructorAvailabilityAction, deleteInstructorAvailabilityAction, extendInstructorAvailabilityAction, blockDateForInstructorAction, unblockDateForInstructorAction, getInstructorBlocksAction, getInstructorAvailabilityLogAction, getUnassignedStudentsForDay, assignInstructorToScheduleAction } from '../../_actions/student'
import { OPEN_SCHEDULE_EVENT, type OpenScheduleDetail, type ScheduleModalTab } from './scheduleEvents'

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
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
  id?: string
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
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [focusDay, setFocusDay] = useState<number | null>(null)
  const [initialTab, setInitialTab] = useState<ScheduleModalTab>('horarios')
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    const openIt = (e: Event) => {
      const detail = (e as CustomEvent<OpenScheduleDetail>).detail
      setFocusDay(typeof detail === 'number' ? detail : detail?.focusDay ?? null)
      setInitialTab(typeof detail === 'number' ? 'horarios' : detail?.tab ?? 'horarios')
      setOpen(true)
    }
    window.addEventListener(OPEN_SCHEDULE_EVENT, openIt)
    return () => window.removeEventListener(OPEN_SCHEDULE_EVENT, openIt)
  }, [])

  return (
    <>
      {mounted && open && createPortal(
        <AvailabilityModal
          initialSlots={initialAvailability}
          focusDay={focusDay}
          initialTab={initialTab}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); router.refresh() }}
        />,
        document.body
      )}
    </>
  )
}

/* ── Modal de edición completo ──────────────────────────────────── */
function AvailabilityModal({ initialSlots, focusDay, initialTab, onClose, onSaved }: {
  initialSlots: Slot[]
  focusDay?: number | null
  initialTab: ScheduleModalTab
  onClose: () => void
  onSaved: () => void
}) {
  const [tab, setTab] = useState<ScheduleModalTab>(initialTab)
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
          {tab === 'horarios' && <HorariosTab initialSlots={initialSlots} onSaved={onSaved} focusDay={focusDay} />}
          {tab === 'bloqueos' && <BloqueosTab />}
          {tab === 'historial' && <HistorialTab />}
        </div>
      </div>
    </div>
  )
}

/* ── Tab: Horarios (CRUD individual + ampliar) ──────────────────── */
function HorariosTab({ initialSlots, onSaved, focusDay }: { initialSlots: Slot[]; onSaved: () => void; focusDay?: number | null }) {
  const [isPending, startTransition] = useTransition()
  const [slots, setSlots] = useState<Record<number, TimeRange[]>>(() => {
    const init: Record<number, TimeRange[]> = {}
    for (let d = 1; d <= 6; d++) {
      const existing = initialSlots.filter(s => s.day_of_week === d)
      init[d] = existing.length > 0
        ? existing.map(s => ({ start: s.start_time.slice(0,5), end: s.end_time.slice(0,5), id: s.id }))
        : (d === focusDay ? [{ start: DEFAULT_START, end: DEFAULT_END }] : [])
    }
    return init
  })
  const [editingSlot, setEditingSlot] = useState<{ day: number; idx: number } | null>(null)
  const [editValue, setEditValue] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [extendingSlot, setExtendingSlot] = useState<{ day: number; idx: number } | null>(null)
  const [extendValue, setExtendValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const focusRef = useRef<HTMLDivElement>(null)
  useEffect(() => { focusRef.current?.scrollIntoView({ block: 'center' }) }, [])

  function toggleDay(day: number) {
    const wasActive = slots[day].length > 0
    if (wasActive) {
      setSlots(prev => ({ ...prev, [day]: [] }))
      return
    }
    setSlots(prev => ({ ...prev, [day]: [{ start: DEFAULT_START, end: DEFAULT_END, id: undefined }] }))
  }

  function addSlot(day: number) {
    if (isPending) return
    const latestEnd = slots[day].reduce((latest, slot) => slot.end > latest ? slot.end : latest, '09:00')
    const [hour] = latestEnd.split(':').map(Number)
    if (hour >= 21) { setError('No puedes agregar más franjas después de las 21:00.'); return }
    const start = latestEnd
    const end = `${String(hour + 1).padStart(2, '0')}:00`
    startTransition(async () => {
      const result = await createInstructorAvailabilityAction({ day_of_week: day, start_time: start + ':00', end_time: end + ':00' })
      if (result.error) { setError(result.error); return }
      setSlots(prev => ({ ...prev, [day]: [...prev[day], { start, end, id: result.id }] }))
    })
  }

  function removeSlot(day: number, idx: number) {
    const slot = slots[day][idx]
    if (!window.confirm(`¿Eliminar ${slot.start}–${slot.end}?`)) return
    if (slot.id) startTransition(async () => { await deleteInstructorAvailabilityAction(slot.id!) })
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

    for (let d = 1; d <= 6; d++) {
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

    const payload = Object.entries(slots).flatMap(([day, ranges]) => ranges.map(range => ({
      day_of_week: Number(day), start_time: `${range.start}:00`, end_time: `${range.end}:00`,
    })))
    startTransition(async () => {
      const result = await saveInstructorAvailabilityAction(payload)
      if (result.error) { setError(result.error); return }
      setSuccess('Horarios guardados correctamente.')
      setTimeout(onSaved, 600)
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
    const slotId = slots[day][idx].id
    setSlots(prev => {
      const ranges = prev[day].map((r, i) => i === idx ? { ...r, start: editValue.start, end: editValue.end } : r)
      return { ...prev, [day]: ranges }
    })
    setEditingSlot(null)
    if (slotId) {
      startTransition(async () => {
        const result = await updateInstructorAvailabilityAction(slotId, { start_time: editValue.start + ':00', end_time: editValue.end + ':00' })
        if (result.error) setError(result.error)
      })
    }
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
    const slotId = current.id
    setSlots(prev => {
      const ranges = prev[day].map((r, i) => i === idx ? { ...r, end: extendValue } : r)
      return { ...prev, [day]: ranges }
    })
    setExtendingSlot(null)
    if (slotId) {
      startTransition(async () => {
        const result = await extendInstructorAvailabilityAction(slotId, extendValue + ':00')
        if (result.error) setError(result.error)
      })
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">{success}</p>}

      {DAY_NAMES.map((name, i) => {
        const day = i + 1
        const active = slots[day].length > 0
        const isFocus = day === focusDay
        return (
          <div key={day} ref={isFocus ? focusRef : undefined}
            className={`rounded-xl border px-4 py-3 transition-colors ${isFocus ? 'ring-2 ring-[#ff7a00]/50' : ''} ${active ? 'border-[#ff7a00]/30 bg-orange-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
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
              <div key={idx} className="mt-2 pl-0 sm:pl-14">
                {editingSlot?.day === day && editingSlot?.idx === idx ? (
                  /* Modo edición */
                  <div className="flex items-end gap-2 rounded-lg bg-white/80 p-2 sm:p-0 flex-wrap">
                    <label className="text-xs font-medium text-gray-600">De
                    <input type="time" value={editValue.start} min="07:00" max="22:00" step="3600"
                      onChange={e => setEditValue(p => ({ ...p, start: e.target.value }))}
                      className="mt-1 block h-9 w-[112px] rounded-lg border border-gray-300 bg-white px-2 text-sm font-semibold text-gray-900 focus:border-[#ff7a00] focus:outline-none"
                    />
                    </label>
                    <label className="text-xs font-medium text-gray-600">A
                    <input type="time" value={editValue.end} min="07:00" max="22:00" step="3600"
                      onChange={e => setEditValue(p => ({ ...p, end: e.target.value }))}
                      className="mt-1 block h-9 w-[112px] rounded-lg border border-gray-300 bg-white px-2 text-sm font-semibold text-gray-900 focus:border-[#ff7a00] focus:outline-none"
                    />
                    </label>
                    <button onClick={handleEditSave} className="h-9 rounded-lg bg-green-600 px-3 text-xs font-bold text-white hover:bg-green-700">Guardar</button>
                    <button onClick={() => setEditingSlot(null)} className="h-9 rounded-lg px-2 text-xs font-medium text-gray-600 hover:bg-gray-100">Cancelar</button>
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

            {active && <MatchingStudents day={day} ranges={slots[day]} />}
          </div>
        )
      })}

      <div className="pt-3 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-[#ff7a00] text-sm font-bold text-white hover:bg-orange-600 transition-colors"
        >
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

/* ── Alumnos sin instructor que calzan con un día ─────────────────── */
function MatchingStudents({ day, ranges }: { day: number; ranges: TimeRange[] }) {
  const [isPending, startTransition] = useTransition()
  const [requested, setRequested] = useState(false)
  const [matches, setMatches] = useState<any[] | null>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [assigning, setAssigning] = useState<string | null>(null)
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set())

  const rangesKey = ranges.map(r => `${r.start}-${r.end}`).join(',')

  useEffect(() => {
    if (!requested) return
    if (ranges.length === 0) { setMatches([]); return }
    startTransition(async () => {
      const lists = await Promise.all(
        ranges.map(r => getUnassignedStudentsForDay(day, r.start, r.end))
      )
      const seen = new Set<string>()
      const merged: any[] = [] // eslint-disable-line @typescript-eslint/no-explicit-any
      for (const list of lists) for (const s of list) {
        if (seen.has(s.id)) continue
        seen.add(s.id)
        merged.push(s)
      }
      setMatches(merged)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, rangesKey, requested])

  function handleAssign(scheduleId: string) {
    setAssigning(scheduleId)
    startTransition(async () => {
      const result = await assignInstructorToScheduleAction(scheduleId)
      setAssigning(null)
      if (!result.error) setAssignedIds(prev => new Set(prev).add(scheduleId))
    })
  }

  const visible = (matches ?? []).filter(m => !assignedIds.has(m.id))

  return (
    <div className="mt-3 pl-14">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Alumnos sin instructor en este horario</p>
      {!requested
        ? <button type="button" onClick={() => setRequested(true)} className="text-xs font-semibold text-[#ff7a00] hover:text-orange-600">Ver alumnos disponibles</button>
        : isPending && matches === null
        ? <p className="text-xs text-gray-400">Buscando…</p>
        : visible.length === 0
          ? <p className="text-xs text-gray-400">No hay alumnos esperando instructor en este horario.</p>
          : (
            <div className="space-y-1.5">
              {visible.map(m => (
                <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-white px-3 py-1.5">
                  <span className="text-xs text-gray-700">
                    <span className="font-semibold">{m.student?.name ?? 'Alumno'}</span>
                    {' · '}{m.course?.name ?? '—'}{' · '}{m.start_time?.slice(0,5)}
                  </span>
                  <button
                    onClick={() => handleAssign(m.id)}
                    disabled={assigning === m.id}
                    className="text-xs font-bold text-[#ff7a00] hover:text-orange-600 disabled:opacity-50 shrink-0"
                  >
                    {assigning === m.id ? 'Asignando…' : 'Asignarme'}
                  </button>
                </div>
              ))}
            </div>
          )
      }
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

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import BookSessionModal from './BookSessionModal'
import SessionDetailModal from './SessionDetailModal'
import type { ClassSession, AvailableSlot } from '@/types/admin'

// Slots por día de la semana
// ISODOW: 1=Lun…5=Vie → 10:00–21:00  |  6=Sáb → 08:00–13:00  |  7=Dom → cerrado
function generateSlots(isodow: number): string[] {
  if (isodow === 7) return []
  if (isodow === 6) {
    const slots: string[] = []
    for (let h = 8; h <= 13; h++) slots.push(`${String(h).padStart(2, '0')}:00`)
    return slots
  }
  const slots: string[] = []
  for (let h = 10; h <= 21; h++) slots.push(`${String(h).padStart(2, '0')}:00`)
  return slots
}

function getIsodow(date: Date): number {
  const d = date.getDay()
  return d === 0 ? 7 : d
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDateHeader(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
}

const STATUS_COLOR: Record<string, string> = {
  pending:     'border-l-yellow-400 bg-yellow-900/20',
  confirmed:   'border-l-green-400 bg-green-900/20',
  completed:   'border-l-blue-400 bg-blue-900/15',
  cancelled:   'border-l-red-400 bg-red-900/15 opacity-50',
  rescheduled: 'border-l-purple-400 bg-purple-900/15 opacity-50',
  no_show:     'border-l-gray-500 bg-gray-800/30 opacity-50',
}

function getSlotStatus(
  date: string,
  time: string,
  availabilityByDay: Record<string, AvailableSlot[]>
): 'available' | 'occupied' | 'unknown' {
  const daySlots = availabilityByDay[date]
  if (!daySlots || daySlots.length === 0) return 'unknown'
  const slotsForTime = daySlots.filter(s => s.slot_time.slice(0, 5) === time)
  if (slotsForTime.length === 0) return 'unknown'
  return slotsForTime.some(s => s.is_available) ? 'available' : 'occupied'
}

interface Props {
  weekStart:         string
  sessions:          ClassSession[]
  blocked:           any[]
  students:          { id: string; name: string; phone: string }[]
  courses:           { id: string; name: string }[]
  classrooms:        { id: string; name: string }[]
  instructors:       { id: string; name: string }[]
  availabilityByDay: Record<string, AvailableSlot[]>
  defaultStudentId?: string
}

export default function WeekCalendar({ weekStart, sessions, blocked, students, courses, classrooms, instructors, availabilityByDay, defaultStudentId }: Props) {
  const router = useRouter()
  const [bookSlot, setBookSlot] = useState<{ date: string; time: string } | null>(null)
  const [viewSession, setViewSession] = useState<ClassSession | null>(null)

  const prevWeek = addDays(weekStart, -7)
  const nextWeek = addDays(weekStart,  7)

  // Índice de sesiones por fecha+hora
  const sessionsBySlot: Record<string, ClassSession[]> = {}
  for (const s of sessions) {
    const key = `${s.scheduled_date}|${s.start_time.slice(0, 5)}`
    if (!sessionsBySlot[key]) sessionsBySlot[key] = []
    sessionsBySlot[key].push(s)
  }

  // Conjunto de fechas bloqueadas
  const blockedSet = new Set<string>(
    blocked.filter((b) => !b.start_time).map((b) => b.blocked_date)
  )

  // Todos los slots únicos entre los 7 días (para las filas)
  const allSlots = new Set<string>()
  for (let i = 0; i < 7; i++) {
    const d    = new Date(weekStart + 'T12:00:00')
    d.setDate(d.getDate() + i)
    const isodow = getIsodow(d)
    for (const s of generateSlots(isodow)) allSlots.add(s)
  }
  const sortedSlots = Array.from(allSlots).sort()

  const handleSlotClick = useCallback((date: string, time: string, isodow: number, valid: boolean) => {
    if (!valid) return
    setBookSlot({ date, time })
  }, [])

  return (
    <div>
      {/* Navegación de semana */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push(`/admin/agenda?week=${prevWeek}`)}
          className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/25 transition-colors"
        >
          ← Semana anterior
        </button>
        <span className="text-sm text-white/70">
          {new Date(weekStart + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
          {' — '}
          {new Date(addDays(weekStart, 6) + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => router.push(`/admin/agenda?week=${nextWeek}`)}
          className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/25 transition-colors"
        >
          Semana siguiente →
        </button>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs text-white/40">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-900/30 border border-green-500/40" />Disponible</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-900/50 border border-red-900/50" />Ocupado</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-900/30 border-l-2 border-l-green-400" />Confirmada</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-900/20 border-l-2 border-l-yellow-400" />Pendiente</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-900/20" />Sin disponibilidad</span>
      </div>

      {/* Grilla */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-gray-900">
        <table className="w-full text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="w-14 px-2 py-2.5 text-white/30 font-normal text-center">Hora</th>
              {Array.from({ length: 7 }, (_, i) => {
                const d   = new Date(weekStart + 'T12:00:00')
                d.setDate(d.getDate() + i)
                const str = d.toISOString().split('T')[0]
                const isToday = str === new Date().toISOString().split('T')[0]
                return (
                  <th key={str} className={`px-2 py-2.5 font-medium text-center capitalize border-l border-white/5 ${isToday ? 'text-orange-400' : 'text-white/60'}`}>
                    {formatDateHeader(str)}
                    {isToday && <span className="ml-1 text-orange-400">·</span>}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sortedSlots.map((slot) => (
              <tr key={slot} className="border-t border-white/5">
                <td className="px-2 py-0 text-white/30 text-center font-mono align-top pt-1.5">{slot}</td>
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(weekStart + 'T12:00:00')
                  d.setDate(d.getDate() + i)
                  const dateStr = d.toISOString().split('T')[0]
                  const isodow  = getIsodow(d)
                  const validSlots = generateSlots(isodow)
                  const isClosed   = isodow === 7
                  const isBlocked  = blockedSet.has(dateStr)
                  const inRange    = validSlots.includes(slot)
                  const key        = `${dateStr}|${slot}`
                  const slotSessions = sessionsBySlot[key] ?? []

                  // Domingo → cerrado
                  if (isClosed) {
                    return (
                      <td key={dateStr} className="px-1 py-1 border-l border-white/5 bg-gray-950/60 align-top" rowSpan={1}>
                        {slot === sortedSlots[0] && (
                          <div className="h-full min-h-[60px] flex items-center justify-center">
                            <span className="text-red-400/50 text-[10px] text-center leading-tight">Sin<br/>disponibilidad</span>
                          </div>
                        )}
                      </td>
                    )
                  }

                  // Fuera del horario del día
                  if (!inRange) {
                    return (
                      <td key={dateStr} className="border-l border-white/5 bg-gray-950/30">
                        <div className="h-8" />
                      </td>
                    )
                  }

                  // Bloqueado por feriado
                  if (isBlocked) {
                    return (
                      <td key={dateStr} className="px-1 py-1 border-l border-white/5 bg-red-950/40 align-top">
                        <div className="min-h-[52px] flex items-center justify-center">
                          <span className="text-red-400/60 text-[10px]">Bloqueado</span>
                        </div>
                      </td>
                    )
                  }

                  // Tiene sesiones
                  if (slotSessions.length > 0) {
                    return (
                      <td key={dateStr} className="px-1 py-1 border-l border-white/5 align-top">
                        <div className="space-y-0.5">
                          {slotSessions.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => setViewSession(s)}
                              className={`w-full text-left px-2 py-1.5 rounded border-l-2 cursor-pointer hover:brightness-125 transition-all ${STATUS_COLOR[s.status] ?? 'bg-gray-800 border-l-gray-500'}`}
                            >
                              <p className="text-white/90 font-medium truncate text-[11px]">
                                {(s.student as any)?.name ?? '—'}
                              </p>
                              <p className="text-white/40 truncate text-[10px]">
                                {(s.course as any)?.name} · {(s.classroom as any)?.name}
                              </p>
                            </button>
                          ))}
                        </div>
                      </td>
                    )
                  }

                  const slotStatus = getSlotStatus(dateStr, slot, availabilityByDay)

                  if (slotStatus === 'occupied') {
                    return (
                      <td key={dateStr} className="px-1 py-1 border-l border-white/5 align-top">
                        <button
                          onClick={() => handleSlotClick(dateStr, slot, isodow, true)}
                          className="w-full min-h-[52px] rounded border border-red-900/40 bg-red-950/20 hover:bg-red-900/20 transition-all group cursor-pointer"
                          title="Ocupado — todos los salones están ocupados en este horario"
                        >
                          <span className="text-red-400/40 text-[10px]">Ocupado</span>
                        </button>
                      </td>
                    )
                  }

                  return (
                    <td key={dateStr} className="px-1 py-1 border-l border-white/5 align-top">
                      <button
                        onClick={() => handleSlotClick(dateStr, slot, isodow, true)}
                        className="w-full min-h-[52px] rounded border border-green-900/30 bg-green-900/15 hover:bg-green-700/20 hover:border-green-500/40 transition-all group cursor-pointer"
                        title="Crear clase"
                      >
                        <span className="text-green-400/50 group-hover:text-green-300/80 text-lg transition-colors">+</span>
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: crear clase */}
      {bookSlot && (
        <BookSessionModal
          date={bookSlot.date}
          time={bookSlot.time}
          students={students}
          courses={courses}
          classrooms={classrooms}
          instructors={instructors}
          defaultStudentId={defaultStudentId}
          onClose={() => setBookSlot(null)}
        />
      )}

      {/* Modal: ver / cancelar / reagendar */}
      {viewSession && (
        <SessionDetailModal
          session={viewSession}
          classrooms={classrooms}
          instructors={instructors}
          onClose={() => setViewSession(null)}
        />
      )}
    </div>
  )
}

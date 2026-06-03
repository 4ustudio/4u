'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { getMonthSessions } from '../../_actions/student'
import { InstrumentIcon } from './instruments'
import { statusMeta, STATUS_LEGEND } from './statusMeta'
import { getHolidayMapForYears } from '@/lib/calendar/colombia-holidays'
import { EVENT_STYLE } from '@/lib/calendar/types'
import type { CalendarEvent } from '@/lib/calendar/types'

/* eslint-disable @typescript-eslint/no-explicit-any */

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DOW_HEAD   = ['D','L','M','M','J','V','S']
const DOW_HEAD_LG = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB']
const WEEK_DAYS  = [1, 2, 3, 4, 5, 6]
const WEEK_HEAD  = ['Lun','Mar','Mié','Jue','Vie','Sáb']

function calendarDays(year: number, month: number) {
  const firstDow = new Date(year, month, 1).getDay()
  const total    = new Date(year, month + 1, 0).getDate()
  const cells: { day: number; current: boolean }[] = []
  for (let i = 0; i < firstDow; i++) cells.push({ day: 0, current: false })
  for (let d = 1; d <= total; d++)   cells.push({ day: d, current: true })
  while (cells.length % 7 !== 0)     cells.push({ day: 0, current: false })
  return cells
}

function fmtTime(t?: string) { return t ? t.slice(0, 5) : '' }
function fmtDateLong(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
}
function fmtDateFull(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtDateShort(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
}

function googleCalUrl(s: any): string {
  const title  = encodeURIComponent(s.course?.name ?? 'Clase 4U Studio')
  const date   = s.scheduled_date?.replace(/-/g, '') ?? ''
  const start  = s.start_time?.slice(0, 5).replace(':', '') ?? '0900'
  const endH   = s.start_time ? parseInt(s.start_time.slice(0, 2)) + 1 : 10
  const endStr = `${String(endH).padStart(2,'0')}${s.start_time?.slice(3,5) ?? '00'}`
  const details = encodeURIComponent(`Clase de ${s.course?.name ?? 'música'} en 4U Studio Academy. Instructor: ${s.instructor?.name ?? '—'}. Salón: ${s.classroom?.name ?? '—'}.`)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}T${start}00/${date}T${endStr}00&details=${details}`
}

function downloadICS(s: any) {
  const date  = s.scheduled_date?.replace(/-/g, '') ?? ''
  const startH = s.start_time?.slice(0, 5).replace(':', '') ?? '0900'
  const endH   = s.start_time ? `${String(parseInt(s.start_time.slice(0,2))+1).padStart(2,'0')}${s.start_time.slice(3,5)}` : '1000'
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//4U Studio//ES','BEGIN:VEVENT',
    `DTSTART:${date}T${startH}00`,`DTEND:${date}T${endH}00`,
    `SUMMARY:${s.course?.name ?? 'Clase 4U Studio'}`,
    `DESCRIPTION:Clase de ${s.course?.name ?? 'música'} en 4U Studio Academy.`,
    'END:VEVENT','END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `clase-4u-${s.scheduled_date ?? 'fecha'}.ics`; a.click()
  URL.revokeObjectURL(url)
}

interface Props {
  initialSessions: any[]
  schedules: any[]
  initialYear: number
  initialMonth: number
  events?: CalendarEvent[]
}

export default function ClassesCalendar({ initialSessions, schedules, initialYear, initialMonth, events = [] }: Props) {
  const [mounted, setMounted]           = useState(false)
  // Default = 'calendar' so Mes/Semana/Hoy buttons are immediately visible
  const [view, setView]                 = useState<'agenda'|'calendar'>('calendar')
  const [calendarView, setCalendarView] = useState<'mes'|'semana'>('mes')
  const [year, setYear]                 = useState(initialYear)
  const [month, setMonth]               = useState(initialMonth)
  const [sessions, setSessions]         = useState<any[]>(initialSessions)
  const [cache, setCache]               = useState<Record<string,any[]>>({ [`${initialYear}-${initialMonth}`]: initialSessions })
  const [selected, setSelected]         = useState<any|null>(null)
  const [selectedDay, setSelectedDay]   = useState<string|null>(null)
  const [isPending, startTransition]    = useTransition()

  useEffect(() => { setMounted(true) }, [])

  const todayIso   = useMemo(() => new Date().toISOString().split('T')[0], [])
  const todayYear  = useMemo(() => new Date().getFullYear(), [])
  const todayMonth = useMemo(() => new Date().getMonth() + 1, [])

  const holidayMap = useMemo(
    () => getHolidayMapForYears(year - 1, year, year + 1),
    [year]
  )

  const eventsMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    }
    return map
  }, [events])

  function getDayOverlays(dateStr: string): CalendarEvent[] {
    return [...(holidayMap[dateStr] ?? []), ...(eventsMap[dateStr] ?? [])]
  }

  const byDay = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const s of sessions) {
      if (!map[s.scheduled_date]) map[s.scheduled_date] = []
      map[s.scheduled_date].push(s)
    }
    return map
  }, [sessions])

  const byWeekday = useMemo(() => {
    const map: Record<number, any[]> = {}
    const push = (d: number, item: any) => {
      if (d < 1 || d > 6) return
      if (!map[d]) map[d] = []
      map[d].push(item)
    }
    for (const s of sessions) push(new Date(s.scheduled_date + 'T12:00:00').getDay(), { ...s, _hour: fmtTime(s.start_time) })
    for (const sc of schedules ?? []) push(sc.day_of_week, { ...sc, _hour: fmtTime(sc.start_time), status: 'confirmed', _fixed: true })
    return map
  }, [sessions, schedules])

  function navigate(delta: number) {
    let m = month + delta, y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setYear(y); setMonth(m)
    const key = `${y}-${m}`
    if (cache[key]) { setSessions(cache[key]); return }
    startTransition(async () => {
      const data = await getMonthSessions(y, m)
      setCache(prev => ({ ...prev, [key]: data }))
      setSessions(data)
    })
  }

  function goToToday() {
    const y = todayYear, m = todayMonth
    setView('calendar'); setCalendarView('mes')
    if (y === year && m === month) return
    setYear(y); setMonth(m)
    const key = `${y}-${m}`
    if (cache[key]) { setSessions(cache[key]); return }
    startTransition(async () => {
      const data = await getMonthSessions(y, m)
      setCache(prev => ({ ...prev, [key]: data }))
      setSessions(data)
    })
  }

  const isCurrentMonth = year === todayYear && month === todayMonth
  const mm = String(month).padStart(2, '0')
  const cells = calendarDays(year, month - 1)

  return (
    <div
      className="rounded-2xl border border-[#ff7a00]/20 bg-white shadow-lg p-4 sm:p-5"
      style={{ boxShadow: '0 4px 32px rgba(255,122,0,0.08), 0 1px 3px rgba(0,0,0,0.05)' }}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        {/* Navegación mes */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-xl border border-gray-200 bg-stone-50 flex items-center justify-center text-gray-500 hover:text-[#ff7a00] hover:border-[#ff7a00]/30 transition-colors"
            aria-label="Mes anterior"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>

          <h3 className="text-base sm:text-lg font-bold text-gray-900 font-poppins capitalize min-w-[140px] text-center select-none">
            {MONTHS_ES[month - 1]} {year}
            {isPending && <span className="ml-2 inline-block h-3 w-3 align-middle border-2 border-[#ff7a00]/40 border-t-[#ff7a00] rounded-full animate-spin"/>}
          </h3>

          <button
            onClick={() => navigate(1)}
            className="h-9 w-9 rounded-xl border border-gray-200 bg-stone-50 flex items-center justify-center text-gray-500 hover:text-[#ff7a00] hover:border-[#ff7a00]/30 transition-colors"
            aria-label="Mes siguiente"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>

          <button
            onClick={goToToday}
            className={`h-9 px-3 rounded-xl border text-xs font-semibold font-poppins transition-colors ${
              isCurrentMonth && view === 'calendar' && calendarView === 'mes'
                ? 'border-[#ff7a00]/30 bg-[#ff7a00]/8 text-[#ff7a00] cursor-default'
                : 'border-gray-200 bg-stone-50 text-gray-500 hover:text-[#ff7a00] hover:border-[#ff7a00]/30'
            }`}
          >
            Hoy
          </button>
        </div>

        {/* Toggle Agenda / Calendario — siempre visible */}
        <div className="flex rounded-xl border border-gray-200 bg-stone-50 p-0.5 gap-0.5">
          {(['calendar', 'agenda'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold font-poppins transition-all ${
                view === v ? 'bg-[#ff7a00] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {v === 'agenda' ? 'Agenda' : 'Calendario'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Calendario ────────────────────────────────────────────────── */}
      {view === 'calendar' ? (
        <>
          {/* Sub-toggle Mes / Semana */}
          <div className="flex items-center justify-center mb-3">
            <div className="flex rounded-lg border border-gray-200 bg-stone-50 p-0.5 gap-0.5">
              {(['mes', 'semana'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setCalendarView(v)}
                  className={`px-4 py-1.5 rounded-md text-[11px] font-semibold font-poppins capitalize transition-all ${
                    calendarView === v ? 'bg-[#ff7a00] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {v === 'mes' ? 'Mes' : 'Semana'}
                </button>
              ))}
            </div>
          </div>

          {calendarView === 'mes' ? (
            /* ── Grid mensual — visible en todas las pantallas ── */
            <div>
              {/* Cabecera días */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DOW_HEAD.map((d, i) => (
                  <div key={i} className="text-center text-[10px] sm:hidden font-semibold text-gray-400 uppercase tracking-wider py-1">{d}</div>
                ))}
                {DOW_HEAD_LG.map((d, i) => (
                  <div key={i} className="text-center text-[10px] hidden sm:block font-semibold text-gray-400 uppercase tracking-wider py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {cells.map((cell, i) => {
                  if (!cell.current) return <div key={i} className="min-h-[38px] sm:min-h-[76px] lg:min-h-[96px] rounded-lg bg-gray-50/70"/>
                  const dateStr    = `${year}-${mm}-${String(cell.day).padStart(2,'0')}`
                  const dayClasses = byDay[dateStr] ?? []
                  const overlays   = getDayOverlays(dateStr)
                  const holiday    = overlays.find(e => e.type === 'holiday')
                  const isToday    = dateStr === todayIso
                  const hasOverlay = overlays.length > 0

                  const cellStyle = isToday
                    ? 'border-[#ff7a00]/50 bg-orange-50'
                    : holiday
                      ? 'border-yellow-300 bg-yellow-50 cursor-pointer hover:bg-yellow-100'
                      : hasOverlay
                        ? 'border-blue-200 bg-blue-50/40 cursor-pointer'
                        : dayClasses.length > 0
                          ? 'border-[#ff7a00]/20 bg-orange-50/30'
                          : 'border-gray-100 bg-white'

                  return (
                    <div
                      key={i}
                      onClick={() => hasOverlay && setSelectedDay(dateStr)}
                      className={`min-h-[38px] sm:min-h-[76px] lg:min-h-[96px] rounded-lg border p-1 sm:p-1.5 flex flex-col gap-0.5 transition-colors ${cellStyle}`}
                    >
                      <span className={`text-[10px] sm:text-[11px] font-bold leading-none ${isToday ? 'text-[#ff7a00]' : holiday ? 'text-yellow-700' : dayClasses.length > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                        {cell.day}
                      </span>

                      {/* Festivo — visible en desktop, solo punto en mobile */}
                      {holiday && (
                        <>
                          <span className="hidden sm:block text-[8px] font-bold px-1 py-0.5 rounded leading-none truncate" style={{ background: '#fefce8', color: '#854d0e', border: '1px solid #fde047' }} title={holiday.description ?? holiday.title}>
                            Festivo
                          </span>
                          <span className="sm:hidden h-1.5 w-1.5 rounded-full bg-yellow-400 mt-0.5"/>
                        </>
                      )}

                      {/* Pills de clases — solo desktop */}
                      <div className="hidden sm:flex flex-col gap-1 overflow-hidden mt-0.5">
                        {dayClasses.slice(0, 2).map(s => {
                          const meta = statusMeta(s.status)
                          return (
                            <button
                              key={s.id}
                              onClick={e => { e.stopPropagation(); setSelected({ ...s, _dayOverlays: overlays }) }}
                              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-left hover:brightness-125 transition-all w-full"
                              style={{ background: meta.hex + '26', borderLeft: `2px solid ${meta.hex}` }}
                              title={`${s.course?.name ?? ''} · ${fmtTime(s.start_time)}${holiday ? ` · Festivo: ${holiday.title}` : ''}`}
                            >
                              <span className="shrink-0" style={{ color: meta.hex }}>
                                <InstrumentIcon courseName={s.course?.name} className="h-3 w-3"/>
                              </span>
                              <span className="text-[10px] font-semibold text-gray-800 truncate">{s.course?.name ?? '—'}</span>
                            </button>
                          )
                        })}
                        {dayClasses.length > 2 && (
                          <span className="text-[9px] text-gray-400 pl-1">+{dayClasses.length - 2}</span>
                        )}
                      </div>

                      {/* Puntos de clases — solo mobile */}
                      {dayClasses.length > 0 && (
                        <div className="sm:hidden flex gap-0.5 mt-auto flex-wrap">
                          {dayClasses.slice(0, 3).map(s => {
                            const meta = statusMeta(s.status)
                            return <span key={s.id} className="h-1.5 w-1.5 rounded-full" style={{ background: meta.hex }}/>
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* ── Vista Semana ── */
            <div className="overflow-x-auto">
              {Object.keys(byWeekday).length === 0
                ? <p className="text-sm text-gray-400 text-center py-8">No hay clases este mes.</p>
                : <WeekTimetable byWeekday={byWeekday} onSelect={s => setSelected({ ...s, _dayOverlays: getDayOverlays(s.scheduled_date ?? '') })}/>
              }
            </div>
          )}

          {/* Leyenda */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-gray-100">
            {STATUS_LEGEND.map(m => (
              <span key={m.key} className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className={`h-2 w-2 rounded-full ${m.dotClass}`}/>
                {m.label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="h-2 w-2 rounded-full bg-yellow-400"/>
              Festivo
            </span>
          </div>
        </>
      ) : (
        /* ── Vista Agenda ──────────────────────────────────────────── */
        <AgendaView
          byDay={byDay}
          todayIso={todayIso}
          holidayMap={holidayMap}
          eventsMap={eventsMap}
          onSelectSession={s => setSelected({ ...s, _dayOverlays: getDayOverlays(s.scheduled_date ?? '') })}
        />
      )}

      {/* Modales */}
      {mounted && selected && createPortal(
        <SessionDetailModal session={selected} onClose={() => setSelected(null)}/>,
        document.body
      )}
      {mounted && selectedDay && createPortal(
        <DayModal
          dateStr={selectedDay}
          overlays={getDayOverlays(selectedDay)}
          sessions={byDay[selectedDay] ?? []}
          onSelectSession={s => { setSelectedDay(null); setSelected({ ...s, _dayOverlays: getDayOverlays(selectedDay) }) }}
          onClose={() => setSelectedDay(null)}
        />,
        document.body
      )}
    </div>
  )
}

/* ── Vista Agenda ─────────────────────────────────────────────────────────── */
function AgendaView({ byDay, todayIso, holidayMap, eventsMap, onSelectSession }: {
  byDay: Record<string, any[]>
  todayIso: string
  holidayMap: Record<string, CalendarEvent[]>
  eventsMap: Record<string, CalendarEvent[]>
  onSelectSession: (s: any) => void
}) {
  const sorted = Object.keys(byDay).sort()
  if (sorted.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400 text-sm">No hay clases este mes.</p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {sorted.map(dateStr => {
        const isToday    = dateStr === todayIso
        const overlays   = [...(holidayMap[dateStr] ?? []), ...(eventsMap[dateStr] ?? [])]
        const holiday    = overlays.find(e => e.type === 'holiday')
        const daySessions = [...byDay[dateStr]].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
        return (
          <div key={dateStr}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-sm font-bold font-poppins ${isToday ? 'text-[#ff7a00]' : 'text-gray-800'}`}>
                {fmtDateShort(dateStr)}
              </span>
              {isToday && <span className="text-[10px] font-semibold text-white bg-[#ff7a00] px-2 py-0.5 rounded-full">Hoy</span>}
              {overlays.map((ev, i) => {
                const s = EVENT_STYLE[ev.type]
                return (
                  <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
                    title={ev.description ? `${ev.title} — ${ev.description}` : ev.title}
                  >
                    {ev.title}
                  </span>
                )
              })}
            </div>
            <div className="space-y-2">
              {daySessions.map(s => {
                const meta = statusMeta(s.status)
                return (
                  <button key={s.id} onClick={() => onSelectSession(s)}
                    className="w-full flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left shadow-sm hover:bg-gray-50 transition-all"
                  >
                    <span className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.hex + '1f', color: meta.hex }}>
                      <InstrumentIcon courseName={s.course?.name} className="h-4 w-4"/>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 font-poppins font-medium">{s.course?.name ?? '—'} · {fmtTime(s.start_time)}</p>
                      <p className="text-xs text-gray-400 truncate">{s.instructor?.name ?? 'Sin instructor'} · {s.classroom?.name ?? '—'}</p>
                      {holiday && <p className="text-[10px] text-yellow-700 font-medium">Festivo: {holiday.title}</p>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-semibold ${meta.badgeClass}`}>{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Vista Semana ─────────────────────────────────────────────────────────── */
function WeekTimetable({ byWeekday, onSelect }: { byWeekday: Record<number,any[]>; onSelect: (s:any) => void }) {
  const hours = useMemo(() => {
    const set = new Set<string>()
    for (const list of Object.values(byWeekday)) for (const sc of list) set.add(sc._hour)
    const arr = Array.from(set).filter(Boolean).sort()
    return arr.length ? arr : ['17:00','18:00','19:00','20:00']
  }, [byWeekday])

  return (
    <table className="w-full min-w-[520px] border-separate border-spacing-1">
      <thead>
        <tr>
          <th className="w-12"/>
          {WEEK_HEAD.map(d => <th key={d} className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider pb-1">{d}</th>)}
        </tr>
      </thead>
      <tbody>
        {hours.map(h => (
          <tr key={h}>
            <td className="text-[10px] text-gray-400 align-top pt-2 pr-1 text-right">{h}</td>
            {WEEK_DAYS.map(dow => {
              const cls = (byWeekday[dow] ?? []).filter(sc => sc._hour === h)
              return (
                <td key={dow} className="align-top">
                  {cls.length === 0
                    ? <div className="min-h-[44px] rounded-lg border border-gray-100 bg-gray-50"/>
                    : cls.map(sc => {
                        const meta = statusMeta(sc.status)
                        return (
                          <button key={sc.id} onClick={() => onSelect(sc)}
                            className="w-full min-h-[44px] rounded-lg border p-1.5 flex flex-col items-center justify-center gap-0.5 hover:brightness-125 transition-colors"
                            style={{ borderColor: meta.hex + '40', background: meta.hex + '14' }}
                          >
                            <span style={{ color: meta.hex }}><InstrumentIcon courseName={sc.course?.name} className="h-4 w-4"/></span>
                            <span className="text-[10px] text-gray-700 font-medium leading-tight text-center">{sc.course?.name ?? '—'}</span>
                          </button>
                        )
                      })
                  }
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ── Modal sesión ─────────────────────────────────────────────────────────── */
function SessionDetailModal({ session: s, onClose }: { session: any; onClose: () => void }) {
  const meta    = statusMeta(s.status)
  const holiday = (s._dayOverlays as CalendarEvent[] ?? []).find(e => e.type === 'holiday')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-[#ff7a00]/20 bg-white p-6 shadow-xl"
        style={{ boxShadow: '0 8px 32px rgba(255,122,0,0.12)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-5">
          <span className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.hex + '22', color: meta.hex }}>
            <InstrumentIcon courseName={s.course?.name} className="h-6 w-6"/>
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 font-poppins">{s.course?.name ?? 'Clase'}</h3>
            <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${meta.badgeClass}`}>{meta.label}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {holiday && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2.5">
            <span className="text-base leading-none mt-0.5">📅</span>
            <div>
              <p className="text-xs font-bold text-yellow-800">Festivo: {holiday.title}</p>
              {holiday.description && <p className="text-[10px] text-yellow-700 mt-0.5">{holiday.description}</p>}
            </div>
          </div>
        )}

        <dl className="space-y-3">
          {!s._fixed && <Row label="Fecha" value={s.scheduled_date ? fmtDateLong(s.scheduled_date) : '—'} capitalize/>}
          {s._fixed  && <Row label="Horario" value="Clase fija semanal"/>}
          <Row label="Hora"       value={fmtTime(s.start_time) || '—'}/>
          <Row label="Instructor" value={s.instructor?.name ?? 'Sin asignar'}/>
          <Row label="Salón"      value={s.classroom?.name ?? '—'}/>
          {s.notes && <Row label="Observaciones" value={s.notes}/>}
        </dl>

        {s.scheduled_date && !s._fixed && (
          <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100">
            <a href={googleCalUrl(s)} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 transition-all">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10v2H7zM4 5h16v2H4zM3 8h18l-1 13H4L3 8zm3 2h2v9H6v-9zm4 0h2v9h-2v-9zm4 0h2v9h-2v-9z"/></svg>
              Google Cal
            </a>
            <button onClick={() => downloadICS(s)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 transition-all">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              Apple Cal
            </button>
          </div>
        )}

        <button
          onClick={() => alert('Para solicitar un cambio de horario, por favor comunícate con recepción.')}
          className="w-full mt-3 rounded-lg border border-[#ff7a00]/20 text-[#ff7a00] px-3 py-2 text-[11px] font-semibold hover:bg-[#ff7a00]/5 transition-all"
        >
          Solicitar cambio de horario
        </button>
      </div>
    </div>
  )
}

/* ── Modal día festivo / evento ───────────────────────────────────────────── */
function DayModal({ dateStr, overlays, sessions, onSelectSession, onClose }: {
  dateStr: string; overlays: CalendarEvent[]; sessions: any[]
  onSelectSession: (s: any) => void; onClose: () => void
}) {
  const holiday = overlays.find(e => e.type === 'holiday')
  const ps = holiday ? EVENT_STYLE.holiday : EVENT_STYLE.academic_event

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        style={{ border: `1px solid ${ps.border}` }} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: ps.text }}>
              {holiday ? 'Festivo nacional' : 'Evento académico'}
            </p>
            <h3 className="text-xl font-bold text-gray-900 font-poppins">{overlays[0]?.title ?? '—'}</h3>
            <p className="text-sm text-gray-500 mt-1 capitalize">{fmtDateFull(dateStr)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-1 shrink-0">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {overlays[0]?.description && (
          <p className="text-sm text-gray-600 mb-4 rounded-lg px-3 py-2.5 leading-relaxed" style={{ background: ps.bg }}>
            {overlays[0].description}
          </p>
        )}

        <p className="text-[11px] text-gray-400 mb-4 leading-relaxed italic">
          Los festivos son informativos. La academia decide si hay clases ese día.
        </p>

        {sessions.length > 0 ? (
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Clases programadas ({sessions.length})
            </p>
            <div className="space-y-2">
              {sessions.map(s => {
                const meta = statusMeta(s.status)
                return (
                  <button key={s.id} onClick={() => onSelectSession(s)}
                    className="w-full flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-left hover:bg-gray-100 transition-all"
                  >
                    <span className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.hex + '1f', color: meta.hex }}>
                      <InstrumentIcon courseName={s.course?.name} className="h-3.5 w-3.5"/>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900 font-poppins">{s.course?.name ?? '—'}</p>
                      <p className="text-[10px] text-gray-400">{fmtTime(s.start_time)} · {s.instructor?.name ?? 'Sin instructor'}</p>
                      {holiday && <p className="text-[10px] text-yellow-700 font-medium">Festivo: {holiday.title}</p>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-semibold ${meta.badgeClass}`}>{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">No hay clases programadas este día.</p>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-xs uppercase tracking-wider text-gray-400 pt-0.5">{label}</dt>
      <dd className={`text-sm text-gray-900 text-right ${capitalize ? 'capitalize' : ''}`}>{value}</dd>
    </div>
  )
}

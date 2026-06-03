'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { getInstructorMonthSessions } from '../../_actions/student'
import { InstrumentIcon } from './instruments'
import { statusMeta, STATUS_LEGEND } from './statusMeta'
import { getHolidayMapForYears } from '@/lib/calendar/colombia-holidays'
import { EVENT_STYLE } from '@/lib/calendar/types'

/* eslint-disable @typescript-eslint/no-explicit-any */

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DOW_HEAD  = ['D','L','M','M','J','V','S']
const DOW_FULL  = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB']
const WEEK_DAYS = [1, 2, 3, 4, 5, 6]
const WEEK_HEAD = ['Lun','Mar','Mié','Jue','Vie','Sáb']

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
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' })
}
function fmtDateShort(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { weekday:'short', day:'numeric', month:'short' })
}
function fmtDateFull(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}

interface Props {
  initialSessions: any[]
  initialYear: number
  initialMonth: number
}

export default function InstructorCalendar({ initialSessions, initialYear, initialMonth }: Props) {
  const [mounted, setMounted]           = useState(false)
  const [view, setView]                 = useState<'calendar'|'agenda'>('calendar')
  const [calView, setCalView]           = useState<'mes'|'semana'>('mes')
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

  const holidayMap = useMemo(() => getHolidayMapForYears(year - 1, year, year + 1), [year])

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
    for (const s of sessions) {
      const dow = new Date(s.scheduled_date + 'T12:00:00').getDay()
      if (dow < 1 || dow > 6) continue
      if (!map[dow]) map[dow] = []
      map[dow].push({ ...s, _hour: fmtTime(s.start_time) })
    }
    return map
  }, [sessions])

  function navigate(delta: number) {
    let m = month + delta, y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setYear(y); setMonth(m)
    const key = `${y}-${m}`
    if (cache[key]) { setSessions(cache[key]); return }
    startTransition(async () => {
      const data = await getInstructorMonthSessions(y, m)
      setCache(prev => ({ ...prev, [key]: data }))
      setSessions(data)
    })
  }

  function goToToday() {
    setView('calendar'); setCalView('mes')
    const y = todayYear, m = todayMonth
    if (y === year && m === month) return
    setYear(y); setMonth(m)
    const key = `${y}-${m}`
    if (cache[key]) { setSessions(cache[key]); return }
    startTransition(async () => {
      const data = await getInstructorMonthSessions(y, m)
      setCache(prev => ({ ...prev, [key]: data }))
      setSessions(data)
    })
  }

  const isCurrentMonth = year === todayYear && month === todayMonth
  const mm = String(month).padStart(2, '0')
  const cells = calendarDays(year, month - 1)

  return (
    <div id="calendario" className="rounded-2xl border border-[#ff7a00]/20 bg-white shadow-lg p-4 sm:p-5"
      style={{ boxShadow: '0 4px 32px rgba(255,122,0,0.08)' }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-xl border border-gray-200 bg-stone-50 flex items-center justify-center text-gray-500 hover:text-[#ff7a00] hover:border-[#ff7a00]/30 transition-colors"
            aria-label="Mes anterior">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 font-poppins capitalize min-w-[140px] text-center select-none">
            {MONTHS_ES[month - 1]} {year}
            {isPending && <span className="ml-2 inline-block h-3 w-3 align-middle border-2 border-[#ff7a00]/40 border-t-[#ff7a00] rounded-full animate-spin"/>}
          </h3>
          <button onClick={() => navigate(1)}
            className="h-9 w-9 rounded-xl border border-gray-200 bg-stone-50 flex items-center justify-center text-gray-500 hover:text-[#ff7a00] hover:border-[#ff7a00]/30 transition-colors"
            aria-label="Mes siguiente">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <button onClick={goToToday}
            className={`h-9 px-3 rounded-xl border text-xs font-semibold font-poppins transition-colors ${
              isCurrentMonth && view === 'calendar' && calView === 'mes'
                ? 'border-[#ff7a00]/30 bg-[#ff7a00]/8 text-[#ff7a00] cursor-default'
                : 'border-gray-200 bg-stone-50 text-gray-500 hover:text-[#ff7a00] hover:border-[#ff7a00]/30'
            }`}>
            Hoy
          </button>
        </div>
        <div className="flex rounded-xl border border-gray-200 bg-stone-50 p-0.5 gap-0.5">
          {(['calendar','agenda'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold font-poppins transition-all ${view === v ? 'bg-[#ff7a00] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {v === 'agenda' ? 'Agenda' : 'Calendario'}
            </button>
          ))}
        </div>
      </div>

      {view === 'calendar' ? (
        <>
          {/* Sub-toggle */}
          <div className="flex items-center justify-center mb-3">
            <div className="flex rounded-lg border border-gray-200 bg-stone-50 p-0.5 gap-0.5">
              {(['mes','semana'] as const).map(v => (
                <button key={v} onClick={() => setCalView(v)}
                  className={`px-4 py-1.5 rounded-md text-[11px] font-semibold font-poppins capitalize transition-all ${calView === v ? 'bg-[#ff7a00] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {v === 'mes' ? 'Mes' : 'Semana'}
                </button>
              ))}
            </div>
          </div>

          {calView === 'mes' ? (
            <div>
              {/* Cabecera */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DOW_HEAD.map((d, i) => <div key={i} className="text-center text-[10px] sm:hidden font-semibold text-gray-400 uppercase tracking-wider py-1">{d}</div>)}
                {DOW_FULL.map((d, i) => <div key={i} className="text-center text-[10px] hidden sm:block font-semibold text-gray-400 uppercase tracking-wider py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {cells.map((cell, i) => {
                  if (!cell.current) return <div key={i} className="min-h-[38px] sm:min-h-[76px] rounded-lg bg-gray-50/70"/>
                  const dateStr    = `${year}-${mm}-${String(cell.day).padStart(2,'0')}`
                  const daySessions = byDay[dateStr] ?? []
                  const holiday    = holidayMap[dateStr]?.[0]
                  const isToday    = dateStr === todayIso

                  const cellStyle = isToday
                    ? 'border-[#ff7a00]/50 bg-orange-50'
                    : holiday
                      ? 'border-yellow-300 bg-yellow-50 cursor-pointer hover:bg-yellow-100'
                      : daySessions.length > 0
                        ? 'border-[#ff7a00]/20 bg-orange-50/30'
                        : 'border-gray-100 bg-white'

                  return (
                    <div key={i} onClick={() => holiday && setSelectedDay(dateStr)}
                      className={`min-h-[38px] sm:min-h-[76px] rounded-lg border p-1 sm:p-1.5 flex flex-col gap-0.5 transition-colors ${cellStyle}`}>
                      <span className={`text-[10px] sm:text-[11px] font-bold leading-none ${isToday ? 'text-[#ff7a00]' : holiday ? 'text-yellow-700' : daySessions.length > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                        {cell.day}
                      </span>
                      {holiday && (
                        <>
                          <span className="hidden sm:block text-[8px] font-bold px-1 py-0.5 rounded leading-none truncate"
                            style={{ background:'#fefce8', color:'#854d0e', border:'1px solid #fde047' }} title={holiday.title}>Festivo</span>
                          <span className="sm:hidden h-1.5 w-1.5 rounded-full bg-yellow-400 mt-0.5"/>
                        </>
                      )}
                      {/* Clases en desktop */}
                      <div className="hidden sm:flex flex-col gap-1 overflow-hidden mt-0.5">
                        {daySessions.slice(0,2).map(s => {
                          const meta = statusMeta(s.status)
                          return (
                            <button key={s.id}
                              onClick={e => { e.stopPropagation(); setSelected(s) }}
                              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-left hover:brightness-125 transition-all w-full"
                              style={{ background: meta.hex + '26', borderLeft: `2px solid ${meta.hex}` }}
                              title={`${s.student?.name ?? '—'} · ${s.course?.name ?? '—'} · ${fmtTime(s.start_time)}`}>
                              <span className="shrink-0" style={{ color: meta.hex }}>
                                <InstrumentIcon courseName={s.course?.name} className="h-3 w-3"/>
                              </span>
                              <span className="text-[10px] font-semibold text-gray-800 truncate">
                                {s.student?.name?.split(' ')[0] ?? s.course?.name ?? '—'}
                              </span>
                            </button>
                          )
                        })}
                        {daySessions.length > 2 && <span className="text-[9px] text-gray-400 pl-1">+{daySessions.length - 2} más</span>}
                      </div>
                      {/* Puntos en mobile */}
                      {daySessions.length > 0 && (
                        <div className="sm:hidden flex gap-0.5 mt-auto flex-wrap">
                          {daySessions.slice(0,3).map(s => {
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
            /* Vista Semana */
            <div className="overflow-x-auto">
              {Object.keys(byWeekday).length === 0
                ? <p className="text-sm text-gray-400 text-center py-8">No hay clases este mes.</p>
                : (
                  <table className="w-full min-w-[520px] border-separate border-spacing-1">
                    <thead>
                      <tr>
                        <th className="w-12"/>
                        {WEEK_HEAD.map(d => <th key={d} className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider pb-1">{d}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(new Set(Object.values(byWeekday).flat().map(s => s._hour))).filter(Boolean).sort().map(h => (
                        <tr key={h}>
                          <td className="text-[10px] text-gray-400 align-top pt-2 pr-1 text-right">{h}</td>
                          {WEEK_DAYS.map(dow => {
                            const cls = (byWeekday[dow] ?? []).filter(s => s._hour === h)
                            return (
                              <td key={dow} className="align-top">
                                {cls.length === 0
                                  ? <div className="min-h-[44px] rounded-lg border border-gray-100 bg-gray-50"/>
                                  : cls.map(s => {
                                      const meta = statusMeta(s.status)
                                      return (
                                        <button key={s.id} onClick={() => setSelected(s)}
                                          className="w-full min-h-[44px] rounded-lg border p-1.5 flex flex-col items-center justify-center gap-0.5 hover:brightness-125 transition-colors text-center"
                                          style={{ borderColor: meta.hex + '40', background: meta.hex + '14' }}>
                                          <span style={{ color: meta.hex }}><InstrumentIcon courseName={s.course?.name} className="h-4 w-4"/></span>
                                          <span className="text-[9px] text-gray-700 font-medium leading-tight">{s.student?.name?.split(' ')[0] ?? '—'}</span>
                                          <span className="text-[9px] text-gray-500">{s.course?.name ?? '—'}</span>
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
            </div>
          )}

          {/* Leyenda */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-gray-100">
            {STATUS_LEGEND.map(m => (
              <span key={m.key} className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className={`h-2 w-2 rounded-full ${m.dotClass}`}/>{m.label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="h-2 w-2 rounded-full bg-yellow-400"/>Festivo
            </span>
          </div>
        </>
      ) : (
        /* Vista Agenda */
        <div className="space-y-4">
          {Object.keys(byDay).sort().length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No hay clases este mes.</p>
          ) : (
            Object.keys(byDay).sort().map(dateStr => {
              const isToday   = dateStr === todayIso
              const holiday   = holidayMap[dateStr]?.[0]
              const daySessions = [...byDay[dateStr]].sort((a, b) => (a.start_time||'').localeCompare(b.start_time||''))
              return (
                <div key={dateStr}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-sm font-bold font-poppins ${isToday ? 'text-[#ff7a00]' : 'text-gray-800'}`}>{fmtDateShort(dateStr)}</span>
                    {isToday && <span className="text-[10px] font-semibold text-white bg-[#ff7a00] px-2 py-0.5 rounded-full">Hoy</span>}
                    {holiday && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: EVENT_STYLE.holiday.bg, color: EVENT_STYLE.holiday.text, border:`1px solid ${EVENT_STYLE.holiday.border}` }}>
                        {holiday.title}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {daySessions.map(s => {
                      const meta = statusMeta(s.status)
                      return (
                        <button key={s.id} onClick={() => setSelected(s)}
                          className="w-full flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left shadow-sm hover:bg-gray-50 transition-all">
                          <span className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.hex + '1f', color: meta.hex }}>
                            <InstrumentIcon courseName={s.course?.name} className="h-4 w-4"/>
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-900 font-poppins font-medium">{s.course?.name ?? '—'} · {fmtTime(s.start_time)}</p>
                            <p className="text-xs text-gray-400 truncate">
                              <span className="font-medium text-gray-600">{s.student?.name ?? 'Sin alumno'}</span> · {s.classroom?.name ?? '—'}
                            </p>
                            {holiday && <p className="text-[10px] text-yellow-700 font-medium">Festivo: {holiday.title}</p>}
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-semibold ${meta.badgeClass}`}>{meta.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Modales */}
      {mounted && selected && createPortal(
        <SessionModal session={selected} onClose={() => setSelected(null)}/>,
        document.body
      )}
      {mounted && selectedDay && createPortal(
        <DayModal
          dateStr={selectedDay}
          holiday={holidayMap[selectedDay]?.[0]}
          sessions={byDay[selectedDay] ?? []}
          onSelectSession={s => { setSelectedDay(null); setSelected(s) }}
          onClose={() => setSelectedDay(null)}
        />,
        document.body
      )}
    </div>
  )
}

/* ── Modal sesión instructor ─────────────────────────────────────────── */
function SessionModal({ session: s, onClose }: { session: any; onClose: () => void }) {
  const meta = statusMeta(s.status)
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-[#ff7a00]/20 bg-white p-6 shadow-xl"
        style={{ boxShadow:'0 8px 32px rgba(255,122,0,0.12)' }} onClick={e => e.stopPropagation()}>
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
        <dl className="space-y-3">
          <Row label="Alumno"   value={s.student?.name ?? 'Sin asignar'}/>
          <Row label="Fecha"    value={s.scheduled_date ? fmtDateLong(s.scheduled_date) : '—'} capitalize/>
          <Row label="Hora"     value={fmtTime(s.start_time) || '—'}/>
          <Row label="Curso"    value={s.course?.name ?? '—'}/>
          <Row label="Salón"    value={s.classroom?.name ?? '—'}/>
          {s.notes && <Row label="Notas" value={s.notes}/>}
        </dl>
      </div>
    </div>
  )
}

/* ── Modal día festivo ───────────────────────────────────────────────── */
function DayModal({ dateStr, holiday, sessions, onSelectSession, onClose }: {
  dateStr: string; holiday?: any; sessions: any[]
  onSelectSession: (s: any) => void; onClose: () => void
}) {
  const hs = EVENT_STYLE.holiday
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        style={{ border:`1px solid ${hs.border}` }} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: hs.text }}>Festivo nacional</p>
            <h3 className="text-xl font-bold text-gray-900 font-poppins">{holiday?.title ?? '—'}</h3>
            <p className="text-sm text-gray-500 mt-1 capitalize">{fmtDateFull(dateStr)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-1 shrink-0">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {holiday?.description && (
          <p className="text-sm text-gray-600 mb-4 rounded-lg px-3 py-2.5" style={{ background: hs.bg }}>{holiday.description}</p>
        )}
        {sessions.length > 0 ? (
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Clases programadas ({sessions.length})</p>
            <div className="space-y-2">
              {sessions.map(s => {
                const meta = statusMeta(s.status)
                return (
                  <button key={s.id} onClick={() => onSelectSession(s)}
                    className="w-full flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-left hover:bg-gray-100 transition-all">
                    <span className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.hex + '1f', color: meta.hex }}>
                      <InstrumentIcon courseName={s.course?.name} className="h-3.5 w-3.5"/>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900">{s.student?.name ?? '—'}</p>
                      <p className="text-[10px] text-gray-400">{s.course?.name ?? '—'} · {fmtTime(s.start_time)}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-semibold ${meta.badgeClass}`}>{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">No hay clases programadas.</p>
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

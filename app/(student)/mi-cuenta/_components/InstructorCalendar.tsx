'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { cancelInstructorSessionAction, getInstructorMonthSessions, instructorRegisterAttendanceAction } from '../../_actions/student'
import { InstrumentIcon } from './instruments'
import { statusMeta, STATUS_LEGEND } from './statusMeta'
import { getHolidayMapForYears } from '@/lib/calendar/colombia-holidays'
import { EVENT_STYLE } from '@/lib/calendar/types'
import { OPEN_SCHEDULE_EVENT } from './scheduleEvents'

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
function cancellationWhatsAppUrl(phone: string, studentName: string, course: string, date: string, time: string) {
  const number = phone.replace(/\D/g, '').replace(/^57/, '')
  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  const message = `Hola ${studentName}, te informamos que tu clase de ${course} del ${dateLabel} a las ${time} ha sido cancelada por el instructor. Por favor comunícate con 4U Studio Academy para reprogramarla. Disculpa los inconvenientes.`
  return `https://wa.me/57${number}?text=${encodeURIComponent(message)}`
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
                    <div key={i}
                      onClick={() => {
                        if (holiday || daySessions.length > 1) { setSelectedDay(dateStr); return }
                        if (daySessions.length === 1) { setSelected(daySessions[0]); return }
                        window.dispatchEvent(new CustomEvent(OPEN_SCHEDULE_EVENT, { detail: new Date(dateStr + 'T12:00:00').getDay() }))
                      }}
                      className={`min-h-[38px] sm:min-h-[76px] rounded-lg border p-1 sm:p-1.5 flex flex-col gap-0.5 transition-colors cursor-pointer ${!holiday ? 'hover:border-[#ff7a00]/40' : ''} ${cellStyle}`}>
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
  const router = useRouter()
  const [open, setOpen] = useState<'attendance' | null>(null)
  const [attendance, setAttendance] = useState<string | null>(s.attendance_status ?? null)
  const [attendanceMessage, setAttendanceMessage] = useState<string | null>(null)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)
  const [attendancePending, startAttendanceTransition] = useTransition()
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [cancelMessage, setCancelMessage] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancelPending, startCancelTransition] = useTransition()
  const [isCancelled, setIsCancelled] = useState(false)
  const [cancellationNotice, setCancellationNotice] = useState<{ name: string; phone: string | null; course: string; date: string; time: string } | null>(null)
  const meta = statusMeta(isCancelled ? 'cancelled' : s.status)
  const hoursUntilClass = (new Date(`${s.scheduled_date}T${s.start_time}`).getTime() - Date.now()) / (1000 * 60 * 60)
  const isShortNotice = hoursUntilClass < 24

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  function registerAttendance(value: 'attended' | 'absent' | 'no_show') {
    const previousAttendance = attendance
    setAttendance(value)
    setAttendanceError(null)
    setAttendanceMessage('Guardando asistencia…')
    startAttendanceTransition(async () => {
      const formData = new FormData()
      formData.set('session_id', s.id)
      formData.set('attendance', value)
      const result = await instructorRegisterAttendanceAction({}, formData)
      if (result.error) {
        setAttendance(previousAttendance)
        setAttendanceMessage(null)
        setAttendanceError(result.error)
        return
      }
      setAttendanceMessage('Asistencia registrada correctamente.')
      router.refresh()
    })
  }

  function cancelSession() {
    setCancelError(null)
    setCancelMessage('Cancelando clase…')
    startCancelTransition(async () => {
      const result = await cancelInstructorSessionAction(s.id)
      if (result.error) {
        setCancelMessage(null)
        setCancelError(result.error)
        return
      }
      setShowCancelConfirmation(false)
      setIsCancelled(true)
      setCancellationNotice({
        name: result.student?.name ?? 'Estudiante',
        phone: result.student?.phone ?? null,
        course: result.session?.course ?? s.course?.name ?? 'Clase',
        date: result.session?.date ?? s.scheduled_date,
        time: result.session?.time ?? fmtTime(s.start_time),
      })
      setCancelMessage('Clase cancelada correctamente.')
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-[#ff7a00]/20 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
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

        {s.student_id && (
          <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Registrar asistencia</p>

            <AttendanceAccordion
              title="Registrar asistencia"
              subtitle="Marca si el estudiante asistió, faltó o no se presentó."
              open={open === 'attendance'}
              onToggle={() => setOpen(p => p === 'attendance' ? null : 'attendance')}
            >
              <div className="space-y-1.5 pt-1">
                {([
                  { value: 'attended', label: '✅ Asistió' },
                  { value: 'absent',   label: '❌ Ausente' },
                  { value: 'no_show',  label: '🚫 No se presentó' },
                ] as const).map(({ value, label }) => (
                  <button key={value} type="button" onClick={() => registerAttendance(value)} disabled={attendancePending || cancelPending || isCancelled}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-colors disabled:opacity-40 ${
                        attendance === value ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-white text-gray-700 border-gray-200 hover:border-[#ff7a00]/40'
                      }`}
                    >
                      {label}{attendance === value && <span className="ml-1.5 text-gray-400">(actual)</span>}
                    </button>
                ))}
                {attendanceMessage && <p className="text-green-700 text-xs font-medium" role="status">{attendanceMessage}</p>}
                {attendanceError && <p className="text-red-500 text-xs" role="alert">{attendanceError}</p>}
              </div>
            </AttendanceAccordion>

            {!isCancelled && !attendance && !['cancelled', 'completed', 'no_show', 'rescheduled'].includes(s.status) && (
              <div className="pt-2">
                {!showCancelConfirmation ? (
                  <button type="button" onClick={() => setShowCancelConfirmation(true)} disabled={attendancePending || cancelPending}
                    className="text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50">
                    Cancelar clase
                  </button>
                ) : (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-xs font-medium text-red-800">¿Seguro que deseas cancelar esta clase?</p>
                    {isShortNotice && (
                      <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-800">
                        Faltan menos de 24 horas. La cancelación no descontará clases al alumno, pero debes notificarle para que pueda reprogramar.
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={cancelSession} disabled={cancelPending}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
                        {cancelPending ? 'Cancelando…' : 'Sí, cancelar'}
                      </button>
                      <button type="button" onClick={() => setShowCancelConfirmation(false)} disabled={cancelPending}
                        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600">
                        No
                      </button>
                    </div>
                  </div>
                )}
                {cancelError && <p className="mt-2 text-xs text-red-600" role="alert">{cancelError}</p>}
              </div>
            )}

            {!isCancelled && ['completed', 'no_show', 'rescheduled'].includes(s.status) && (
              <p className="pt-2 text-[11px] text-gray-500">
                Esta clase ya tiene un resultado registrado y no se puede cancelar.
              </p>
            )}

            {isCancelled && cancelMessage && (
              <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3" role="status">
                <p className="text-xs font-bold text-green-800">{cancelMessage}</p>
                {isShortNotice && <p className="mt-1 text-[11px] text-amber-800">La cancelación se hizo con menos de 24 horas; recuerda avisar al alumno.</p>}
                {cancellationNotice?.phone ? (
                  <a href={cancellationWhatsAppUrl(cancellationNotice.phone, cancellationNotice.name, cancellationNotice.course, cancellationNotice.date, cancellationNotice.time)} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex rounded-md bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1ebe5a]">
                    Notificar a {cancellationNotice.name.split(' ')[0]}
                  </a>
                ) : (
                  <p className="mt-1 text-[11px] text-gray-600">El alumno no tiene teléfono registrado para notificarle.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AttendanceAccordion({ title, subtitle, open, onToggle, children }: {
  title: string; subtitle: string; open: boolean; onToggle: () => void; children: any
}) {
  return (
    <div className={`rounded-xl border transition-colors ${open ? 'border-[#ff7a00]/40 bg-orange-50/30' : 'border-gray-100'}`}>
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left">
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-800">{title}</p>
          <p className="text-[11px] text-gray-400 leading-snug">{subtitle}</p>
        </div>
        <svg className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
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
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: hs.text }}>{holiday ? 'Festivo nacional' : 'Clases del día'}</p>
            <h3 className="text-xl font-bold text-gray-900 font-poppins">{holiday?.title ?? 'Clases programadas'}</h3>
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

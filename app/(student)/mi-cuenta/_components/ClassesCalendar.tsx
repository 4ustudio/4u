'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { getMonthSessions } from '../../_actions/student'
import { InstrumentIcon } from './instruments'
import { statusMeta, STATUS_LEGEND } from './statusMeta'

/* eslint-disable @typescript-eslint/no-explicit-any */

const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DOW_HEAD = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
const WEEK_DAYS = [1, 2, 3, 4, 5, 6] // Lun..Sáb (ISO sin domingo)
const WEEK_HEAD = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function calendarDays(year: number, month: number) {
  const firstDow = new Date(year, month, 1).getDay()
  const total = new Date(year, month + 1, 0).getDate()
  const cells: { day: number; current: boolean }[] = []
  for (let i = 0; i < firstDow; i++) cells.push({ day: 0, current: false })
  for (let d = 1; d <= total; d++) cells.push({ day: d, current: true })
  while (cells.length % 7 !== 0) cells.push({ day: 0, current: false })
  return cells
}

function fmtTime(t?: string) {
  return t ? t.slice(0, 5) : ''
}

function fmtDateLong(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

interface Props {
  initialSessions: any[]
  schedules: any[]
  initialYear: number
  initialMonth: number // 1-12
}

export default function ClassesCalendar({ initialSessions, schedules, initialYear, initialMonth }: Props) {
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<'mes' | 'semana'>('mes')
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth) // 1-12
  const [sessions, setSessions] = useState<any[]>(initialSessions)
  const [cache, setCache] = useState<Record<string, any[]>>({
    [`${initialYear}-${initialMonth}`]: initialSessions,
  })
  const [selected, setSelected] = useState<any | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => { setMounted(true) }, [])

  const todayIso = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  // Sesiones agrupadas por día (YYYY-MM-DD → sesiones[])
  const byDay = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const s of sessions) {
      const k = s.scheduled_date
      if (!map[k]) map[k] = []
      map[k].push(s)
    }
    return map
  }, [sessions])

  function navigate(delta: number) {
    let m = month + delta
    let y = year
    if (m < 1) { m = 12; y -= 1 }
    if (m > 12) { m = 1; y += 1 }
    setYear(y)
    setMonth(m)
    const key = `${y}-${m}`
    if (cache[key]) {
      setSessions(cache[key])
      return
    }
    startTransition(async () => {
      const data = await getMonthSessions(y, m)
      setCache(prev => ({ ...prev, [key]: data }))
      setSessions(data)
    })
  }

  const mm = String(month).padStart(2, '0')
  const cells = calendarDays(year, month - 1)

  // Vista Semana: clases del mes agrupadas por día de la semana (Lun–Sáb).
  // Combina sesiones puntuales (con fecha) y horarios fijos recurrentes.
  const byWeekday = useMemo(() => {
    const map: Record<number, any[]> = {}
    const push = (d: number, item: any) => {
      if (d < 1 || d > 6) return
      if (!map[d]) map[d] = []
      map[d].push(item)
    }
    for (const s of sessions) {
      const dow = new Date(s.scheduled_date + 'T12:00:00').getDay() // 0=Dom..6=Sáb
      push(dow, { ...s, _hour: fmtTime(s.start_time) })
    }
    for (const sc of schedules ?? []) {
      push(sc.day_of_week, { ...sc, _hour: fmtTime(sc.start_time), status: 'confirmed', _fixed: true })
    }
    return map
  }, [sessions, schedules])

  return (
    <div className="rounded-2xl border border-[#ff7a00]/20 bg-white shadow-lg p-4 sm:p-5"
      style={{ boxShadow: '0 4px 32px rgba(255,122,0,0.08), 0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Header: navegación + toggle */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="h-8 w-8 rounded-lg border border-gray-200 bg-stone-100 flex items-center justify-center text-gray-500 hover:text-[#ff7a00] hover:border-[#ff7a00]/30 transition-colors"
            aria-label="Mes anterior"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 font-poppins capitalize min-w-[150px] text-center">
            {MONTHS_ES[month - 1]} {year}
            {isPending && <span className="ml-2 inline-block h-3 w-3 align-middle border-2 border-[#ff7a00]/40 border-t-[#ff7a00] rounded-full animate-spin" />}
          </h3>
          <button
            onClick={() => navigate(1)}
            className="h-8 w-8 rounded-lg border border-gray-200 bg-stone-100 flex items-center justify-center text-gray-500 hover:text-[#ff7a00] hover:border-[#ff7a00]/30 transition-colors"
            aria-label="Mes siguiente"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>

        {/* Toggle Mes / Semana */}
        <div className="flex rounded-xl border border-gray-200 bg-stone-100 p-0.5">
          {(['mes', 'semana'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
               className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-poppins capitalize transition-all ${
                  view === v ? 'bg-[#ff7a00] text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'mes' ? (
        <>
          {/* ── Grid mensual (tablet/desktop) ── */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DOW_HEAD.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((cell, i) => {
                if (!cell.current) return <div key={i} className="min-h-[76px] lg:min-h-[104px] rounded-lg bg-gray-50" />
                const dateStr = `${year}-${mm}-${String(cell.day).padStart(2, '0')}`
                const dayClasses = byDay[dateStr] ?? []
                const isToday = dateStr === todayIso
                return (
                  <div
                    key={i}
                    className={`min-h-[76px] lg:min-h-[104px] rounded-lg border p-1.5 flex flex-col gap-1 transition-colors ${
                      isToday
                        ? 'border-[#ff7a00]/50 bg-orange-50'
                        : dayClasses.length > 0
                          ? 'border-[#ff7a00]/20 bg-orange-50/20'
                          : 'border-gray-100 bg-white'
                    }`}
                  >
                    <span className={`text-[11px] font-bold ${isToday ? 'text-[#ff7a00]' : dayClasses.length > 0 ? 'text-gray-800' : 'text-gray-400'}`}>{cell.day}</span>
                    <div className="flex flex-col gap-1 overflow-hidden">
                      {dayClasses.map(s => {
                        const meta = statusMeta(s.status)
                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelected(s)}
                            className="group flex items-center gap-1 rounded-md px-1.5 py-1 text-left transition-all hover:brightness-125"
                            style={{ background: meta.hex + '26', borderLeft: `2px solid ${meta.hex}` }}
                            title={`${s.course?.name ?? ''} · ${fmtTime(s.start_time)}`}
                          >
                            <span className="shrink-0" style={{ color: meta.hex }}>
                              <InstrumentIcon courseName={s.course?.name} className="h-3 w-3" />
                            </span>
                            <span className="min-w-0 flex flex-col leading-tight">
                              <span className="text-[10px] font-semibold text-gray-800 truncate">{s.course?.name ?? '—'}</span>
                              <span className="text-[9px] text-gray-500 hidden lg:inline">{fmtTime(s.start_time)}</span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Vista agenda (mobile) ── */}
          <div className="sm:hidden space-y-2">
            {Object.keys(byDay).sort().length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6 font-roboto">No hay clases este mes.</p>
            ) : (
              Object.keys(byDay).sort().map(dateStr => (
                <div key={dateStr}>
                  <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${dateStr === todayIso ? 'text-[#ff7a00]' : 'text-gray-500'}`}>
                    {fmtDateLong(dateStr)}
                  </p>
                  <div className="space-y-1.5">
                    {byDay[dateStr].map(s => {
                      const meta = statusMeta(s.status)
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelected(s)}
                          className="w-full flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left shadow-sm hover:bg-gray-50 transition-all"
                        >
                          <span className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.hex + '1f', color: meta.hex }}>
                            <InstrumentIcon courseName={s.course?.name} className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-900 font-poppins font-medium">{s.course?.name ?? '—'} · {fmtTime(s.start_time)}</p>
                            <p className="text-xs text-gray-400 truncate">{s.instructor?.name ?? 'Sin instructor'} · {s.classroom?.name ?? '—'}</p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-semibold ${meta.badgeClass}`}>{meta.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* ── Vista Semana (horario tipo academia) ── */
        <div className="overflow-x-auto">
          {Object.keys(byWeekday).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 font-roboto">No hay clases este mes.</p>
          ) : (
            <WeekTimetable byWeekday={byWeekday} onSelect={setSelected} />
          )}
        </div>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-gray-200">
        {STATUS_LEGEND.map(m => (
          <span key={m.key} className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 font-roboto">
            <span className={`h-2 w-2 rounded-full ${m.dotClass}`} />
            {m.label}
          </span>
        ))}
      </div>

      {/* Modal de detalle */}
      {mounted && selected && createPortal(
        <DetailModal session={selected} onClose={() => setSelected(null)} />,
        document.body
      )}
    </div>
  )
}

function WeekTimetable({ byWeekday, onSelect }: { byWeekday: Record<number, any[]>; onSelect: (s: any) => void }) {
  // Filas = horas presentes en las clases; fallback a 17-20
  const hours = useMemo(() => {
    const set = new Set<string>()
    for (const list of Object.values(byWeekday)) {
      for (const sc of list) set.add(sc._hour)
    }
    const arr = Array.from(set).filter(Boolean).sort()
    return arr.length ? arr : ['17:00', '18:00', '19:00', '20:00']
  }, [byWeekday])

  return (
    <table className="w-full min-w-[560px] border-separate border-spacing-1">
      <thead>
        <tr>
          <th className="w-14" />
          {WEEK_HEAD.map(d => (
            <th key={d} className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider pb-1">{d}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {hours.map(h => (
          <tr key={h}>
            <td className="text-[11px] text-gray-400 font-roboto align-top pt-2 pr-1 text-right">{h}</td>
            {WEEK_DAYS.map(dow => {
              const cls = (byWeekday[dow] ?? []).filter(sc => sc._hour === h)
              return (
                <td key={dow} className="align-top">
                  {cls.length === 0 ? (
                    <div className="min-h-[44px] rounded-lg border border-gray-100 bg-gray-50" />
                  ) : (
                    cls.map(sc => {
                      const meta = statusMeta(sc.status)
                      return (
                        <button
                          key={sc.id}
                          onClick={() => onSelect(sc)}
                          className="w-full min-h-[44px] rounded-lg border p-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors hover:brightness-125"
                          style={{ borderColor: meta.hex + '40', background: meta.hex + '14' }}
                        >
                          <span style={{ color: meta.hex }}><InstrumentIcon courseName={sc.course?.name} className="h-4 w-4" /></span>
                          <span className="text-[10px] text-gray-700 font-medium leading-tight text-center">{sc.course?.name ?? '—'}</span>
                        </button>
                      )
                    })
                  )}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DetailModal({ session: s, onClose }: { session: any; onClose: () => void }) {
  const meta = statusMeta(s.status)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-[#ff7a00]/20 bg-white p-6 shadow-xl animate-scale-in"
        style={{ boxShadow: '0 8px 32px rgba(255,122,0,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-5">
          <span className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.hex + '22', color: meta.hex }}>
            <InstrumentIcon courseName={s.course?.name} className="h-6 w-6" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 font-poppins">{s.course?.name ?? 'Clase'}</h3>
            <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${meta.badgeClass}`}>{meta.label}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0" aria-label="Cerrar">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <dl className="space-y-3">
          {!s._fixed && (
            <Row label="Fecha" value={s.scheduled_date ? fmtDateLong(s.scheduled_date) : '—'} capitalize />
          )}
          {s._fixed && (
            <Row label="Horario" value="Clase fija semanal" />
          )}
          <Row label="Hora" value={fmtTime(s.start_time) || '—'} />
          <Row label="Instructor" value={s.instructor?.name ?? 'Sin asignar'} />
          <Row label="Salón" value={s.classroom?.name ?? '—'} />
          {s.notes && <Row label="Observaciones" value={s.notes} />}
        </dl>
      </div>
    </div>
  )
}

function Row({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-xs uppercase tracking-wider text-gray-400 font-roboto pt-0.5">{label}</dt>
      <dd className={`text-sm text-gray-900 font-roboto text-right ${capitalize ? 'capitalize' : ''}`}>{value}</dd>
    </div>
  )
}

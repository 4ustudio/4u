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
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      {/* Header: navegación + toggle */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/60 hover:text-white hover:border-white/20 transition-colors"
            aria-label="Mes anterior"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <h3 className="text-base sm:text-lg font-bold text-white font-poppins capitalize min-w-[150px] text-center">
            {MONTHS_ES[month - 1]} {year}
            {isPending && <span className="ml-2 inline-block h-3 w-3 align-middle border-2 border-[#ff7a00]/40 border-t-[#ff7a00] rounded-full animate-spin" />}
          </h3>
          <button
            onClick={() => navigate(1)}
            className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/60 hover:text-white hover:border-white/20 transition-colors"
            aria-label="Mes siguiente"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>

        {/* Toggle Mes / Semana */}
        <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
          {(['mes', 'semana'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-poppins capitalize transition-all ${
                view === v ? 'bg-[#ff7a00] text-white' : 'text-white/50 hover:text-white'
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
                <div key={d} className="text-center text-[10px] font-semibold text-white/30 uppercase tracking-wider py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, i) => {
                if (!cell.current) return <div key={i} className="min-h-[64px] lg:min-h-[84px] rounded-lg" />
                const dateStr = `${year}-${mm}-${String(cell.day).padStart(2, '0')}`
                const dayClasses = byDay[dateStr] ?? []
                const isToday = dateStr === todayIso
                return (
                  <div
                    key={i}
                    className={`min-h-[64px] lg:min-h-[84px] rounded-lg border p-1.5 flex flex-col gap-1 transition-colors ${
                      isToday ? 'border-[#ff7a00]/50 bg-[#ff7a00]/[0.06]' : 'border-white/[0.06] bg-white/[0.015]'
                    }`}
                  >
                    <span className={`text-[11px] font-semibold ${isToday ? 'text-[#ff7a00]' : 'text-white/40'}`}>{cell.day}</span>
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {dayClasses.map(s => {
                        const meta = statusMeta(s.status)
                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelected(s)}
                            className="group flex items-center gap-1 rounded px-1 py-0.5 text-left hover:bg-white/[0.06] transition-colors"
                            style={{ background: meta.hex + '1a' }}
                            title={`${s.course?.name ?? ''} · ${fmtTime(s.start_time)}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${meta.dotClass}`} />
                            <span className="text-white/70 shrink-0" style={{ color: meta.hex }}>
                              <InstrumentIcon courseName={s.course?.name} className="h-3 w-3" />
                            </span>
                            <span className="text-[10px] text-white/70 truncate hidden lg:inline">{fmtTime(s.start_time)}</span>
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
              <p className="text-sm text-white/35 text-center py-6 font-roboto">No hay clases este mes.</p>
            ) : (
              Object.keys(byDay).sort().map(dateStr => (
                <div key={dateStr}>
                  <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${dateStr === todayIso ? 'text-[#ff7a00]' : 'text-white/35'}`}>
                    {fmtDateLong(dateStr)}
                  </p>
                  <div className="space-y-1.5">
                    {byDay[dateStr].map(s => {
                      const meta = statusMeta(s.status)
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelected(s)}
                          className="w-full flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left hover:bg-white/[0.04] transition-colors"
                        >
                          <span className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.hex + '1f', color: meta.hex }}>
                            <InstrumentIcon courseName={s.course?.name} className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-white font-poppins font-medium">{s.course?.name ?? '—'} · {fmtTime(s.start_time)}</p>
                            <p className="text-xs text-white/40 truncate">{s.instructor?.name ?? 'Sin instructor'} · {s.classroom?.name ?? '—'}</p>
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
            <p className="text-sm text-white/35 text-center py-8 font-roboto">No hay clases este mes.</p>
          ) : (
            <WeekTimetable byWeekday={byWeekday} onSelect={setSelected} />
          )}
        </div>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-white/[0.06]">
        {STATUS_LEGEND.map(m => (
          <span key={m.key} className="inline-flex items-center gap-1.5 text-[11px] text-white/45 font-roboto">
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
            <th key={d} className="text-[11px] font-semibold text-white/40 uppercase tracking-wider pb-1">{d}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {hours.map(h => (
          <tr key={h}>
            <td className="text-[11px] text-white/35 font-roboto align-top pt-2 pr-1 text-right">{h}</td>
            {WEEK_DAYS.map(dow => {
              const cls = (byWeekday[dow] ?? []).filter(sc => sc._hour === h)
              return (
                <td key={dow} className="align-top">
                  {cls.length === 0 ? (
                    <div className="min-h-[44px] rounded-lg border border-white/[0.04] bg-white/[0.01]" />
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
                          <span className="text-[10px] text-white/70 font-medium leading-tight text-center">{sc.course?.name ?? '—'}</span>
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
        className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-5">
          <span className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.hex + '22', color: meta.hex }}>
            <InstrumentIcon courseName={s.course?.name} className="h-6 w-6" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white font-poppins">{s.course?.name ?? 'Clase'}</h3>
            <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${meta.badgeClass}`}>{meta.label}</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors shrink-0" aria-label="Cerrar">
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
      <dt className="text-xs uppercase tracking-wider text-white/35 font-roboto pt-0.5">{label}</dt>
      <dd className={`text-sm text-white font-roboto text-right ${capitalize ? 'capitalize' : ''}`}>{value}</dd>
    </div>
  )
}

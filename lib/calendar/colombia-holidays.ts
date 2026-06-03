/**
 * Festivos oficiales de Colombia — Ley 51 de 1983 (Ley Emiliani) y feriados fijos.
 * Fuente: https://www.dian.gov.co/Documentos%20compartidos/calendario_tributario.pdf
 *
 * Funciona para cualquier año presente o futuro sin edición manual.
 */

import type { CalendarEvent } from './types'

// ─── Easter (Domingo de Resurrección) — Anonymous Gregorian algorithm ────────
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const ii = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * ii - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// Ley Emiliani: si no cae en lunes, se corre al siguiente lunes.
function nextMonday(date: Date): Date {
  const d = new Date(date)
  const dow = d.getDay() // 0=Dom, 1=Lun
  if (dow === 1) return d
  d.setDate(d.getDate() + (dow === 0 ? 1 : 8 - dow))
  return d
}

function toIso(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

/**
 * Retorna los festivos colombianos de un año dado como CalendarEvent[].
 * Incluye cálculo automático de Semana Santa y festivos Emiliani.
 */
export function getColombianHolidays(year: number): CalendarEvent[] {
  const events: CalendarEvent[] = []

  const fixed = (date: Date, title: string, description?: string) => {
    events.push({ date: toIso(date), title, type: 'holiday', description })
  }
  const emiliani = (date: Date, title: string, description?: string) => {
    fixed(nextMonday(date), title, description)
  }

  const easter = easterSunday(year)

  // ── Festivos de fecha fija ───────────────────────────────────────────────
  fixed(new Date(year, 0,  1), 'Año Nuevo', 'Primer día del año')
  fixed(new Date(year, 4,  1), 'Día del Trabajo', 'Fiesta del Trabajo')
  fixed(new Date(year, 6, 20), 'Día de la Independencia', 'Grito de Independencia, 1810')
  fixed(new Date(year, 7,  7), 'Batalla de Boyacá', 'Independencia definitiva, 1819')
  fixed(new Date(year, 11, 8), 'Inmaculada Concepción', 'Fiesta de la Inmaculada Concepción')
  fixed(new Date(year, 11,25), 'Navidad', 'Día de la Natividad')

  // ── Semana Santa (no se mueven por Emiliani) ─────────────────────────────
  fixed(addDays(easter, -3), 'Jueves Santo', 'Semana Santa')
  fixed(addDays(easter, -2), 'Viernes Santo', 'Semana Santa')

  // ── Festivos basados en Pascua + Emiliani ────────────────────────────────
  emiliani(addDays(easter, 39), 'Ascensión del Señor', '39 días después de Pascua')
  emiliani(addDays(easter, 60), 'Corpus Christi', '60 días después de Pascua')
  emiliani(addDays(easter, 71), 'Sagrado Corazón de Jesús', '71 días después de Pascua')

  // ── Festivos de fecha fija con Ley Emiliani ──────────────────────────────
  emiliani(new Date(year,  0,  6), 'Reyes Magos', 'Epifanía del Señor')
  emiliani(new Date(year,  2, 19), 'San José', 'Festividad de San José')
  emiliani(new Date(year,  5, 29), 'San Pedro y San Pablo', 'Apóstoles Pedro y Pablo')
  emiliani(new Date(year,  7, 15), 'Asunción de la Virgen', 'Virgen María')
  emiliani(new Date(year,  9, 12), 'Día de la Raza', 'Diversidad étnica y cultural')
  emiliani(new Date(year, 10,  1), 'Todos los Santos', 'Día de Todos los Santos')
  emiliani(new Date(year, 10, 11), 'Independencia de Cartagena', '11 de Noviembre de 1811')

  return events
}

/**
 * Retorna un mapa { 'YYYY-MM-DD': CalendarEvent[] } con los festivos del año.
 * Conveniente para lookups O(1) por fecha.
 */
export function getHolidayMap(year: number): Record<string, CalendarEvent[]> {
  const map: Record<string, CalendarEvent[]> = {}
  for (const ev of getColombianHolidays(year)) {
    if (!map[ev.date]) map[ev.date] = []
    map[ev.date].push(ev)
  }
  return map
}

/** Retorna TODOS los festivos de un rango de años (útil para navegación). */
export function getHolidayMapForYears(...years: number[]): Record<string, CalendarEvent[]> {
  const merged: Record<string, CalendarEvent[]> = {}
  for (const y of years) {
    const m = getHolidayMap(y)
    for (const [date, evs] of Object.entries(m)) {
      if (!merged[date]) merged[date] = []
      merged[date].push(...evs)
    }
  }
  return merged
}

// Zona horaria del negocio.
//
// En BD, `scheduled_date` / `start_time` / `due_date` / `blocked_date` guardan
// hora local de Colombia (no UTC). El servidor de Vercel corre en UTC, así que
// `new Date()`, `toISOString()` y `toTimeString()` producen valores desfasados
// 5 horas — que es lo que hacía salir correos y recordatorios a la hora
// equivocada. Toda fecha/hora "de hoy" o "de ahora" que se compare o se muestre
// junto a esas columnas debe pasar por estos helpers.
//
// Colombia no aplica horario de verano: el offset es -05:00 fijo.

export const BOGOTA_TZ = 'America/Bogota'
export const BOGOTA_OFFSET = '-05:00'

/** "15:00" | "15:00:00" | "15:00:00.000" → "15:00:00" */
function normalizeTime(time: string): string {
  const s = time.slice(0, 8)
  return s.length === 5 ? `${s}:00` : s
}

/** Fecha local Bogotá en formato YYYY-MM-DD, con offset opcional en días. */
export function bogotaDateStr(base: Date = new Date(), offsetDays = 0): string {
  const d = new Date(base.getTime() + offsetDays * 24 * 60 * 60 * 1000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: BOGOTA_TZ }).format(d)
}

/** Hora local Bogotá en formato HH:MM, con offset opcional en horas. */
export function bogotaTimeStr(base: Date = new Date(), offsetHours = 0): string {
  const d = new Date(base.getTime() + offsetHours * 60 * 60 * 1000)
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: BOGOTA_TZ, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d)
}

/**
 * Instante real de una clase a partir de las columnas de BD (hora Bogotá).
 * `new Date('2026-09-04T15:00:00')` usaría la TZ del servidor (UTC en Vercel);
 * esto ancla el offset colombiano.
 */
export function bogotaDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${normalizeTime(timeStr)}${BOGOTA_OFFSET}`)
}

/** Etiqueta de fecha en español para correos/UI, ej: "jueves, 4 de septiembre de 2026". */
export function formatBogotaDate(
  dateStr: string,
  opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
): string {
  // Mediodía: evita que un cambio de offset mueva el día.
  const d = new Date(`${dateStr}T12:00:00${BOGOTA_OFFSET}`)
  return new Intl.DateTimeFormat('es-CO', { timeZone: BOGOTA_TZ, ...opts }).format(d)
}

/** Etiqueta de hora en español para correos/UI, ej: "3:00 p. m.". */
export function formatBogotaTime(dateStr: string, timeStr: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: BOGOTA_TZ, hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(bogotaDateTime(dateStr, timeStr))
}

/**
 * Hoy en Bogotá, anclado al mediodía. Sirve como base para aritmética de
 * calendario (`setDate`, `getDay`, `toISOString().split('T')[0]`) en el
 * servidor UTC: el mediodía colombiano son las 17:00 UTC del mismo día, así
 * que ningún desplazamiento de días cruza la medianoche por error.
 */
export function bogotaNoon(dateStr: string = bogotaDateStr()): Date {
  return new Date(`${dateStr}T12:00:00${BOGOTA_OFFSET}`)
}

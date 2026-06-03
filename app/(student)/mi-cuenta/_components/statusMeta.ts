// Mapeo único de estados de clase → color, etiqueta y estilos.
// Fuente de verdad compartida por la página, calendario, historial y PDF.

export type SessionStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'
  | 'no_show'

// Categorías visibles para el estudiante (4 colores semánticos)
export type StatusKey = 'confirmed' | 'completed' | 'pending' | 'reprogramar'

export interface StatusMeta {
  /** Clave de categoría agrupada para leyenda/filtros */
  key: StatusKey
  /** Etiqueta legible en español */
  label: string
  /** Color base (hex) — usado en PDF y dots */
  hex: string
  /** Punto de color para el calendario */
  dotClass: string
  /** Badge para listas/tablas (dark UI) */
  badgeClass: string
}

const CONFIRMED: StatusMeta = {
  key: 'confirmed',
  label: 'Confirmada',
  hex: '#16a34a',
  dotClass: 'bg-green-400',
  badgeClass: 'bg-green-100 text-green-700 border-green-300',
}

const COMPLETED: StatusMeta = {
  key: 'completed',
  label: 'Completada',
  hex: '#2563eb',
  dotClass: 'bg-blue-400',
  badgeClass: 'bg-blue-100 text-blue-700 border-blue-300',
}

const PENDING: StatusMeta = {
  key: 'pending',
  label: 'Pendiente',
  hex: '#ea9a16',
  dotClass: 'bg-orange-400',
  badgeClass: 'bg-amber-100 text-amber-700 border-amber-300',
}

const REPROGRAMAR: StatusMeta = {
  key: 'reprogramar',
  label: 'Para reprogramar',
  hex: '#dc2626',
  dotClass: 'bg-red-400',
  badgeClass: 'bg-red-100 text-red-700 border-red-300',
}

// cancelled, rescheduled y no_show se agrupan en "Para reprogramar"
const STATUS_MAP: Record<SessionStatus, StatusMeta> = {
  confirmed: CONFIRMED,
  completed: COMPLETED,
  pending: PENDING,
  cancelled: REPROGRAMAR,
  rescheduled: REPROGRAMAR,
  no_show: REPROGRAMAR,
}

export function statusMeta(status: string): StatusMeta {
  return STATUS_MAP[status as SessionStatus] ?? PENDING
}

// Leyenda ordenada para calendario y PDF
export const STATUS_LEGEND: StatusMeta[] = [
  CONFIRMED,
  COMPLETED,
  PENDING,
  REPROGRAMAR,
]

// Filtros del historial: clave de filtro → predicado por categoría
export const HISTORY_FILTERS: { id: string; label: string; keys: StatusKey[] | null }[] = [
  { id: 'all', label: 'Todas', keys: null },
  { id: 'completed', label: 'Completadas', keys: ['completed'] },
  { id: 'reprogramar', label: 'Para reprogramar', keys: ['reprogramar'] },
  { id: 'pending', label: 'Pendientes', keys: ['pending', 'confirmed'] },
]

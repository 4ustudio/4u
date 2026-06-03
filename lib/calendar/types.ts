export type CalendarEventType =
  | 'holiday'
  | 'academic_event'
  | 'concert'
  | 'recital'
  | 'closure'
  | 'presentation'

export interface CalendarEvent {
  date: string            // 'YYYY-MM-DD'
  title: string
  type: CalendarEventType
  description?: string
  color?: string          // hex override (optional)
}

export const EVENT_STYLE: Record<CalendarEventType, { bg: string; text: string; border: string; dot: string; label: string }> = {
  holiday:        { bg: '#fefce8', text: '#854d0e', border: '#fde047', dot: '#eab308', label: 'Festivo' },
  concert:        { bg: '#f5f3ff', text: '#5b21b6', border: '#c4b5fd', dot: '#7c3aed', label: 'Concierto' },
  recital:        { bg: '#fdf2f8', text: '#9d174d', border: '#f9a8d4', dot: '#ec4899', label: 'Recital' },
  presentation:   { bg: '#eff6ff', text: '#1e40af', border: '#93c5fd', dot: '#3b82f6', label: 'Presentación' },
  academic_event: { bg: '#f0fdf4', text: '#166534', border: '#86efac', dot: '#22c55e', label: 'Evento' },
  closure:        { bg: '#fff1f2', text: '#9f1239', border: '#fca5a5', dot: '#ef4444', label: 'Cierre' },
}

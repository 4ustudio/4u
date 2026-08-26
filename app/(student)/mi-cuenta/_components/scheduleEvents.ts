export const OPEN_SCHEDULE_EVENT = 'instructor:open-schedule'

export type ScheduleModalTab = 'horarios' | 'clases' | 'bloqueos' | 'historial'

export type OpenScheduleDetail = number | { tab?: ScheduleModalTab; focusDay?: number | null }

// Re-export from new canonical location — kept for backwards compatibility
export { getColombianHolidays } from './calendar/colombia-holidays'

import { getHolidayMap } from './calendar/colombia-holidays'

/** @deprecated Use getHolidayMap from @/lib/calendar/colombia-holidays */
export function getColombianHolidaysLegacy(year: number): Record<string, string> {
  const map = getHolidayMap(year)
  const result: Record<string, string> = {}
  for (const [date, events] of Object.entries(map)) {
    result[date] = events[0]?.title ?? ''
  }
  return result
}

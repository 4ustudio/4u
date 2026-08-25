'use client'

import { OPEN_SCHEDULE_EVENT } from './scheduleEvents'

export default function OpenScheduleLink({ label = 'Editar' }: { label?: string }) {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event(OPEN_SCHEDULE_EVENT))}
      className="text-xs font-bold text-[#ff7a00] hover:text-orange-600 transition-colors"
    >
      {label}
    </button>
  )
}

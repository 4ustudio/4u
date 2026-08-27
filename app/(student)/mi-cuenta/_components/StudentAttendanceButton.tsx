'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { instructorRegisterAttendanceAction } from '../../_actions/student'

const OPTIONS = [
  { value: 'attended', label: '✅ Asistió' },
  { value: 'absent', label: '❌ Ausente' },
  { value: 'no_show', label: '🚫 No se presentó' },
] as const

export default function StudentAttendanceButton({ sessionId, current }: { sessionId: string; current: string | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [attendance, setAttendance] = useState(current)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function register(value: (typeof OPTIONS)[number]['value']) {
    const previous = attendance
    setAttendance(value)
    setError(null)
    setMessage('Guardando…')
    startTransition(async () => {
      const formData = new FormData()
      formData.set('session_id', sessionId)
      formData.set('attendance', value)
      const result = await instructorRegisterAttendanceAction({}, formData)
      if (result.error) {
        setAttendance(previous)
        setMessage(null)
        setError(result.error)
        return
      }
      setMessage('Registrada.')
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="text-xs font-semibold text-[#ff7a00] hover:text-[#e56d00] whitespace-nowrap">
        {attendance ? OPTIONS.find(o => o.value === attendance)?.label ?? 'Registrar asistencia' : 'Registrar asistencia'}
      </button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-1">
        {OPTIONS.map(({ value, label }) => (
          <button key={value} type="button" onClick={() => register(value)} disabled={pending}
            className={`px-2 py-1 rounded-md text-[11px] border transition-colors disabled:opacity-40 whitespace-nowrap ${
              attendance === value ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-white text-gray-700 border-gray-200 hover:border-[#ff7a00]/40'
            }`}>
            {label}{attendance === value && <span className="ml-1 text-gray-400">(actual)</span>}
          </button>
        ))}
        <button type="button" onClick={() => setOpen(false)} disabled={pending}
          className="px-2 py-1 rounded-md text-[11px] text-gray-400 hover:text-gray-600">
          Cancelar
        </button>
      </div>
      {message && <p className="text-[11px] text-green-700" role="status">{message}</p>}
      {error && <p className="text-[11px] text-red-500" role="alert">{error}</p>}
    </div>
  )
}

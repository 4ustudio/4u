'use client'

import { useState, useTransition } from 'react'
import { instructorSaveTrialNotesAction } from '../../_actions/student'

export default function TrialClassNotes({ enrollmentId, initialNotes }: { enrollmentId: string; initialNotes: string | null }) {
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function save() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await instructorSaveTrialNotesAction(enrollmentId, notes)
      if (result.error) { setError(result.error); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div>
      <textarea
        value={notes}
        onChange={e => { setNotes(e.target.value); setSaved(false) }}
        rows={2}
        placeholder="Qué se notó en la primera sesión…"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#ff7a00]/40 focus:border-[#ff7a00]/40 resize-none"
      />
      <div className="mt-1.5 flex items-center justify-between">
        {error && <p className="text-[11px] text-red-500" role="alert">{error}</p>}
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className={`ml-auto text-xs font-semibold disabled:opacity-40 ${saved ? 'text-green-600' : 'text-[#ff7a00] hover:text-[#e56d00]'}`}
        >
          {pending ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

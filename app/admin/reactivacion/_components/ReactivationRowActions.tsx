'use client'

import { useActionState, useState } from 'react'
import { markStudentReactivatedAction, recordStudentFollowUpAction } from '../../_actions/retention'

const initial: { error?: string; success?: boolean } = {}

export default function ReactivationRowActions({ studentId, phone, email }: { studentId: string; phone?: string | null; email?: string | null }) {
  const [open, setOpen] = useState(false)
  const [noteState, noteAction, notePending] = useActionState(recordStudentFollowUpAction, initial)
  const [reactState, reactAction, reactPending] = useActionState(markStudentReactivatedAction, initial)
  const whatsapp = phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : null
  const mail = email ? `mailto:${email}` : null

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {whatsapp && (
          <a href={whatsapp} target="_blank" className="rounded-lg border border-green-500/25 px-3 py-1.5 text-xs font-semibold text-green-300 hover:bg-green-500/10">
            WhatsApp
          </a>
        )}
        {mail && (
          <a href={mail} className="rounded-lg border border-blue-500/25 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-500/10">
            Correo
          </a>
        )}
        <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white">
          Seguimiento
        </button>
        <form action={reactAction}>
          <input type="hidden" name="student_id" value={studentId} />
          <button disabled={reactPending} className="rounded-lg border border-orange-500/30 px-3 py-1.5 text-xs font-bold text-orange-300 hover:bg-orange-500/10 disabled:opacity-50">
            Reactivado
          </button>
        </form>
      </div>

      {open && (
        <form action={noteAction} className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <input type="hidden" name="student_id" value={studentId} />
          <textarea
            name="note"
            rows={3}
            required
            placeholder="Observación interna del seguimiento..."
            className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-orange-500/40 focus:outline-none"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              name="outcome"
              placeholder="Resultado"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-orange-500/40 focus:outline-none"
            />
            <input
              type="datetime-local"
              name="follow_up_at"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70 focus:border-orange-500/40 focus:outline-none"
            />
          </div>
          {noteState.error && <p className="text-xs text-red-300">{noteState.error}</p>}
          {noteState.success && <p className="text-xs text-green-300">Seguimiento guardado.</p>}
          {reactState.error && <p className="text-xs text-red-300">{reactState.error}</p>}
          {reactState.success && <p className="text-xs text-green-300">Alumno marcado como reactivado.</p>}
          <button disabled={notePending} className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
            {notePending ? 'Guardando...' : 'Registrar observación'}
          </button>
        </form>
      )}
    </div>
  )
}

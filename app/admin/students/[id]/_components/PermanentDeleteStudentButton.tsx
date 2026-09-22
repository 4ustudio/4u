'use client'

import { useActionState, useState } from 'react'
import { MdDeleteForever } from 'react-icons/md'
import { permanentlyDeleteStudentAction } from '@/app/admin/_actions/students'

const initial: { error?: string; success?: boolean } = {}

export default function PermanentDeleteStudentButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [state, action, isPending] = useActionState(permanentlyDeleteStudentAction, initial)

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all font-poppins text-red-500 border border-red-600/30 bg-red-600/5 hover:bg-red-600/10"
      >
        <MdDeleteForever className="h-3.5 w-3.5" aria-hidden="true" />
        Borrar estudiante permanentemente
      </button>
    )
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={studentId} />
      <p className="text-xs text-red-400 font-roboto">
        Esto elimina para siempre a <span className="font-semibold">{studentName}</span> y todo su historial, clases y pagos. No se puede deshacer.
      </p>
      <p className="text-xs text-white/60 font-roboto">
        Escribe <span className="text-white font-semibold">{studentName}</span> para confirmar:
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-xs text-white outline-none focus:border-red-500/50"
      />
      {state.error && <p className="text-xs text-red-400 font-roboto">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending || confirmText !== studentName}
          className="flex-1 rounded-lg px-3 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? 'Borrando…' : 'Borrar definitivamente'}
        </button>
        <button
          type="button"
          onClick={() => { setConfirming(false); setConfirmText('') }}
          disabled={isPending}
          className="flex-1 rounded-lg px-3 py-2 text-xs font-medium text-white/60 border border-white/10 hover:text-white transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

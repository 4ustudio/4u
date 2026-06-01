'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteStudentAction } from '@/app/admin/_actions/students'

const initial: { error?: string; success?: boolean } = {}

export default function DeleteStudentButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [state, action, isPending] = useActionState(deleteStudentAction, initial)

  if (state.success) {
    router.push('/admin/students')
    return null
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all font-poppins text-red-400 border border-red-500/25 bg-red-500/5 hover:bg-red-500/10"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
        </svg>
        Eliminar estudiante
      </button>
    )
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={studentId} />
      <p className="text-xs text-white/60 font-roboto">
        ¿Eliminar a <span className="text-white font-semibold">{studentName}</span>? Esta acción borra sus clases, horarios y acceso al portal. No se puede deshacer.
      </p>
      {state.error && <p className="text-xs text-red-400 font-roboto">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg px-3 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Eliminando…' : 'Sí, eliminar'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="flex-1 rounded-lg px-3 py-2 text-xs font-medium text-white/60 border border-white/10 hover:text-white transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

'use client'

import { useActionState, useState } from 'react'
import { MdInventory2 } from 'react-icons/md'
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
        <MdInventory2 className="h-3.5 w-3.5" aria-hidden="true" />
        Archivar estudiante
      </button>
    )
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={studentId} />
      <input type="hidden" name="archived_reason" value="Archivado manualmente desde el perfil administrativo" />
      <p className="text-xs text-white/60 font-roboto">
        ¿Archivar a <span className="text-white font-semibold">{studentName}</span>? Se ocultará del directorio activo, pero conservará clases, historial, notas y acceso registrado.
      </p>
      {state.error && <p className="text-xs text-red-400 font-roboto">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg px-3 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Archivando…' : 'Sí, archivar'}
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

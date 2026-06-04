'use client'

import { useTransition } from 'react'
import { deleteInstructorAction } from '../../_actions/instructors'
import { useRouter } from 'next/navigation'

export default function DeleteInstructorButton({ id, email, name }: { id: string; email: string; name: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    if (!confirm(`¿Eliminar al instructor ${name}? Esta acción también borrará su cuenta de acceso y no se puede deshacer.`)) return
    startTransition(async () => {
      const result = await deleteInstructorAction(id, email)
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-40"
    >
      {isPending ? 'Eliminando…' : 'Eliminar'}
    </button>
  )
}

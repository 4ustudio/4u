'use client'

import { useState, useTransition } from 'react'
import { deleteInstructorAction } from '../../_actions/instructors'
import { useRouter } from 'next/navigation'
import { ConfirmModal } from '../../_components/LeadUI'

export default function DeleteInstructorButton({ id, email, name }: { id: string; email: string; name: string }) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = () => {
    setOpen(false)
    setMsg(null)
    startTransition(async () => {
      const result = await deleteInstructorAction(id, email)
      if (result.error) setMsg(result.error)
      else router.refresh()
    })
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="text-xs text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-40"
      >
        {isPending ? 'Eliminando…' : 'Eliminar'}
      </button>
      {msg && <span role="alert" className="text-[11px] text-red-400 max-w-[220px] text-right">{msg}</span>}
      <ConfirmModal
        open={open}
        title={`¿Eliminar a ${name}?`}
        message="Se borrará su cuenta de acceso. Si ya dictó clases, quedará como Inactivo para conservar el historial."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </span>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { deleteInstructorAction } from '../../_actions/instructors'
import { useRouter } from 'next/navigation'
import { ConfirmModal } from '../../_components/LeadUI'
import PopupSelect from '../../_components/PopupSelect'

type Others = { id: string; name: string }[]

export default function DeleteInstructorButton({ id, email, name, others }: { id: string; email: string; name: string; others: Others }) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [mode, setMode] = useState<'reassign' | 'cancel'>('cancel')
  const [to, setTo] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const router = useRouter()

  const run = (pending?: { mode: 'cancel' } | { mode: 'reassign'; to: string }) => {
    setOpen(false)
    setMsg(null)
    startTransition(async () => {
      const result = await deleteInstructorAction(id, email, pending)
      if (result.error) setMsg(result.error)
      else if (result.pendingCount) setPendingCount(result.pendingCount)
      else { setPendingCount(0); router.refresh() }
    })
  }

  const confirmSecond = () => {
    if (mode === 'reassign' && !to) { setMsg('Elige a quién reasignar las clases.'); return }
    run(mode === 'reassign' ? { mode, to } : { mode })
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
      {msg && !pendingCount && <span role="alert" className="text-[11px] text-red-400 max-w-[220px] text-right">{msg}</span>}
      <ConfirmModal
        open={open}
        title={`¿Eliminar a ${name}?`}
        message="Se borrará su cuenta de acceso. Si ya dictó clases, quedará como Inactivo para conservar el historial."
        confirmLabel="Eliminar"
        onConfirm={() => run()}
        onCancel={() => setOpen(false)}
      />
      {pendingCount > 0 && createPortal(
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-6"
          onClick={() => { setPendingCount(0); setMsg(null) }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            onClick={ev => ev.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-[#141414] border border-white/10 p-5 shadow-2xl text-left"
          >
            <h3 className="text-sm font-bold text-white">{name} tiene {pendingCount} clase(s) pendientes</h3>
            <p className="text-sm text-white/60 mt-2">¿Qué hacemos con ellas antes de eliminarlo?</p>
            <div className="mt-4 space-y-2" role="radiogroup">
              {([['cancel', 'Cancelar las clases'], ['reassign', 'Reasignar a otro instructor']] as const).map(([v, label]) => (
                <label key={v} className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input type="radio" name={`del-${id}`} checked={mode === v} onChange={() => setMode(v)} className="accent-orange-500" />
                  {label}
                </label>
              ))}
              {mode === 'reassign' && (
                <PopupSelect
                  value={to}
                  onChange={setTo}
                  placeholder="Elegir instructor"
                  options={others.map(o => ({ value: o.id, label: o.name }))}
                />
              )}
            </div>
            {msg && <p role="alert" className="text-[11px] text-red-400 mt-3">{msg}</p>}
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => { setPendingCount(0); setMsg(null) }}
                className="text-xs px-4 py-2 rounded-lg font-semibold text-white/60 border border-white/10 hover:border-white/25 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmSecond}
                disabled={isPending}
                className="text-xs px-4 py-2 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
                style={{ background: '#ff7a00' }}
              >
                {isPending ? 'Procesando…' : 'Eliminar instructor'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </span>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MdRefresh } from 'react-icons/md'

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-white/30 mb-0.5">{label}</p>
      <p className="text-sm text-white/75 font-medium">{value}</p>
    </div>
  )
}

export function QuickBtn({ icon, label, hover, onClick }: { icon: React.ReactNode; label: string; hover: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 py-3 rounded-xl border border-white/[0.08] text-white/40 transition-all ${hover}`}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  )
}

export function SpinIcon() {
  return <MdRefresh className="h-4 w-4 animate-spin" aria-hidden="true" />
}

export function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${color}`}>{children}</span>
}

export function ConfirmModal({
  open, title, message, confirmLabel = 'Aceptar', onConfirm, onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted || !open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-6"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={ev => ev.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-[#141414] border border-white/10 p-5 shadow-2xl"
      >
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <p className="text-sm text-white/60 mt-2">{message}</p>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs px-4 py-2 rounded-lg font-semibold text-white/60 border border-white/10 hover:border-white/25 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="text-xs px-4 py-2 rounded-lg font-semibold text-white transition-colors"
            style={{ background: '#ff7a00' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
